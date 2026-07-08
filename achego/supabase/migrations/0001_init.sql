-- Achego — schema inicial
-- Principio central: cada pessoa controla os proprios dados. RLS garante que
-- ninguem le/escreve dado de outra pessoa fora das regras de descoberta e
-- conexao. Nada aqui coleta ou infere dados de terceiros.

create extension if not exists "postgis";

-- =====================================================================
-- Perfis
-- =====================================================================
create type gender as enum ('mulher', 'homem', 'nao_binario', 'outro');
create type orientation as enum ('hetero', 'gay', 'lesbica', 'bi', 'pan', 'outro');
create type relationship_status as enum ('solteiro', 'recem_separado');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text check (char_length(bio) <= 500),
  birthdate date,
  gender gender,
  orientation orientation,
  relationship_status relationship_status,
  region text,
  -- Descoberta por proximidade: desligada por padrao (opt-in explicito).
  location_sharing_enabled boolean not null default false,
  latitude double precision,
  longitude double precision,
  geog geography(point, 4326),
  -- Consentimento registrado (versao dos termos + quando aceitou).
  consent_version text,
  consent_at timestamptz,
  -- Se aparece ou nao para outras pessoas. Pausar some do app sem apagar conta.
  is_discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mantem a coluna geografica coerente com lat/long declarados.
create or replace function sync_geog()
returns trigger language plpgsql as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geog := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  else
    new.geog := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_sync_geog
  before insert or update on profiles
  for each row execute function sync_geog();

-- Cria a linha de perfil automaticamente quando um usuario se cadastra.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Novo membro'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- Conexoes (pedidos entre pessoas)
-- =====================================================================
create type connection_status as enum ('pendente', 'aceita', 'recusada');

create table connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  target_id uuid not null references profiles (id) on delete cascade,
  status connection_status not null default 'pendente',
  created_at timestamptz not null default now(),
  unique (requester_id, target_id),
  check (requester_id <> target_id)
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles enable row level security;
alter table connections enable row level security;

-- A pessoa sempre le e edita o proprio perfil.
create policy "perfil proprio: leitura"
  on profiles for select
  using (auth.uid() = id);

create policy "perfil proprio: escrita"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Perfis descobriveis sao visiveis para membros autenticados.
-- (As colunas sensiveis de localizacao exata sao expostas so via RPC abaixo,
--  nunca por select direto de lat/long de terceiros.)
create policy "descoberta: perfis publicos"
  on profiles for select
  using (is_discoverable = true and auth.uid() <> id);

-- Conexoes: cada lado ve as que envolvem a si mesmo.
create policy "conexoes: participantes"
  on connections for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "conexoes: criar pedido"
  on connections for insert
  with check (auth.uid() = requester_id);

-- Apenas o alvo do pedido pode aceitar/recusar.
create policy "conexoes: responder"
  on connections for update
  using (auth.uid() = target_id)
  with check (auth.uid() = target_id);

-- =====================================================================
-- RPC de descoberta por proximidade
-- Retorna DISTANCIA aproximada (faixas), nunca coordenadas cruas de terceiros.
-- =====================================================================
create or replace function discover_nearby(
  max_distance_km double precision default 50,
  filter_genders gender[] default null,
  min_age int default 18,
  max_age int default 99
)
returns table (
  id uuid,
  display_name text,
  bio text,
  age int,
  gender gender,
  relationship_status relationship_status,
  region text,
  distance_km double precision
)
language sql stable security definer set search_path = public as $$
  with me as (
    select geog, birthdate from profiles where id = auth.uid()
  )
  select
    p.id,
    p.display_name,
    p.bio,
    extract(year from age(p.birthdate))::int as age,
    p.gender,
    p.relationship_status,
    p.region,
    round((st_distance(p.geog, me.geog) / 1000.0)::numeric, 1)::double precision as distance_km
  from profiles p, me
  where p.is_discoverable = true
    and p.id <> auth.uid()
    and p.location_sharing_enabled = true
    and p.geog is not null
    and me.geog is not null
    and st_dwithin(p.geog, me.geog, max_distance_km * 1000)
    and (filter_genders is null or p.gender = any(filter_genders))
    and (p.birthdate is null or extract(year from age(p.birthdate))::int between min_age and max_age)
  order by distance_km asc
  limit 100;
$$;

-- Achego — fotos de perfil, seguranca (bloqueio/denuncia) e push tokens.

-- =====================================================================
-- Foto de perfil
-- =====================================================================
alter table profiles add column avatar_url text;

-- Bucket publico para avatares (leitura publica, escrita so na propria pasta).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: leitura publica"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: upload proprio"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: atualizar proprio"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: apagar proprio"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- Bloqueio
-- =====================================================================
create table blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

create policy "blocks: ler os meus"
  on blocks for select using (auth.uid() = blocker_id);
create policy "blocks: criar"
  on blocks for insert with check (auth.uid() = blocker_id);
create policy "blocks: remover"
  on blocks for delete using (auth.uid() = blocker_id);

-- =====================================================================
-- Denuncia
-- =====================================================================
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_id uuid not null references profiles (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

alter table reports enable row level security;

create policy "reports: criar"
  on reports for insert with check (auth.uid() = reporter_id);
create policy "reports: ler os meus"
  on reports for select using (auth.uid() = reporter_id);

-- =====================================================================
-- Push tokens (Expo)
-- =====================================================================
create table push_tokens (
  user_id uuid not null references profiles (id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table push_tokens enable row level security;

create policy "push: gerenciar os meus"
  on push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- Descoberta: excluir quem eu bloqueei e quem me bloqueou
-- (drop necessario: a assinatura de retorno mudou com avatar_url)
-- =====================================================================
drop function if exists discover_nearby(double precision, gender[], int, int);
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
  avatar_url text,
  distance_km double precision
)
language sql stable security definer set search_path = public, extensions as $$
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
    p.avatar_url,
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
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by distance_km asc
  limit 100;
$$;

-- =====================================================================
-- Conversas: incluir avatar e excluir bloqueados
-- =====================================================================
drop function if exists my_matches();
create or replace function my_matches()
returns table (
  connection_id uuid,
  other_id uuid,
  other_name text,
  other_region text,
  other_avatar text,
  last_body text,
  last_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    c.id as connection_id,
    other.id as other_id,
    other.display_name as other_name,
    other.region as other_region,
    other.avatar_url as other_avatar,
    lm.body as last_body,
    lm.created_at as last_at
  from connections c
  join profiles other
    on other.id = case when c.requester_id = auth.uid() then c.target_id else c.requester_id end
  left join lateral (
    select body, created_at
    from messages m
    where m.connection_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  where c.status = 'aceita'
    and (c.requester_id = auth.uid() or c.target_id = auth.uid())
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = other.id)
         or (b.blocker_id = other.id and b.blocked_id = auth.uid())
    )
  order by coalesce(lm.created_at, c.created_at) desc;
$$;

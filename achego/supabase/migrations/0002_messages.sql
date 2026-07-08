-- Achego — chat entre matches
-- Um "match" e uma conexao aceita. So os dois participantes leem/escrevem,
-- garantido por RLS. Mensagens em tempo real via publication do Supabase.

create table messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conn_time_idx on messages (connection_id, created_at);

alter table messages enable row level security;

-- Confere se auth.uid() participa de um match aceito. Security definer para
-- poder olhar a conexao sem depender das policies de connections.
create or replace function is_match_participant(conn uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from connections c
    where c.id = conn
      and c.status = 'aceita'
      and (c.requester_id = auth.uid() or c.target_id = auth.uid())
  );
$$;

create policy "mensagens: ler do match"
  on messages for select
  using (is_match_participant(connection_id));

create policy "mensagens: enviar"
  on messages for insert
  with check (sender_id = auth.uid() and is_match_participant(connection_id));

-- Permite ver o perfil de quem voce deu match (mesmo que a pessoa tenha
-- pausado a descoberta), para exibir nome/regiao no chat.
create policy "descoberta: perfis de matches"
  on profiles for select
  using (
    exists (
      select 1 from connections c
      where c.status = 'aceita'
        and (
          (c.requester_id = auth.uid() and c.target_id = id)
          or (c.target_id = auth.uid() and c.requester_id = id)
        )
    )
  );

-- Habilita realtime na tabela de mensagens.
alter publication supabase_realtime add table messages;

-- Lista de matches com a ultima mensagem, para a aba Conversas.
create or replace function my_matches()
returns table (
  connection_id uuid,
  other_id uuid,
  other_name text,
  other_region text,
  last_body text,
  last_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    c.id as connection_id,
    other.id as other_id,
    other.display_name as other_name,
    other.region as other_region,
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
  order by coalesce(lm.created_at, c.created_at) desc;
$$;

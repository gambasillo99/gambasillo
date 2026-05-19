-- Gambasillo — nuevas funciones sociales
-- Ejecutar en Supabase SQL Editor después del schema base

-- Perfil ampliado + presencia
alter table users add column if not exists banner_url text not null default '';
alter table users add column if not exists links jsonb not null default '[]';
alter table users add column if not exists last_seen_at timestamptz;

-- Posts: edición, fijado, encuestas
alter table posts add column if not exists updated_at timestamptz;
alter table posts add column if not exists is_pinned boolean not null default false;
alter table posts add column if not exists pinned_at timestamptz;
alter table posts add column if not exists poll jsonb;

-- Reacciones rápidas (una por usuario y gamba)
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji text not null check (emoji in ('fire', 'laugh', 'skull', 'heart')),
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

-- Votos de encuesta
create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

-- Gambalertas
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  actor_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('follow', 'like', 'comment', 'reaction', 'mention')),
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  emoji text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on notifications (user_id, created_at desc);
create index if not exists reactions_post_id_idx on reactions (post_id);
create index if not exists poll_votes_post_id_idx on poll_votes (post_id);
create index if not exists users_last_seen_idx on users (last_seen_at desc);

alter table reactions enable row level security;
alter table poll_votes enable row level security;
alter table notifications enable row level security;

create policy "reactions_read" on reactions for select using (true);
create policy "poll_votes_read" on poll_votes for select using (true);
create policy "notifications_read" on notifications for select using (true);

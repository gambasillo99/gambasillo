-- Gambasillo — Supabase PostgreSQL schema
-- Ejecutar en: Supabase Dashboard → SQL Editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  password_hash text not null,
  followers_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null default '',
  media jsonb not null default '[]',
  likes_count int not null default 0,
  reposts_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists reposts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create index if not exists posts_created_at_idx on posts (created_at desc);
create index if not exists posts_user_id_idx on posts (user_id);
create index if not exists comments_post_id_idx on comments (post_id);

-- RLS: desactivado (el backend usa service_role en API routes)
alter table users enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table reposts enable row level security;
alter table follows enable row level security;

-- Políticas permisivas para anon (opcional si usas cliente directo)
-- Con API routes + service_role, estas no son necesarias pero permiten lectura pública:
create policy "users_read" on users for select using (true);
create policy "posts_read" on posts for select using (true);
create policy "comments_read" on comments for select using (true);

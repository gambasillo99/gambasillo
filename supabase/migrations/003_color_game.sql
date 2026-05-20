-- Minijuego "memoriza el color" — puntos acumulados por usuario (ranking global)
-- Ejecutar en Supabase SQL Editor si ya tienes la base en producción.

create table if not exists color_game_scores (
  user_id uuid primary key references users(id) on delete cascade,
  total_points bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists color_game_scores_total_points_idx
  on color_game_scores (total_points desc);

alter table color_game_scores enable row level security;

-- Lectura pública del ranking (solo datos agregados + referencia a usuario ya público)
create policy "color_game_scores_read" on color_game_scores for select using (true);

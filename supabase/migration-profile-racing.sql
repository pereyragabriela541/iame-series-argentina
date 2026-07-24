-- Datos de piloto en perfil + presentismo en campeonato.
-- Ejecutar en SQL Editor de Supabase.

alter table public.profiles
  add column if not exists kart_number text,
  add column if not exists category_slug text,
  add column if not exists team text,
  add column if not exists chassis text;

alter table public.standings
  add column if not exists presentismo int not null default 0;

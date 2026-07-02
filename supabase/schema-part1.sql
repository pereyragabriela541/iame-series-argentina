-- PARTE 1 — Tablas base (ejecutar PRIMERO)
-- Supabase SQL Editor → pegar TODO → Ejecuta y habilita RLS

create extension if not exists "pgcrypto";

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name text not null,
  is_active boolean not null default false,
  regular_rounds int not null default 7,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  sort_order int not null default 0,
  color text default '#004A99',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  round_number int not null,
  name text not null,
  circuit text,
  location text,
  city text,
  event_date date,
  event_date_iso timestamptz,
  flyer_url text,
  map_url text,
  map_pdf_url text,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (season_id, round_number)
);

create table if not exists round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  label text not null default 'Resultados PDF',
  pdf_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  pilot_number text not null,
  pilot_name text not null,
  nationality text default 'ARG',
  points int not null default 0,
  position int,
  wins int not null default 0,
  clasif int default 0,
  m1 int default 0,
  m2 int default 0,
  sh int default 0,
  final_pts int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, category_id, pilot_number)
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  excerpt text,
  body text,
  category text default 'General',
  image_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists regulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text default 'deportivo',
  pdf_url text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  round_id uuid references rounds(id) on delete set null,
  pdf_url text,
  items jsonb default '[]',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  form_type text default 'general',
  pdf_url text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists media_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  round_id uuid references rounds(id) on delete set null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists media_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  thumbnail_url text,
  round_id uuid references rounds(id) on delete set null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete set null,
  dni text not null,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  age int,
  category_slug text,
  kart_number text,
  team text,
  city text,
  extra jsonb default '{}',
  created_at timestamptz not null default now()
);

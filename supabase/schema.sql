-- IAME SERIES ARGENTINA — Esquema relacional
-- Ejecutar en Supabase → SQL Editor

-- ─── Extensiones ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Temporadas ────────────────────────────────────────────────
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name text not null,
  is_active boolean not null default false,
  regular_rounds int not null default 7,
  created_at timestamptz not null default now()
);

-- ─── Categorías ────────────────────────────────────────────────
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

-- ─── Fechas / Rondas ───────────────────────────────────────────
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

-- ─── Resultados PDF por fecha y categoría ──────────────────────
create table if not exists round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  label text not null default 'Resultados PDF',
  pdf_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Campeonato: posiciones por piloto ───────────────────────────
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

-- ─── Noticias ────────────────────────────────────────────────────
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

-- ─── Reglamentos ─────────────────────────────────────────────────
create table if not exists regulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text default 'deportivo',
  pdf_url text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Cronogramas ─────────────────────────────────────────────────
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

-- ─── Formularios ─────────────────────────────────────────────────
create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  form_type text default 'general',
  pdf_url text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Galería ─────────────────────────────────────────────────────
create table if not exists media_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  round_id uuid references rounds(id) on delete set null,
  section_key text not null default 'main',
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

-- Textos editables de /imagenes y /videos
create table if not exists media_sections (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('images', 'videos')),
  round_id uuid references rounds(id) on delete cascade,
  section_key text not null default 'main',
  kicker text,
  title text,
  subtitle text,
  description text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Inscripciones ───────────────────────────────────────────────
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

-- ─── Alertas / Notificaciones ────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- ─── Configuración global (key-value) ────────────────────────────
create table if not exists app_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ─── Índices ─────────────────────────────────────────────────────
create index if not exists idx_rounds_season on rounds(season_id, sort_order);
create index if not exists idx_standings_cat on standings(season_id, category_id, position);
create index if not exists idx_news_published on news(is_published, published_at desc);
create index if not exists idx_registrations_dni on registrations(dni);

-- ─── RLS: lectura pública, escritura restringida ─────────────────
alter table seasons enable row level security;
alter table categories enable row level security;
alter table rounds enable row level security;
alter table round_results enable row level security;
alter table standings enable row level security;
alter table news enable row level security;
alter table regulations enable row level security;
alter table schedules enable row level security;
alter table forms enable row level security;
alter table media_images enable row level security;
alter table media_videos enable row level security;
alter table media_sections enable row level security;
alter table notifications enable row level security;
alter table app_config enable row level security;
alter table registrations enable row level security;

-- Lectura pública
create policy "public_read_seasons" on seasons for select using (true);
create policy "public_read_categories" on categories for select using (is_active = true);
create policy "public_read_rounds" on rounds for select using (true);
create policy "public_read_round_results" on round_results for select using (true);
create policy "public_read_standings" on standings for select using (true);
create policy "public_read_news" on news for select using (is_published = true);
create policy "public_read_regulations" on regulations for select using (is_published = true);
create policy "public_read_schedules" on schedules for select using (is_published = true);
create policy "public_read_forms" on forms for select using (is_published = true);
create policy "public_read_media_images" on media_images for select using (is_published = true);
create policy "public_read_media_videos" on media_videos for select using (is_published = true);
create policy "public_read_media_sections" on media_sections for select using (is_published = true);
create policy "public_read_notifications" on notifications for select using (is_published = true);
create policy "public_read_app_config" on app_config for select using (true);

-- Inscripciones: solo insert público (sin listado)
create policy "public_insert_registrations" on registrations for insert with check (true);

-- ─── Seed: Temporada 2026 ────────────────────────────────────────
insert into seasons (year, name, is_active, regular_rounds)
values (2026, 'IAME Series Argentina 2026', true, 10)
on conflict (year) do update set is_active = true, regular_rounds = 10;

-- Categorías oficiales 2026
insert into categories (slug, name, short_name, sort_order, color) values
  ('60-mini', '60 MINI', '60M', 1, '#75BEE9'),
  ('60-mini-under', '60 MINI UNDER', '60U', 2, '#75BEE9'),
  ('junior', 'JUNIOR MY10', 'JMY10', 3, '#004A99'),
  ('senior', 'SENIOR MY10', 'SMY10', 4, '#004A99'),
  ('master', 'MASTER MY10', 'MAS', 5, '#A7A9AC'),
  ('master-gentleman', 'GENTLEMAN', 'GENT', 6, '#A7A9AC'),
  ('okn-junior', 'OKN JUNIOR', 'OKNJ', 7, '#E30613'),
  ('okn', 'OKN', 'OKN', 8, '#E30613'),
  ('senior-pro-390-honda', 'SENIOR 390 PRO/HONDA', 'S390H', 9, '#E30613'),
  ('academy', 'ACADEMY/HONDA', 'ACADH', 10, '#75BEE9')
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  sort_order = excluded.sort_order;

-- Calendario oficial 2026 (10 fechas + final)
with s as (select id from seasons where year = 2026)
insert into rounds (season_id, round_number, name, circuit, location, city, event_date, status, sort_order)
select s.id, n.num, n.name, n.circuit, n.circuit, n.city, n.dt::date, n.st, n.num
from s, (values
  (1, 'Fecha 1', 'Kartódromo de BS AS', 'CABA', '2026-02-28', 'finished'),
  (2, 'Fecha 2', 'Kartódromo Ramiro Tot, Baradero', 'Baradero', '2026-03-28', 'finished'),
  (3, 'Fecha 3', 'Kartódromo de BS AS', 'CABA', '2026-04-25', 'finished'),
  (4, 'Fecha 4', 'Kartódromo Internacional de Zárate', 'Zárate', '2026-05-30', 'finished'),
  (5, 'Fecha 5', 'Kartódromo de BS AS', 'CABA', '2026-07-18', 'upcoming'),
  (6, 'Fecha 6', 'Kartódromo Ramiro Tot, Baradero', 'Baradero', '2026-08-08', 'upcoming'),
  (7, 'Fecha 7', 'Kartódromo de BS AS', 'CABA', '2026-10-03', 'upcoming'),
  (8, 'Fecha 8', 'Kartódromo a confirmar', 'A confirmar', '2026-10-31', 'upcoming'),
  (9, 'Fecha 9', 'Kartódromo de BS AS', 'CABA', '2026-11-14', 'upcoming'),
  (10, 'Fecha 10', 'Kartódromo de BS AS', 'CABA', '2026-12-19', 'upcoming'),
  (11, 'Final IAME Argentina', 'Kartódromo a confirmar', 'A confirmar', '2026-09-05', 'upcoming')
) as n(num, name, circuit, city, dt, st)
on conflict (season_id, round_number) do update set
  name = excluded.name,
  circuit = excluded.circuit,
  location = excluded.circuit,
  city = excluded.city,
  event_date = excluded.event_date,
  status = excluded.status;

-- Config global
insert into app_config (key, value) values
  ('temporada', '{"year": 2026, "nombre": "IAME Series Argentina", "organizador": "BS Proyect", "inscripcion_habilitada": true}'),
  ('contacto', '{"email": "info@iameseriesargentina.com.ar", "inscripciones_email": "inscripciones@iameseriesargentina.com.ar"}'),
  ('live', '{"is_live": false, "timing_url": "", "round_label": "Fecha 5"}'),
  ('transmision', '{"titulo": "Transmisión en Vivo", "url": "", "descripcion": "Seguí la transmisión oficial de IAME Series Argentina."}'),
  ('theme', '{"navy": "#004A99", "red": "#E30613", "silver": "#A7A9AC", "sky": "#75BEE9"}')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Noticia de bienvenida
insert into news (slug, title, excerpt, body, category, is_published, sort_order)
values (
  'bienvenida-temporada-2026',
  'Arranca la temporada 2026 de IAME Series Argentina',
  'Nuevas categorías OKN, 60 Mini y Old School Master. Siete fechas en la etapa regular.',
  'IAME Series Argentina presenta la Champion Cup 2026 con 7 fechas de etapa regular, nuevas divisionales OKN y OKN Junior, y premios para correr en Italia.',
  'General',
  false,
  1
) on conflict (slug) do update set is_published = false;

-- Standings demo (OKN Junior)
with s as (select id from seasons where year = 2026),
     c as (select id from categories where slug = 'okn-junior')
insert into standings (season_id, category_id, pilot_number, pilot_name, points, position, wins, m1, m2, sh, final_pts)
select s.id, c.id, p.num, p.name, p.pts, p.pos, p.w, p.m1, p.m2, p.sh, p.fin
from s, c, (values
  ('07', 'Martínez', 61, 1, 1, 12, 15, 16, 18),
  ('44', 'García', 48, 2, 0, 10, 12, 13, 13),
  ('16', 'López', 35, 3, 0, 8, 8, 10, 9)
) as p(num, name, pts, pos, w, m1, m2, sh, fin)
on conflict (season_id, category_id, pilot_number) do nothing;

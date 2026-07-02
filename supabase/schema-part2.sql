-- PARTE 2 — Ejecutar si schema.sql falló en la línea 171
-- (pegar TODO este archivo en Supabase SQL Editor → Correr)

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists app_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_rounds_season on rounds(season_id, sort_order);
create index if not exists idx_standings_cat on standings(season_id, category_id, position);
create index if not exists idx_news_published on news(is_published, published_at desc);
create index if not exists idx_registrations_dni on registrations(dni);

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
alter table notifications enable row level security;
alter table app_config enable row level security;
alter table registrations enable row level security;

drop policy if exists "public_read_seasons" on seasons;
drop policy if exists "public_read_categories" on categories;
drop policy if exists "public_read_rounds" on rounds;
drop policy if exists "public_read_round_results" on round_results;
drop policy if exists "public_read_standings" on standings;
drop policy if exists "public_read_news" on news;
drop policy if exists "public_read_regulations" on regulations;
drop policy if exists "public_read_schedules" on schedules;
drop policy if exists "public_read_forms" on forms;
drop policy if exists "public_read_media_images" on media_images;
drop policy if exists "public_read_media_videos" on media_videos;
drop policy if exists "public_read_notifications" on notifications;
drop policy if exists "public_read_app_config" on app_config;
drop policy if exists "public_insert_registrations" on registrations;

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
create policy "public_read_notifications" on notifications for select using (is_published = true);
create policy "public_read_app_config" on app_config for select using (true);
create policy "public_insert_registrations" on registrations for insert with check (true);

insert into seasons (year, name, is_active, regular_rounds)
values (2026, 'IAME Series Argentina 2026', true, 10)
on conflict (year) do update set is_active = true, regular_rounds = 10;

insert into categories (slug, name, short_name, sort_order, color) values
  ('60-mini-under', '60 MINI/UNDER', '60MU', 1, '#75BEE9'),
  ('junior', 'JUNIOR', 'JUN', 2, '#004A99'),
  ('master-gentleman', 'MASTER/GENTLEMAN', 'M/G', 3, '#A7A9AC'),
  ('senior', 'SENIOR', 'SEN', 4, '#004A99'),
  ('okn-junior', 'OKN JUNIOR', 'OKNJ', 5, '#E30613'),
  ('okn', 'OKN', 'OKN', 6, '#E30613'),
  ('senior-pro-390-honda', 'SENIOR PRO 390 HONDA', 'SP390', 7, '#E30613'),
  ('academy', 'ACADEMY', 'ACAD', 8, '#75BEE9')
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  sort_order = excluded.sort_order;

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

insert into app_config (key, value) values
  ('temporada', '{"year": 2026, "nombre": "IAME Series Argentina", "organizador": "BS Proyecta", "inscripcion_habilitada": true}'),
  ('contacto', '{"email": "info@iameseriesargentina.com.ar", "inscripciones_email": "inscripciones@iameseriesargentina.com.ar"}'),
  ('live', '{"is_live": false, "timing_url": "", "speedhive_url": "", "round_label": "Fecha 5"}'),
  ('transmision', '{"titulo": "Transmisión en Vivo", "url": "", "descripcion": "Seguí la transmisión oficial de IAME Series Argentina."}'),
  ('theme', '{"navy": "#004A99", "red": "#E30613", "silver": "#A7A9AC", "sky": "#75BEE9"}')
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into news (slug, title, excerpt, body, category, is_published, sort_order)
values (
  'bienvenida-temporada-2026',
  'Arranca la temporada 2026 de IAME Series Argentina',
  'Nuevas categorías OKN, 60 Mini y Old School Master.',
  'IAME Series Argentina presenta la Champion Cup 2026.',
  'General',
  false,
  1
) on conflict (slug) do update set is_published = false;

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

-- Actualización inscripción: número de kart + calendario/categorías 2026
-- Ejecutar en Supabase → SQL Editor si ya corriste schema.sql antes

alter table registrations
  add column if not exists kart_number text;

update seasons set regular_rounds = 10 where year = 2026;

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
  (2, 'Fecha 2', 'Kartódromo Ramiro Tot, Baradero', 'Baradero', '2026-03-28', 'upcoming'),
  (3, 'Fecha 3', 'Kartódromo de BS AS', 'CABA', '2026-04-25', 'upcoming'),
  (4, 'Fecha 4', 'Kartódromo Internacional de Zárate', 'Zárate', '2026-05-30', 'upcoming'),
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

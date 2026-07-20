-- Actualización inscripción: número de kart + calendario/categorías 2026
-- Ejecutar en Supabase → SQL Editor si ya corriste schema.sql antes

alter table registrations
  add column if not exists kart_number text;

update seasons set regular_rounds = 10 where year = 2026;

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

-- Separar MASTER MY10 y GENTLEMAN (como 60 Mini / 60 Mini Under).
-- Corren juntas, pero los (G) puntúan en ambas tablas.
-- Ejecutar en Supabase → SQL Editor (antes del seed de standings Fecha 5).

insert into categories (slug, name, short_name, sort_order, color, is_active) values
  ('master', 'MASTER MY10/GENTLEMAN', 'M/G', 5, '#A7A9AC', true),
  ('master-gentleman', 'GENTLEMAN', 'GENT', 6, '#A7A9AC', true),
  ('okn-junior', 'OKN JUNIOR', 'OKNJ', 7, '#E30613', true),
  ('okn', 'OKN', 'OKN', 8, '#E30613', true),
  ('senior-pro-390-honda', 'SENIOR 390 PRO/HONDA', 'S390H', 9, '#E30613', true),
  ('academy', 'ACADEMY/HONDA', 'ACADH', 10, '#75BEE9', true)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  sort_order = excluded.sort_order,
  color = excluded.color,
  is_active = true;

-- Alias viejo
update categories
set is_active = false, sort_order = 99
where slug = 'master-my10';

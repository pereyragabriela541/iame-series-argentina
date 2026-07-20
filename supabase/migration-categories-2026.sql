-- Categorías oficiales IAME Series Argentina 2026
-- Ejecutar en Supabase → SQL Editor
-- MASTER y GENTLEMAN separados (corren juntas; los G puntúan en ambas)

insert into categories (slug, name, short_name, sort_order, color, is_active) values
  ('60-mini', '60 MINI', '60M', 1, '#75BEE9', true),
  ('60-mini-under', '60 MINI UNDER', '60U', 2, '#75BEE9', true),
  ('junior', 'JUNIOR MY10', 'JMY10', 3, '#004A99', true),
  ('senior', 'SENIOR MY10', 'SMY10', 4, '#004A99', true),
  ('master', 'MASTER MY10', 'MAS', 5, '#A7A9AC', true),
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

-- Alias viejo unificado
update categories
set is_active = false, sort_order = 99
where slug = 'master-my10';

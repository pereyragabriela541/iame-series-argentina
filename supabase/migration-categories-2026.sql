-- Categorías oficiales IAME Series Argentina 2026
-- Ejecutar en Supabase → SQL Editor

insert into categories (slug, name, short_name, sort_order, color, is_active) values
  ('60-mini', '60 MINI', '60M', 1, '#75BEE9', true),
  ('60-mini-under', '60 MINI UNDER', '60U', 2, '#75BEE9', true),
  ('junior', 'JUNIOR MY10', 'JMY10', 3, '#004A99', true),
  ('senior', 'SENIOR MY10', 'SMY10', 4, '#004A99', true),
  ('master-my10', 'MASTER MY10', 'MMY10', 5, '#A7A9AC', true),
  ('okn-junior', 'OKN JUNIOR', 'OKNJ', 6, '#E30613', true),
  ('okn', 'OKN', 'OKN', 7, '#E30613', true),
  ('master-gentleman', 'MASTER MY10 GENTLEMAN', 'MG10', 8, '#A7A9AC', true)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  sort_order = excluded.sort_order,
  color = excluded.color,
  is_active = true;

update categories
set is_active = false
where slug in ('senior-pro-390-honda', 'academy');

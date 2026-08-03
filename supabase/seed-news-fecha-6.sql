-- Noticia: flyer Fecha 6 — Gran Premio Nave Planes / Pilotos Invitados
-- Ejecutar en Supabase → SQL Editor

-- Ocultar flyer Fecha 5 como featured (queda el de Fecha 6)
update news
set is_published = false
where slug = 'fecha-5';

insert into news (slug, title, excerpt, body, category, image_url, is_published, sort_order, published_at)
values (
  'fecha-6',
  'FECHA 6 | Gran Premio Nave Planes',
  'Gran Premio Nave Planes – Pilotos Invitados. Kartódromo Ramiro Tot, Baradero. 8 y 9 de agosto. Round 6.',
  E'El Champion Cup 2026 suma un nuevo desafío.\n\nLlega el Gran Premio Nave Planes – Pilotos Invitados, un fin de semana donde la velocidad, la estrategia y el trabajo en equipo serán protagonistas.\n\n📍 Kartódromo Ramiro Tot – Baradero\n8 y 9 de agosto · Round 6',
  'Champion Cup 2026',
  '/noticias/fecha-6.jpg',
  true,
  0,
  now()
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  category = excluded.category,
  image_url = excluded.image_url,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at;

-- Flyer en la fecha del calendario
update rounds
set flyer_url = '/noticias/fecha-6.jpg'
where round_number = 6
  and season_id = (select id from seasons where is_active = true limit 1);

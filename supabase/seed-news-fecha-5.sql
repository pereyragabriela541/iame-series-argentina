-- Noticia: flyer Fecha 5 — Champion Cup 2026
-- Ejecutar en Supabase → SQL Editor

insert into news (slug, title, excerpt, body, category, image_url, is_published, sort_order, published_at)
values (
  'fecha-5',
  'FECHA 5 | Champion Cup 2026',
  'Un fin de semana histórico en el Kartódromo de Buenos Aires, Circuito 2. Inscripciones abiertas.',
  E'Llega un fin de semana que quedará para siempre en la historia del karting argentino.\n\nNos toca el honor de ser la categoría que despida, al menos por un tiempo, al histórico Kartódromo de Buenos Aires. Un circuito que formó generaciones de pilotos, equipos y apasionados por este deporte.\n\n📍 Kartódromo de Buenos Aires – Circuito 2\n\nLas inscripciones ya se encuentran abiertas en nuestra página web.\n\nNo será un adiós… será un hasta pronto para un lugar que nos regaló miles de historias, emociones y recuerdos imborrables.',
  'Champion Cup 2026',
  '/noticias/fecha-5.png',
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

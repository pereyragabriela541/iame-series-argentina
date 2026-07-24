-- Noticia de dúos Fecha 6
insert into news (slug, title, excerpt, body, category, is_published, sort_order, published_at)
values (
  'duos-fecha-6',
  'Dúos Fecha 6 — Titular + Invitado',
  'Mirá los dúos que se van inscribiendo a la Fecha 6: piloto titular y piloto invitado, con sus fotos.',
  E'La Fecha 6 de IAME Series Argentina se corre con piloto titular y piloto invitado.\n\nAl inscribirte en la web, subís la foto de ambos y el dúo se publica automáticamente en esta sección.\n\nInscribite, reservá tu turno y sumate a la grilla de dúos.',
  'Fecha 6',
  true,
  1,
  now()
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  category = excluded.category,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at;

-- Flyer Fecha 6 — Gran Premio Nave Planes / Pilotos Invitados
-- Va en Calendario → Fecha 6 (rounds.flyer_url), no en Noticias.
-- Ejecutar en Supabase → SQL Editor

update rounds
set flyer_url = '/noticias/fecha-6.jpg'
where round_number = 6
  and season_id = (select id from seasons where is_active = true limit 1);

-- Por si quedó una noticia previa del flyer, mantenerla oculta
update news
set is_published = false
where slug in ('fecha-5', 'fecha-6');

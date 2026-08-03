-- Opcional (largo plazo): texto del flyer en la fila de la fecha.
-- Hoy el texto vive en app_config.flyer_copy (sin migración) y la imagen en rounds.flyer_url.

alter table rounds
  add column if not exists flyer_text text;

-- Ejemplo Fecha 6
update rounds
set flyer_url = '/noticias/fecha-6.jpg'
where round_number = 6
  and season_id = (select id from seasons where is_active = true limit 1);

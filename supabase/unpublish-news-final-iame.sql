-- Ocultar flyer y PDF de la Final IAME; dejar la fecha a confirmar.
update news
set is_published = false
where slug in (
  'final-iame-argentina-2026',
  'inscripciones-abiertas-final-iame-2026'
);

update rounds
set
  flyer_url = null,
  event_date = null,
  event_date_iso = null
where round_number = 11
  and season_id = (select id from seasons where is_active = true limit 1);

update app_config
set
  value = coalesce(value, '{}'::jsonb) - '11',
  updated_at = now()
where key = 'flyer_copy';

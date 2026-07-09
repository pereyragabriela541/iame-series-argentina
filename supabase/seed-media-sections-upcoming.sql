-- Cabeceras de Imágenes / Videos para todas las fechas del Champion Cup 2026
-- (excepto las que ya tienen secciones propias, ej. Fecha 4)
-- Ejecutar en Supabase → SQL Editor → Run

insert into media_sections (media_type, round_id, section_key, title, sort_order, is_published)
select
  v.media_type,
  r.id,
  'main',
  case
    when r.round_number = 11 then 'FINAL'
    else 'FECHA ' || r.round_number
  end,
  r.round_number,
  true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
cross join (values ('images'), ('videos')) as v(media_type)
where not exists (
  select 1
  from media_sections ms
  where ms.media_type = v.media_type
    and ms.round_id = r.id
    and ms.section_key != 'page'
)
on conflict (media_type, round_id, section_key) where round_id is not null
do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  is_published = true;

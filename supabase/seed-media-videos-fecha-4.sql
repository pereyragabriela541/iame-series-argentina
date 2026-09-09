-- Selección curada de videos para las Fechas 4 y 6.

delete from media_videos
where round_id in (
  select r.id from rounds r
  join seasons s on s.id = r.season_id and s.is_active = true
  where r.round_number in (4, 6)
);

delete from media_sections
where media_type = 'videos'
  and round_id in (
    select r.id from rounds r
    join seasons s on s.id = r.season_id and s.is_active = true
    where r.round_number in (4, 6)
  );

insert into media_sections (
  media_type, round_id, section_key, title, subtitle, description, sort_order, is_published
)
select 'videos', r.id, 'main', 'FECHA ' || r.round_number,
  case
    when r.round_number = 4 then 'Kartódromo Internacional de Zárate'
    when r.round_number = 6 then 'Kartódromo Ramiro Tot — Baradero'
  end,
  null, r.round_number, true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
where r.round_number in (4, 6);

insert into media_videos (
  title, video_url, thumbnail_url, round_id, sort_order, is_published
)
select
  v.title,
  v.video_url,
  v.thumbnail_url,
  r.id,
  v.sort_order,
  true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
cross join lateral (
  values (
    case
      when r.round_number = 4 then 'Resumen de la Fecha 4 — Domingo de finales'
      when r.round_number = 6 then 'Resumen de la Fecha 6 — Domingo de finales'
    end,
    case
      when r.round_number = 4 then '/videos/fecha-4/resumen-final-vertical.mp4'
      when r.round_number = 6 then '/videos/fecha-6/resumen-final-vertical.mp4'
    end,
    case
      when r.round_number = 4 then '/videos/fecha-4/resumen-final-poster.jpg'
      when r.round_number = 6 then '/videos/fecha-6/resumen-final-poster.jpg'
    end,
    1
  )
) as v(title, video_url, thumbnail_url, sort_order)
where r.round_number in (4, 6);

-- Videos FECHA 4 — Conociendo equipos (Franco Manta / FGM)
-- Ejecutar en Supabase SQL Editor si hace falta re-seed

delete from media_videos
where video_url like '%DZs8EwfAATe%';

delete from media_sections
where media_type = 'videos'
  and round_id in (
    select r.id from rounds r
    join seasons s on s.id = r.season_id and s.is_active = true
    where r.round_number = 4
  );

insert into media_sections (
  media_type, round_id, section_key, title, subtitle, description, sort_order, is_published
)
select
  'videos',
  r.id,
  'main',
  'FECHA 4',
  null,
  null,
  1,
  true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
where r.round_number = 4;

insert into media_videos (title, video_url, round_id, sort_order, is_published)
select
  v.title,
  v.video_url,
  r.id,
  v.sort_order,
  true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
cross join (
  values
    (
      'Franco Manta — FGM | Conociendo equipos',
      'https://www.instagram.com/reel/DZs8EwfAATe/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
      1
    ),
    (
      'Un resumen de lo que fue nuestra 4ª fecha del Champion Cup 2026. Un fin de semana lleno de competencia, emoción, grandes carreras y momentos que siguen demostrando el crecimiento de esta categoría. Seguimos construyendo juntos un campeonato cada vez más grande, manteniendo la pasión, el profesionalismo y el espíritu que caracterizan a IAME Series Argentina.',
      'https://www.instagram.com/reel/DZbJDT3EcpM/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
      2
    )
) as v(title, video_url, sort_order)
where r.round_number = 4;

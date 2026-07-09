-- Galería Fecha 4 — imágenes en /public/galeria/fecha-4/
-- Bloque winners (sort 1–7) + weekend (sort 8–17)
-- Los textos van en media_sections (ver migration-media-sections.sql)

delete from media_images
where image_url like '/galeria/fecha-4/%';

insert into media_images (title, image_url, round_id, section_key, sort_order, is_published)
select
  null,
  v.image_url,
  r.id,
  v.section_key,
  v.sort_order,
  true
from (
  values
    ('/galeria/fecha-4/IMG_7821.png', 'winners', 1),
    ('/galeria/fecha-4/IMG_7822.png', 'winners', 2),
    ('/galeria/fecha-4/IMG_7823.png', 'winners', 3),
    ('/galeria/fecha-4/IMG_7824.png', 'winners', 4),
    ('/galeria/fecha-4/IMG_7825.png', 'winners', 5),
    ('/galeria/fecha-4/IMG_7826.png', 'winners', 6),
    ('/galeria/fecha-4/IMG_7827.png', 'winners', 7),
    ('/galeria/fecha-4/IMG_7828.png', 'weekend', 8),
    ('/galeria/fecha-4/IMG_7829.png', 'weekend', 9),
    ('/galeria/fecha-4/IMG_7830.png', 'weekend', 10),
    ('/galeria/fecha-4/IMG_7831.png', 'weekend', 11),
    ('/galeria/fecha-4/IMG_7832.png', 'weekend', 12),
    ('/galeria/fecha-4/IMG_7833.png', 'weekend', 13),
    ('/galeria/fecha-4/IMG_7834.png', 'weekend', 14),
    ('/galeria/fecha-4/IMG_7835.png', 'weekend', 15),
    ('/galeria/fecha-4/IMG_7836.png', 'weekend', 16),
    ('/galeria/fecha-4/IMG_7837.png', 'weekend', 17)
) as v(image_url, section_key, sort_order)
cross join rounds r
join seasons s on s.id = r.season_id and s.is_active = true
where r.round_number = 4;

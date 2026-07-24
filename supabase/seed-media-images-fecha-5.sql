-- Galería Fecha 5 — imágenes en /public/galeria/fecha-5/
-- Carrusel weekend + texto de cierre del Kartódromo de Buenos Aires

delete from media_images
where image_url like '/galeria/fecha-5/%';

delete from media_sections
where media_type = 'images'
  and section_key = 'weekend'
  and round_id in (
    select r.id from rounds r
    join seasons s on s.id = r.season_id and s.is_active = true
    where r.round_number = 5
  );

insert into media_sections (
  media_type, round_id, section_key, title, subtitle, description, sort_order, is_published
)
select
  'images',
  r.id,
  'weekend',
  'FECHA 5',
  'Kartódromo de la Ciudad de Buenos Aires — última fecha en el trazado histórico',
  E'IAME Series Argentina cerró una etapa histórica en el Kartódromo de la Ciudad de Buenos Aires.\n\nLa quinta fecha de IAME Series Argentina quedó marcada como una jornada inolvidable para el karting nacional. El tradicional Kartódromo de la Ciudad de Buenos Aires recibió su última competencia oficial antes del inicio de las obras que darán paso a un nuevo trazado internacional con homologación FIA, poniendo punto final a una etapa que durante décadas fue escenario del crecimiento de miles de pilotos.\n\nAdemás de la actividad en pista, la fecha tuvo un significado especial con la presentación oficial del proyecto del nuevo kartódromo, una obra que posicionará al país con un escenario de nivel internacional para el desarrollo del karting.\n\nMaster: Damián Cassino volvió a subirse en lo más alto del podio tras una gran performance dentro de la divisional mayor.\n\nMaster Gentleman: el triunfo quedó en poder de Nicolás Torres, logrando su mejor actuación en la categoría.\n\nJunior: Santino Mateo volvió a ser imbatible en pista y acumuló una nueva victoria en la categoría; Noha Vasicek y Pedro Rossotti finalizaron segundo y tercero respectivamente.\n\nSenior: Franco Bataglia logró finalmente la primera victoria en la temporada, tras una peleadísima última vuelta con Ricardo Mattar y Ramiro Amorelli.\n\nOKN Junior: Ignacio Díaz Quaglia llegó finalmente a su primer podio en la temporada tras una gran actuación a lo largo de todo el fin de semana. Tomás Roca y Bruno Bisceglia terminaron segundo y tercero respectivamente.\n\nOKN: Martín Saa se quedó con la victoria que en pista fue de Juan Ignacio Alessi, pasando a ocupar el segundo lugar, mientras que Martín Córdoba ocupó el tercer escalón del podio.\n\n60 Mini: se encuentra en suspenso por deportiva.',
  1,
  true
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
where r.round_number = 5;

insert into media_images (title, image_url, round_id, section_key, sort_order, is_published)
select
  null,
  v.image_url,
  r.id,
  'weekend',
  v.sort_order,
  true
from (
  values
    ('/galeria/fecha-5/IMG_8337.png', 1),
    ('/galeria/fecha-5/IMG_8338.png', 2),
    ('/galeria/fecha-5/IMG_8339.png', 3),
    ('/galeria/fecha-5/IMG_8340.png', 4),
    ('/galeria/fecha-5/IMG_8341.png', 5),
    ('/galeria/fecha-5/IMG_8342.png', 6),
    ('/galeria/fecha-5/IMG_8343.png', 7),
    ('/galeria/fecha-5/IMG_8344.png', 8)
) as v(image_url, sort_order)
cross join rounds r
join seasons s on s.id = r.season_id and s.is_active = true
where r.round_number = 5;

-- Textos editables de Imágenes / Videos (títulos, subtítulos, descripciones)
-- Ejecutar en Supabase → SQL Editor → Run

-- ─── Tabla de secciones ──────────────────────────────────────────
create table if not exists media_sections (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('images', 'videos')),
  round_id uuid references rounds(id) on delete cascade,
  section_key text not null default 'main',
  kicker text,
  title text,
  subtitle text,
  description text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists media_sections_page_uidx
  on media_sections (media_type)
  where round_id is null and section_key = 'page';

create unique index if not exists media_sections_round_uidx
  on media_sections (media_type, round_id, section_key)
  where round_id is not null;

create index if not exists idx_media_sections_type_round
  on media_sections (media_type, round_id, sort_order);

alter table media_sections enable row level security;

drop policy if exists "public_read_media_sections" on media_sections;
create policy "public_read_media_sections"
  on media_sections for select
  using (is_published = true);

-- ─── Bloque de cada imagen ───────────────────────────────────────
alter table media_images
  add column if not exists section_key text not null default 'main';

-- ─── Cabeceras de página ─────────────────────────────────────────
delete from media_sections
where round_id is null and section_key = 'page' and media_type in ('images', 'videos');

insert into media_sections (media_type, round_id, section_key, kicker, title, subtitle, description, sort_order)
values
  ('images', null, 'page', 'Galería', 'Imágenes', null, null, 0),
  ('videos', null, 'page', 'Media', 'Videos', null, null, 0);

-- ─── FECHA 4 ─────────────────────────────────────────────────────
delete from media_sections
where media_type = 'images'
  and section_key in ('winners', 'weekend')
  and round_id in (
    select r.id from rounds r
    join seasons s on s.id = r.season_id and s.is_active = true
    where r.round_number = 4
  );

insert into media_sections (
  media_type, round_id, section_key, title, subtitle, description, sort_order
)
select
  'images',
  r.id,
  v.section_key,
  v.title,
  v.subtitle,
  v.description,
  v.sort_order
from rounds r
join seasons s on s.id = r.season_id and s.is_active = true
cross join (
  values
    (
      'winners',
      'FECHA 4',
      'Postales de los ganadores de la Final',
      E'Ellos fueron los protagonistas del primer escalón del podio en una nueva jornada de IAME Series Argentina.\n\nLa cuenta regresiva ya comenzó…\n\nNos reencontramos en la Fecha #5, en el Kartódromo de Buenos Aires – Circuito N.º 2.\n\n¡Nos vemos en la pista! 🇦🇷🔥',
      1
    ),
    (
      'weekend',
      null,
      'Cada imagen cuenta una parte de un fin de semana que volvió a demostrar por qué IAME Series Argentina sigue creciendo.',
      null,
      2
    )
) as v(section_key, title, subtitle, description, sort_order)
where r.round_number = 4;

update media_images
set section_key = case
  when sort_order <= 7 then 'winners'
  else 'weekend'
end
where image_url like '/galeria/fecha-4/%';

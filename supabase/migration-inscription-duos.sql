-- Fotos de dúos Fecha 6 (titular + invitado). Ejecutar en Supabase SQL Editor.
-- Subida solo vía API con service role; lectura pública.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inscription-duos',
  'inscription-duos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "inscription_duos_public_read" on storage.objects;
create policy "inscription_duos_public_read"
  on storage.objects for select
  using (bucket_id = 'inscription-duos');

-- ---------------------------------------------------------------------------
-- Bucket para el material de demostración.
--
-- Separado del de avatares a propósito: tiene otro tamaño, otros tipos y otra
-- vida. El de avatares se queda; este se borra con el resto del demo.
--
-- Nadie escribe aquí desde la aplicación: solo se sube desde fuera con la
-- llave de servicio. Por eso no hay política de INSERT.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demo', 'demo', true, 10485760, array['video/mp4', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "material demo se lee siempre" on storage.objects;
create policy "material demo se lee siempre" on storage.objects
  for select using (bucket_id = 'demo');

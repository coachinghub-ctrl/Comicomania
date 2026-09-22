-- ---------------------------------------------------------------------------
-- Quién puede escribir en el bucket de avatares.
--
-- El bucket es público para LEER: una foto de perfil que hay que firmar para
-- mostrar no sirve en una ficha pública ni en un muro.
--
-- Lo que se protege es quién ESCRIBE, y la regla es una sola: cada quien solo
-- toca su propia carpeta. El primer tramo de la ruta tiene que ser su id, así
-- que nadie puede pisar la foto de otro ni llenarle el espacio.
-- ---------------------------------------------------------------------------

drop policy if exists "avatares se leen siempre"   on storage.objects;
drop policy if exists "subo mi propio avatar"      on storage.objects;
drop policy if exists "reemplazo mi propio avatar" on storage.objects;
drop policy if exists "borro mi propio avatar"     on storage.objects;

create policy "avatares se leen siempre" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "subo mi propio avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "reemplazo mi propio avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "borro mi propio avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

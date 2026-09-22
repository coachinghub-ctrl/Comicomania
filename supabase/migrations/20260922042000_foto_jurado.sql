-- ---------------------------------------------------------------------------
-- Foto del jurado.
--
-- La columna photo_url ya existía; faltaba dónde poner el archivo. El jurado
-- aparece ante el público —quien compite tiene derecho a saber quién lo
-- juzga—, así que su foto es material público, igual que el arte del concurso.
--
-- Se reutiliza el bucket de concursos en vez de crear uno por cada cosa: es el
-- mismo tipo de material, la misma vida y casi el mismo permiso. Lo que cambia
-- es la carpeta, y eso basta para separar quién puede escribir en cada una.
-- ---------------------------------------------------------------------------

drop policy if exists "sube foto quien gestiona jurado" on storage.objects;
create policy "sube foto quien gestiona jurado" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'jurado'
    and public.has_permission('JUDGES', 'MANAGE')
  );

drop policy if exists "reemplaza foto quien gestiona jurado" on storage.objects;
create policy "reemplaza foto quien gestiona jurado" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'jurado'
    and public.has_permission('JUDGES', 'MANAGE')
  )
  with check (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'jurado'
    and public.has_permission('JUDGES', 'MANAGE')
  );

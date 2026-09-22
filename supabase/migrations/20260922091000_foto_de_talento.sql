-- ---------------------------------------------------------------------------
-- Dónde se sube la foto de un humorista.
--
-- Se reutiliza el bucket de concursos con carpeta propia, igual que se hizo
-- con la foto del jurado: es el mismo tipo de material —público, para
-- compartir, del mismo peso— y lo que cambia es quién puede escribir en cada
-- carpeta. Crear un bucket por cada cosa multiplica las políticas sin
-- multiplicar la seguridad.
--
-- El VIDEO no se sube aquí, y no es un descuido: un reel son decenas de
-- megas, necesita transcodificación y varias calidades, y nada de eso lo da
-- este bucket. El reel se guarda como URL —YouTube, Vimeo o un mp4 alojado
-- fuera— hasta que haya un proveedor de video de verdad.
-- ---------------------------------------------------------------------------

drop policy if exists "sube foto quien edita talento" on storage.objects;
create policy "sube foto quien edita talento" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'talento'
    and public.has_permission('TALENT', 'EDIT')
  );

drop policy if exists "reemplaza foto quien edita talento" on storage.objects;
create policy "reemplaza foto quien edita talento" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'talento'
    and public.has_permission('TALENT', 'EDIT')
  )
  with check (
    bucket_id = 'concursos'
    and (storage.foldername(name))[1] = 'talento'
    and public.has_permission('TALENT', 'EDIT')
  );

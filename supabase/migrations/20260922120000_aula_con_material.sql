-- ---------------------------------------------------------------------------
-- Material para el aula.
--
-- Los tres cursos del catálogo tenían temario pero sus lecciones estaban
-- vacías por dentro: el alumno entraba y no había nada que ver. Se les pone
-- material de demostración y se convierten algunas en clases en vivo, para
-- que las dos experiencias —grabado y directo— se puedan ver de verdad.
--
-- Todo apunta al video demo, que se borra con el resto de los datos de
-- ejemplo. No hay nada aquí que sobreviva a supabase/demo/quitar.sql salvo la
-- estructura.
-- ---------------------------------------------------------------------------

do $$
declare
  v_video text := 'https://voxvnbynvrxxehnlllma.supabase.co/storage/v1/object/public/demo/video-prueba.mp4';
  v_l record;
  v_n int := 0;
begin
  -- Material para todo lo grabado de los tres cursos del catálogo.
  for v_l in
    select l.id, l.type, l.title
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
     where c.slug in ('stand-up-desde-cero', 'escribe-para-hacer-reir', 'marca-de-comedia')
       and l.asset_ref = '{}'::jsonb
  loop
    if v_l.type = 'TEXT' then
      update public.lessons
         set asset_ref = jsonb_build_object(
               'texto',
               'Material de ejemplo para "' || v_l.title || '". Aquí iría la '
               || 'lectura de la clase: el texto que el alumno lee antes de '
               || 'hacer el ejercicio.')
       where id = v_l.id;
    else
      update public.lessons
         set asset_ref = jsonb_build_object('url', v_video)
       where id = v_l.id;
    end if;
    v_n := v_n + 1;
  end loop;

  raise notice 'Material puesto en % lecciones.', v_n;
end;
$$;

/* Dos clases en vivo de verdad en el curso mixto, para que se vea cómo queda
   el aula cuando lo que toca es conectarse un día a una hora. */
do $$
declare
  v_modulo uuid;
  v_orden smallint;
begin
  select m.id into v_modulo
    from public.course_modules m
    join public.courses c on c.id = m.course_id
   where c.slug = 'stand-up-desde-cero'
   order by m."order" desc
   limit 1;

  if v_modulo is null then return; end if;

  select coalesce(max("order"), 0) into v_orden
    from public.lessons where module_id = v_modulo;

  if not exists (
    select 1 from public.lessons
     where module_id = v_modulo and type = 'LIVE'
  ) then
    insert into public.lessons (module_id, title, type, duration_s, "order",
                                starts_at, meeting_url)
    values
      (v_modulo, 'Taller en vivo: prueba tu material', 'LIVE', 5400,
       v_orden + 1, (current_date + 21 + time '19:00') at time zone 'America/New_York',
       'https://meet.google.com/demo-comicomania'),
      (v_modulo, 'Micrófono abierto con el grupo', 'LIVE', 7200,
       v_orden + 2, (current_date + 28 + time '20:00') at time zone 'America/New_York',
       'https://meet.google.com/demo-comicomania');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- El concurso necesita poder explicarse solo.
--
-- Hasta ahora un concurso tenía fechas, territorio y premio, pero nada que
-- leer: quien llegaba no sabía qué se pide, cuánto puede durar el video ni qué
-- descalifica. Eso no es un detalle de diseño — es la diferencia entre
-- recibir cien videos servibles y recibir cien videos que hay que rechazar
-- uno por uno.
--
-- Tres cosas:
--   1. El arte de invitación, que es lo que se comparte por WhatsApp.
--   2. Una descripción: qué es este concurso y para quién.
--   3. Los requisitos, en una tabla aparte y no en un párrafo: separados se
--      pueden marcar como cumplidos, contar y mostrar como lista de chequeo.
-- ---------------------------------------------------------------------------

alter table public.contests add column if not exists invitation_image_url text;
alter table public.contests add column if not exists invitation_image_alt text;
alter table public.contests add column if not exists description text;
alter table public.contests add column if not exists how_to_enter text;

comment on column public.contests.invitation_image_alt is
  'Qué se ve en el arte, para quien no lo ve. Un concurso cuya invitación es '
  'solo una imagen deja fuera a quien usa lector de pantalla.';

comment on column public.contests.how_to_enter is
  'Los pasos para inscribirse, en prosa. Los requisitos comprobables van en '
  'contest_requirements, que sí se puede contar y marcar.';

-- ---------------------------------------------------------------------------
-- Requisitos, uno por fila.
--
-- En una tabla y no en un texto largo porque un requisito suelto se puede
-- ordenar, marcar como obligatorio o no, y algún día comprobar solo. Un
-- párrafo con seis condiciones adentro no se puede hacer nada de eso, y
-- además nadie lo lee entero.
-- ---------------------------------------------------------------------------
create table if not exists public.contest_requirements (
  id          uuid primary key default public.uuid_generate_v7(),
  contest_id  uuid not null references public.contests(id) on delete cascade,
  "order"     smallint not null,
  title       text not null,
  detail      text,
  -- Un requisito opcional es una recomendación; conviene que se note.
  is_required boolean not null default true,
  -- Qué lo hace fallar, en las palabras de quien revisa. Es lo que convierte
  -- un rechazo en algo que se puede corregir.
  fails_when  text,
  created_at  timestamptz not null default now(),
  unique (contest_id, "order")
);

create index if not exists contest_requirements_concurso
  on public.contest_requirements (contest_id, "order");

alter table public.contest_requirements enable row level security;

-- Los requisitos son públicos si el concurso lo es: si hay que registrarse
-- para saber qué se pide, la gente se registra, lee, y se va.
create policy "requisitos visibles con el concurso" on public.contest_requirements
  for select using (
    exists (select 1 from public.contests c where c.id = contest_id)
  );
create policy "requisitos con permiso" on public.contest_requirements
  for all using (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)))
  with check (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)));

-- ---------------------------------------------------------------------------
-- Dónde vive el arte de invitación.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('concursos', 'concursos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "arte de concurso se lee siempre" on storage.objects;
drop policy if exists "sube arte quien edita concursos" on storage.objects;
drop policy if exists "reemplaza arte quien edita concursos" on storage.objects;

-- Público para leer: es material para compartir, ese es su trabajo.
create policy "arte de concurso se lee siempre" on storage.objects
  for select using (bucket_id = 'concursos');

-- Escribir, solo quien puede editar concursos en algún territorio. El
-- territorio exacto lo vuelve a comprobar la acción del servidor al guardar
-- la URL en el concurso.
create policy "sube arte quien edita concursos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'concursos'
    and public.has_permission('CONTESTS', 'EDIT')
  );

create policy "reemplaza arte quien edita concursos" on storage.objects
  for update to authenticated
  using (bucket_id = 'concursos' and public.has_permission('CONTESTS', 'EDIT'))
  with check (bucket_id = 'concursos' and public.has_permission('CONTESTS', 'EDIT'));

-- ---------------------------------------------------------------------------
-- Requisitos de arranque para el concurso demo, para que la página no nazca
-- vacía. Son los del brief: dos minutos, material propio, sin música con
-- derechos.
-- ---------------------------------------------------------------------------
do $$
declare v_concurso uuid;
begin
  select id into v_concurso from public.contests where slug = 'demo-miami-2027';
  if v_concurso is null then return; end if;

  update public.contests
     set description = 'La primera edición de COMICOMANÍA en Miami. Buscamos a la '
                       'gente que hace reír en la mesa, en el grupo de WhatsApp y en '
                       'el escenario. No hace falta ser profesional: hace falta tener '
                       'dos minutos que funcionen.',
         how_to_enter = 'Crea tu COMICOMANIA ID, completa tu perfil y sube tu video '
                        'antes del cierre. Tu categoría se asigna sola por tu edad: '
                        'no la eliges, y por eso nadie compite contra quien no debe.'
   where id = v_concurso and description is null;

  if not exists (select 1 from public.contest_requirements where contest_id = v_concurso) then
    insert into public.contest_requirements (contest_id, "order", title, detail, is_required, fails_when) values
      (v_concurso, 1, 'Máximo 2 minutos',
       'Se mide desde el primer fotograma. Si pasa de 2:00, no entra a la cola de revisión.',
       true, 'El video dura más de 2 minutos.'),
      (v_concurso, 2, 'Material propio',
       'La rutina tiene que ser tuya. Versionar a otro humorista sin decirlo es motivo de descalificación.',
       true, 'La rutina es de otra persona, o es una copia sin acreditar.'),
      (v_concurso, 3, 'Sin música ni clips con derechos',
       'Nada de canciones de fondo ni fragmentos de películas o series. Si suena algo que no es tuyo, no se puede publicar.',
       true, 'Se escucha música comercial o se ve material de terceros sin permiso.'),
      (v_concurso, 4, '18 años cumplidos al cierre de inscripciones',
       'La edad se congela con la fecha de cierre, así que cumplir años durante el concurso no cambia tu categoría.',
       true, 'No tienes 18 años cumplidos en la fecha de referencia.'),
      (v_concurso, 5, 'Grabado en horizontal o vertical, pero estable',
       'Cualquiera de las dos sirve. Lo que no sirve es una toma temblorosa donde no se te entiende.',
       false, 'No se te entiende por el sonido o por la imagen.'),
      (v_concurso, 6, 'Una sola entrada por persona',
       'Puedes presentarte a un solo concurso por ciudad y edición.',
       true, 'Ya estás inscrito en este concurso con otra cuenta.');
  end if;
end;
$$;

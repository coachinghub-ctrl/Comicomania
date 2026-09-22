-- ---------------------------------------------------------------------------
-- Clases en vivo o grabadas.
--
-- Hasta ahora un curso era implícitamente grabado: tenía módulos, lecciones y
-- duración, pero nada decía si alguien se conecta un martes a las siete o si
-- se ve cuando se quiera. Y esa es la primera pregunta que hace quien va a
-- pagar, porque cambia si el curso le sirve o no.
--
-- El tipo LIVE ya existía en las lecciones desde el principio; lo que faltaba
-- era lo único que hace que una clase en vivo exista: CUÁNDO es y DÓNDE se
-- entra.
-- ---------------------------------------------------------------------------

alter table public.courses add column if not exists modality text not null default 'RECORDED';
alter table public.courses drop constraint if exists curso_modalidad;
alter table public.courses add constraint curso_modalidad
  check (modality in ('RECORDED', 'LIVE', 'BLENDED'));

comment on column public.courses.modality is
  'RECORDED: se ve cuando se quiera. LIVE: cohorte con clases en directo. '
  'BLENDED: material grabado más encuentros en vivo.';

-- Una cohorte en vivo empieza un día y tiene un aforo. Un curso grabado no.
alter table public.courses add column if not exists starts_on date;
alter table public.courses add column if not exists seats integer;
alter table public.courses drop constraint if exists curso_aforo_positivo;
alter table public.courses add constraint curso_aforo_positivo
  check (seats is null or seats > 0);

alter table public.courses add column if not exists instructor_name text;

-- ---------------------------------------------------------------------------
-- La clase en vivo.
-- ---------------------------------------------------------------------------
alter table public.lessons add column if not exists starts_at   timestamptz;
alter table public.lessons add column if not exists ends_at     timestamptz;
alter table public.lessons add column if not exists meeting_url text;

comment on column public.lessons.meeting_url is
  'El enlace de la sala. NO es público: un enlace de reunión filtrado es una '
  'clase con gente que no pagó dentro. Va por el mismo camino que asset_ref.';

/* Una clase en vivo sin fecha no es una clase, es una promesa. Quien compra
   un curso en directo compra unos días y unas horas concretas. */
alter table public.lessons drop constraint if exists clase_en_vivo_tiene_fecha;
alter table public.lessons add constraint clase_en_vivo_tiene_fecha
  check (type <> 'LIVE' or starts_at is not null);

alter table public.lessons drop constraint if exists clase_en_vivo_termina_despues;
alter table public.lessons add constraint clase_en_vivo_termina_despues
  check (ends_at is null or starts_at is null or ends_at > starts_at);

/* Un curso EN VIVO tiene que tener una fecha de arranque antes de publicarse.
   Se comprueba con un trigger porque una CHECK no puede mirar otra tabla, y
   publicar una cohorte sin decir cuándo empieza es vender una fecha que no
   existe. */
create or replace function public.curso_en_vivo_exige_fecha()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'PUBLISHED'
     and new.modality in ('LIVE', 'BLENDED')
     and new.starts_on is null then
    raise exception
      'Un curso con clases en vivo no se puede publicar sin fecha de arranque.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists courses_en_vivo_con_fecha on public.courses;
create trigger courses_en_vivo_con_fecha
  before insert or update on public.courses
  for each row execute function public.curso_en_vivo_exige_fecha();

-- ---------------------------------------------------------------------------
-- El temario sigue siendo público; la sala de la clase, no.
--
-- El permiso por columna de `lessons` hay que volver a declararlo: la fecha y
-- la duración de una clase en vivo SÍ son argumento de venta —"martes y
-- jueves a las 19:00"— y el enlace de la sala no.
-- ---------------------------------------------------------------------------
revoke select on public.lessons from anon, authenticated;

grant select (
  id, module_id, title, type, duration_s, "order", is_preview,
  starts_at, ends_at
) on public.lessons to anon, authenticated;

/* El contenido de una lección, ahora también con el enlace de la sala. Misma
   puerta que ya comprobaba inscripción, muestra o permiso: no hace falta otra,
   y tener una sola es lo que impide que se olvide cerrar la segunda. */
create or replace function public.contenido_de_leccion(p_leccion uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_asset jsonb;
  v_sala  text;
  v_muestra boolean;
  v_curso uuid;
  v_puede boolean := false;
begin
  select l.asset_ref, l.meeting_url, l.is_preview, m.course_id
    into v_asset, v_sala, v_muestra, v_curso
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
   where l.id = p_leccion;

  if v_curso is null then return null; end if;

  if v_muestra then
    v_puede := true;
  elsif exists (
    select 1 from public.course_enrollments e
     where e.course_id = v_curso and e.user_id = auth.uid()
  ) then
    v_puede := true;
  elsif public.has_permission('ACADEMY', 'VIEW') then
    v_puede := true;
  end if;

  -- Ni inscrito, ni muestra, ni permiso: no hay contenido, y se dice con un
  -- null en vez de con un error. Quien mira el temario no hace nada malo.
  if not v_puede then return null; end if;

  return jsonb_build_object('asset', v_asset, 'sala', v_sala);
end;
$$;

grant execute on function public.contenido_de_leccion(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Los tres cursos de ejemplo, con su modalidad.
-- ---------------------------------------------------------------------------
update public.courses set modality = 'BLENDED',
       starts_on = (current_date + 21),
       seats = 30,
       instructor_name = coalesce(instructor_name, 'Equipo COMICOMANÍA')
 where slug = 'stand-up-desde-cero' and modality = 'RECORDED';

update public.courses set modality = 'RECORDED',
       instructor_name = coalesce(instructor_name, 'Equipo COMICOMANÍA')
 where slug = 'escribe-para-hacer-reir';

update public.courses set modality = 'LIVE',
       starts_on = (current_date + 35),
       seats = 20,
       instructor_name = coalesce(instructor_name, 'Equipo COMICOMANÍA')
 where slug = 'marca-de-comedia' and modality = 'RECORDED';

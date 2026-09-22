-- ---------------------------------------------------------------------------
-- Fase K · Academia.
--
-- Dos reglas en la base:
--
--   1. El progreso NO se mantiene a mano. Se recalcula desde las lecciones
--      completadas cada vez que alguien avanza. Un porcentaje que alguien
--      actualiza por su cuenta se desincroniza el primer día, y a partir de
--      ahí nadie sabe quién terminó de verdad.
--   2. No se emite certificado de un curso sin terminar. Un certificado es un
--      documento que la gente pone en su currículum: si se puede emitir a
--      medias, no vale nada.
-- ---------------------------------------------------------------------------

create table public.courses (
  id           uuid primary key default public.uuid_generate_v7(),
  slug         text not null unique,
  title        text not null,
  description  text,
  instructor_id uuid references public.users(id) on delete set null,
  level        text not null default 'BEGINNER'
               check (level in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  language     text not null default 'es',
  price        numeric(12,2) not null default 0 check (price >= 0),
  currency     char(3) not null default 'USD',
  duration_min integer,
  cover_url    text,
  status       text not null default 'DRAFT'
               check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id        uuid primary key default public.uuid_generate_v7(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title     text not null,
  "order"   smallint not null,
  unique (course_id, "order")
);

create table public.lessons (
  id        uuid primary key default public.uuid_generate_v7(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title     text not null,
  type      text not null default 'VIDEO'
            check (type in ('VIDEO', 'TEXT', 'QUIZ', 'LIVE', 'ASSIGNMENT')),
  asset_ref jsonb not null default '{}'::jsonb,
  duration_s integer,
  "order"   smallint not null,
  -- Una lección de muestra se ve sin pagar: es lo que vende el curso.
  is_preview boolean not null default false,
  unique (module_id, "order")
);

create table public.course_enrollments (
  id           uuid primary key default public.uuid_generate_v7(),
  user_id      uuid not null references public.users(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  source       text not null default 'PURCHASE'
               check (source in ('PURCHASE', 'MEMBERSHIP', 'PRIZE', 'COURTESY')),
  entitlement_id uuid references public.entitlements(id) on delete set null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  progress_pct smallint not null default 0 check (progress_pct between 0 and 100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)
);

create index course_enrollments_curso on public.course_enrollments (course_id);

create trigger course_enrollments_updated_at before update on public.course_enrollments
  for each row execute function public.set_updated_at();

create table public.lesson_progress (
  id            uuid primary key default public.uuid_generate_v7(),
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  seconds_watched integer not null default 0 check (seconds_watched >= 0),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

create trigger lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- El progreso se recalcula solo.
-- ---------------------------------------------------------------------------
create or replace function public.recalcular_progreso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inscripcion uuid;
  v_curso   uuid;
  v_total   integer;
  v_hechas  integer;
  v_pct     smallint;
begin
  v_inscripcion := coalesce(new.enrollment_id, old.enrollment_id);

  select course_id into v_curso
    from public.course_enrollments where id = v_inscripcion;

  select count(*) into v_total
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
   where m.course_id = v_curso;

  select count(*) into v_hechas
    from public.lesson_progress p
    join public.lessons l on l.id = p.lesson_id
    join public.course_modules m on m.id = l.module_id
   where p.enrollment_id = v_inscripcion
     and p.completed_at is not null
     and m.course_id = v_curso;

  v_pct := case when v_total = 0 then 0
                else least(100, round(v_hechas::numeric * 100 / v_total))::smallint end;

  update public.course_enrollments
     set progress_pct = v_pct,
         completed_at = case when v_pct = 100 then coalesce(completed_at, now()) else null end
   where id = v_inscripcion;

  return null;
end;
$$;

create trigger lesson_progress_recalcula
  after insert or update or delete on public.lesson_progress
  for each row execute function public.recalcular_progreso();

-- ---------------------------------------------------------------------------
-- Certificados.
-- ---------------------------------------------------------------------------
create table public.certificates (
  id            uuid primary key default public.uuid_generate_v7(),
  enrollment_id uuid not null unique references public.course_enrollments(id) on delete cascade,
  serial        text not null unique
                default 'CM-CERT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  issued_at     timestamptz not null default now(),
  pdf_url       text
);

create rule certificates_sin_delete as
  on delete to public.certificates do instead nothing;

/* Un certificado es un documento que la gente pone en su currículum. Si se
   pudiera emitir con el curso a medias, no valdría nada — ni para quien lo
   recibe ni para quien lo lee. */
create or replace function public.certificado_exige_curso_terminado()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pct smallint;
begin
  select progress_pct into v_pct
    from public.course_enrollments where id = new.enrollment_id;
  if v_pct is null or v_pct < 100 then
    raise exception
      'No se puede certificar un curso al %%%. El certificado se emite al terminarlo.',
      coalesce(v_pct, 0);
  end if;
  return new;
end;
$$;

create trigger certificates_curso_terminado
  before insert on public.certificates
  for each row execute function public.certificado_exige_curso_terminado();

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.courses            enable row level security;
alter table public.course_modules     enable row level security;
alter table public.lessons            enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.certificates       enable row level security;

create policy "catálogo publicado es público" on public.courses
  for select using (status = 'PUBLISHED' or public.has_permission('ACADEMY', 'VIEW'));
create policy "cursos con permiso" on public.courses
  for all using (public.has_permission('ACADEMY', 'EDIT'))
  with check (public.has_permission('ACADEMY', 'EDIT'));

create policy "temario visible" on public.course_modules for select using (true);
create policy "módulos con permiso" on public.course_modules
  for all using (public.has_permission('ACADEMY', 'EDIT'))
  with check (public.has_permission('ACADEMY', 'EDIT'));

/* El temario se ve entero —hace falta para decidir la compra— pero el
   contenido de una lección solo si está inscrito o es de muestra. */
create policy "lecciones de muestra, mías, o con permiso" on public.lessons
  for select using (
    is_preview
    or exists (
      select 1 from public.course_enrollments e
        join public.course_modules m on m.course_id = e.course_id
       where m.id = module_id and e.user_id = auth.uid()
    )
    or public.has_permission('ACADEMY', 'VIEW')
  );
create policy "lecciones con permiso" on public.lessons
  for all using (public.has_permission('ACADEMY', 'EDIT'))
  with check (public.has_permission('ACADEMY', 'EDIT'));

create policy "veo mi inscripción" on public.course_enrollments
  for select using (user_id = auth.uid() or public.has_permission('ACADEMY', 'VIEW'));
create policy "inscripciones con permiso" on public.course_enrollments
  for all using (public.has_permission('ACADEMY', 'EDIT'))
  with check (public.has_permission('ACADEMY', 'EDIT'));

create policy "veo y marco mi progreso" on public.lesson_progress
  for all using (
    exists (select 1 from public.course_enrollments e
             where e.id = enrollment_id and e.user_id = auth.uid())
    or public.has_permission('ACADEMY', 'VIEW')
  )
  with check (
    exists (select 1 from public.course_enrollments e
             where e.id = enrollment_id and e.user_id = auth.uid())
    or public.has_permission('ACADEMY', 'EDIT')
  );

-- Un certificado se verifica por su serie: cualquiera puede comprobar que uno
-- es auténtico, que es todo el sentido de tenerlo.
create policy "certificados verificables" on public.certificates
  for select using (true);
create policy "emitir con permiso" on public.certificates
  for insert with check (public.has_permission('ACADEMY', 'EDIT'));

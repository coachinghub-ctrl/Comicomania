-- ---------------------------------------------------------------------------
-- Fase E · Contest Engine — el esqueleto.
--
-- Series → temporadas → concursos → categorías y rondas → participantes.
-- Entries, videos, jurado y votos llegan en las fases F y G; acá está lo que
-- hace falta para que un no-desarrollador cree un concurso de punta a punta,
-- que es el hito de la semana 8.
--
-- La decisión que más manda en este archivo: `contests.age_reference_date`.
-- La edad de cada participante se congela contra esa fecha y NO se recalcula
-- nunca más. Sin eso, alguien que cumple años entre la ronda 1 y la final
-- cambiaría de categoría a mitad del concurso. Es el error clásico que
-- arruina un concurso ya andando. Ver docs/04-contest-engine.md.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Hueco del ERD: la fecha de nacimiento no aparecía en ninguna entidad, pese a
-- que docs/04 dice que la categoría sale de ella ("el participante la ve, no
-- la escoge"). Va en `users` y no en `participants` porque es dato de
-- identidad: se declara una vez y sirve para todos los concursos. En
-- participants queda la EDAD CONGELADA, que es otra cosa.
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists birth_date date;

comment on column public.users.birth_date is
  'Declarada por la persona. El documento se exige solo al clasificar a '
  'semifinal o final: pedirlo al inscribirse mata la conversión.';

create type public.contest_status as enum
  ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'JUDGING', 'FINISHED', 'CANCELLED');

create type public.round_type as enum
  ('SUBMISSION', 'JURY', 'AUDIENCE', 'MIXED', 'LIVE');

create type public.category_assignment as enum ('AUTO', 'SELF', 'ADMIN');

create type public.participant_status as enum
  ('REGISTERED', 'VERIFIED', 'SUBMITTED', 'ADVANCED', 'ELIMINATED', 'WITHDRAWN', 'DISQUALIFIED');

-- ---------------------------------------------------------------------------
-- Series y temporadas. La serie es la marca del formato; la temporada es la
-- edición del año. Un concurso siempre cuelga de una temporada, para que
-- comparar ediciones no exija arqueología.
-- ---------------------------------------------------------------------------
create table public.series (
  id          uuid primary key default public.uuid_generate_v7(),
  slug        text not null unique,
  name        text not null,
  brand       text,
  description text,
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger series_updated_at before update on public.series
  for each row execute function public.set_updated_at();

create table public.seasons (
  id         uuid primary key default public.uuid_generate_v7(),
  series_id  uuid not null references public.series(id) on delete restrict,
  slug       text not null,
  name       text not null,
  year       smallint not null,
  starts_at  timestamptz,
  ends_at    timestamptz,
  status     text not null default 'PLANNED'
             check (status in ('PLANNED', 'ACTIVE', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, slug)
);

create trigger seasons_updated_at before update on public.seasons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Concursos.
-- ---------------------------------------------------------------------------
create table public.contests (
  id          uuid primary key default public.uuid_generate_v7(),
  season_id   uuid not null references public.seasons(id) on delete restrict,
  slug        text not null unique,
  name        text not null,
  status      public.contest_status not null default 'DRAFT',

  country_id  uuid not null references public.countries(id) on delete restrict,
  city_id     uuid references public.cities(id) on delete restrict,
  timezone    text not null default 'America/New_York',

  registration_opens_at  timestamptz,
  registration_closes_at timestamptz,
  submission_deadline    timestamptz,

  -- Por defecto, el cierre de inscripciones. Se fija una vez y se congela.
  age_reference_date date not null,

  prize          jsonb not null default '{}'::jsonb,
  landing_config jsonb not null default '{}'::jsonb,
  created_by     uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- La ciudad, si la hay, tiene que pertenecer al país declarado. Se comprueba
  -- con un trigger porque una CHECK no puede consultar otra tabla.
  constraint contest_ventana_inscripcion check (
    registration_opens_at is null
    or registration_closes_at is null
    or registration_closes_at > registration_opens_at
  ),
  constraint contest_cierre_antes_de_entrega check (
    registration_closes_at is null
    or submission_deadline is null
    or submission_deadline >= registration_closes_at
  )
);

create index contests_estado on public.contests (status, country_id, city_id);
create index contests_temporada on public.contests (season_id);

create trigger contests_updated_at before update on public.contests
  for each row execute function public.set_updated_at();

create or replace function public.contest_ciudad_coherente()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pais uuid;
begin
  if new.city_id is null then
    return new;
  end if;
  select country_id into v_pais from public.cities where id = new.city_id;
  if v_pais is null or v_pais <> new.country_id then
    raise exception 'La ciudad no pertenece al país del concurso';
  end if;
  return new;
end;
$$;

create trigger contests_ciudad_coherente
  before insert or update of city_id, country_id on public.contests
  for each row execute function public.contest_ciudad_coherente();

-- ---------------------------------------------------------------------------
-- Categorías. El modelo es genérico —sirve para estilo, universitarios,
-- amateur— y la edad solo tiene columnas propias porque se valida y se
-- consulta constantemente.
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default public.uuid_generate_v7(),
  contest_id  uuid not null references public.contests(id) on delete cascade,
  slug        text not null,
  name        text not null,
  "order"     smallint not null default 0,
  description text,
  assignment  public.category_assignment not null default 'AUTO',
  min_age     smallint,
  max_age     smallint,
  eligibility jsonb not null default '{}'::jsonb,
  -- Con menos de esto la categoría se siente vacía y conviene fusionarla.
  min_participants smallint not null default 20,
  merge_into  uuid references public.categories(id) on delete set null,
  prize       jsonb not null default '{}'::jsonb,
  status      text not null default 'ACTIVE'
              check (status in ('ACTIVE', 'MERGED', 'CANCELLED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (contest_id, slug),
  constraint categoria_rango_de_edad check (
    min_age is null or max_age is null or max_age >= min_age
  )
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rondas.
-- ---------------------------------------------------------------------------
create table public.rounds (
  id          uuid primary key default public.uuid_generate_v7(),
  contest_id  uuid not null references public.contests(id) on delete cascade,
  "order"     smallint not null,
  name        text not null,
  type        public.round_type not null default 'SUBMISSION',
  starts_at   timestamptz,
  ends_at     timestamptz,
  status      text not null default 'PLANNED'
              check (status in ('PLANNED', 'OPEN', 'CLOSED', 'RESOLVED')),
  scoring_config jsonb not null default '{}'::jsonb,
  vote_rules     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (contest_id, "order"),
  constraint ronda_ventana_valida check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create trigger rounds_updated_at before update on public.rounds
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Participantes. Una persona, un concurso, una vez.
-- ---------------------------------------------------------------------------
create table public.participants (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid not null references public.users(id) on delete cascade,
  contest_id  uuid not null references public.contests(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  status      public.participant_status not null default 'REGISTERED',
  registered_at timestamptz not null default now(),
  -- Congelada contra contests.age_reference_date. No se recalcula jamás.
  age_at_reference smallint,
  /* Escalonada, tal como está decidido en docs/04: se declara al inscribirse
     y el documento se exige solo al clasificar a semifinal o final. Un
     MISMATCH abre un caso de Trust & Safety, nunca descalifica solo. */
  age_verification text not null default 'DECLARED'
                   check (age_verification in
                     ('DECLARED', 'DOCUMENT_REQUESTED', 'VERIFIED', 'MISMATCH')),
  eligibility_snapshot jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, contest_id)
);

create index participants_concurso on public.participants (contest_id, status);
create index participants_categoria on public.participants (category_id);

create trigger participants_updated_at before update on public.participants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Territorio de un concurso: su ciudad si la tiene, si no su país. Es lo que
-- RLS compara contra el alcance del grant, igual que con los usuarios.
-- ---------------------------------------------------------------------------
create or replace function public.path_de_concurso(p_contest_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(ci.path, co.path)
    from public.contests c
    join public.countries co on co.id = c.country_id
    left join public.cities ci on ci.id = c.city_id
   where c.id = p_contest_id;
$$;

-- ---------------------------------------------------------------------------
-- RLS.
--
-- Los concursos publicados son públicos: si no, nadie podría ver a qué se
-- inscribe. Los borradores y lo demás, solo con permiso y dentro del
-- territorio. Un manager de Miami no ve el borrador de Bogotá.
-- ---------------------------------------------------------------------------
alter table public.series       enable row level security;
alter table public.seasons      enable row level security;
alter table public.contests     enable row level security;
alter table public.categories   enable row level security;
alter table public.rounds       enable row level security;
alter table public.participants enable row level security;

create policy "series visibles" on public.series
  for select using (status = 'ACTIVE' or public.has_permission('SERIES', 'VIEW'));
create policy "series con permiso" on public.series
  for all using (public.has_permission('SERIES', 'MANAGE'))
  with check (public.has_permission('SERIES', 'MANAGE'));

create policy "temporadas visibles" on public.seasons
  for select using (status <> 'PLANNED' or public.has_permission('SEASONS', 'VIEW'));
create policy "temporadas con permiso" on public.seasons
  for all using (public.has_permission('SEASONS', 'MANAGE'))
  with check (public.has_permission('SEASONS', 'MANAGE'));

create policy "concursos publicados o con permiso" on public.contests
  for select using (
    status in ('SCHEDULED', 'OPEN', 'CLOSED', 'JUDGING', 'FINISHED')
    or public.has_permission('CONTESTS', 'VIEW', public.path_de_concurso(id))
  );
create policy "concursos se crean con permiso" on public.contests
  for insert with check (
    public.has_permission('CONTESTS', 'CREATE', coalesce(
      (select path from public.cities where id = city_id),
      (select path from public.countries where id = country_id)
    ))
  );
create policy "concursos se editan con permiso" on public.contests
  for update using (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(id)))
  with check (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(id)));
create policy "concursos se borran con permiso" on public.contests
  for delete using (public.has_permission('CONTESTS', 'DELETE', public.path_de_concurso(id)));

create policy "categorías siguen a su concurso" on public.categories
  for select using (
    exists (select 1 from public.contests c where c.id = contest_id)
  );
create policy "categorías con permiso" on public.categories
  for all using (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)))
  with check (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)));

create policy "rondas siguen a su concurso" on public.rounds
  for select using (
    exists (select 1 from public.contests c where c.id = contest_id)
  );
create policy "rondas con permiso" on public.rounds
  for all using (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)))
  with check (public.has_permission('CONTESTS', 'EDIT', public.path_de_concurso(contest_id)));

-- Cada quien ve su propia inscripción; el resto, con permiso y en territorio.
create policy "veo mi inscripción" on public.participants
  for select using (
    user_id = auth.uid()
    or public.has_permission('PARTICIPANTS', 'VIEW', public.path_de_concurso(contest_id))
  );
create policy "participantes con permiso" on public.participants
  for all using (public.has_permission('PARTICIPANTS', 'EDIT', public.path_de_concurso(contest_id)))
  with check (public.has_permission('PARTICIPANTS', 'EDIT', public.path_de_concurso(contest_id)));

-- ---------------------------------------------------------------------------
-- Congelar la edad al inscribirse. Va en la base y no en la aplicación porque
-- es la regla que no puede fallar nunca: si algún día alguien inscribe desde
-- otro sitio, la edad se congela igual.
-- ---------------------------------------------------------------------------
create or replace function public.congelar_edad_participante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fecha date;
  v_nacimiento date;
begin
  if new.age_at_reference is not null then
    return new;
  end if;

  select age_reference_date into v_fecha from public.contests where id = new.contest_id;
  select birth_date into v_nacimiento from public.users where id = new.user_id;

  if v_fecha is null or v_nacimiento is null then
    return new;
  end if;

  new.age_at_reference := extract(year from age(v_fecha, v_nacimiento))::smallint;
  return new;
end;
$$;

create trigger participants_congelar_edad
  before insert on public.participants
  for each row execute function public.congelar_edad_participante();

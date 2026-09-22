-- ---------------------------------------------------------------------------
-- Fase G · Jurado y votación.
--
-- La parte del sistema donde un fallo no es un error visible sino un ganador
-- equivocado. Tres cosas viven acá y no en la aplicación, porque son las que
-- no pueden fallar nunca:
--
--   1. La unicidad del voto, como constraint. docs/04 lo pide con esas
--      palabras: "una constraint, no una comprobación en código".
--   2. El bloqueo de la nota tras enviarla.
--   3. Que ningún voto se borre jamás: se marca.
--
-- El cálculo del puntaje NO está acá: es una función pura en
-- packages/domain/puntaje.ts, con tests de tabla, para poder reproducirlo
-- delante de quien reclame.
-- ---------------------------------------------------------------------------

create type public.vote_status as enum
  ('VALID', 'SUSPECT', 'INVALIDATED', 'PENDING_REVIEW');

create type public.assignment_status as enum
  ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'EXCUSED', 'CONFLICT');

-- ---------------------------------------------------------------------------
-- Jueces. El perfil público del jurado no es lo mismo que el usuario con rol
-- JUDGE: un juez invitado tiene las dos cosas, y un juez histórico puede no
-- tener cuenta.
-- ---------------------------------------------------------------------------
create table public.judges (
  id           uuid primary key default public.uuid_generate_v7(),
  user_id      uuid references public.users(id) on delete set null,
  display_name text not null,
  bio          text,
  photo_url    text,
  country_id   uuid references public.countries(id) on delete set null,
  status       text not null default 'ACTIVE'
               check (status in ('ACTIVE', 'INACTIVE')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger judges_updated_at before update on public.judges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Criterios de puntuación, por concurso.
-- ---------------------------------------------------------------------------
create table public.score_criteria (
  id          uuid primary key default public.uuid_generate_v7(),
  contest_id  uuid not null references public.contests(id) on delete cascade,
  slug        text not null,
  name        text not null,
  weight      smallint not null check (weight >= 0),
  description text,
  "order"     smallint not null default 0,
  created_at  timestamptz not null default now(),
  unique (contest_id, slug)
);

-- ---------------------------------------------------------------------------
-- Asignaciones. Un juez solo ve lo que le asignaron: si viera todo, el
-- reparto no significaría nada y el sesgo sería imposible de acotar.
-- ---------------------------------------------------------------------------
create table public.judge_assignments (
  id         uuid primary key default public.uuid_generate_v7(),
  judge_id   uuid not null references public.judges(id) on delete cascade,
  round_id   uuid not null references public.rounds(id) on delete cascade,
  entry_id   uuid not null references public.entries(id) on delete cascade,
  due_at     timestamptz,
  status     public.assignment_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (judge_id, entry_id)
);

create index judge_assignments_juez  on public.judge_assignments (judge_id, status);
create index judge_assignments_ronda on public.judge_assignments (round_id, status);

create trigger judge_assignments_updated_at before update on public.judge_assignments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notas del jurado.
--
-- `locked_at` es lo que hace que el concurso sea defendible: enviada la nota,
-- se cierra. Reabrirla exige SCORING.EDIT con segundo factor, motivo, y deja
-- en auditoría el valor anterior y el nuevo.
-- ---------------------------------------------------------------------------
create table public.judge_scores (
  id             uuid primary key default public.uuid_generate_v7(),
  assignment_id  uuid not null unique references public.judge_assignments(id) on delete cascade,
  criteria_scores jsonb not null default '{}'::jsonb,
  comment        text,
  submitted_at   timestamptz,
  locked_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger judge_scores_updated_at before update on public.judge_scores
  for each row execute function public.set_updated_at();

/* Una nota bloqueada no se toca. Ni por la aplicación, ni por un UPDATE a
   mano, ni por quien se equivoque de fila. Para reabrirla hay que quitar el
   bloqueo a propósito, y eso es un acto distinto que queda auditado. */
create or replace function public.nota_bloqueada_no_se_edita()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.locked_at is not null
     and new.locked_at is not null
     and (new.criteria_scores is distinct from old.criteria_scores
          or new.comment is distinct from old.comment) then
    raise exception
      'Esa nota está cerrada desde %. Para corregirla hay que reabrirla primero.',
      old.locked_at;
  end if;
  return new;
end;
$$;

create trigger judge_scores_bloqueo
  before update on public.judge_scores
  for each row execute function public.nota_bloqueada_no_se_edita();

-- ---------------------------------------------------------------------------
-- Votos.
--
-- Nunca anónimos: siempre cuelgan de un usuario con email verificado. Y NINGÚN
-- voto se borra: se marca. Un voto borrado no se puede auditar, y el día que
-- alguien acuse de haber quitado votos no habría con qué responder.
-- ---------------------------------------------------------------------------
create table public.votes (
  id             uuid primary key default public.uuid_generate_v7(),
  round_id       uuid not null references public.rounds(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  category_id    uuid references public.categories(id) on delete set null,
  user_id        uuid not null references public.users(id) on delete cascade,
  status         public.vote_status not null default 'VALID',
  -- El reintento del móvil no duplica ni da un error confuso.
  idempotency_key text,
  invalidated_reason text,
  invalidated_by  uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

/* LA constraint. Un usuario, un voto por participante y ronda, mientras el
   voto valga. Es parcial a propósito: un voto invalidado no debe impedir que
   la misma persona vuelva a votar si la invalidación fue un error. */
create unique index votes_uno_por_persona
  on public.votes (round_id, participant_id, user_id)
  where status = 'VALID';

create unique index votes_idempotencia
  on public.votes (user_id, idempotency_key)
  where idempotency_key is not null;

create index votes_conteo on public.votes (round_id, category_id, participant_id, status);

create trigger votes_updated_at before update on public.votes
  for each row execute function public.set_updated_at();

create rule votes_sin_delete as on delete to public.votes do instead nothing;

/* Solo vota quien tiene el email verificado. En la base, no en el formulario:
   el formulario se puede saltar. */
create or replace function public.voto_exige_email_verificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verificado timestamptz;
begin
  select email_verified_at into v_verificado
    from public.users where id = new.user_id;
  if v_verificado is null then
    raise exception 'Para votar hace falta tener el email verificado.';
  end if;
  return new;
end;
$$;

create trigger votes_email_verificado
  before insert on public.votes
  for each row execute function public.voto_exige_email_verificado();

-- Señales para el antifraude. Se guardan hashes, nunca la IP en claro.
create table public.vote_signals (
  id              uuid primary key default public.uuid_generate_v7(),
  vote_id         uuid not null references public.votes(id) on delete cascade,
  ip_hash         text,
  asn             text,
  is_datacenter   boolean,
  device_fp_hash  text,
  user_agent      text,
  referrer        text,
  geo             text,
  created_at      timestamptz not null default now()
);

create index vote_signals_voto on public.vote_signals (vote_id);
create index vote_signals_ip   on public.vote_signals (ip_hash);

-- ---------------------------------------------------------------------------
-- Resultados materializados. Se calculan al resolver la ronda, con el
-- snapshot de la configuración usada: cambiar los pesos después no reescribe
-- la historia.
-- ---------------------------------------------------------------------------
create table public.round_results (
  id             uuid primary key default public.uuid_generate_v7(),
  round_id       uuid not null references public.rounds(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  jury_score     numeric(6,2),
  audience_score numeric(6,2),
  final_score    numeric(6,2) not null,
  rank           integer,
  advanced       boolean not null default false,
  config_snapshot jsonb not null,
  resolved_at    timestamptz not null default now(),
  unique (round_id, participant_id)
);

create index round_results_orden on public.round_results (round_id, rank);

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.judges            enable row level security;
alter table public.score_criteria    enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.judge_scores      enable row level security;
alter table public.votes             enable row level security;
alter table public.vote_signals      enable row level security;
alter table public.round_results     enable row level security;

-- El jurado es público: la gente tiene derecho a saber quién la juzga.
create policy "el jurado es público" on public.judges
  for select using (status = 'ACTIVE' or public.has_permission('JUDGES', 'VIEW'));
create policy "jurado con permiso" on public.judges
  for all using (public.has_permission('JUDGES', 'MANAGE'))
  with check (public.has_permission('JUDGES', 'MANAGE'));

create policy "criterios visibles" on public.score_criteria
  for select using (true);
create policy "criterios con permiso" on public.score_criteria
  for all using (public.has_permission('SCORING', 'EDIT', public.path_de_concurso(contest_id)))
  with check (public.has_permission('SCORING', 'EDIT', public.path_de_concurso(contest_id)));

-- Un juez ve sus asignaciones; quien coordina, las de su territorio.
create policy "veo mis asignaciones" on public.judge_assignments
  for select using (
    exists (select 1 from public.judges j
             where j.id = judge_id and j.user_id = auth.uid())
    or public.has_permission('JUDGES', 'VIEW')
  );
create policy "asignaciones con permiso" on public.judge_assignments
  for all using (public.has_permission('JUDGES', 'ASSIGN'))
  with check (public.has_permission('JUDGES', 'ASSIGN'));

/* Ciego hasta enviar: un juez ve SU nota, nunca la de otro. Si pudiera verlas
   antes de enviar la suya, el jurado dejaría de ser independiente. Quien
   coordina las ve todas, porque tiene que resolver la ronda. */
create policy "veo mi nota, no la ajena" on public.judge_scores
  for select using (
    exists (
      select 1 from public.judge_assignments a
        join public.judges j on j.id = a.judge_id
       where a.id = assignment_id and j.user_id = auth.uid()
    )
    or public.has_permission('SCORING', 'VIEW')
  );
create policy "el juez puntúa lo suyo" on public.judge_scores
  for insert with check (
    exists (
      select 1 from public.judge_assignments a
        join public.judges j on j.id = a.judge_id
       where a.id = assignment_id and j.user_id = auth.uid()
    )
  );
create policy "corregir nota propia o con permiso" on public.judge_scores
  for update using (
    exists (
      select 1 from public.judge_assignments a
        join public.judges j on j.id = a.judge_id
       where a.id = assignment_id and j.user_id = auth.uid()
    )
    or public.has_permission('SCORING', 'EDIT')
  );

-- Cada quien ve su voto. El conteo público sale de agregados, no de las filas.
create policy "veo mi voto" on public.votes
  for select using (
    user_id = auth.uid() or public.has_permission('VOTING', 'VIEW')
  );
create policy "voto por mí mismo" on public.votes
  for insert with check (user_id = auth.uid());
-- Invalidar exige permiso explícito, y VOTING.MANAGE pide segundo factor.
create policy "invalidar con permiso" on public.votes
  for update using (public.has_permission('VOTING', 'MANAGE'))
  with check (public.has_permission('VOTING', 'MANAGE'));

create policy "señales solo con permiso" on public.vote_signals
  for select using (public.has_permission('VOTING', 'VIEW'));

-- Los resultados resueltos son públicos: un resultado que no se puede mirar
-- no se puede discutir.
create policy "resultados públicos" on public.round_results
  for select using (true);
create policy "resolver con permiso" on public.round_results
  for all using (public.has_permission('SCORING', 'EDIT'))
  with check (public.has_permission('SCORING', 'EDIT'));

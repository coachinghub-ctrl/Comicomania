-- ---------------------------------------------------------------------------
-- Fase O · Legal y Trust & Safety.
--
-- Dos reglas que la arquitectura promete y que hasta ahora eran solo texto:
--
--   1. Un texto legal VIGENTE no se puede editar. Las aceptaciones apuntan a
--      una versión concreta; si el texto cambiara por debajo, esa fila diría
--      que alguien aceptó algo que nunca leyó. Para cambiarlo se publica una
--      versión nueva.
--
--   2. Una apelación NO la revisa quien tomó la decisión. docs/12 lo promete
--      para descalificaciones y suspensiones, y sin esto la promesa depende de
--      que nadie se asigne su propio caso un viernes por la tarde.
-- ---------------------------------------------------------------------------

create type public.trust_case_status as enum
  ('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'REJECTED', 'APPEALED');

create type public.legal_version_status as enum
  ('DRAFT', 'EFFECTIVE', 'SUPERSEDED');

/* `convert_to` no es inmutable para Postgres porque depende de la codificación
   de la sesión, y una columna generada exige inmutabilidad. Acá la
   codificación va fijada a UTF8, así que el resultado sí depende solo del
   texto: el mismo texto da el mismo hash siempre, en cualquier sesión. Por eso
   se puede declarar inmutable sin mentir. */
create or replace function public.hash_de_texto(t text)
returns text
language sql
immutable
strict
as $$
  select encode(sha256(convert_to(t, 'UTF8')), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Documentos legales y sus versiones.
-- ---------------------------------------------------------------------------
create table public.legal_documents (
  id           uuid primary key default public.uuid_generate_v7(),
  slug         text not null,
  jurisdiction text not null,
  type         text not null
               check (type in ('TERMS', 'PRIVACY', 'RULES', 'RELEASE', 'MINOR_CONSENT', 'COOKIES')),
  name         text not null,
  created_at   timestamptz not null default now(),
  unique (slug, jurisdiction)
);

create table public.legal_document_versions (
  id           uuid primary key default public.uuid_generate_v7(),
  document_id  uuid not null references public.legal_documents(id) on delete cascade,
  version      integer not null,
  body_md      text not null,
  -- Huella del texto. Si alguien lograra cambiarlo, el hash lo delataría.
  body_hash    text not null generated always as (public.hash_de_texto(body_md)) stored,
  effective_from timestamptz,
  effective_to   timestamptz,
  status       public.legal_version_status not null default 'DRAFT',
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (document_id, version),

  constraint vigente_tiene_fecha check (
    status <> 'EFFECTIVE' or effective_from is not null
  )
);

create index legal_versions_vigentes
  on public.legal_document_versions (document_id, status, effective_from desc);

/* Un texto que ya está vigente no se toca. La gente aceptó ESE texto; cambiarlo
   por debajo convertiría cada aceptación en una mentira documentada. Para
   cambiarlo se publica una versión nueva y la anterior pasa a SUPERSEDED. */
create or replace function public.texto_vigente_es_inmutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'EFFECTIVE' and new.body_md is distinct from old.body_md then
    raise exception
      'La versión % ya está vigente y hay gente que la aceptó. Publica una versión nueva.',
      old.version;
  end if;
  return new;
end;
$$;

create trigger legal_versions_inmutables
  before update on public.legal_document_versions
  for each row execute function public.texto_vigente_es_inmutable();

create rule legal_versions_sin_delete as
  on delete to public.legal_document_versions do instead nothing;

-- ---------------------------------------------------------------------------
-- Aceptaciones. Apuntan a una VERSIÓN, nunca a un documento: "aceptó los
-- términos" sin decir cuáles no sirve para nada.
-- ---------------------------------------------------------------------------
create table public.release_acceptances (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid not null references public.users(id) on delete cascade,
  version_id  uuid not null references public.legal_document_versions(id) on delete restrict,
  participant_id uuid references public.participants(id) on delete set null,
  video_id    uuid references public.videos(id) on delete set null,
  contest_id  uuid references public.contests(id) on delete set null,
  accepted_checkboxes jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  locale      text,
  accepted_at timestamptz not null default now()
);

create index release_acceptances_persona on public.release_acceptances (user_id);
create index release_acceptances_video   on public.release_acceptances (video_id);

create rule release_acceptances_sin_update as
  on update to public.release_acceptances do instead nothing;
create rule release_acceptances_sin_delete as
  on delete to public.release_acceptances do instead nothing;

-- Solo se puede aceptar un texto que esté vigente.
create or replace function public.solo_se_acepta_lo_vigente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado public.legal_version_status;
begin
  select status into v_estado
    from public.legal_document_versions where id = new.version_id;
  if v_estado <> 'EFFECTIVE' then
    raise exception 'Esa versión no está vigente (%): no se puede aceptar.', v_estado;
  end if;
  return new;
end;
$$;

create trigger release_acceptances_vigente
  before insert on public.release_acceptances
  for each row execute function public.solo_se_acepta_lo_vigente();

-- ---------------------------------------------------------------------------
-- Trust & Safety.
-- ---------------------------------------------------------------------------
create table public.trust_cases (
  id            uuid primary key default public.uuid_generate_v7(),
  type          text not null
                check (type in ('CONTENT', 'USER', 'DMCA', 'APPEAL', 'CONTEST_DISPUTE',
                                'VOTE_DISPUTE', 'HARASSMENT', 'TECHNICAL')),
  reporter_user_id uuid references public.users(id) on delete set null,
  object_type   text,
  object_id     uuid,
  description   text not null,
  status        public.trust_case_status not null default 'OPEN',
  priority      smallint not null default 3 check (priority between 1 and 5),
  assignee_user_id uuid references public.users(id) on delete set null,
  sla_due_at    timestamptz,
  resolution    text,
  resolved_by   uuid references public.users(id) on delete set null,
  resolved_at   timestamptz,
  -- Si este caso es la apelación de otro, de cuál.
  appeal_of     uuid references public.trust_cases(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Resolver sin decir qué se resolvió no es resolver.
  constraint resuelto_con_resolucion check (
    status not in ('RESOLVED', 'REJECTED')
    or (resolution is not null and resolved_by is not null)
  )
);

create index trust_cases_cola on public.trust_cases (status, priority, sla_due_at);

create trigger trust_cases_updated_at before update on public.trust_cases
  for each row execute function public.set_updated_at();

/* La apelación la revisa ALGUIEN DISTINTO. Sin esto, la garantía depende de
   que nadie se asigne su propio caso un viernes por la tarde. */
create or replace function public.apelacion_la_revisa_otro()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_decidio uuid;
begin
  if new.appeal_of is null or new.assignee_user_id is null then
    return new;
  end if;

  select resolved_by into v_decidio
    from public.trust_cases where id = new.appeal_of;

  if v_decidio is not null and v_decidio = new.assignee_user_id then
    raise exception
      'Una apelación no la revisa quien tomó la decisión original. Asigna a otra persona.';
  end if;
  return new;
end;
$$;

create trigger trust_cases_apelacion
  before insert or update of assignee_user_id, appeal_of on public.trust_cases
  for each row execute function public.apelacion_la_revisa_otro();

create table public.trust_case_actions (
  id            uuid primary key default public.uuid_generate_v7(),
  case_id       uuid not null references public.trust_cases(id) on delete cascade,
  action        text not null,
  actor_user_id uuid references public.users(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);

create index trust_case_actions_caso on public.trust_case_actions (case_id, created_at);

create rule trust_case_actions_sin_update as
  on update to public.trust_case_actions do instead nothing;
create rule trust_case_actions_sin_delete as
  on delete to public.trust_case_actions do instead nothing;

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.legal_documents         enable row level security;
alter table public.legal_document_versions enable row level security;
alter table public.release_acceptances     enable row level security;
alter table public.trust_cases             enable row level security;
alter table public.trust_case_actions      enable row level security;

-- Los textos legales son públicos: es su razón de ser.
create policy "documentos legales públicos" on public.legal_documents
  for select using (true);
create policy "documentos con permiso" on public.legal_documents
  for all using (public.has_permission('LEGAL', 'CONFIGURE'))
  with check (public.has_permission('LEGAL', 'CONFIGURE'));

create policy "versiones vigentes públicas" on public.legal_document_versions
  for select using (
    status in ('EFFECTIVE', 'SUPERSEDED') or public.has_permission('LEGAL', 'VIEW')
  );
create policy "versiones con permiso" on public.legal_document_versions
  for all using (public.has_permission('LEGAL', 'CONFIGURE'))
  with check (public.has_permission('LEGAL', 'CONFIGURE'));

-- Cada quien puede probar qué aceptó y cuándo. Es su derecho, no un favor.
create policy "veo lo que acepté" on public.release_acceptances
  for select using (
    user_id = auth.uid() or public.has_permission('LEGAL', 'VIEW')
  );
create policy "acepto por mí mismo" on public.release_acceptances
  for insert with check (user_id = auth.uid());

-- Quien reporta puede seguir su caso: un reporte que desaparece no se vuelve
-- a hacer.
create policy "veo mi reporte o los de mi territorio" on public.trust_cases
  for select using (
    reporter_user_id = auth.uid()
    or public.has_permission('TRUST_SAFETY', 'VIEW')
  );
create policy "cualquiera reporta" on public.trust_cases
  for insert with check (true);
create policy "casos con permiso" on public.trust_cases
  for update using (public.has_permission('TRUST_SAFETY', 'EDIT'))
  with check (public.has_permission('TRUST_SAFETY', 'EDIT'));

create policy "acciones con permiso" on public.trust_case_actions
  for select using (public.has_permission('TRUST_SAFETY', 'VIEW'));
create policy "actuar con permiso" on public.trust_case_actions
  for insert with check (public.has_permission('TRUST_SAFETY', 'EDIT'));

-- Los ajustes ya existían; faltaba dejarlos leer a quien los administra.
create policy "ajustes con permiso" on public.settings
  for select using (public.has_permission('SETTINGS', 'VIEW'));
create policy "ajustes se cambian con permiso" on public.settings
  for all using (public.has_permission('SETTINGS', 'CONFIGURE'))
  with check (public.has_permission('SETTINGS', 'CONFIGURE'));

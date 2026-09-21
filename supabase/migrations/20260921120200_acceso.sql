-- Control de acceso y auditoría. Ver docs/02-identidad-y-acceso.md
--
-- La autoridad se otorga, no se hereda: nadie tiene acceso por tener un tipo
-- o un nivel alto. Solo un grant explícito
--   (persona + rol + territorio + secciones + acciones + ventana temporal)
-- da permiso, y el territorio del objeto se resuelve desde la base, nunca
-- desde lo que manda el cliente.

create type public.scope_type as enum
  ('GLOBAL','COUNTRY','REGION','CITY','CONTEST','EVENT','VENUE');

create type public.grant_status as enum
  ('ACTIVE','SUSPENDED','EXPIRED','REVOKED');

create type public.finance_level as enum
  ('NONE','LOCAL','CITY','COUNTRY','GLOBAL');

-- ---------------------------------------------------------------------------
create table public.permissions (
  id           uuid primary key default public.uuid_generate_v7(),
  section      text not null,
  action       text not null,
  requires_mfa boolean not null default false,
  description  text,
  unique (section, action)
);

create table public.roles (
  id                 uuid primary key default public.uuid_generate_v7(),
  slug               text not null unique,
  name               text not null,
  description        text,
  is_system          boolean not null default false,
  default_sections   text[] not null default '{}',
  default_actions    text[] not null default '{}',
  -- Lista de denegación: gana siempre, por encima de cualquier grant.
  -- Así el admin técnico no puede emitir un refund ni cambiar un ganador.
  denied_permissions text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- El grant. `scope_path` materializa el territorio ('US', 'US.FL.MIA') para
-- que la contención sea un prefijo y no un recorrido recursivo.
-- ---------------------------------------------------------------------------
create table public.access_grants (
  id            uuid primary key default public.uuid_generate_v7(),
  user_id       uuid not null references public.users(id) on delete cascade,
  role_id       uuid not null references public.roles(id) on delete restrict,
  scope_type    public.scope_type not null,
  scope_id      uuid,
  scope_path    text,
  sections      text[] not null,
  actions       text[] not null,
  finance_level public.finance_level not null default 'NONE',
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz,
  status        public.grant_status not null default 'ACTIVE',
  granted_by    uuid references public.users(id) on delete set null,
  reason        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- GLOBAL no lleva objeto; el resto sí. Un grant sin alcance no existe.
  constraint grant_alcance_coherente check (
    (scope_type = 'GLOBAL' and scope_id is null and scope_path is null)
    or (scope_type in ('COUNTRY','REGION','CITY')
        and scope_id is not null and scope_path is not null)
    or (scope_type in ('CONTEST','EVENT','VENUE') and scope_id is not null)
  ),
  constraint grant_ventana_valida check (ends_at is null or ends_at > starts_at),
  constraint grant_no_vacio check (
    array_length(sections, 1) > 0 and array_length(actions, 1) > 0
  )
);

create index access_grants_vigentes on public.access_grants (user_id, status, ends_at);
create index access_grants_scope    on public.access_grants (scope_type, scope_id);
create index access_grants_path     on public.access_grants (scope_path text_pattern_ops);

create trigger access_grants_updated_at before update on public.access_grants
  for each row execute function public.set_updated_at();

create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Resolución de autoridad. Una sola función, un solo lugar.
-- `p_path` es el territorio del OBJETO, que el llamador resuelve desde la
-- base (video → entry → concurso → ciudad), nunca desde el request.
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(
  p_section text,
  p_action  text,
  p_path    text default null,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.access_grants g
      join public.roles r on r.id = g.role_id
     where g.user_id = p_user_id
       and g.status = 'ACTIVE'
       and g.starts_at <= now()
       and (g.ends_at is null or g.ends_at > now())
       and p_section = any(g.sections)
       and p_action  = any(g.actions)
       -- deny gana sobre cualquier concesión
       and not ((p_section || '.' || p_action) = any(r.denied_permissions))
       and (
         g.scope_type = 'GLOBAL'
         or (
           p_path is not null
           and g.scope_path is not null
           and (p_path = g.scope_path or p_path like g.scope_path || '.%')
         )
       )
  );
$$;

comment on function public.has_permission is
  'Única fuente de verdad de la autorización. El territorio del objeto se '
  'resuelve desde la base, nunca desde parámetros del cliente.';

-- Nivel financiero efectivo del actor sobre un territorio.
create or replace function public.finance_access(
  p_path    text default null,
  p_user_id uuid default auth.uid()
)
returns public.finance_level
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(g.finance_level::text)::public.finance_level, 'NONE')
    from public.access_grants g
   where g.user_id = p_user_id
     and g.status = 'ACTIVE'
     and g.starts_at <= now()
     and (g.ends_at is null or g.ends_at > now())
     and (
       g.scope_type = 'GLOBAL'
       or (p_path is not null and g.scope_path is not null
           and (p_path = g.scope_path or p_path like g.scope_path || '.%'))
     );
$$;

-- ---------------------------------------------------------------------------
-- Historial de accesos y auditoría.
-- audit_logs es append-only y encadenado por hash: cualquier manipulación
-- rompe la cadena y se nota. En un concurso con premio y dinero la
-- trazabilidad tiene que ser verificable, no una promesa.
-- ---------------------------------------------------------------------------
create table public.access_history (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid not null references public.users(id) on delete cascade,
  grant_id    uuid references public.access_grants(id) on delete set null,
  change_type text not null,
  before      jsonb,
  after       jsonb,
  actor_id    uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.audit_logs (
  id             bigserial primary key,
  actor_user_id  uuid references public.users(id) on delete set null,
  actor_role     text,
  scope_type     public.scope_type,
  scope_id       uuid,
  scope_path     text,
  section        text not null,
  action         text not null,
  object_type    text,
  object_id      text,
  previous_value jsonb,
  new_value      jsonb,
  result         text not null default 'ALLOWED' check (result in ('ALLOWED','DENIED')),
  ip             inet,
  user_agent     text,
  request_id     text,
  created_at     timestamptz not null default now(),
  prev_hash      text,
  hash           text
);

create index audit_logs_objeto on public.audit_logs (object_type, object_id);
create index audit_logs_actor  on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_fecha  on public.audit_logs (created_at desc);

create or replace function public.audit_encadenar()
returns trigger
language plpgsql
as $$
declare
  v_prev text;
begin
  -- Serializa la escritura de la cadena. El volumen de auditoría lo tolera
  -- y sin esto dos inserts concurrentes producirían el mismo prev_hash.
  perform pg_advisory_xact_lock(hashtext('audit_logs_chain'));

  select hash into v_prev
    from public.audit_logs
   order by id desc
   limit 1;

  new.prev_hash := v_prev;
  new.hash := encode(
    sha256(
      convert_to(
        coalesce(v_prev, '')
        || coalesce(new.actor_user_id::text, '')
        || new.section || new.action
        || coalesce(new.object_type, '') || coalesce(new.object_id, '')
        || coalesce(new.previous_value::text, '') || coalesce(new.new_value::text, '')
        || new.result || new.created_at::text,
        'UTF8'
      )
    ),
    'hex'
  );
  return new;
end;
$$;

create trigger audit_logs_hash before insert on public.audit_logs
  for each row execute function public.audit_encadenar();

-- Append-only de verdad: ni el dueño puede reescribir la historia.
create rule audit_logs_sin_update as on update to public.audit_logs do instead nothing;
create rule audit_logs_sin_delete as on delete to public.audit_logs do instead nothing;

-- ---------------------------------------------------------------------------
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.access_grants    enable row level security;
alter table public.access_history   enable row level security;
alter table public.audit_logs       enable row level security;

-- Cada quien puede ver qué puede hacer; nadie se otorga acceso a sí mismo.
create policy "veo mis propios grants" on public.access_grants
  for select using (
    user_id = auth.uid()
    or public.has_permission('ACCESS_CONTROL', 'VIEW')
  );

create policy "solo con permiso explícito" on public.access_grants
  for all using (public.has_permission('ACCESS_CONTROL', 'MANAGE'))
  with check (public.has_permission('ACCESS_CONTROL', 'MANAGE'));

create policy "auditoría con permiso" on public.audit_logs
  for select using (public.has_permission('AUDIT', 'VIEW'));

create policy "historial de accesos con permiso" on public.access_history
  for select using (public.has_permission('ACCESS_CONTROL', 'VIEW'));

create policy "catálogo de roles visible con permiso" on public.roles
  for select using (public.has_permission('ACCESS_CONTROL', 'VIEW'));
create policy "catálogo de permisos visible con permiso" on public.permissions
  for select using (public.has_permission('ACCESS_CONTROL', 'VIEW'));
create policy "role_permissions visible con permiso" on public.role_permissions
  for select using (public.has_permission('ACCESS_CONTROL', 'VIEW'));

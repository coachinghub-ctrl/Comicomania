-- ---------------------------------------------------------------------------
-- Fase L · Talento.
--
-- El problema de esta fase no es el modelo, es la privacidad: el perfil de
-- talento es PÚBLICO —esa es su función, que lo contraten— pero la misma fila
-- guarda el nombre legal y el contacto de contratación.
--
-- RLS no sirve para esto: decide filas enteras, no columnas. Si la fila es
-- visible, lo es con todo lo que lleva dentro. La herramienta correcta son los
-- permisos por COLUMNA de Postgres, y es lo que se usa acá: el público ve el
-- nombre artístico y la bio; el nombre legal y el contacto solo los ve quien
-- tiene el permiso, aunque consulte la misma fila.
-- ---------------------------------------------------------------------------

create type public.talent_status as enum
  ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'RETIRED', 'BLOCKED');

create table public.talent_profiles (
  user_id      uuid primary key references public.users(id) on delete cascade,
  stage_name   text not null,
  bio          text,
  languages    text[] not null default '{}',
  comedy_styles text[] not null default '{}',
  markets      text[] not null default '{}',
  travel_availability text,
  set_durations integer[] not null default '{}',
  technical_rider text,
  media_kit_url text,

  -- Datos que NO son públicos aunque la fila lo sea.
  legal_name      text,
  booking_contact text,

  manager_id   uuid references public.users(id) on delete set null,
  representation text,
  status       public.talent_status not null default 'DRAFT',
  public_visible boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Un perfil no publicado no puede estar marcado como visible: sería una
  -- ficha pública sin haber pasado por revisión.
  constraint visible_exige_activo check (
    not public_visible or status = 'ACTIVE'
  )
);

create trigger talent_profiles_updated_at before update on public.talent_profiles
  for each row execute function public.set_updated_at();

-- Historial de estado: por qué alguien dejó de estar activo importa tanto como
-- que lo esté. No se edita ni se borra.
create table public.talent_status_history (
  id          uuid primary key default public.uuid_generate_v7(),
  talent_id   uuid not null references public.talent_profiles(user_id) on delete cascade,
  from_status public.talent_status,
  to_status   public.talent_status not null,
  changed_by  uuid references public.users(id) on delete set null,
  reason      text,
  created_at  timestamptz not null default now()
);

create rule talent_status_history_sin_update as
  on update to public.talent_status_history do instead nothing;
create rule talent_status_history_sin_delete as
  on delete to public.talent_status_history do instead nothing;

create or replace function public.registrar_cambio_de_estado_talento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.talent_status_history (talent_id, from_status, to_status, changed_by)
    values (new.user_id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger talent_profiles_historial
  after update of status on public.talent_profiles
  for each row execute function public.registrar_cambio_de_estado_talento();

create table public.talent_availability (
  id         uuid primary key default public.uuid_generate_v7(),
  talent_id  uuid not null references public.talent_profiles(user_id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  type       text not null default 'AVAILABLE'
             check (type in ('AVAILABLE', 'BUSY', 'TRAVEL', 'HOLD')),
  created_at timestamptz not null default now(),
  constraint disponibilidad_valida check (ends_at > starts_at)
);

create index talent_availability_rango
  on public.talent_availability (talent_id, starts_at, ends_at);

create table public.booking_requests (
  id             uuid primary key default public.uuid_generate_v7(),
  client_user_id uuid references public.users(id) on delete set null,
  client_company text,
  contact_name   text not null,
  email          text not null,
  phone          text,
  talent_id      uuid not null references public.talent_profiles(user_id) on delete cascade,
  event_type     text,
  event_date     date,
  city_id        uuid references public.cities(id) on delete set null,
  budget_amount  numeric(12,2),
  currency       char(3) default 'USD',
  message        text,
  status         text not null default 'NEW'
                 check (status in ('NEW', 'QUALIFIED', 'QUOTED', 'WON', 'LOST', 'CANCELLED')),
  lost_reason    text,
  owner_user_id  uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint booking_perdido_con_motivo check (
    status <> 'LOST' or lost_reason is not null
  )
);

create index booking_requests_talento on public.booking_requests (talent_id, status);

create trigger booking_requests_updated_at before update on public.booking_requests
  for each row execute function public.set_updated_at();

create table public.talent_contracts (
  id           uuid primary key default public.uuid_generate_v7(),
  booking_id   uuid not null unique references public.booking_requests(id) on delete cascade,
  talent_id    uuid not null references public.talent_profiles(user_id) on delete restrict,
  document_url text,
  signed_at    timestamptz,
  fee_amount   numeric(12,2) not null check (fee_amount >= 0),
  commission_pct numeric(5,2) not null default 0
                 check (commission_pct >= 0 and commission_pct <= 100),
  currency     char(3) not null default 'USD',
  terms        jsonb not null default '{}'::jsonb,
  status       text not null default 'DRAFT'
               check (status in ('DRAFT', 'SENT', 'SIGNED', 'CANCELLED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Un contrato firmado sin fecha de firma no se puede hacer valer.
  constraint firmado_tiene_fecha check (status <> 'SIGNED' or signed_at is not null)
);

create trigger talent_contracts_updated_at before update on public.talent_contracts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.talent_profiles       enable row level security;
alter table public.talent_status_history enable row level security;
alter table public.talent_availability   enable row level security;
alter table public.booking_requests      enable row level security;
alter table public.talent_contracts      enable row level security;

create policy "fichas públicas, la mía, o con permiso" on public.talent_profiles
  for select using (
    (public_visible and status = 'ACTIVE')
    or user_id = auth.uid()
    or public.has_permission('TALENT', 'VIEW')
  );
create policy "edito mi ficha" on public.talent_profiles
  for update using (user_id = auth.uid() or public.has_permission('TALENT', 'EDIT'))
  with check (user_id = auth.uid() or public.has_permission('TALENT', 'EDIT'));
create policy "creo mi ficha" on public.talent_profiles
  for insert with check (user_id = auth.uid() or public.has_permission('TALENT', 'EDIT'));

create policy "historial con permiso" on public.talent_status_history
  for select using (
    talent_id = auth.uid() or public.has_permission('TALENT', 'VIEW')
  );

create policy "disponibilidad visible" on public.talent_availability
  for select using (true);
create policy "gestiono mi disponibilidad" on public.talent_availability
  for all using (talent_id = auth.uid() or public.has_permission('TALENT', 'EDIT'))
  with check (talent_id = auth.uid() or public.has_permission('TALENT', 'EDIT'));

/* Una solicitud la puede crear cualquiera, incluso sin cuenta: es el formulario
   de "quiero contratarte". Leerla es otra cosa. */
create policy "cualquiera solicita" on public.booking_requests
  for insert with check (true);
create policy "veo las solicitudes que me tocan" on public.booking_requests
  for select using (
    talent_id = auth.uid()
    or client_user_id = auth.uid()
    or public.has_permission('BOOKINGS', 'VIEW')
  );
create policy "gestiono solicitudes con permiso" on public.booking_requests
  for update using (public.has_permission('BOOKINGS', 'EDIT'))
  with check (public.has_permission('BOOKINGS', 'EDIT'));

-- Los contratos llevan cifras: nivel financiero, no solo BOOKINGS.
create policy "contratos con permiso" on public.talent_contracts
  for select using (
    talent_id = auth.uid() or public.has_permission('BOOKINGS', 'VIEW')
  );
create policy "contratos se editan con permiso" on public.talent_contracts
  for all using (public.has_permission('BOOKINGS', 'EDIT'))
  with check (public.has_permission('BOOKINGS', 'EDIT'));

-- ---------------------------------------------------------------------------
-- Permisos por COLUMNA.
--
-- Esto es lo que RLS no puede hacer. La fila del perfil es pública, pero el
-- nombre legal y el contacto de contratación no viajan con ella: Postgres
-- rechaza la consulta que los pida sin permiso, aunque la fila sea visible.
--
-- Sin esto, publicar el directorio de talento equivaldría a publicar el nombre
-- legal y el teléfono de cada humorista.
--
-- EFECTO SECUNDARIO, A PROPÓSITO: `select *` sobre esta tabla queda denegado
-- para todo el mundo, porque el asterisco expande a todas las columnas. Hay
-- que nombrar las que se quieren. Es incómodo una vez y seguro para siempre:
-- nadie filtra el nombre legal por escribir un atajo.
-- ---------------------------------------------------------------------------
revoke select on public.talent_profiles from anon, authenticated;

grant select (
  user_id, stage_name, bio, languages, comedy_styles, markets,
  travel_availability, set_durations, technical_rider, media_kit_url,
  manager_id, representation, status, public_visible, created_at, updated_at
) on public.talent_profiles to anon, authenticated;

grant insert, update, delete on public.talent_profiles to authenticated;

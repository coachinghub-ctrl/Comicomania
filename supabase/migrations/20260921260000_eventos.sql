-- ---------------------------------------------------------------------------
-- Fase J · Eventos y entradas.
--
-- Tres reglas en la base, porque las tres fallan en la puerta del teatro con
-- gente esperando:
--
--   1. No se emiten más entradas que el aforo. Explicarle a cuarenta personas
--      que su entrada no existe es peor que cualquier caída.
--   2. Primer scan gana. Un duplicado NO se descarta en silencio: se guarda
--      con resultado DUPLICATE para que quede la alerta. Descartarlo sería
--      perder justo la evidencia de que alguien clonó una entrada.
--   3. El QR se valida contra el secreto de la entrada, y ese secreto ROTA al
--      transferirla. Sin rotación, quien revendió conserva un QR válido.
-- ---------------------------------------------------------------------------

create type public.ticket_kind as enum
  ('GENERAL', 'VIP', 'PREMIUM', 'EARLY_BIRD', 'VIRTUAL', 'PROMO', 'COMP');

create type public.ticket_status as enum
  ('VALID', 'USED', 'VOID', 'TRANSFERRED');

create type public.checkin_result as enum
  ('OK', 'DUPLICATE', 'INVALID', 'WRONG_EVENT', 'VOID', 'OVERRIDE');

create table public.venues (
  id         uuid primary key default public.uuid_generate_v7(),
  name       text not null,
  address    text,
  city_id    uuid references public.cities(id) on delete set null,
  capacity   integer check (capacity > 0),
  map_url    text,
  created_at timestamptz not null default now()
);

create table public.events (
  id          uuid primary key default public.uuid_generate_v7(),
  slug        text not null unique,
  name        text not null,
  type        text not null default 'SHOW'
              check (type in ('SHOW', 'FINAL', 'WORKSHOP', 'ONLINE', 'TOUR_STOP')),
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  timezone    text not null default 'America/New_York',
  venue_id    uuid references public.venues(id) on delete set null,
  online_url  text,
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  capacity    integer check (capacity > 0),
  contest_id  uuid references public.contests(id) on delete set null,
  sales_start timestamptz,
  sales_end   timestamptz,
  status      text not null default 'DRAFT'
              check (status in ('DRAFT', 'ANNOUNCED', 'ON_SALE', 'SOLD_OUT', 'LIVE', 'FINISHED', 'CANCELLED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint evento_termina_despues check (ends_at is null or ends_at > starts_at),
  -- Un evento online sin URL y sin sede no se puede ni anunciar.
  constraint evento_tiene_donde check (venue_id is not null or online_url is not null)
);

create index events_cartelera on public.events (status, starts_at);

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table public.ticket_types (
  id         uuid primary key default public.uuid_generate_v7(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null,
  kind       public.ticket_kind not null default 'GENERAL',
  price      numeric(12,2) not null check (price >= 0),
  currency   char(3) not null default 'USD',
  quantity   integer not null check (quantity > 0),
  per_user_limit smallint not null default 6 check (per_user_limit > 0),
  sales_start timestamptz,
  sales_end   timestamptz,
  benefits   jsonb not null default '{}'::jsonb,
  status     text not null default 'ACTIVE'
             check (status in ('ACTIVE', 'PAUSED', 'SOLD_OUT')),
  created_at timestamptz not null default now()
);

create table public.tickets (
  id             uuid primary key default public.uuid_generate_v7(),
  event_id       uuid not null references public.events(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  order_item_id  uuid references public.order_items(id) on delete set null,
  user_id        uuid references public.users(id) on delete set null,
  holder_name    text,
  code           text not null unique,
  /* El secreto del QR. Rota al transferir: sin eso, quien revendió la entrada
     conserva un código que sigue abriendo la puerta. */
  qr_secret      text not null default encode(gen_random_uuid()::text::bytea, 'hex'),
  qr_version     smallint not null default 1,
  status         public.ticket_status not null default 'VALID',
  issued_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index tickets_evento  on public.tickets (event_id, status);
create index tickets_persona on public.tickets (user_id);

create trigger tickets_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- No emitir más entradas que el aforo.
-- ---------------------------------------------------------------------------
create or replace function public.entrada_respeta_aforo()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cupo_tipo  integer;
  v_emitidas_tipo integer;
  v_aforo      integer;
  v_emitidas   integer;
begin
  select quantity into v_cupo_tipo
    from public.ticket_types where id = new.ticket_type_id;
  select count(*) into v_emitidas_tipo
    from public.tickets
   where ticket_type_id = new.ticket_type_id and status <> 'VOID';

  if v_emitidas_tipo >= v_cupo_tipo then
    raise exception 'Ese tipo de entrada está agotado (% de %).',
      v_emitidas_tipo, v_cupo_tipo;
  end if;

  select coalesce(e.capacity, v.capacity) into v_aforo
    from public.events e
    left join public.venues v on v.id = e.venue_id
   where e.id = new.event_id;

  if v_aforo is not null then
    select count(*) into v_emitidas
      from public.tickets where event_id = new.event_id and status <> 'VOID';
    if v_emitidas >= v_aforo then
      raise exception 'El evento llegó a su aforo (% de %).', v_emitidas, v_aforo;
    end if;
  end if;

  return new;
end;
$$;

create trigger tickets_aforo
  before insert on public.tickets
  for each row execute function public.entrada_respeta_aforo();

-- ---------------------------------------------------------------------------
-- Check-in.
--
-- El scanner en puerta trabaja sin red y sincroniza después, así que puede
-- llegar el mismo ticket dos veces. La resolución es "primer scan gana", y el
-- segundo se GUARDA como DUPLICATE: si se descartara, se perdería justo la
-- evidencia de que alguien clonó la entrada.
-- ---------------------------------------------------------------------------
create table public.checkins (
  id            uuid primary key default public.uuid_generate_v7(),
  ticket_id     uuid not null references public.tickets(id) on delete cascade,
  gate          text,
  staff_user_id uuid references public.users(id) on delete set null,
  device_id     text,
  result        public.checkin_result not null,
  reason        text,
  scanned_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),

  -- Un override manual sin motivo no se puede revisar después.
  constraint override_con_motivo check (result <> 'OVERRIDE' or reason is not null)
);

/* Un solo check-in bueno por entrada. El índice es parcial: los duplicados y
   los rechazos se siguen registrando, que es de lo que se trata. */
create unique index checkins_uno_bueno
  on public.checkins (ticket_id) where result in ('OK', 'OVERRIDE');

create index checkins_evento on public.checkins (scanned_at desc);

create rule checkins_sin_update as on update to public.checkins do instead nothing;
create rule checkins_sin_delete as on delete to public.checkins do instead nothing;

-- Marcar la entrada usada al primer scan bueno, en la misma operación.
create or replace function public.entrada_usada_al_entrar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.result in ('OK', 'OVERRIDE') then
    update public.tickets set status = 'USED' where id = new.ticket_id;
  end if;
  return new;
end;
$$;

create trigger checkins_marcan_usada
  after insert on public.checkins
  for each row execute function public.entrada_usada_al_entrar();

-- Rotar el secreto del QR al transferir.
create or replace function public.rotar_qr_al_transferir()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id then
    new.qr_secret := encode(gen_random_uuid()::text::bytea, 'hex');
    new.qr_version := old.qr_version + 1;
  end if;
  return new;
end;
$$;

create trigger tickets_rotan_qr
  before update of user_id on public.tickets
  for each row execute function public.rotar_qr_al_transferir();

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.venues       enable row level security;
alter table public.events       enable row level security;
alter table public.ticket_types enable row level security;
alter table public.tickets      enable row level security;
alter table public.checkins     enable row level security;

create policy "sedes públicas" on public.venues for select using (true);
create policy "sedes con permiso" on public.venues
  for all using (public.has_permission('EVENTS', 'EDIT'))
  with check (public.has_permission('EVENTS', 'EDIT'));

-- La cartelera es pública desde que se anuncia: si no, nadie compra.
create policy "cartelera anunciada es pública" on public.events
  for select using (
    status in ('ANNOUNCED', 'ON_SALE', 'SOLD_OUT', 'LIVE', 'FINISHED')
    or public.has_permission('EVENTS', 'VIEW')
  );
create policy "eventos con permiso" on public.events
  for all using (public.has_permission('EVENTS', 'EDIT'))
  with check (public.has_permission('EVENTS', 'EDIT'));

create policy "tipos de entrada visibles" on public.ticket_types
  for select using (
    status = 'ACTIVE' or public.has_permission('TICKETING', 'VIEW')
  );
create policy "tipos con permiso" on public.ticket_types
  for all using (public.has_permission('TICKETING', 'EDIT'))
  with check (public.has_permission('TICKETING', 'EDIT'));

/* Cada quien ve SU entrada. El qr_secret viaja en esa fila, así que una
   política más laxa acá equivale a repartir entradas falsificables. */
create policy "veo mi entrada" on public.tickets
  for select using (
    user_id = auth.uid() or public.has_permission('TICKETING', 'VIEW')
  );
create policy "entradas con permiso" on public.tickets
  for all using (public.has_permission('TICKETING', 'EDIT'))
  with check (public.has_permission('TICKETING', 'EDIT'));

create policy "check-ins con permiso" on public.checkins
  for select using (public.has_permission('TICKETING', 'VIEW'));
create policy "escanear con permiso" on public.checkins
  for insert with check (public.has_permission('TICKETING', 'EDIT'));

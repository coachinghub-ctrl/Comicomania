-- ---------------------------------------------------------------------------
-- Fase I · Comercio.
--
-- Cuatro reglas que no pueden vivir en la aplicación:
--
--   1. La orden se marca pagada por WEBHOOK, nunca por el retorno del
--      navegador. Quien vuelve de Stripe puede cerrar la pestaña antes, o
--      manipular la URL. Acá se exige un pago conciliado para poder pasar a
--      PAID.
--   2. Los webhooks son idempotentes: Stripe reintenta, y sin una clave única
--      un mismo pago se contaría dos veces.
--   3. El disponible es una columna GENERADA. Si se calculara a mano, en el
--      minuto pico del lanzamiento se vende de más.
--   4. Un reembolso no puede superar lo cobrado.
-- ---------------------------------------------------------------------------

create type public.order_status as enum
  ('PENDING', 'PAID', 'FULFILLING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

create type public.payment_status as enum
  ('REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- Catálogo.
-- ---------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default public.uuid_generate_v7(),
  slug        text not null unique,
  name        text not null,
  description text,
  type        text not null default 'PHYSICAL'
              check (type in ('PHYSICAL', 'DIGITAL', 'TICKET', 'COURSE', 'MEMBERSHIP')),
  status      text not null default 'DRAFT'
              check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  contest_id  uuid references public.contests(id) on delete set null,
  season_id   uuid references public.seasons(id) on delete set null,
  requires_shipping boolean not null default true,
  weight_g    integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id         uuid primary key default public.uuid_generate_v7(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku        text not null unique,
  option_values jsonb not null default '{}'::jsonb,
  price      numeric(12,2) not null check (price >= 0),
  compare_price numeric(12,2),
  currency   char(3) not null default 'USD',
  cost       numeric(12,2),
  status     text not null default 'ACTIVE'
             check (status in ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventario. `available` es GENERADA: no hay forma de que se desincronice.
-- ---------------------------------------------------------------------------
create table public.inventory_locations (
  id         uuid primary key default public.uuid_generate_v7(),
  type       text not null default 'WAREHOUSE'
             check (type in ('WAREHOUSE', 'VENUE', 'PARTNER', 'VIRTUAL')),
  country_id uuid references public.countries(id) on delete set null,
  city_id    uuid references public.cities(id) on delete set null,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id          uuid primary key default public.uuid_generate_v7(),
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  on_hand     integer not null default 0 check (on_hand >= 0),
  reserved    integer not null default 0 check (reserved >= 0),
  available   integer generated always as (on_hand - reserved) stored,
  low_stock_threshold integer not null default 5,
  updated_at  timestamptz not null default now(),
  unique (variant_id, location_id),
  -- Reservar más de lo que hay es el origen de la sobreventa.
  constraint reservado_no_supera_existencias check (reserved <= on_hand)
);

create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

create table public.inventory_adjustments (
  id            uuid primary key default public.uuid_generate_v7(),
  inventory_id  uuid not null references public.inventory(id) on delete cascade,
  delta         integer not null,
  reason        text not null,
  actor_user_id uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create rule inventory_adjustments_sin_update as
  on update to public.inventory_adjustments do instead nothing;
create rule inventory_adjustments_sin_delete as
  on delete to public.inventory_adjustments do instead nothing;

-- Reserva con vencimiento. Sin TTL, un carrito abandonado retiene entradas
-- para siempre y el aforo se agota sin haber vendido nada.
create table public.inventory_reservations (
  id          uuid primary key default public.uuid_generate_v7(),
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  qty         integer not null check (qty > 0),
  user_id     uuid references public.users(id) on delete set null,
  expires_at  timestamptz not null default now() + interval '15 minutes',
  released_at timestamptz,
  created_at  timestamptz not null default now()
);

create index inventory_reservations_vencen
  on public.inventory_reservations (expires_at) where released_at is null;

-- ---------------------------------------------------------------------------
-- Órdenes.
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create table public.orders (
  id         uuid primary key default public.uuid_generate_v7(),
  number     text not null unique default 'CM-' || nextval('public.order_number_seq'),
  user_id    uuid not null references public.users(id) on delete restrict,
  subtotal   numeric(12,2) not null default 0 check (subtotal >= 0),
  discount   numeric(12,2) not null default 0 check (discount >= 0),
  tax        numeric(12,2) not null default 0 check (tax >= 0),
  shipping   numeric(12,2) not null default 0 check (shipping >= 0),
  total      numeric(12,2) not null default 0 check (total >= 0),
  currency   char(3) not null default 'USD',
  status     public.order_status not null default 'PENDING',
  country_id uuid references public.countries(id) on delete set null,
  city_id    uuid references public.cities(id) on delete set null,
  utm        jsonb not null default '{}'::jsonb,
  placed_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_persona on public.orders (user_id, placed_at desc);
create index orders_estado  on public.orders (status);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id         uuid primary key default public.uuid_generate_v7(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  sellable_type text not null default 'PRODUCT',
  sellable_id   uuid,
  qty        integer not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount   numeric(12,2) not null default 0,
  tax        numeric(12,2) not null default 0,
  total      numeric(12,2) not null,
  fulfillment_status text not null default 'PENDING'
                     check (fulfillment_status in ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  metadata   jsonb not null default '{}'::jsonb
);

create index order_items_orden on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Pagos. Tabla propia: no se depende de Stripe como base de datos, porque el
-- día que haya que conciliar o cambiar de proveedor no se puede pedir la
-- historia prestada.
-- ---------------------------------------------------------------------------
create table public.payments (
  id         uuid primary key default public.uuid_generate_v7(),
  order_id   uuid not null references public.orders(id) on delete restrict,
  provider   text not null default 'stripe',
  provider_payment_id text not null,
  amount     numeric(12,2) not null check (amount >= 0),
  currency   char(3) not null default 'USD',
  status     public.payment_status not null default 'PROCESSING',
  method     text,
  fee        numeric(12,2),
  net        numeric(12,2),
  paid_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.refunds (
  id         uuid primary key default public.uuid_generate_v7(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount     numeric(12,2) not null check (amount > 0),
  reason     text not null,
  actor_user_id uuid references public.users(id) on delete set null,
  status     text not null default 'PENDING'
             check (status in ('PENDING', 'SUCCEEDED', 'FAILED')),
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

/* Devolver más de lo cobrado no es un error de redondeo: es dinero que sale y
   no vuelve. Se comprueba contra la suma de todo lo ya devuelto. */
create or replace function public.reembolso_no_supera_lo_cobrado()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cobrado numeric(12,2);
  v_devuelto numeric(12,2);
begin
  select amount into v_cobrado from public.payments where id = new.payment_id;
  select coalesce(sum(amount), 0) into v_devuelto
    from public.refunds
   where payment_id = new.payment_id
     and status <> 'FAILED'
     and id <> new.id;

  if v_devuelto + new.amount > v_cobrado then
    raise exception
      'Ese reembolso deja el total devuelto en % y solo se cobraron %.',
      v_devuelto + new.amount, v_cobrado;
  end if;
  return new;
end;
$$;

create trigger refunds_no_superan
  before insert or update on public.refunds
  for each row execute function public.reembolso_no_supera_lo_cobrado();

-- ---------------------------------------------------------------------------
-- Eventos de Stripe. La clave única ES la idempotencia: Stripe reintenta, y
-- sin esto un mismo pago se contaría dos veces.
-- ---------------------------------------------------------------------------
create table public.stripe_events (
  id              uuid primary key default public.uuid_generate_v7(),
  stripe_event_id text not null unique,
  type            text not null,
  payload         jsonb not null,
  processed_at    timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

/* Una orden no se marca pagada porque alguien volvió del navegador diciendo
   que pagó. Hace falta un pago con estado SUCCEEDED conciliado por webhook. */
create or replace function public.orden_pagada_exige_pago()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('PAID', 'FULFILLING', 'COMPLETED')
     and old.status = 'PENDING'
     and not exists (
       select 1 from public.payments p
        where p.order_id = new.id and p.status = 'SUCCEEDED'
     ) then
    raise exception
      'Esa orden no tiene un pago conciliado. El estado se confirma por webhook, no por el retorno del navegador.';
  end if;
  return new;
end;
$$;

create trigger orders_pago_conciliado
  before update on public.orders
  for each row execute function public.orden_pagada_exige_pago();

-- ---------------------------------------------------------------------------
-- Entitlements: qué desbloqueó una compra. Separado de la orden porque un
-- beneficio puede venir de una compra, de un premio o de una cortesía.
-- ---------------------------------------------------------------------------
create table public.entitlements (
  id         uuid primary key default public.uuid_generate_v7(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null,
  ref_type   text,
  ref_id     uuid,
  source_type text,
  source_id  uuid,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  status     text not null default 'ACTIVE'
             check (status in ('ACTIVE', 'EXPIRED', 'REVOKED')),
  created_at timestamptz not null default now()
);

create index entitlements_persona on public.entitlements (user_id, kind, status);

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.products               enable row level security;
alter table public.product_variants       enable row level security;
alter table public.inventory_locations    enable row level security;
alter table public.inventory              enable row level security;
alter table public.inventory_adjustments  enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.payments               enable row level security;
alter table public.refunds                enable row level security;
alter table public.stripe_events          enable row level security;
alter table public.entitlements           enable row level security;

create policy "catálogo activo es público" on public.products
  for select using (status = 'ACTIVE' or public.has_permission('PRODUCTS', 'VIEW'));
create policy "productos con permiso" on public.products
  for all using (public.has_permission('PRODUCTS', 'EDIT'))
  with check (public.has_permission('PRODUCTS', 'EDIT'));

create policy "variantes activas son públicas" on public.product_variants
  for select using (status = 'ACTIVE' or public.has_permission('PRODUCTS', 'VIEW'));
create policy "variantes con permiso" on public.product_variants
  for all using (public.has_permission('PRODUCTS', 'EDIT'))
  with check (public.has_permission('PRODUCTS', 'EDIT'));

create policy "ubicaciones con permiso" on public.inventory_locations
  for all using (public.has_permission('INVENTORY', 'VIEW'))
  with check (public.has_permission('INVENTORY', 'EDIT'));
create policy "inventario con permiso" on public.inventory
  for all using (public.has_permission('INVENTORY', 'VIEW'))
  with check (public.has_permission('INVENTORY', 'EDIT'));
create policy "ajustes con permiso" on public.inventory_adjustments
  for all using (public.has_permission('INVENTORY', 'VIEW'))
  with check (public.has_permission('INVENTORY', 'EDIT'));
create policy "mis reservas o con permiso" on public.inventory_reservations
  for all using (user_id = auth.uid() or public.has_permission('INVENTORY', 'VIEW'))
  with check (user_id = auth.uid() or public.has_permission('INVENTORY', 'EDIT'));

-- Cada quien ve sus órdenes. Es dato suyo y lo necesita para reclamar.
create policy "veo mis órdenes" on public.orders
  for select using (user_id = auth.uid() or public.has_permission('ORDERS', 'VIEW'));
create policy "órdenes con permiso" on public.orders
  for update using (public.has_permission('ORDERS', 'EDIT'))
  with check (public.has_permission('ORDERS', 'EDIT'));

create policy "veo las líneas de mis órdenes" on public.order_items
  for select using (
    exists (select 1 from public.orders o
             where o.id = order_id
               and (o.user_id = auth.uid() or public.has_permission('ORDERS', 'VIEW')))
  );

-- El dinero exige nivel financiero, y FINANCE.VIEW pide segundo factor.
create policy "pagos con permiso" on public.payments
  for select using (public.has_permission('FINANCE', 'VIEW'));
create policy "reembolsos con permiso" on public.refunds
  for all using (public.has_permission('ORDERS', 'REFUND'))
  with check (public.has_permission('ORDERS', 'REFUND'));

-- Los eventos crudos de Stripe no los mira nadie desde el cliente.
create policy "eventos de stripe solo infraestructura" on public.stripe_events
  for select using (public.has_permission('FINANCE', 'EXPORT'));

create policy "veo mis beneficios" on public.entitlements
  for select using (user_id = auth.uid() or public.has_permission('MEMBERSHIPS', 'VIEW'));
create policy "beneficios con permiso" on public.entitlements
  for all using (public.has_permission('MEMBERSHIPS', 'EDIT'))
  with check (public.has_permission('MEMBERSHIPS', 'EDIT'));

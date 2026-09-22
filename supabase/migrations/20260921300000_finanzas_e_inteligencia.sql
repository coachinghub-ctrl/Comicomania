-- ---------------------------------------------------------------------------
-- Fase N · Finanzas e inteligencia.
--
-- No reemplaza la contabilidad formal: es gestión de negocio con datos reales
-- de la plataforma. Cuatro decisiones que van en la base:
--
--   1. TODA fila financiera lleva país y centro de costo. Sin eso, el
--      finance_level de los grants no puede acotar nada y el P&L por ciudad no
--      existe. Es la columna que hace posible que un manager de Miami vea
--      Miami y solo Miami.
--   2. `amount_base` es una columna GENERADA: importe por tipo de cambio.
--      Calculado a mano se desincroniza, y entonces dos informes de la misma
--      semana no cuadran y nadie sabe cuál creer.
--   3. Una métrica que no está en el diccionario NO se puede guardar. docs/08:
--      "sin diccionario de métricas, dos personas discuten con dos cifras
--      distintas". Es una clave foránea, no una convención.
--   4. Lo financiero se lee por finance_level, no por sección: tener
--      FINANCE.VIEW no basta si tu grant no alcanza ese territorio.
-- ---------------------------------------------------------------------------

create type public.financial_kind as enum ('REVENUE', 'EXPENSE');

create type public.revenue_source as enum
  ('TICKETS', 'STORE', 'ACADEMY', 'MEMBERSHIPS', 'SPONSORS',
   'BOOKINGS', 'EXPERIENCES', 'LICENSING', 'TOURS', 'OTHER');

create table public.financial_categories (
  id        uuid primary key default public.uuid_generate_v7(),
  kind      public.financial_kind not null,
  name      text not null,
  parent_id uuid references public.financial_categories(id) on delete set null,
  code      text not null unique,
  created_at timestamptz not null default now()
);

create table public.revenue_entries (
  id          uuid primary key default public.uuid_generate_v7(),
  source      public.revenue_source not null,
  order_id    uuid references public.orders(id) on delete set null,
  amount      numeric(14,2) not null,
  currency    char(3) not null default 'USD',
  -- Congelado a la fecha del hecho, no al de la consulta.
  fx_rate     numeric(12,6) not null default 1 check (fx_rate > 0),
  amount_base numeric(16,4) generated always as (amount * fx_rate) stored,
  tax         numeric(14,2) not null default 0,
  net         numeric(14,2),
  country_id  uuid not null references public.countries(id) on delete restrict,
  city_id     uuid references public.cities(id) on delete set null,
  scope_path  text not null,
  contest_id  uuid references public.contests(id) on delete set null,
  event_id    uuid references public.events(id) on delete set null,
  season_id   uuid references public.seasons(id) on delete set null,
  cost_center text not null,
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now()
);

create index revenue_entries_periodo on public.revenue_entries (occurred_at, scope_path);
create index revenue_entries_fuente  on public.revenue_entries (source, occurred_at);

create table public.expenses (
  id          uuid primary key default public.uuid_generate_v7(),
  category_id uuid not null references public.financial_categories(id) on delete restrict,
  vendor      text,
  amount      numeric(14,2) not null check (amount >= 0),
  currency    char(3) not null default 'USD',
  fx_rate     numeric(12,6) not null default 1 check (fx_rate > 0),
  amount_base numeric(16,4) generated always as (amount * fx_rate) stored,
  tax         numeric(14,2) not null default 0,
  description text,
  receipt_url text,
  invoice_number text,
  season_id   uuid references public.seasons(id) on delete set null,
  contest_id  uuid references public.contests(id) on delete set null,
  event_id    uuid references public.events(id) on delete set null,
  country_id  uuid not null references public.countries(id) on delete restrict,
  city_id     uuid references public.cities(id) on delete set null,
  scope_path  text not null,
  cost_center text not null,
  payment_method text,
  paid_at     timestamptz,
  created_by  uuid references public.users(id) on delete set null,
  approved_by uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),

  -- Un gasto pagado sin aprobar es exactamente el agujero que se busca evitar.
  constraint gasto_pagado_fue_aprobado check (paid_at is null or approved_by is not null)
);

create index expenses_periodo on public.expenses (paid_at, scope_path);

/* El scope_path se deriva de la ciudad o el país, nunca se escribe a mano: si
   viniera del formulario, bastaría con mentir en un campo para sacar una fila
   del alcance de quien debe verla. */
create or replace function public.derivar_scope_financiero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.scope_path := coalesce(
    (select path from public.cities    where id = new.city_id),
    (select path from public.countries where id = new.country_id)
  );
  if new.scope_path is null then
    raise exception 'Una fila financiera sin territorio no se puede gobernar.';
  end if;
  return new;
end;
$$;

create trigger revenue_entries_scope
  before insert or update of country_id, city_id on public.revenue_entries
  for each row execute function public.derivar_scope_financiero();

create trigger expenses_scope
  before insert or update of country_id, city_id on public.expenses
  for each row execute function public.derivar_scope_financiero();

-- ---------------------------------------------------------------------------
-- Inteligencia.
--
-- El diccionario de métricas es una TABLA, y metrics_daily apunta a ella con
-- clave foránea. Una métrica sin definición escrita no se puede guardar, así
-- que no puede aparecer en un tablero.
-- ---------------------------------------------------------------------------
create table public.metric_definitions (
  slug        text primary key,
  name        text not null,
  -- Qué cuenta exactamente, en castellano, para que dos personas no discutan.
  definition  text not null,
  unit        text,
  owner_area  text,
  created_at  timestamptz not null default now(),
  constraint definicion_no_vacia check (length(trim(definition)) > 10)
);

create table public.metrics_daily (
  id          uuid primary key default public.uuid_generate_v7(),
  date        date not null,
  metric      text not null references public.metric_definitions(slug) on delete restrict,
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  scope_path  text,
  contest_id  uuid references public.contests(id) on delete set null,
  entity_type text,
  entity_id   uuid,
  value       numeric(18,4) not null,
  computed_at timestamptz not null default now(),
  unique (date, metric, country_id, city_id, contest_id, entity_type, entity_id)
);

create index metrics_daily_serie on public.metrics_daily (metric, date desc);

create table public.attribution_touches (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid references public.users(id) on delete cascade,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  utm_content text,
  utm_term    text,
  landing     text,
  contest_id  uuid references public.contests(id) on delete set null,
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  platform    text,
  creative    text,
  occurred_at timestamptz not null default now()
);

create index attribution_touches_persona
  on public.attribution_touches (user_id, occurred_at);

-- ---------------------------------------------------------------------------
-- RLS.
--
-- Lo financiero NO se gobierna con has_permission a secas: se usa
-- finance_access() contra el territorio de la fila. Tener FINANCE.VIEW no
-- basta si el grant no alcanza esa ciudad.
-- ---------------------------------------------------------------------------
alter table public.financial_categories enable row level security;
alter table public.revenue_entries      enable row level security;
alter table public.expenses             enable row level security;
alter table public.metric_definitions   enable row level security;
alter table public.metrics_daily        enable row level security;
alter table public.attribution_touches  enable row level security;

create policy "catálogo contable con permiso" on public.financial_categories
  for all using (public.has_permission('FINANCE', 'VIEW'))
  with check (public.has_permission('FINANCE', 'EDIT'));

create policy "ingresos según nivel financiero" on public.revenue_entries
  for select using (
    public.finance_access(scope_path) <> 'NONE'
    and public.has_permission('FINANCE', 'VIEW', scope_path)
  );
create policy "ingresos se escriben con permiso" on public.revenue_entries
  for all using (public.has_permission('FINANCE', 'EDIT', scope_path))
  with check (public.has_permission('FINANCE', 'EDIT', scope_path));

create policy "gastos según nivel financiero" on public.expenses
  for select using (
    public.finance_access(scope_path) <> 'NONE'
    and public.has_permission('FINANCE', 'VIEW', scope_path)
  );
create policy "gastos se escriben con permiso" on public.expenses
  for all using (public.has_permission('FINANCE', 'EDIT', scope_path))
  with check (public.has_permission('FINANCE', 'EDIT', scope_path));

-- El diccionario es público a propósito: si la definición de una métrica fuera
-- secreta, el número no se podría discutir.
create policy "el diccionario se lee siempre" on public.metric_definitions
  for select using (true);
create policy "el diccionario se escribe con permiso" on public.metric_definitions
  for all using (public.has_permission('ANALYTICS', 'EDIT'))
  with check (public.has_permission('ANALYTICS', 'EDIT'));

create policy "métricas con permiso" on public.metrics_daily
  for select using (public.has_permission('ANALYTICS', 'VIEW', scope_path));
create policy "métricas se escriben con permiso" on public.metrics_daily
  for all using (public.has_permission('ANALYTICS', 'EDIT'))
  with check (public.has_permission('ANALYTICS', 'EDIT'));

create policy "atribución con permiso" on public.attribution_touches
  for select using (
    user_id = auth.uid() or public.has_permission('ANALYTICS', 'VIEW')
  );

-- ---------------------------------------------------------------------------
-- Diccionario de arranque. Cada una dice qué cuenta EXACTAMENTE.
-- ---------------------------------------------------------------------------
insert into public.metric_definitions (slug, name, definition, unit, owner_area) values
  ('registros',
   'Registros',
   'Cuentas creadas con el email verificado, contadas el día de la verificación y no el de la creación. Una cuenta sin verificar no cuenta.',
   'personas', 'Comunidad'),
  ('inscritos_concurso',
   'Inscritos a concurso',
   'Participantes con estado distinto de WITHDRAWN en un concurso, contados el día de la inscripción. Una persona inscrita en dos concursos cuenta dos veces.',
   'inscripciones', 'Concursos'),
  ('videos_aprobados',
   'Videos aprobados',
   'Videos que pasaron a estado APPROVED, contados el día de la aprobación. Un video aprobado y luego rechazado deja de contar desde el día del rechazo.',
   'videos', 'Contenido'),
  ('votos_validos',
   'Votos válidos',
   'Votos con estado VALID al momento del cálculo. Los anulados se descuentan del día en que se emitieron, no del día en que se anularon.',
   'votos', 'Concursos'),
  ('ingreso_bruto',
   'Ingreso bruto',
   'Suma de amount_base de las entradas de ingreso, antes de impuestos y comisiones, en la moneda base y con el tipo de cambio del día del hecho.',
   'USD', 'Finanzas'),
  ('entradas_vendidas',
   'Entradas vendidas',
   'Entradas emitidas con estado distinto de VOID, contadas el día de emisión. Las cortesías se cuentan aparte y no entran acá.',
   'entradas', 'Eventos')
on conflict (slug) do nothing;

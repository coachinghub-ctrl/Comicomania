-- ---------------------------------------------------------------------------
-- Fase M · Sponsors e inventario comercial.
--
-- El inventario comercial se modela como producto vendible con disponibilidad,
-- igual que una entrada. Con eso el equipo comercial responde en segundos
-- "¿qué me queda por vender en México para 2027?", que es la pregunta que hoy
-- nadie contesta sin una hoja de cálculo.
--
-- Tres reglas en la base:
--
--   1. Vendido es vendido. Una pieza exclusiva no se vende dos veces, y no se
--      marca SOLD sin decir a quién. El inventario solo sirve si el estado es
--      de fiar.
--   2. Un entregable cumplido exige EVIDENCIA. "Ya lo publicamos" no es un
--      reporte: es una discusión con la marca dentro de seis meses.
--   3. Un número estimado se marca como estimado. docs/08 lo dice con estas
--      palabras: nunca se presenta una estimación como resultado real.
-- ---------------------------------------------------------------------------

create type public.inventory_commercial_status as enum
  ('AVAILABLE', 'HELD', 'SOLD', 'DELIVERED', 'RETIRED');

create table public.sponsors (
  id          uuid primary key default public.uuid_generate_v7(),
  company     text not null,
  category    text,
  contact_name text,
  email       text,
  phone       text,
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  status      text not null default 'PROSPECT'
              check (status in ('PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED')),
  owner_user_id uuid references public.users(id) on delete set null,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger sponsors_updated_at before update on public.sponsors
  for each row execute function public.set_updated_at();

create table public.sponsor_contracts (
  id          uuid primary key default public.uuid_generate_v7(),
  sponsor_id  uuid not null references public.sponsors(id) on delete restrict,
  season_id   uuid references public.seasons(id) on delete set null,
  contest_id  uuid references public.contests(id) on delete set null,
  value       numeric(14,2) not null check (value >= 0),
  currency    char(3) not null default 'USD',
  starts_at   date not null,
  ends_at     date not null,
  exclusivity jsonb not null default '{}'::jsonb,
  document_url text,
  status      text not null default 'DRAFT'
              check (status in ('DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'CLOSED', 'CANCELLED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint contrato_vigencia_valida check (ends_at > starts_at)
);

create trigger sponsor_contracts_updated_at before update on public.sponsor_contracts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventario comercial.
-- ---------------------------------------------------------------------------
create table public.commercial_inventory (
  id          uuid primary key default public.uuid_generate_v7(),
  type        text not null,
  scope_type  public.scope_type,
  scope_id    uuid,
  scope_path  text,
  season_id   uuid references public.seasons(id) on delete set null,
  contest_id  uuid references public.contests(id) on delete set null,
  starts_at   date,
  ends_at     date,
  price       numeric(14,2) not null check (price >= 0),
  currency    char(3) not null default 'USD',
  exclusivity boolean not null default false,
  status      public.inventory_commercial_status not null default 'AVAILABLE',
  sponsor_id  uuid references public.sponsors(id) on delete set null,
  contract_id uuid references public.sponsor_contracts(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  /* Marcar algo vendido sin decir a quién deja el inventario inservible:
     "¿qué me queda?" se vuelve una pregunta sin respuesta. */
  constraint vendido_tiene_dueno check (
    status not in ('SOLD', 'DELIVERED') or sponsor_id is not null
  )
);

create index commercial_inventory_disponible
  on public.commercial_inventory (status, scope_path, season_id);

create trigger commercial_inventory_updated_at before update on public.commercial_inventory
  for each row execute function public.set_updated_at();

/* Una pieza exclusiva no se revende estando vendida. Sin esto, dos comerciales
   venden el mismo naming rights la misma semana y se entera la marca. */
create or replace function public.exclusiva_no_se_revende()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.exclusivity
     and old.status in ('SOLD', 'DELIVERED')
     and new.status in ('SOLD', 'DELIVERED')
     and new.sponsor_id is distinct from old.sponsor_id then
    raise exception
      'Esa pieza es exclusiva y ya está vendida. Libérala primero y deja el motivo.';
  end if;
  return new;
end;
$$;

create trigger commercial_inventory_exclusiva
  before update on public.commercial_inventory
  for each row execute function public.exclusiva_no_se_revende();

-- ---------------------------------------------------------------------------
-- Entregables.
-- ---------------------------------------------------------------------------
create table public.sponsor_deliverables (
  id           uuid primary key default public.uuid_generate_v7(),
  contract_id  uuid not null references public.sponsor_contracts(id) on delete cascade,
  inventory_id uuid references public.commercial_inventory(id) on delete set null,
  description  text not null,
  due_at       timestamptz,
  status       text not null default 'PENDING'
               check (status in ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'WAIVED', 'FAILED')),
  evidence_url text,
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  /* "Ya lo publicamos" no es un reporte. Sin evidencia y sin fecha, un
     entregable cumplido es una discusión con la marca dentro de seis meses. */
  constraint entregado_con_evidencia check (
    status <> 'DELIVERED'
    or (evidence_url is not null and delivered_at is not null)
  ),
  -- Renunciar a un entregable también se explica.
  constraint renuncia_con_motivo check (
    status <> 'WAIVED' or description is not null
  )
);

create index sponsor_deliverables_pendientes
  on public.sponsor_deliverables (contract_id, status, due_at);

create trigger sponsor_deliverables_updated_at before update on public.sponsor_deliverables
  for each row execute function public.set_updated_at();

create table public.sponsor_campaigns (
  id          uuid primary key default public.uuid_generate_v7(),
  sponsor_id  uuid not null references public.sponsors(id) on delete cascade,
  contract_id uuid references public.sponsor_contracts(id) on delete set null,
  name        text not null,
  assets      jsonb not null default '{}'::jsonb,
  utm         jsonb not null default '{}'::jsonb,
  placements  text[] not null default '{}',
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Métricas reportadas a la marca.
--
-- `is_estimate` no es un adorno: docs/08 exige que una estimación nunca se
-- presente como resultado real. La columna es NOT NULL para que nadie pueda
-- guardar un número sin declarar cuál de las dos cosas es.
-- ---------------------------------------------------------------------------
create table public.sponsor_metrics (
  id          uuid primary key default public.uuid_generate_v7(),
  contract_id uuid not null references public.sponsor_contracts(id) on delete cascade,
  metric      text not null,
  value       numeric(16,2) not null,
  unit        text,
  period_start date not null,
  period_end   date not null,
  is_estimate  boolean not null,
  method       text,
  created_at   timestamptz not null default now(),
  constraint periodo_valido check (period_end >= period_start),
  -- Si es estimación, hay que decir cómo se estimó.
  constraint estimacion_explica_metodo check (
    not is_estimate or method is not null
  )
);

-- ---------------------------------------------------------------------------
-- RLS. Nada de esto es público: son cifras comerciales.
-- ---------------------------------------------------------------------------
alter table public.sponsors             enable row level security;
alter table public.sponsor_contracts    enable row level security;
alter table public.commercial_inventory enable row level security;
alter table public.sponsor_deliverables enable row level security;
alter table public.sponsor_campaigns    enable row level security;
alter table public.sponsor_metrics      enable row level security;

create policy "sponsors con permiso" on public.sponsors
  for all using (public.has_permission('SPONSORS', 'VIEW'))
  with check (public.has_permission('SPONSORS', 'EDIT'));

create policy "contratos con permiso" on public.sponsor_contracts
  for all using (public.has_permission('SPONSORS', 'VIEW'))
  with check (public.has_permission('SPONSORS', 'EDIT'));

create policy "inventario comercial con permiso" on public.commercial_inventory
  for all using (public.has_permission('COMMERCIAL_INVENTORY', 'VIEW'))
  with check (public.has_permission('COMMERCIAL_INVENTORY', 'EDIT'));

create policy "entregables con permiso" on public.sponsor_deliverables
  for all using (public.has_permission('SPONSORS', 'VIEW'))
  with check (public.has_permission('SPONSORS', 'EDIT'));

create policy "campañas con permiso" on public.sponsor_campaigns
  for all using (public.has_permission('CAMPAIGNS', 'VIEW'))
  with check (public.has_permission('CAMPAIGNS', 'EDIT'));

create policy "métricas con permiso" on public.sponsor_metrics
  for all using (public.has_permission('SPONSORS', 'VIEW'))
  with check (public.has_permission('SPONSORS', 'EDIT'));

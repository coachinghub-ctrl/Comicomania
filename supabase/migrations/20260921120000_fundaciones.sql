-- Fundaciones: extensiones, helpers y geografía.
-- Ver docs/09-erd.md (convenciones) y docs/01-arquitectura-y-stack.md (multi-país).

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- UUIDv7: ordenable por tiempo y no adivinable. Los IDs públicos nunca son
-- secuenciales, para que no se pueda enumerar participantes ni órdenes.
-- ---------------------------------------------------------------------------
create or replace function public.uuid_generate_v7()
returns uuid
language sql
volatile
as $$
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(
            int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint)
            from 3
          )
          from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid;
$$;

comment on function public.uuid_generate_v7 is
  'UUID v7: los primeros 48 bits son el timestamp en ms, el resto aleatorio.';

-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Geografía. El par (country_id, city_id) es la llave de todo el modelo de
-- acceso, de la analítica y de las finanzas: ningún objeto operable existe
-- sin él. `path` materializa el árbol ('US', 'US.FL', 'US.FL.MIA') para que
-- la contención de territorio sea una comparación de prefijo.
-- ---------------------------------------------------------------------------
create table public.countries (
  id          uuid primary key default public.uuid_generate_v7(),
  iso2        char(2) not null unique,
  name        text not null,
  path        text not null unique,
  currency_default  char(3) not null,
  locale_default    text not null default 'es',
  tax_mode          text not null default 'none',
  legal_jurisdiction text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.regions (
  id          uuid primary key default public.uuid_generate_v7(),
  country_id  uuid not null references public.countries(id) on delete restrict,
  slug        text not null,
  name        text not null,
  path        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (country_id, slug)
);

create table public.cities (
  id          uuid primary key default public.uuid_generate_v7(),
  country_id  uuid not null references public.countries(id) on delete restrict,
  region_id   uuid references public.regions(id) on delete set null,
  slug        text not null,
  name        text not null,
  path        text not null unique,
  timezone    text not null,
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (country_id, slug)
);

-- Búsqueda por prefijo de territorio: 'US.FL%' encuentra toda Florida.
create index countries_path_prefix on public.countries (path text_pattern_ops);
create index regions_path_prefix   on public.regions   (path text_pattern_ops);
create index cities_path_prefix    on public.cities    (path text_pattern_ops);
create index cities_country        on public.cities    (country_id);

create trigger countries_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
create trigger regions_updated_at before update on public.regions
  for each row execute function public.set_updated_at();
create trigger cities_updated_at before update on public.cities
  for each row execute function public.set_updated_at();

-- La geografía es pública: la web la lee sin sesión para armar las landings.
alter table public.countries enable row level security;
alter table public.regions   enable row level security;
alter table public.cities    enable row level security;

create policy "geografía visible para todos" on public.countries
  for select using (true);
create policy "geografía visible para todos" on public.regions
  for select using (true);
create policy "geografía visible para todos" on public.cities
  for select using (true);

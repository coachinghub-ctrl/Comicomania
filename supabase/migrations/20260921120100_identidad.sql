-- COMICOMANIA ID. Una persona, una identidad, un historial.
-- Ver docs/02-identidad-y-acceso.md
--
-- auth.users (Supabase) es SOLO el almacén de credenciales.
-- public.users es el COMICOMANIA ID: el activo del negocio, con su perfil,
-- sus tipos, sus niveles y todo lo que cuelga de él. Ningún otro módulo
-- crea usuarios ni duplica perfiles.

create table public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  email_verified_at timestamptz,
  phone             text,
  phone_verified_at timestamptz,
  first_name        text,
  last_name         text,
  display_name      text,
  handle            text unique,
  avatar_url        text,
  country_id        uuid references public.countries(id) on delete set null,
  region_id         uuid references public.regions(id)   on delete set null,
  city_id           uuid references public.cities(id)    on delete set null,
  locale            text not null default 'es',
  timezone          text,
  marketing_opt_in  boolean not null default false,
  status            text not null default 'ACTIVE'
                    check (status in ('ACTIVE','SUSPENDED','DELETED')),
  mfa_enabled       boolean not null default false,
  referral_code     text not null unique
                    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  last_active_at    timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- El handle vive en la URL pública (/humoristas/[handle]): minúsculas,
-- sin acentos, y no puede chocar con las rutas del sitio.
alter table public.users add constraint users_handle_formato
  check (handle is null or handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$');

create index users_city     on public.users (city_id);
create index users_country  on public.users (country_id);
create index users_activity on public.users (last_active_at desc nulls last);
create index users_handle_trgm on public.users using gin (handle gin_trgm_ops);

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Perfil artístico: separado de la identidad porque no todo el mundo lo tiene.
create table public.profiles (
  user_id      uuid primary key references public.users(id) on delete cascade,
  stage_name   text,
  bio          text,
  socials      jsonb not null default '{}'::jsonb,
  photo_url    text,
  completeness smallint not null default 0 check (completeness between 0 and 100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tipos de usuario. Catálogo en base de datos, nunca un enum de código:
-- se agregan tipos sin deploy. Una persona puede tener varios a la vez.
-- El tipo activa secciones de interfaz y campos de perfil, NO permisos.
-- ---------------------------------------------------------------------------
create table public.user_types (
  id              uuid primary key default public.uuid_generate_v7(),
  slug            text not null unique,
  name            text not null,
  is_public       boolean not null default true,
  requires_profile boolean not null default false,
  created_at      timestamptz not null default now()
);

create table public.user_type_assignments (
  id           uuid primary key default public.uuid_generate_v7(),
  user_id      uuid not null references public.users(id) on delete cascade,
  user_type_id uuid not null references public.user_types(id) on delete cascade,
  source       text not null default 'SYSTEM',
  assigned_at  timestamptz not null default now(),
  unique (user_id, user_type_id)
);

create index user_type_assignments_user on public.user_type_assignments (user_id);

-- ---------------------------------------------------------------------------
-- Niveles. Describen avance y beneficios. NUNCA otorgan permisos:
-- la autoridad vive solo en access_grants. El historial no se sobrescribe.
-- ---------------------------------------------------------------------------
create table public.user_levels (
  id           uuid primary key default public.uuid_generate_v7(),
  slug         text not null unique,
  track        text not null check (track in ('community','comedian','student','operator')),
  name         text not null,
  rank         smallint not null,
  criteria     jsonb not null default '{}'::jsonb,
  benefits     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  unique (track, rank)
);

create table public.user_level_assignments (
  id            uuid primary key default public.uuid_generate_v7(),
  user_id       uuid not null references public.users(id) on delete cascade,
  user_level_id uuid not null references public.user_levels(id) on delete restrict,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  reason        text
);

create index user_level_assignments_user on public.user_level_assignments (user_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Alta automática: cuando Supabase Auth crea la credencial, nace el ID.
-- Todo el mundo entra como ESPECTADOR y nivel MEMBER; los demás tipos y
-- niveles se agregan después, sin crear otra cuenta.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type_id  uuid;
  v_level_id uuid;
begin
  insert into public.users (id, email, email_verified_at, display_name)
  values (
    new.id,
    new.email,
    new.email_confirmed_at,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  select id into v_type_id  from public.user_types  where slug = 'ESPECTADOR';
  select id into v_level_id from public.user_levels where slug = 'MEMBER';

  if v_type_id is not null then
    insert into public.user_type_assignments (user_id, user_type_id, source)
    values (new.id, v_type_id, 'SIGNUP')
    on conflict do nothing;
  end if;

  if v_level_id is not null then
    insert into public.user_level_assignments (user_id, user_level_id, reason)
    values (new.id, v_level_id, 'Alta de cuenta');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Mantener el email en sincronía con la credencial.
create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set email = new.email,
         email_verified_at = new.email_confirmed_at
   where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_auth_user_email();

-- ---------------------------------------------------------------------------
-- RLS. Primera muralla de datos: cada quien ve lo suyo.
-- La segunda (territorio y secciones) llega con access_grants.
-- ---------------------------------------------------------------------------
alter table public.users                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.user_types             enable row level security;
alter table public.user_type_assignments  enable row level security;
alter table public.user_levels            enable row level security;
alter table public.user_level_assignments enable row level security;

create policy "cada quien ve su ID" on public.users
  for select using (auth.uid() = id);
create policy "cada quien edita su ID" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "perfil propio" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "catálogo de tipos visible" on public.user_types
  for select using (true);
create policy "catálogo de niveles visible" on public.user_levels
  for select using (true);

create policy "mis tipos" on public.user_type_assignments
  for select using (auth.uid() = user_id);
create policy "mis niveles" on public.user_level_assignments
  for select using (auth.uid() = user_id);

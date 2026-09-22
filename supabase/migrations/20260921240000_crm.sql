-- ---------------------------------------------------------------------------
-- Fase H · CRM.
--
-- La regla que ordena todo este archivo: el CRM NO duplica usuarios. Un
-- contacto que tiene cuenta ES esa cuenta. Los leads sin cuenta —sponsors,
-- clientes de talento, prensa— viven con user_id nulo y se fusionan el día que
-- se registran. Un CRM con la gente duplicada deja de ser una fuente de verdad
-- a la semana de usarse.
-- ---------------------------------------------------------------------------

create type public.crm_entity as enum
  ('CONTESTANT', 'SPONSOR', 'TALENT', 'SUPPORT');

create type public.consent_channel as enum ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

create table public.crm_contacts (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid unique references public.users(id) on delete set null,
  email       text,
  phone       text,
  company     text,
  first_name  text,
  last_name   text,
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  source      text,
  utm         jsonb not null default '{}'::jsonb,
  owner_user_id uuid references public.users(id) on delete set null,
  status      text not null default 'ACTIVE'
              check (status in ('ACTIVE', 'ARCHIVED', 'MERGED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un contacto sin forma de contactarlo no es un contacto.
  constraint contacto_alcanzable check (
    user_id is not null or email is not null or phone is not null
  )
);

-- Sin esto se duplica el mismo lead cada vez que entra por otro formulario.
create unique index crm_contacts_email_unico
  on public.crm_contacts (lower(email)) where email is not null;

create index crm_contacts_dueno on public.crm_contacts (owner_user_id, status);

create trigger crm_contacts_updated_at before update on public.crm_contacts
  for each row execute function public.set_updated_at();

create table public.crm_tags (
  id    uuid primary key default public.uuid_generate_v7(),
  slug  text not null unique,
  name  text not null,
  color text
);

create table public.crm_contact_tags (
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  tag_id     uuid not null references public.crm_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Un solo motor de pipelines para participantes, sponsors, talento y soporte.
-- Cambian los stages, no el código.
-- ---------------------------------------------------------------------------
create table public.crm_pipelines (
  id          uuid primary key default public.uuid_generate_v7(),
  slug        text not null unique,
  name        text not null,
  entity_type public.crm_entity not null,
  created_at  timestamptz not null default now()
);

create table public.crm_stages (
  id          uuid primary key default public.uuid_generate_v7(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  name        text not null,
  "order"     smallint not null,
  probability smallint check (probability between 0 and 100),
  sla_hours   integer,
  unique (pipeline_id, "order")
);

create table public.crm_opportunities (
  id          uuid primary key default public.uuid_generate_v7(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete restrict,
  stage_id    uuid not null references public.crm_stages(id) on delete restrict,
  contact_id  uuid not null references public.crm_contacts(id) on delete cascade,
  title       text not null,
  amount      numeric(12,2),
  currency    char(3),
  country_id  uuid references public.countries(id) on delete set null,
  city_id     uuid references public.cities(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  expected_close date,
  status      text not null default 'OPEN'
              check (status in ('OPEN', 'WON', 'LOST')),
  lost_reason text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Perder sin motivo es perder la lección. Se exige al cerrar, no antes.
  constraint perdida_con_motivo check (status <> 'LOST' or lost_reason is not null)
);

create index crm_opportunities_tablero
  on public.crm_opportunities (pipeline_id, stage_id, status);

create trigger crm_opportunities_updated_at before update on public.crm_opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Actividades: el timeline. Lo alimenta el bus de eventos, no la mano.
-- ---------------------------------------------------------------------------
create table public.crm_activities (
  id          uuid primary key default public.uuid_generate_v7(),
  contact_id  uuid not null references public.crm_contacts(id) on delete cascade,
  type        text not null,
  subject     text,
  body        text,
  direction   text check (direction in ('IN', 'OUT', 'SYSTEM')),
  actor_user_id uuid references public.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  source_event_id uuid,
  created_at  timestamptz not null default now()
);

create index crm_activities_timeline
  on public.crm_activities (contact_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Consentimiento de marketing, por canal.
--
-- Esto no es una preferencia: en la UE es un requisito legal, y en LATAM y
-- EE. UU. es la diferencia entre una lista sana y una denuncia por spam. Por
-- eso la comprobación vive acá, en una función que el envío TIENE que llamar,
-- y no en la plantilla de correo de turno.
-- ---------------------------------------------------------------------------
create table public.marketing_consents (
  id          uuid primary key default public.uuid_generate_v7(),
  contact_id  uuid not null references public.crm_contacts(id) on delete cascade,
  channel     public.consent_channel not null,
  granted     boolean not null,
  -- Dónde y cuándo lo dio: sin esto no se puede demostrar.
  source      text,
  ip          inet,
  locale      text,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  unique (contact_id, channel)
);

create or replace function public.puede_recibir_marketing(
  p_contact_id uuid,
  p_channel public.consent_channel
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Sin fila, la respuesta es NO. El silencio nunca es consentimiento.
  select coalesce(
    (select granted and revoked_at is null
       from public.marketing_consents
      where contact_id = p_contact_id and channel = p_channel),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Outbox de eventos de dominio. Los disparadores de las automatizaciones son
-- eventos con nombre estable: si las automatizaciones leyeran tablas, cada
-- cambio de esquema rompería diecisiete flujos a la vez.
-- ---------------------------------------------------------------------------
create table public.domain_events (
  id          uuid primary key default public.uuid_generate_v7(),
  name        text not null,
  payload     jsonb not null default '{}'::jsonb,
  user_id     uuid references public.users(id) on delete set null,
  contact_id  uuid references public.crm_contacts(id) on delete set null,
  occurred_at timestamptz not null default now(),
  -- Null = todavía no lo tomó el bus. Así el outbox se vacía solo.
  dispatched_at timestamptz,
  attempts    smallint not null default 0,
  last_error  text
);

create index domain_events_pendientes
  on public.domain_events (occurred_at) where dispatched_at is null;
create index domain_events_nombre on public.domain_events (name, occurred_at desc);

-- ---------------------------------------------------------------------------
-- El contacto se crea solo con la cuenta. Si hubiera que crearlo a mano, la
-- mitad de la gente no estaría en el CRM y nadie sabría cuál mitad.
-- ---------------------------------------------------------------------------
create or replace function public.contacto_desde_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si ese email ya era un lead, se adopta en vez de duplicarlo.
  update public.crm_contacts
     set user_id = new.id, updated_at = now()
   where user_id is null and lower(email) = lower(new.email);

  if not found then
    insert into public.crm_contacts (user_id, email, source)
    values (new.id, new.email, 'SIGNUP')
    on conflict do nothing;
  end if;

  insert into public.domain_events (name, payload, user_id)
  values ('usuario.registrado', jsonb_build_object('email', new.email), new.id);

  return new;
end;
$$;

create trigger users_contacto_crm
  after insert on public.users
  for each row execute function public.contacto_desde_usuario();

-- ---------------------------------------------------------------------------
-- RLS. El CRM es dato comercial: nada es público.
-- ---------------------------------------------------------------------------
alter table public.crm_contacts       enable row level security;
alter table public.crm_tags           enable row level security;
alter table public.crm_contact_tags   enable row level security;
alter table public.crm_pipelines      enable row level security;
alter table public.crm_stages         enable row level security;
alter table public.crm_opportunities  enable row level security;
alter table public.crm_activities     enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.domain_events      enable row level security;

-- Cada quien ve su propia ficha: es dato suyo, y en la UE tiene derecho a ella.
create policy "veo mi ficha o las de mi territorio" on public.crm_contacts
  for select using (
    user_id = auth.uid()
    or public.has_permission('CRM', 'VIEW', coalesce(
         (select path from public.cities where id = city_id),
         (select path from public.countries where id = country_id)))
  );
create policy "contactos con permiso" on public.crm_contacts
  for all using (public.has_permission('CRM', 'EDIT'))
  with check (public.has_permission('CRM', 'EDIT'));

create policy "etiquetas con permiso" on public.crm_tags
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));
create policy "etiquetas de contacto con permiso" on public.crm_contact_tags
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));

create policy "pipelines con permiso" on public.crm_pipelines
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));
create policy "stages con permiso" on public.crm_stages
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));
create policy "oportunidades con permiso" on public.crm_opportunities
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));
create policy "actividades con permiso" on public.crm_activities
  for all using (public.has_permission('CRM', 'VIEW'))
  with check (public.has_permission('CRM', 'EDIT'));

-- Cada quien ve y revoca su propio consentimiento: la baja en un clic es
-- requisito legal, no una cortesía.
create policy "mi consentimiento es mío" on public.marketing_consents
  for select using (
    exists (select 1 from public.crm_contacts c
             where c.id = contact_id and c.user_id = auth.uid())
    or public.has_permission('CRM', 'VIEW')
  );
create policy "revoco mi consentimiento" on public.marketing_consents
  for update using (
    exists (select 1 from public.crm_contacts c
             where c.id = contact_id and c.user_id = auth.uid())
    or public.has_permission('CRM', 'EDIT')
  );

create policy "eventos con permiso" on public.domain_events
  for select using (public.has_permission('AUTOMATIONS', 'VIEW'));

-- ---------------------------------------------------------------------------
-- Pipeline de participantes, que es el único que hace falta para R1.
-- ---------------------------------------------------------------------------
insert into public.crm_pipelines (slug, name, entity_type)
values ('participantes', 'Participantes', 'CONTESTANT')
on conflict (slug) do nothing;

insert into public.crm_stages (pipeline_id, name, "order", probability)
select p.id, e.name, e.orden, e.prob
  from public.crm_pipelines p,
       (values ('Registrado', 1::smallint, 10::smallint),
               ('Perfil completo', 2, 30),
               ('Video subido', 3, 60),
               ('Video aprobado', 4, 85),
               ('Compitiendo', 5, 100)) as e(name, orden, prob)
 where p.slug = 'participantes'
on conflict do nothing;

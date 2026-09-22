-- ---------------------------------------------------------------------------
-- Eventos gratuitos, y la lista que de verdad importa.
--
-- Un evento no siempre se cobra. Y cuando es gratis, lo valioso no es la
-- entrada: es saber QUIÉN va a ir, para poder escribirle antes y después.
--
-- Esa lista es la razón de hacer el evento gratis, así que no puede vivir en
-- una hoja de cálculo aparte: entra al CRM con el evento como fuente, y desde
-- ahí alimenta campañas sin que nadie copie y pegue nada.
--
-- Y esto SÍ funciona hoy: reservar un lugar gratis no necesita pasarela de
-- pago. Es lo único del comercio que se puede usar de verdad ahora mismo.
-- ---------------------------------------------------------------------------

alter table public.events add column if not exists is_free boolean not null default false;

comment on column public.events.is_free is
  'Un evento gratuito. La lista de asistentes es el objetivo, no la venta: '
  'por eso la reserva no exige cuenta, solo correo.';

-- ---------------------------------------------------------------------------
-- Reservas.
--
-- Sin cuenta: pedir registro para un evento gratis pierde a la mitad de la
-- gente en el formulario. El COMICOMANIA ID llega después, si quiere.
--
-- Cuando esa persona se registre con el mismo correo, la reserva se adopta
-- sola — igual que los leads del CRM.
-- ---------------------------------------------------------------------------
create table if not exists public.event_registrations (
  id          uuid primary key default public.uuid_generate_v7(),
  event_id    uuid not null references public.events(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  user_id     uuid references public.users(id) on delete set null,
  contact_id  uuid references public.crm_contacts(id) on delete set null,
  ticket_id   uuid references public.tickets(id) on delete set null,
  source      text not null default 'WEB',
  attended    boolean not null default false,
  created_at  timestamptz not null default now(),

  -- Una persona, un lugar. Reservar tres veces no da tres asientos.
  unique (event_id, email)
);

create index if not exists event_registrations_evento
  on public.event_registrations (event_id, created_at desc);

alter table public.event_registrations enable row level security;

-- La lista es dato de negocio: no la ve nadie sin permiso. Cada quien sí ve
-- la suya, para poder comprobar que quedó anotado.
create policy "veo mi reserva o las de mi territorio" on public.event_registrations
  for select using (
    user_id = auth.uid()
    or public.has_permission('EVENTS', 'VIEW')
  );
create policy "reservas con permiso" on public.event_registrations
  for all using (public.has_permission('EVENTS', 'EDIT'))
  with check (public.has_permission('EVENTS', 'EDIT'));

-- ---------------------------------------------------------------------------
-- Reservar un lugar sin tener cuenta.
--
-- Misma forma que el aviso de la tienda: una puerta estrecha en vez de abrir
-- la tabla. Valida, respeta el aforo, y no revela si el correo ya estaba
-- anotado —eso permitiría averiguar quién va a ir probando correos—.
-- ---------------------------------------------------------------------------
create or replace function public.reservar_lugar(
  p_evento text,
  p_email  text,
  p_nombre text default null,
  p_telefono text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(trim(p_email));
  v_evento  record;
  v_ocupados int;
  v_contacto uuid;
  v_user     uuid;
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'correo_invalido';
  end if;

  select e.id, e.name, e.slug, e.is_free, e.status, e.capacity, e.starts_at
    into v_evento
    from public.events e
   where e.slug = p_evento;

  if v_evento.id is null then raise exception 'evento_desconocido'; end if;
  if not v_evento.is_free then raise exception 'evento_de_pago'; end if;
  if v_evento.status not in ('ANNOUNCED', 'ON_SALE') then
    raise exception 'reservas_cerradas';
  end if;
  if v_evento.starts_at < now() then raise exception 'evento_pasado'; end if;

  -- El aforo también manda en lo gratuito: prometer un lugar que no existe
  -- se descubre en la puerta, que es el peor sitio posible.
  if v_evento.capacity is not null then
    select count(*) into v_ocupados
      from public.event_registrations where event_id = v_evento.id;
    if v_ocupados >= v_evento.capacity then
      raise exception 'aforo_completo';
    end if;
  end if;

  -- Si ya es usuario, se vincula. Si no, queda como lead.
  select id into v_user from public.users where lower(email) = v_email;

  select id into v_contacto from public.crm_contacts where lower(email) = v_email;
  if v_contacto is null then
    insert into public.crm_contacts (email, first_name, phone, source, user_id)
    values (v_email, nullif(split_part(coalesce(p_nombre, ''), ' ', 1), ''),
            nullif(trim(coalesce(p_telefono, '')), ''), 'EVENTO_' || upper(v_evento.slug), v_user)
    returning id into v_contacto;
  end if;

  insert into public.event_registrations (event_id, email, full_name, phone, user_id, contact_id)
  values (v_evento.id, v_email, nullif(trim(coalesce(p_nombre, '')), ''),
          nullif(trim(coalesce(p_telefono, '')), ''), v_user, v_contacto)
  on conflict (event_id, email) do nothing;

  -- El timeline del CRM y el bus de eventos, que es lo que alimenta campañas.
  insert into public.crm_activities (contact_id, type, subject, body, direction)
  values (v_contacto, 'RESERVA_EVENTO', v_evento.name,
          'Reservó su lugar para ' || v_evento.name || '.', 'IN');

  insert into public.domain_events (name, payload, user_id, contact_id)
  values ('evento.reserva',
          jsonb_build_object('evento', v_evento.slug, 'nombre', v_evento.name),
          v_user, v_contacto);

  return 'ok';
end;
$$;

revoke all on function public.reservar_lugar(text, text, text, text) from public;
grant execute on function public.reservar_lugar(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cuántos van, sin exponer quiénes.
--
-- La página pública necesita decir "quedan 40 lugares", no la lista. Decir
-- quién va sería repartir la base de asistentes a cualquiera que abra la web.
-- ---------------------------------------------------------------------------
create or replace function public.lugares_del_evento(p_evento text)
returns table (reservados bigint, aforo integer, quedan integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(r.id),
    e.capacity,
    case when e.capacity is null then null
         else greatest(0, e.capacity - count(r.id)::int) end
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where e.slug = p_evento
    and e.status in ('ANNOUNCED', 'ON_SALE', 'SOLD_OUT', 'LIVE', 'FINISHED')
  group by e.capacity;
$$;

grant execute on function public.lugares_del_evento(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cuando alguien se registra, sus reservas anteriores se adoptan solas.
-- ---------------------------------------------------------------------------
create or replace function public.adoptar_reservas_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.event_registrations
     set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists users_adoptan_reservas on public.users;
create trigger users_adoptan_reservas
  after insert on public.users
  for each row execute function public.adoptar_reservas_al_registrarse();

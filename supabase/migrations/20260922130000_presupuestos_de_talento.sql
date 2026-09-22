-- ---------------------------------------------------------------------------
-- Presupuestos de talento.
--
-- Había un agujero en medio del embudo: una solicitud de contratación podía
-- estar en estado 'QUOTED' y no existía nada que produjera una cotización. Se
-- pasaba de "alguien preguntó" a "hay un contrato firmado" sin el paso donde
-- se dice el precio, que es justamente donde se gana o se pierde el encargo.
--
-- Dos piezas:
--   · talent_rates    — el tarifario: cuánto cuesta cada humorista por set.
--   · booking_quotes  — el presupuesto, con sus líneas.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- El tarifario.
--
-- Por duración, porque un humorista no cuesta lo mismo por quince minutos que
-- por una hora, y opcionalmente por mercado: el mismo show en Miami y en
-- Bogotá no se cobra igual y fingir que sí obliga a improvisar en cada
-- presupuesto.
-- ---------------------------------------------------------------------------
create table if not exists public.talent_rates (
  id          uuid primary key default public.uuid_generate_v7(),
  talent_id   uuid not null references public.talent_profiles(user_id) on delete cascade,
  set_minutes smallint not null check (set_minutes > 0 and set_minutes <= 240),
  fee         numeric(12,2) not null check (fee >= 0),
  currency    char(3) not null default 'USD',
  -- Path de territorio (US.FL, MX) o null para la tarifa general.
  market      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/* Dos índices y no uno: en Postgres los NULL no chocan entre sí, así que un
   único índice sobre (talent_id, set_minutes, market) dejaría meter la tarifa
   general dos veces. Es el mismo problema que ya apareció con settings. */
create unique index if not exists talent_rates_mercado_unico
  on public.talent_rates (talent_id, set_minutes, market) where market is not null;
create unique index if not exists talent_rates_general_unico
  on public.talent_rates (talent_id, set_minutes) where market is null;

drop trigger if exists talent_rates_updated_at on public.talent_rates;
create trigger talent_rates_updated_at before update on public.talent_rates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- El presupuesto.
-- ---------------------------------------------------------------------------
create table if not exists public.booking_quotes (
  id          uuid primary key default public.uuid_generate_v7(),
  booking_id  uuid not null references public.booking_requests(id) on delete cascade,
  talent_id   uuid not null references public.talent_profiles(user_id) on delete restrict,

  /* Versión, no edición. Un presupuesto que ya se mandó es un número sobre el
     que alguien está decidiendo; cambiarlo por debajo convierte esa decisión
     en una sobre algo que nunca vio. Para cambiarlo se emite otra versión.
     Es la misma regla que rige los textos legales. */
  version     integer not null default 1,

  currency    char(3) not null default 'USD',
  discount    numeric(12,2) not null default 0 check (discount >= 0),
  commission_pct numeric(5,2) not null default 0
                 check (commission_pct >= 0 and commission_pct <= 100),
  tax_pct     numeric(5,2) not null default 0
              check (tax_pct >= 0 and tax_pct <= 100),

  /* Totales calculados por un trigger desde las líneas. No son de escritura
     libre: si se pudieran escribir a mano, el total y las líneas
     discreparían, y el cliente vería un desglose que no suma lo que se le
     cobra. */
  subtotal    numeric(14,2) not null default 0,
  base        numeric(14,2) not null default 0,
  commission  numeric(14,2) not null default 0,
  tax         numeric(14,2) not null default 0,
  total       numeric(14,2) not null default 0,
  talent_net  numeric(14,2) not null default 0,

  /* Un presupuesto sin caducidad es un precio al que te comprometes para
     siempre, y los vuelos de dentro de ocho meses no cuestan lo mismo. */
  valid_until date not null,

  status      text not null default 'DRAFT'
              check (status in ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  notes       text,
  terms       text,
  created_by  uuid references public.users(id) on delete set null,
  sent_at     timestamptz,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (booking_id, version),

  constraint enviado_tiene_fecha check (status = 'DRAFT' or sent_at is not null),
  constraint decidido_tiene_fecha check (
    status not in ('ACCEPTED', 'REJECTED') or decided_at is not null
  )
);

create index if not exists booking_quotes_solicitud on public.booking_quotes (booking_id, version desc);
create index if not exists booking_quotes_estado on public.booking_quotes (status, valid_until);

drop trigger if exists booking_quotes_updated_at on public.booking_quotes;
create trigger booking_quotes_updated_at before update on public.booking_quotes
  for each row execute function public.set_updated_at();

create table if not exists public.quote_lines (
  id         uuid primary key default public.uuid_generate_v7(),
  quote_id   uuid not null references public.booking_quotes(id) on delete cascade,
  concept    text not null check (length(btrim(concept)) > 0),
  kind       text not null default 'OTHER'
             check (kind in ('FEE', 'TRAVEL', 'LODGING', 'PER_DIEM', 'TECH', 'OTHER')),
  quantity   numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),

  /* El importe de la línea se redondea al centavo ANTES de sumar, igual que
     hará la factura. Sumar fracciones de centavo y redondear al final da un
     total que no coincide con la suma de lo que el cliente ve escrito. */
  amount     numeric(14,2) generated always as (round(unit_price * quantity, 2)) stored,

  "order"    smallint not null default 1
);

create index if not exists quote_lines_presupuesto on public.quote_lines (quote_id, "order");

-- ---------------------------------------------------------------------------
-- La aritmética, en un solo sitio.
--
-- El orden NO es intercambiable y por eso está escrito una vez:
--   subtotal → menos descuento → más comisión sobre la base → más impuesto.
-- Aplicar el descuento después de la comisión da otro número. Ninguno de los
-- dos es "el correcto" por sí solo; lo correcto es que siempre sea el mismo.
--
-- Esto es gemelo de calcularPresupuesto() en packages/domain, que solo sirve
-- para la vista previa mientras se escribe. El número que vale es este.
-- ---------------------------------------------------------------------------
create or replace function public.recalcular_presupuesto(p_quote uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(14,2);
  v_q record;
  v_base numeric(14,2);
  v_comision numeric(14,2);
  v_impuesto numeric(14,2);
begin
  select coalesce(sum(amount), 0) into v_subtotal
    from public.quote_lines where quote_id = p_quote;

  select discount, commission_pct, tax_pct into v_q
    from public.booking_quotes where id = p_quote;

  if v_q is null then return; end if;

  v_base := greatest(v_subtotal - v_q.discount, 0);
  v_comision := round(v_base * v_q.commission_pct / 100, 2);
  v_impuesto := round((v_base + v_comision) * v_q.tax_pct / 100, 2);

  update public.booking_quotes
     set subtotal   = v_subtotal,
         base       = v_base,
         commission = v_comision,
         tax        = v_impuesto,
         total      = v_base + v_comision + v_impuesto,
         talent_net = v_base - v_comision
   where id = p_quote;
end;
$$;

create or replace function public.presupuesto_tras_cambiar_linea()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_presupuesto(coalesce(new.quote_id, old.quote_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists quote_lines_recalculan on public.quote_lines;
create trigger quote_lines_recalculan
  after insert or update or delete on public.quote_lines
  for each row execute function public.presupuesto_tras_cambiar_linea();

/* Y cuando cambia el descuento, la comisión o el impuesto, también. Va en un
   BEFORE sobre la propia fila para no entrar en bucle con el UPDATE de
   recalcular_presupuesto. */
create or replace function public.presupuesto_recalcula_sus_totales()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(14,2);
begin
  select coalesce(sum(amount), 0) into v_subtotal
    from public.quote_lines where quote_id = new.id;

  new.subtotal   := v_subtotal;
  new.base       := greatest(v_subtotal - new.discount, 0);
  new.commission := round(new.base * new.commission_pct / 100, 2);
  new.tax        := round((new.base + new.commission) * new.tax_pct / 100, 2);
  new.total      := new.base + new.commission + new.tax;
  new.talent_net := new.base - new.commission;
  return new;
end;
$$;

drop trigger if exists booking_quotes_totales on public.booking_quotes;
create trigger booking_quotes_totales
  before insert or update of discount, commission_pct, tax_pct
  on public.booking_quotes
  for each row execute function public.presupuesto_recalcula_sus_totales();

-- ---------------------------------------------------------------------------
-- Un presupuesto enviado no se toca.
--
-- Esta es la regla dura de la fase, y va en la base porque es la que no puede
-- fallar nunca: el cliente tiene en su correo un PDF con un número. Si ese
-- número cambia por debajo, la conversación deja de ser sobre algo real.
--
-- Lo único que se le puede mover a un presupuesto enviado es su ESTADO —
-- aceptado, rechazado, caducado— y las notas internas.
-- ---------------------------------------------------------------------------
create or replace function public.presupuesto_enviado_es_inmutable()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'DRAFT' then return new; end if;

  if new.discount      is distinct from old.discount
     or new.commission_pct is distinct from old.commission_pct
     or new.tax_pct    is distinct from old.tax_pct
     or new.currency   is distinct from old.currency
     or new.valid_until is distinct from old.valid_until
     or new.terms      is distinct from old.terms
     or new.talent_id  is distinct from old.talent_id then
    raise exception
      'Este presupuesto ya se envió: sus cifras no se pueden cambiar. Emite una versión nueva.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists booking_quotes_inmutable on public.booking_quotes;
create trigger booking_quotes_inmutable
  before update on public.booking_quotes
  for each row execute function public.presupuesto_enviado_es_inmutable();

create or replace function public.lineas_de_presupuesto_enviado()
returns trigger
language plpgsql
as $$
declare v_estado text;
begin
  select status into v_estado from public.booking_quotes
   where id = coalesce(new.quote_id, old.quote_id);

  if v_estado is not null and v_estado <> 'DRAFT' then
    raise exception
      'Ese presupuesto ya se envió: no se le pueden tocar las líneas. Emite una versión nueva.'
      using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists quote_lines_inmutables on public.quote_lines;
create trigger quote_lines_inmutables
  before insert or update or delete on public.quote_lines
  for each row execute function public.lineas_de_presupuesto_enviado();

/* Al enviar, la solicitud pasa a 'QUOTED'. Va en la base y no en la pantalla
   porque si se olvidara, el embudo diría que nadie ha cotizado nada mientras
   los presupuestos salen por correo. */
create or replace function public.solicitud_sigue_al_presupuesto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'SENT' and coalesce(old.status, 'DRAFT') = 'DRAFT' then
    update public.booking_requests
       set status = 'QUOTED'
     where id = new.booking_id and status in ('NEW', 'QUALIFIED');
  elsif new.status = 'ACCEPTED' then
    update public.booking_requests
       set status = 'WON'
     where id = new.booking_id and status not in ('WON', 'CANCELLED');
  end if;
  return new;
end;
$$;

drop trigger if exists booking_quotes_mueven_la_solicitud on public.booking_quotes;
create trigger booking_quotes_mueven_la_solicitud
  after update of status on public.booking_quotes
  for each row execute function public.solicitud_sigue_al_presupuesto();

-- ---------------------------------------------------------------------------
-- RLS.
--
-- Los presupuestos llevan cifras y comisiones: se leen con BOOKINGS.VIEW, o
-- por el propio humorista, que tiene derecho a saber por cuánto lo están
-- ofreciendo. El tarifario, igual.
-- ---------------------------------------------------------------------------
alter table public.talent_rates    enable row level security;
alter table public.booking_quotes  enable row level security;
alter table public.quote_lines     enable row level security;

drop policy if exists "veo mis tarifas o con permiso" on public.talent_rates;
create policy "veo mis tarifas o con permiso" on public.talent_rates
  for select using (
    talent_id = auth.uid() or public.has_permission('BOOKINGS', 'VIEW')
  );

drop policy if exists "tarifas se editan con permiso" on public.talent_rates;
create policy "tarifas se editan con permiso" on public.talent_rates
  for all using (public.has_permission('BOOKINGS', 'EDIT'))
  with check (public.has_permission('BOOKINGS', 'EDIT'));

drop policy if exists "veo los presupuestos que me tocan" on public.booking_quotes;
create policy "veo los presupuestos que me tocan" on public.booking_quotes
  for select using (
    talent_id = auth.uid() or public.has_permission('BOOKINGS', 'VIEW')
  );

drop policy if exists "presupuestos se editan con permiso" on public.booking_quotes;
create policy "presupuestos se editan con permiso" on public.booking_quotes
  for all using (public.has_permission('BOOKINGS', 'EDIT'))
  with check (public.has_permission('BOOKINGS', 'EDIT'));

drop policy if exists "veo las líneas de lo que puedo ver" on public.quote_lines;
create policy "veo las líneas de lo que puedo ver" on public.quote_lines
  for select using (
    exists (
      select 1 from public.booking_quotes q
       where q.id = quote_id
         and (q.talent_id = auth.uid() or public.has_permission('BOOKINGS', 'VIEW'))
    )
  );

drop policy if exists "líneas se editan con permiso" on public.quote_lines;
create policy "líneas se editan con permiso" on public.quote_lines
  for all using (public.has_permission('BOOKINGS', 'EDIT'))
  with check (public.has_permission('BOOKINGS', 'EDIT'));

-- ---------------------------------------------------------------------------
-- Tarifario de ejemplo para el repertorio demo, para que el cotizador no
-- arranque en blanco. Cuelga de cuentas demo: se va con el resto.
-- ---------------------------------------------------------------------------
insert into public.talent_rates (talent_id, set_minutes, fee, currency, notes)
select t.user_id, r.minutos, r.tarifa, 'USD', 'Tarifa de ejemplo'
  from public.talent_profiles t
  join public.users u on u.id = t.user_id
  cross join (values (15, 900), (30, 1800), (45, 3500), (60, 5000)) as r(minutos, tarifa)
 where u.email like '%@demo.comicomania.test'
   and not exists (
     select 1 from public.talent_rates x
      where x.talent_id = t.user_id and x.set_minutes = r.minutos and x.market is null
   );

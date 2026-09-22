-- ---------------------------------------------------------------------------
-- Cada evento con su propio formato visual.
--
-- Un evento sin cartel no se comparte. La gente no reenvía una fecha por
-- WhatsApp: reenvía una imagen. Así que el arte no es un adorno del evento,
-- es el evento cuando sale de la plataforma.
--
-- Tres piezas, y no una:
--   · poster_url   — el cartel vertical, para redes y para la página
--   · banner_url   — el mismo evento en horizontal, para cabeceras
--   · tagline      — la frase del cartel, en texto, para que exista fuera de
--                    la imagen: en el asunto de un correo, en un buscador y
--                    para quien usa lector de pantalla
-- ---------------------------------------------------------------------------

alter table public.events add column if not exists poster_url text;
alter table public.events add column if not exists poster_alt text;
alter table public.events add column if not exists banner_url text;
alter table public.events add column if not exists tagline text;
alter table public.events add column if not exists subtitle text;

comment on column public.events.poster_alt is
  'Qué se ve en el cartel. Obligatorio en la práctica: el cartel es lo que '
  'más se comparte, y sin descripción deja fuera a quien no lo ve.';

comment on column public.events.tagline is
  'La frase del cartel, en texto. Una promesa que solo existe dentro de un '
  'JPG no se puede buscar, ni citar, ni leer en voz alta.';

-- ---------------------------------------------------------------------------
-- La Gran Final de Miami, con su arte.
--
-- Deja de ser dato demo y pasa a ser un evento real: tiene cartel, sede y
-- fecha de verdad. Por eso NO lleva marca demo y no lo borra quitar.sql.
-- ---------------------------------------------------------------------------
do $$
declare
  v_us uuid; v_miami uuid; v_sede uuid; v_evento uuid; v_concurso uuid;
begin
  select id into v_us from public.countries where iso2 = 'US';
  select id into v_miami from public.cities where path = 'US.FL.MIAMI';
  select id into v_concurso from public.contests where slug like 'demo-miami%';

  select id into v_sede from public.venues where name = 'Kaseya Center';
  if v_sede is null then
    insert into public.venues (name, address, city_id, capacity)
    values ('Kaseya Center', '601 Biscayne Blvd, Miami, FL 33132', v_miami, 19600)
    returning id into v_sede;
  end if;

  select id into v_evento from public.events where slug = 'final-miami-2027';
  if v_evento is null then
    insert into public.events (
      slug, name, type, description, tagline, subtitle,
      starts_at, ends_at, timezone, venue_id, country_id, city_id,
      capacity, contest_id, sales_start, sales_end, status,
      poster_url, poster_alt
    ) values (
      'final-miami-2027',
      'COMICOMANÍA Miami 2027 · Gran Final',
      'FINAL',
      'La noche en que se corona a quien hizo reír a una ciudad entera. '
      'Diez finalistas, un escenario y un público que decide junto al jurado.',
      'El escenario donde el talento se convierte en oportunidad',
      'Gran Final',
      -- Viernes 6 de noviembre de 2026, 20:00 hora de Miami.
      '2026-11-06 20:00:00-05', '2026-11-06 23:00:00-05',
      'America/New_York', v_sede, v_us, v_miami,
      19600, v_concurso,
      now(), '2026-11-06 18:00:00-05', 'ON_SALE',
      '/eventos/final-miami.webp',
      'Cartel de la Gran Final: un banco y un micrófono en un escenario rojo, '
      'con el público de pie y el perfil de Miami de fondo. Arriba, la corona '
      'roja y COMICOMANÍA MIAMI 2027.'
    )
    returning id into v_evento;

    insert into public.ticket_types (event_id, name, kind, price, quantity,
                                     per_user_limit, sales_start, sales_end, benefits)
    values
      (v_evento, 'General', 'GENERAL', 35, 1200, 6, now(), '2026-11-06 18:00:00-05',
       '{"incluye": ["entrada general"]}'::jsonb),
      (v_evento, 'Preferencial', 'PREMIUM', 75, 400, 6, now(), '2026-11-06 18:00:00-05',
       '{"incluye": ["primeras filas", "acceso 1 hora antes"]}'::jsonb),
      (v_evento, 'VIP · meet & greet', 'VIP', 150, 80, 4, now(), '2026-11-06 18:00:00-05',
       '{"incluye": ["primera fila", "meet & greet con los finalistas", "poster firmado"]}'::jsonb);
  end if;

  -- El evento de prueba deja de ser público: dos finales en cartelera confunden.
  update public.events set status = 'DRAFT' where slug like 'demo-%';
end;
$$;

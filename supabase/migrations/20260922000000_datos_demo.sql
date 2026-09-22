-- ---------------------------------------------------------------------------
-- DATOS DE DEMOSTRACIÓN.
--
-- Esto NO es esquema: son filas de ejemplo para poder recorrer el panel y ver
-- cómo se comporta cada sección con datos dentro. Va en producción porque es
-- el único entorno que hay, así que todo lo que entra acá es RECONOCIBLE y se
-- puede quitar entero:
--
--   · correos            @demo.comicomania.test
--   · slugs              empiezan por demo-
--   · empresas y sedes   empiezan por "DEMO ·"
--   · centro de costo    DEMO
--
-- Para borrarlo todo: supabase/demo/quitar.sql
--
-- Las cuentas demo no pueden entrar: no tienen contraseña y su dominio no
-- existe, así que tampoco les llega un enlace mágico.
--
-- Idempotente: si ya está puesto, no duplica nada.
-- ---------------------------------------------------------------------------

do $$
declare
  v_us uuid; v_miami uuid; v_miami_path text;
  v_serie uuid; v_temporada uuid; v_concurso uuid;
  v_cat_joven uuid; v_cat_adulto uuid; v_cat_master uuid;
  v_r1 uuid; v_r2 uuid; v_r3 uuid;
  v_sede uuid; v_evento uuid; v_tipo_general uuid; v_tipo_vip uuid;
  v_producto uuid; v_variante uuid; v_bodega uuid; v_inv uuid;
  v_orden uuid; v_pago uuid;
  v_curso uuid; v_modulo uuid; v_leccion1 uuid; v_leccion2 uuid;
  v_sponsor uuid; v_contrato uuid; v_pieza uuid;
  v_doc uuid; v_version uuid;
  v_cat_gasto uuid;
  v_caso uuid;
  v_owner uuid;
  v_persona uuid; v_participante uuid; v_video uuid; v_entry uuid;
  v_juez uuid; v_asignacion uuid;
  v_i int;
  v_nombres text[] := array[
    'Lucía Ferrer','Marco Antonio Ruiz','Kelly Mendoza','Tato Beltrán',
    'Nayeli Cruz','Beto Salcedo','Vane Ortiz','Chino Miranda'];
  v_apodos text[] := array[
    'La Ferrer','Marquitos','Kelly Sin Filtro','Tato',
    'Nay','Beto Bravo','Vane','El Chino'];
  v_edades int[] := array[22, 34, 19, 45, 27, 52, 24, 31];
begin
  -- Si ya está puesto, no se toca.
  if exists (select 1 from public.series where slug = 'demo-comicomania') then
    raise notice 'Los datos demo ya estaban puestos.';
    return;
  end if;

  select id into v_us from public.countries where iso2 = 'US';
  select id, path into v_miami, v_miami_path from public.cities where path = 'US.FL.MIAMI';
  select id into v_owner from public.users order by created_at limit 1;

  -- -------------------------------------------------------------------------
  -- Ocho personas. Se insertan en auth.users y el trigger de identidad crea
  -- su COMICOMANIA ID y su ficha de CRM sola: así el demo recorre el mismo
  -- camino que una persona real.
  -- -------------------------------------------------------------------------
  for v_i in 1..8 loop
    v_persona := gen_random_uuid();

    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_persona, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'demo' || v_i || '@demo.comicomania.test', now() - interval '20 days',
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('display_name', v_nombres[v_i]),
            now() - interval '20 days', now() - interval '20 days');

    update public.users
       set display_name = v_nombres[v_i],
           first_name   = split_part(v_nombres[v_i], ' ', 1),
           country_id   = v_us,
           city_id      = v_miami,
           birth_date   = (current_date - (v_edades[v_i] || ' years')::interval)::date,
           handle       = 'demo_' || v_i
     where id = v_persona;
  end loop;

  -- -------------------------------------------------------------------------
  -- Serie, temporada y concurso.
  -- -------------------------------------------------------------------------
  insert into public.series (slug, name, brand, description)
  values ('demo-comicomania', 'COMICOMANÍA', 'COMICOMANÍA',
          'Serie de demostración. Bórrala cuando ya no la necesites.')
  returning id into v_serie;

  insert into public.seasons (series_id, slug, name, year, starts_at, ends_at, status)
  values (v_serie, 'demo-t1', 'Temporada 1', 2027,
          '2027-01-15', '2027-06-30', 'ACTIVE')
  returning id into v_temporada;

  insert into public.contests (season_id, slug, name, status, country_id, city_id,
                               timezone, registration_opens_at, registration_closes_at,
                               submission_deadline, age_reference_date, prize, created_by)
  values (v_temporada, 'demo-miami-2027', 'COMICOMANÍA Miami 2027', 'OPEN',
          v_us, v_miami, 'America/New_York',
          now() - interval '15 days', now() + interval '20 days',
          now() + interval '25 days', (now() + interval '20 days')::date,
          '{"primer_lugar": "5000 USD y una gira de 3 ciudades"}'::jsonb, v_owner)
  returning id into v_concurso;

  insert into public.categories (contest_id, slug, name, "order", min_age, max_age, min_participants)
  values (v_concurso, 'joven',  'JOVEN',  1, 18, 25, 25) returning id into v_cat_joven;
  insert into public.categories (contest_id, slug, name, "order", min_age, max_age, min_participants)
  values (v_concurso, 'adulto', 'ADULTO', 2, 26, 39, 25) returning id into v_cat_adulto;
  insert into public.categories (contest_id, slug, name, "order", min_age, max_age, min_participants)
  values (v_concurso, 'master', 'MASTER', 3, 40, null, 20) returning id into v_cat_master;

  insert into public.rounds (contest_id, "order", name, type, status, starts_at, ends_at)
  values (v_concurso, 1, 'Clasificatoria', 'SUBMISSION', 'OPEN',
          now() - interval '10 days', now() + interval '25 days') returning id into v_r1;
  insert into public.rounds (contest_id, "order", name, type, status)
  values (v_concurso, 2, 'Semifinal', 'MIXED', 'PLANNED') returning id into v_r2;
  insert into public.rounds (contest_id, "order", name, type, status)
  values (v_concurso, 3, 'Final', 'LIVE', 'PLANNED') returning id into v_r3;

  -- -------------------------------------------------------------------------
  -- Participantes, videos y entries. La edad la congela el trigger: cada quien
  -- cae en su categoría sin que nadie la elija.
  -- -------------------------------------------------------------------------
  v_i := 0;
  for v_persona in
    select id from public.users where email like '%@demo.comicomania.test' order by email
  loop
    v_i := v_i + 1;

    insert into public.participants (user_id, contest_id, category_id, status, registered_at)
    values (v_persona, v_concurso,
            case when v_edades[v_i] <= 25 then v_cat_joven
                 when v_edades[v_i] <= 39 then v_cat_adulto
                 else v_cat_master end,
            (case when v_i <= 5 then 'SUBMITTED' else 'REGISTERED' end)::public.participant_status,
            now() - interval '12 days' + (v_i || ' days')::interval)
    returning id into v_participante;

    -- Los cinco primeros mandaron video, en distintos estados de la máquina.
    if v_i <= 5 then
      insert into public.videos (user_id, contest_id, round_id, category_id, title,
                                 description, status, rights_status, duration_s,
                                 master_url, created_at, published_at)
      values (v_persona, v_concurso, v_r1,
              (select category_id from public.participants where id = v_participante),
              'Rutina de ' || v_apodos[v_i],
              case v_i
                when 1 then 'Dos minutos sobre mudarse a Miami sin hablar inglés.'
                when 2 then 'Mi suegra, el GPS y otras voces que no obedezco.'
                when 3 then 'Trabajar en un call center y salir viva.'
                when 4 then 'Cumplir 45 y descubrir el pádel.'
                else 'La app de citas me mandó a mi prima.' end,
              (case v_i when 1 then 'PUBLISHED' when 2 then 'APPROVED'
                        when 5 then 'PENDING_RIGHTS' else 'SUBMITTED' end)::public.video_status,
              (case v_i when 1 then 'CLEARED' when 2 then 'CLEARED'
                        when 5 then 'PENDING' else 'DECLARED' end)::public.rights_status,
              110 + v_i * 3,
              'https://demo.comicomania.test/master/' || v_i,
              now() - interval '9 days' + (v_i || ' days')::interval,
              case when v_i = 1 then now() - interval '5 days' else null end)
      returning id into v_video;

      insert into public.entries (participant_id, round_id, video_id, status, submitted_at)
      values (v_participante, v_r1, v_video, 'SUBMITTED',
              now() - interval '9 days' + (v_i || ' days')::interval)
      returning id into v_entry;

      -- Historial de revisión del que ya pasó por la cola.
      if v_i <= 2 then
        insert into public.video_reviews (video_id, reviewer_id, decision, comment, created_at)
        values (v_video, v_owner, 'APPROVED',
                'Cumple duración y derechos. Buen cierre.',
                now() - interval '6 days');
      end if;
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- Jurado y notas.
  -- -------------------------------------------------------------------------
  insert into public.judges (display_name, bio, country_id)
  values ('Rosa Iglesias', 'Comediante y guionista. 15 años de escenario en Miami y Bogotá.', v_us)
  returning id into v_juez;
  insert into public.judges (display_name, bio, country_id)
  values ('Kike Peralta', 'Director de club de comedia. Programó a media ciudad.', v_us);
  insert into public.judges (display_name, bio, country_id)
  values ('Dani Sotomayor', 'Productora de televisión. Especialista en formatos de humor.', v_us);

  insert into public.score_criteria (contest_id, slug, name, weight, "order") values
    (v_concurso, 'originalidad', 'Originalidad', 30, 1),
    (v_concurso, 'risa',         'Risa',         25, 2),
    (v_concurso, 'presencia',    'Presencia',    15, 3),
    (v_concurso, 'creatividad',  'Creatividad',  15, 4),
    (v_concurso, 'conexion',     'Conexión',     15, 5);

  select e.id into v_entry
    from public.entries e
    join public.participants p on p.id = e.participant_id
    join public.users u on u.id = p.user_id
   where u.email like '%@demo.comicomania.test'
   order by u.email limit 1;

  insert into public.judge_assignments (judge_id, round_id, entry_id, due_at, status)
  values (v_juez, v_r1, v_entry, now() + interval '5 days', 'SUBMITTED')
  returning id into v_asignacion;

  insert into public.judge_scores (assignment_id, criteria_scores, comment, submitted_at, locked_at)
  values (v_asignacion,
          '{"originalidad": 8.5, "risa": 9, "presencia": 7.5, "creatividad": 8, "conexion": 8.5}'::jsonb,
          'Muy buen material propio. Le falta rematar el segundo bloque.',
          now() - interval '2 days', now() - interval '2 days');

  -- -------------------------------------------------------------------------
  -- Votos: válidos y una ráfaga marcada, para que la cola de antifraude tenga
  -- algo que mostrar.
  -- -------------------------------------------------------------------------
  insert into public.votes (round_id, participant_id, user_id, status, created_at)
  select v_r1, p.id, u.id, 'VALID', now() - interval '4 days'
    from public.participants p
    join public.users u on u.email like '%@demo.comicomania.test'
   where p.contest_id = v_concurso
     and p.user_id <> u.id
   limit 12;

  update public.votes set status = 'SUSPECT'
   where round_id = v_r1
     and id in (select id from public.votes where round_id = v_r1 limit 3);

  -- -------------------------------------------------------------------------
  -- Evento, entradas y un scan duplicado.
  -- -------------------------------------------------------------------------
  insert into public.venues (name, address, city_id, capacity)
  values ('DEMO · Teatro Martí', '420 SW 8th St, Miami', v_miami, 300)
  returning id into v_sede;

  insert into public.events (slug, name, type, description, starts_at, ends_at,
                             venue_id, country_id, city_id, capacity, contest_id,
                             sales_start, sales_end, status)
  values ('demo-final-miami-2027', 'Final COMICOMANÍA Miami 2027', 'FINAL',
          'La final en vivo, con los diez mejores de la ciudad.',
          now() + interval '45 days', now() + interval '45 days' + interval '3 hours',
          v_sede, v_us, v_miami, 300, v_concurso,
          now() - interval '5 days', now() + interval '44 days', 'ON_SALE')
  returning id into v_evento;

  insert into public.ticket_types (event_id, name, kind, price, quantity, sales_start, sales_end)
  values (v_evento, 'General', 'GENERAL', 25, 250, now() - interval '5 days', now() + interval '44 days')
  returning id into v_tipo_general;
  insert into public.ticket_types (event_id, name, kind, price, quantity, benefits)
  values (v_evento, 'VIP · primera fila y meet & greet', 'VIP', 75, 50,
          '{"incluye": ["primera fila", "meet & greet", "poster firmado"]}'::jsonb)
  returning id into v_tipo_vip;

  v_i := 0;
  for v_persona in
    select id from public.users where email like '%@demo.comicomania.test' order by email limit 6
  loop
    v_i := v_i + 1;
    insert into public.tickets (event_id, ticket_type_id, user_id, holder_name, code, status)
    values (v_evento, case when v_i <= 4 then v_tipo_general else v_tipo_vip end,
            v_persona, v_nombres[v_i], 'DEMO-T' || lpad(v_i::text, 3, '0'), 'VALID');
  end loop;

  -- Una entró, y alguien intentó entrar dos veces con el mismo código.
  insert into public.checkins (ticket_id, gate, staff_user_id, result, device_id)
  select id, 'Puerta A', v_owner, 'OK', 'demo-scanner-1'
    from public.tickets where code = 'DEMO-T001';
  insert into public.checkins (ticket_id, gate, staff_user_id, result, device_id, reason)
  select id, 'Puerta B', v_owner, 'DUPLICATE', 'demo-scanner-2', 'Mismo código, segunda puerta'
    from public.tickets where code = 'DEMO-T001';

  -- -------------------------------------------------------------------------
  -- Tienda, inventario y una orden pagada.
  -- -------------------------------------------------------------------------
  insert into public.products (slug, name, description, type, status, contest_id, requires_shipping)
  values ('demo-camiseta-miami', 'Camiseta COMICOMANÍA Miami', 'Algodón, serigrafía a dos tintas.',
          'PHYSICAL', 'ACTIVE', v_concurso, true)
  returning id into v_producto;

  insert into public.product_variants (product_id, sku, option_values, price, currency)
  values (v_producto, 'DEMO-CAM-M', '{"talla": "M"}'::jsonb, 28, 'USD')
  returning id into v_variante;
  insert into public.product_variants (product_id, sku, option_values, price, currency)
  values (v_producto, 'DEMO-CAM-L', '{"talla": "L"}'::jsonb, 28, 'USD');

  insert into public.inventory_locations (type, country_id, city_id, name)
  values ('WAREHOUSE', v_us, v_miami, 'DEMO · Bodega Miami')
  returning id into v_bodega;

  insert into public.inventory (variant_id, location_id, on_hand, reserved, low_stock_threshold)
  values (v_variante, v_bodega, 6, 2, 5) returning id into v_inv;
  insert into public.inventory (variant_id, location_id, on_hand, reserved, low_stock_threshold)
  select id, v_bodega, 40, 0, 5 from public.product_variants where sku = 'DEMO-CAM-L';

  select id into v_persona from public.users
   where email = 'demo1@demo.comicomania.test';

  insert into public.orders (user_id, subtotal, tax, total, currency, status,
                             country_id, city_id, created_at)
  values (v_persona, 28, 2.1, 30.1, 'USD', 'PENDING', v_us, v_miami, now() - interval '3 days')
  returning id into v_orden;

  insert into public.order_items (order_id, variant_id, qty, unit_price, tax, total)
  values (v_orden, v_variante, 1, 28, 2.1, 30.1);

  -- El pago llega por webhook, y recién entonces la orden puede pasar a PAID.
  insert into public.payments (order_id, provider, provider_payment_id, amount,
                               currency, status, method, fee, net, paid_at)
  values (v_orden, 'stripe', 'pi_demo_0001', 30.1, 'USD', 'SUCCEEDED', 'card',
          1.17, 28.93, now() - interval '3 days')
  returning id into v_pago;

  update public.orders set status = 'PAID', placed_at = now() - interval '3 days'
   where id = v_orden;

  -- -------------------------------------------------------------------------
  -- Academia.
  -- -------------------------------------------------------------------------
  insert into public.courses (slug, title, description, instructor_id, level, price, currency,
                              duration_min, status)
  values ('demo-escribir-stand-up', 'Escribir stand-up que funcione',
          'De la idea suelta al set de cinco minutos, con estructura de remate.',
          v_owner, 'BEGINNER', 49, 'USD', 180, 'PUBLISHED')
  returning id into v_curso;

  insert into public.course_modules (course_id, title, "order")
  values (v_curso, 'Fundamentos del remate', 1) returning id into v_modulo;

  insert into public.lessons (module_id, title, type, duration_s, "order", is_preview)
  values (v_modulo, 'Qué hace gracioso a un remate', 'VIDEO', 720, 1, true)
  returning id into v_leccion1;
  insert into public.lessons (module_id, title, type, duration_s, "order")
  values (v_modulo, 'Economía de palabras', 'VIDEO', 840, 2)
  returning id into v_leccion2;

  -- Dos alumnos: uno a medias, otro terminado y certificado.
  insert into public.course_enrollments (user_id, course_id, source)
  select id, v_curso, 'PURCHASE' from public.users
   where email = 'demo2@demo.comicomania.test';
  insert into public.lesson_progress (enrollment_id, lesson_id, seconds_watched, completed_at)
  select e.id, v_leccion1, 720, now() - interval '6 days'
    from public.course_enrollments e
    join public.users u on u.id = e.user_id
   where u.email = 'demo2@demo.comicomania.test';

  insert into public.course_enrollments (user_id, course_id, source)
  select id, v_curso, 'PRIZE' from public.users
   where email = 'demo3@demo.comicomania.test';
  insert into public.lesson_progress (enrollment_id, lesson_id, seconds_watched, completed_at)
  select e.id, l.id, 800, now() - interval '4 days'
    from public.course_enrollments e
    join public.users u on u.id = e.user_id
    cross join (select v_leccion1 as id union all select v_leccion2) l
   where u.email = 'demo3@demo.comicomania.test';

  insert into public.certificates (enrollment_id)
  select e.id from public.course_enrollments e
    join public.users u on u.id = e.user_id
   where u.email = 'demo3@demo.comicomania.test' and e.progress_pct = 100;

  -- -------------------------------------------------------------------------
  -- Talento.
  -- -------------------------------------------------------------------------
  insert into public.talent_profiles (user_id, stage_name, bio, languages, comedy_styles,
                                      markets, set_durations, legal_name, booking_contact,
                                      status, public_visible)
  select id, 'La Ferrer',
         'Observacional, cero filtro, mucho barrio. Diez años de escenario.',
         array['es','en'], array['stand-up','observacional'], array['US.FL','MX'],
         array[15, 30, 45], v_nombres[1], 'booking@demo.comicomania.test',
         'ACTIVE', true
    from public.users where email = 'demo1@demo.comicomania.test';

  insert into public.talent_profiles (user_id, stage_name, bio, languages, comedy_styles,
                                      markets, set_durations, legal_name, booking_contact, status)
  select id, 'El Chino',
         'Personajes y voces. Funciona bien en evento corporativo.',
         array['es'], array['personajes','improvisación'], array['US.FL'],
         array[20, 40], v_nombres[8], 'chino@demo.comicomania.test', 'PENDING_REVIEW'
    from public.users where email = 'demo8@demo.comicomania.test';

  insert into public.booking_requests (client_company, contact_name, email, talent_id,
                                       event_type, event_date, city_id, budget_amount,
                                       currency, message, status)
  select 'DEMO · Grupo Hotelero Brickell', 'Ana Restrepo', 'ana@demo.comicomania.test',
         u.id, 'Cena de fin de año', (current_date + 90), v_miami, 3500, 'USD',
         'Buscamos 40 minutos para 200 personas, público mixto.', 'QUALIFIED'
    from public.users u where u.email = 'demo1@demo.comicomania.test';

  -- -------------------------------------------------------------------------
  -- Sponsors e inventario comercial.
  -- -------------------------------------------------------------------------
  insert into public.sponsors (company, category, contact_name, email, country_id, city_id,
                               status, owner_user_id)
  values ('DEMO · Cervecería La Tropical', 'Bebidas', 'Jorge Peña',
          'jorge@demo.comicomania.test', v_us, v_miami, 'ACTIVE', v_owner)
  returning id into v_sponsor;

  insert into public.sponsors (company, category, contact_name, email, country_id, status)
  values ('DEMO · Telecom Andina', 'Telecomunicaciones', 'Marta Gil',
          'marta@demo.comicomania.test', v_us, 'PROSPECT');

  insert into public.sponsor_contracts (sponsor_id, season_id, contest_id, value, currency,
                                        starts_at, ends_at, status)
  values (v_sponsor, v_temporada, v_concurso, 45000, 'USD',
          '2027-01-01', '2027-06-30', 'ACTIVE')
  returning id into v_contrato;

  insert into public.commercial_inventory (type, scope_type, scope_id, scope_path, season_id,
                                           contest_id, price, currency, exclusivity, status,
                                           sponsor_id, contract_id)
  values ('presenting', 'CITY', v_miami, v_miami_path, v_temporada, v_concurso,
          45000, 'USD', true, 'SOLD', v_sponsor, v_contrato)
  returning id into v_pieza;

  insert into public.commercial_inventory (type, scope_type, scope_id, scope_path, season_id,
                                           contest_id, price, currency, exclusivity, status)
  values
    ('naming_categoria', 'CITY', v_miami, v_miami_path, v_temporada, v_concurso, 12000, 'USD', true, 'AVAILABLE'),
    ('banner_home',      'CITY', v_miami, v_miami_path, v_temporada, v_concurso,  6000, 'USD', false, 'AVAILABLE'),
    ('escenario_final',  'CITY', v_miami, v_miami_path, v_temporada, v_concurso, 18000, 'USD', true, 'HELD');

  insert into public.sponsor_deliverables (contract_id, inventory_id, description, due_at, status,
                                           evidence_url, delivered_at)
  values (v_contrato, v_pieza, 'Logo en la landing del concurso',
          now() - interval '10 days', 'DELIVERED',
          'https://demo.comicomania.test/evidencia/landing.png', now() - interval '11 days');

  insert into public.sponsor_deliverables (contract_id, description, due_at, status)
  values (v_contrato, 'Mención en los 10 videos finalistas', now() - interval '2 days', 'IN_PROGRESS'),
         (v_contrato, 'Activación en la puerta del teatro', now() + interval '40 days', 'PENDING');

  insert into public.sponsor_metrics (contract_id, metric, value, unit, period_start, period_end,
                                      is_estimate, method)
  values (v_contrato, 'impresiones_landing', 18420, 'impresiones',
          current_date - 30, current_date, false, null),
         (v_contrato, 'alcance_estimado_redes', 52000, 'personas',
          current_date - 30, current_date, true,
          'Proyección sobre el promedio de alcance de los últimos 6 posts. NO es una medición.');

  -- -------------------------------------------------------------------------
  -- CRM: leads sin cuenta.
  -- -------------------------------------------------------------------------
  insert into public.crm_contacts (email, company, first_name, last_name, country_id, city_id,
                                   source, owner_user_id) values
    ('prensa@demo.comicomania.test', 'DEMO · El Nuevo Herald', 'Carolina', 'Vidal', v_us, v_miami, 'PRENSA', v_owner),
    ('eventos@demo.comicomania.test', 'DEMO · Fundación Cultural', 'Pedro', 'Lozano', v_us, v_miami, 'FORMULARIO', v_owner),
    ('marcas@demo.comicomania.test', 'DEMO · Agencia Mediática', 'Sofía', 'Arango', v_us, null, 'REFERIDO', v_owner);

  -- -------------------------------------------------------------------------
  -- Legal.
  -- -------------------------------------------------------------------------
  insert into public.legal_documents (slug, jurisdiction, type, name)
  values ('demo-bases-miami-2027', 'US', 'RULES', 'Bases COMICOMANÍA Miami 2027')
  returning id into v_doc;

  insert into public.legal_document_versions (document_id, version, body_md, status,
                                              effective_from, created_by)
  values (v_doc, 1,
    E'# Bases COMICOMANÍA Miami 2027\n\n'
    'Participan mayores de 18 años residentes en Florida.\n\n'
    'El video dura un máximo de 2 minutos y es material propio.\n\n'
    'Los votos fraudulentos se anulan. La decisión final es del comité.',
    'EFFECTIVE', now() - interval '15 days', v_owner)
  returning id into v_version;

  insert into public.release_acceptances (user_id, version_id, contest_id, locale, accepted_at)
  select p.user_id, v_version, v_concurso, 'es', p.registered_at
    from public.participants p where p.contest_id = v_concurso;

  -- -------------------------------------------------------------------------
  -- Trust & Safety: un reporte, y una apelación asignada a OTRA persona.
  -- -------------------------------------------------------------------------
  insert into public.trust_cases (type, reporter_user_id, object_type, description, status,
                                  priority, assignee_user_id, sla_due_at, created_at)
  select 'CONTENT', id, 'video',
         'El video usa una canción de fondo sin acreditar.', 'UNDER_REVIEW', 2,
         v_owner, now() + interval '1 day', now() - interval '2 days'
    from public.users where email = 'demo4@demo.comicomania.test';

  insert into public.trust_cases (type, object_type, description, status, priority,
                                  resolution, resolved_by, resolved_at, created_at)
  values ('USER', 'participant',
          'Sospecha de votos comprados en la clasificatoria.', 'RESOLVED', 1,
          'Se anularon 3 votos de la ráfaga. Sin descalificación.',
          v_owner, now() - interval '1 day', now() - interval '5 days')
  returning id into v_caso;

  -- La apelación queda SIN asignar: la base rechazaría asignarla a quien decidió.
  insert into public.trust_cases (type, description, status, priority, appeal_of, sla_due_at)
  values ('APPEAL', 'El participante apela la anulación de sus votos.',
          'OPEN', 2, v_caso, now() + interval '3 days');

  insert into public.trust_case_actions (case_id, action, actor_user_id, notes)
  values (v_caso, 'INVALIDAR_VOTOS', v_owner,
          'Tres votos del mismo ASN en cuatro minutos.');

  -- -------------------------------------------------------------------------
  -- Finanzas.
  -- -------------------------------------------------------------------------
  insert into public.financial_categories (kind, name, code) values
    ('EXPENSE', 'Producción de evento', 'DEMO-PROD'),
    ('EXPENSE', 'Marketing', 'DEMO-MKT');
  select id into v_cat_gasto from public.financial_categories where code = 'DEMO-PROD';

  insert into public.revenue_entries (source, order_id, amount, currency, fx_rate, tax, net,
                                      country_id, city_id, contest_id, event_id, season_id,
                                      cost_center, occurred_at)
  values ('STORE', v_orden, 28, 'USD', 1, 2.1, 25.9, v_us, v_miami, v_concurso, null,
          v_temporada, 'DEMO', now() - interval '3 days'),
         ('TICKETS', null, 1450, 'USD', 1, 108, 1342, v_us, v_miami, v_concurso, v_evento,
          v_temporada, 'DEMO', now() - interval '2 days'),
         ('SPONSORS', null, 45000, 'USD', 1, 0, 45000, v_us, v_miami, v_concurso, null,
          v_temporada, 'DEMO', now() - interval '20 days');

  insert into public.expenses (category_id, vendor, amount, currency, fx_rate, tax, description,
                               invoice_number, season_id, contest_id, event_id, country_id,
                               city_id, cost_center, payment_method, paid_at, created_by, approved_by)
  values (v_cat_gasto, 'DEMO · Teatro Martí', 4200, 'USD', 1, 0,
          'Alquiler de sala para la final', 'DEMO-0001', v_temporada, v_concurso, v_evento,
          v_us, v_miami, 'DEMO', 'transferencia', now() - interval '8 days', v_owner, v_owner),
         ((select id from public.financial_categories where code = 'DEMO-MKT'),
          'DEMO · Agencia Mediática', 1800, 'USD', 1, 0,
          'Campaña de inscripciones', 'DEMO-0002', v_temporada, v_concurso, null,
          v_us, v_miami, 'DEMO', 'tarjeta', now() - interval '18 days', v_owner, v_owner);

  -- -------------------------------------------------------------------------
  -- Analítica.
  -- -------------------------------------------------------------------------
  insert into public.metrics_daily (date, metric, country_id, city_id, scope_path, contest_id, value)
  select d::date, m.metric, v_us, v_miami, v_miami_path, v_concurso, m.base + (random() * m.ruido)::int
    from generate_series(current_date - 13, current_date, interval '1 day') d
    cross join (values
      ('registros', 4, 6),
      ('inscritos_concurso', 2, 4),
      ('videos_aprobados', 1, 2),
      ('votos_validos', 40, 60)
    ) as m(metric, base, ruido);

  raise notice 'Datos demo puestos.';
end;
$$;

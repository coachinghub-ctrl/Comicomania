-- ---------------------------------------------------------------------------
-- Demo, segunda tanda: lo que hace falta para que lo nuevo se vea funcionando.
--
--   · perfiles completos, para que los embudos avancen de verdad
--   · notas de tres jueces, para que el marcador tenga qué calcular
--   · una entrada a nombre del dueño, para poder abrir /mi/entradas
--   · un máster que se reproduce, para probar el reproductor de la cola
--
-- Mismas marcas de siempre, así que lo quita el mismo supabase/demo/quitar.sql.
-- ---------------------------------------------------------------------------

do $$
declare
  v_owner uuid; v_evento uuid; v_tipo uuid; v_ronda uuid; v_entry uuid;
  v_juez uuid; v_asig uuid; v_i int := 0; v_j int;
  v_persona record;
  v_jueces uuid[];
  v_video text := 'https://voxvnbynvrxxehnlllma.supabase.co/storage/v1/object/public/demo/video-prueba.mp4';
  v_lada text[] := array['+1305','+1305','+1786','+1786','+1305','+1954','+1786','+1305'];
  v_notas jsonb[] := array[
    '{"originalidad": 9,   "risa": 9.5, "presencia": 8,   "creatividad": 8.5, "conexion": 9}'::jsonb,
    '{"originalidad": 7.5, "risa": 8,   "presencia": 7,   "creatividad": 7.5, "conexion": 8}'::jsonb,
    '{"originalidad": 8.5, "risa": 7,   "presencia": 9,   "creatividad": 8,   "conexion": 7.5}'::jsonb
  ];
begin
  if not exists (select 1 from public.series where slug = 'demo-comicomania') then
    raise notice 'No hay datos demo que completar.';
    return;
  end if;

  select id into v_owner from public.users
   where email not like '%@demo.comicomania.test' order by created_at limit 1;

  -- -------------------------------------------------------------------------
  -- 1 · Perfiles completos. Al completarse, los triggers empujan los dos
  --     embudos solos: nadie mueve una tarjeta a mano.
  -- -------------------------------------------------------------------------
  for v_persona in
    select id, first_name, display_name from public.users
     where email like '%@demo.comicomania.test' order by email
  loop
    v_i := v_i + 1;
    update public.users
       set last_name = coalesce(nullif(last_name, ''),
             trim(substring(display_name from position(' ' in display_name)))),
           whatsapp  = v_lada[v_i] || lpad((5550100 + v_i)::text, 7, '0')
     where id = v_persona.id;
  end loop;

  -- -------------------------------------------------------------------------
  -- 2 · Un máster que de verdad se reproduce, para probar el reproductor.
  -- -------------------------------------------------------------------------
  update public.videos set master_url = v_video
   where contest_id in (select id from public.contests where slug like 'demo-%');

  -- -------------------------------------------------------------------------
  -- 3 · Tres jueces puntuando. Uno de los participantes queda a propósito con
  --     solo dos notas: así se ve que el marcador NO inventa un promedio y
  --     dice "incompleto" en vez de contar cero.
  -- -------------------------------------------------------------------------
  select id into v_ronda from public.rounds
   where contest_id in (select id from public.contests where slug like 'demo-%')
     and "order" = 1;

  select array_agg(id order by display_name) into v_jueces
    from public.judges
   where display_name in ('Rosa Iglesias', 'Kike Peralta', 'Dani Sotomayor');

  v_i := 0;
  for v_entry in
    select e.id from public.entries e
      join public.participants p on p.id = e.participant_id
     where e.round_id = v_ronda
     order by e.submitted_at
  loop
    v_i := v_i + 1;

    -- Al tercero lo puntúan solo dos jueces.
    for v_j in 1..(case when v_i = 3 then 2 else 3 end) loop
      v_juez := v_jueces[v_j];

      insert into public.judge_assignments (judge_id, round_id, entry_id, due_at, status)
      values (v_juez, v_ronda, v_entry, now() + interval '3 days', 'SUBMITTED')
      on conflict (judge_id, entry_id) do update set status = 'SUBMITTED'
      returning id into v_asig;

      insert into public.judge_scores (assignment_id, criteria_scores, comment,
                                       submitted_at, locked_at)
      values (v_asig,
              -- Se mueve un poco por participante para que el marcador no
              -- quede plano y se note el orden.
              (select jsonb_object_agg(k, greatest(1, least(10,
                 (v::numeric) - (v_i - 1) * 0.4 + (v_j - 2) * 0.3)))
                 from jsonb_each_text(v_notas[v_j]) as e(k, v)),
              case v_j when 1 then 'Material propio y buen remate.'
                       when 2 then 'Se le va el ritmo en el segundo bloque.'
                       else 'Muy buena presencia escénica.' end,
              now() - interval '2 days', now() - interval '2 days')
      on conflict (assignment_id) do nothing;
    end loop;
  end loop;

  -- -------------------------------------------------------------------------
  -- 4 · Una entrada a nombre del dueño, para poder abrir /mi/entradas.
  -- -------------------------------------------------------------------------
  select id into v_evento from public.events where slug like 'demo-%' limit 1;
  select id into v_tipo from public.ticket_types
   where event_id = v_evento and kind = 'VIP' limit 1;

  if v_owner is not null and v_evento is not null
     and not exists (select 1 from public.tickets where code = 'DEMO-T900') then
    insert into public.tickets (event_id, ticket_type_id, user_id, holder_name, code, status)
    select v_evento, v_tipo, v_owner,
           coalesce(u.display_name, u.email), 'DEMO-T900', 'VALID'
      from public.users u where u.id = v_owner;
  end if;

  raise notice 'Demo completado.';
end;
$$;

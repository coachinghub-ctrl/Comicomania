-- ---------------------------------------------------------------------------
-- La temporada es Miami 2026.
--
-- El concurso y la gala se llamaban "Miami 2027" y la final es el 7 de
-- noviembre de 2026. Un tercero lo encontró revisando el sitio, y con razón:
-- un nombre que no cuadra con su fecha hace dudar de todo lo demás.
--
-- Decisión del negocio: la temporada se llama por el año en que ocurre.
-- ---------------------------------------------------------------------------

update public.contests
   set name = replace(name, '2027', '2026'),
       slug = replace(slug, '2027', '2026')
 where name like '%2027%' or slug like '%2027%';

update public.events
   set name = replace(name, '2027', '2026'),
       slug = replace(slug, '2027', '2026')
 where name like '%2027%' or slug like '%2027%';

update public.seasons
   set name = replace(name, '2027', '2026')
 where name like '%2027%';

-- ---------------------------------------------------------------------------
-- Y las rondas que decían "por anunciar".
--
-- La página de participación mostraba semifinal y final sin fecha mientras el
-- home ya anunciaba el 7 de noviembre en el Kaseya Center. Las dos cosas eran
-- ciertas por separado y juntas se contradecían.
--
-- Se anclan a la fecha real del evento: la final es el día de la gala, y la
-- semifinal las dos semanas anteriores. Si cambia la gala, estas se recalculan
-- a mano — no se inventa una regla automática para dos filas.
-- ---------------------------------------------------------------------------
do $$
declare
  v_concurso uuid;
  v_gala timestamptz;
begin
  select c.id, e.starts_at into v_concurso, v_gala
    from public.contests c
    left join public.events e on e.contest_id = c.id
   where c.status = 'OPEN'
   order by e.starts_at nulls last
   limit 1;

  if v_concurso is null or v_gala is null then
    raise notice 'Sin concurso abierto con gala: no se tocan las rondas.';
    return;
  end if;

  update public.rounds
     set starts_at = v_gala - interval '21 days',
         ends_at   = v_gala - interval '7 days'
   where contest_id = v_concurso and name = 'Semifinal' and starts_at is null;

  update public.rounds
     set starts_at = v_gala,
         ends_at   = v_gala + interval '4 hours'
   where contest_id = v_concurso and name = 'Final' and starts_at is null;
end;
$$;

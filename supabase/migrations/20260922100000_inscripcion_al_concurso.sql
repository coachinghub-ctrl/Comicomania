-- ---------------------------------------------------------------------------
-- Las bases son de UN concurso.
--
-- Hasta ahora el concurso y su documento de bases no se conocían: existían
-- los dos, y nadie sabía cuál iba con cuál. Una aceptación tiene que apuntar
-- al texto concreto que esa persona leyó, así que el concurso tiene que
-- saber cuál es el suyo.
-- ---------------------------------------------------------------------------
alter table public.contests add column if not exists rules_document_id uuid
  references public.legal_documents(id) on delete restrict;

comment on column public.contests.rules_document_id is
  'Las bases de ESTE concurso. La aceptación apunta a una versión de este '
  'documento: "aceptó los términos" sin decir cuáles no sirve de nada.';

-- El concurso demo ya tenía sus bases escritas; se enlazan.
update public.contests c
   set rules_document_id = d.id
  from public.legal_documents d
 where d.type = 'RULES'
   and c.rules_document_id is null
   and d.slug = 'demo-bases-miami-2027'
   and c.slug = 'demo-miami-2027';

-- ---------------------------------------------------------------------------
-- Inscribirse a un concurso.
--
-- FALLO ENCONTRADO: nadie podía inscribirse. `participants` solo tenía
-- política de escritura para quien tiene PARTICIPANTS.EDIT, así que la única
-- forma de entrar a un concurso era que un administrador te metiera a mano.
-- El concurso llevaba semanas "abierto" sin puerta.
--
-- La puerta se abre como las otras de esta casa: una función SECURITY DEFINER
-- estrecha, no una política ancha. Una política de "cualquiera inserta en
-- participants" dejaría inscribir a otra persona, en un concurso cerrado, sin
-- edad y sin consentimiento.
--
-- Las tres cosas pasan JUNTAS o no pasa ninguna: inscripción, video y
-- aceptación de las bases. Un participante sin consentimiento registrado no
-- es un registro incompleto, es un agujero legal: su video se publica, se
-- distribuye y se monetiza sin que exista constancia de que lo permitió.
-- ---------------------------------------------------------------------------

create or replace function public.inscribirme_en_concurso(
  p_concurso    uuid,
  p_categoria   uuid,
  p_titulo      text,
  p_descripcion text,
  p_video_url   text,
  p_duracion    integer,
  p_aceptado    jsonb,
  p_user_agent  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yo          uuid := auth.uid();
  v_concurso    record;
  v_persona     record;
  v_categoria   record;
  v_edad        smallint;
  v_version     uuid;
  v_participante uuid;
  v_video       uuid;
begin
  if v_yo is null then
    raise exception 'Hay que entrar con tu cuenta para inscribirte.'
      using errcode = 'P0001';
  end if;

  select id, status, registration_opens_at, registration_closes_at,
         submission_deadline, age_reference_date, name
    into v_concurso
    from public.contests where id = p_concurso;

  if v_concurso.id is null then
    raise exception 'Ese concurso no existe.' using errcode = 'P0001';
  end if;

  if v_concurso.status <> 'OPEN' then
    raise exception 'Las inscripciones de % no están abiertas.', v_concurso.name
      using errcode = 'P0001';
  end if;

  if v_concurso.registration_opens_at is not null
     and now() < v_concurso.registration_opens_at then
    raise exception 'Las inscripciones todavía no abren.' using errcode = 'P0001';
  end if;

  if v_concurso.registration_closes_at is not null
     and now() > v_concurso.registration_closes_at then
    raise exception 'Las inscripciones ya cerraron.' using errcode = 'P0001';
  end if;

  /* El perfil completo no es burocracia: sin fecha de nacimiento no se puede
     congelar la edad, y sin edad no se puede decidir la categoría ni cumplir
     el mínimo legal. */
  select id, profile_complete, birth_date, first_name, last_name
    into v_persona
    from public.users where id = v_yo;

  if not coalesce(v_persona.profile_complete, false) then
    raise exception 'Completa tu perfil antes de inscribirte: faltan datos obligatorios.'
      using errcode = 'P0001';
  end if;

  if exists (select 1 from public.participants
              where user_id = v_yo and contest_id = p_concurso) then
    raise exception 'Ya estás inscrito en %.', v_concurso.name
      using errcode = 'P0001';
  end if;

  -- La edad, con la fecha de referencia del concurso: cumplir años durante el
  -- concurso no cambia de categoría a nadie.
  v_edad := extract(
    year from age(coalesce(v_concurso.age_reference_date, current_date),
                  v_persona.birth_date)
  )::smallint;

  if p_categoria is not null then
    select id, name, min_age, max_age into v_categoria
      from public.categories
     where id = p_categoria and contest_id = p_concurso;

    if v_categoria.id is null then
      raise exception 'Esa categoría no es de este concurso.' using errcode = 'P0001';
    end if;

    if v_categoria.min_age is not null and v_edad < v_categoria.min_age then
      raise exception 'Para % hay que tener % años cumplidos al cierre. Tú tienes %.',
        v_categoria.name, v_categoria.min_age, v_edad using errcode = 'P0001';
    end if;

    if v_categoria.max_age is not null and v_edad > v_categoria.max_age then
      raise exception 'La categoría % es hasta % años.',
        v_categoria.name, v_categoria.max_age using errcode = 'P0001';
    end if;
  end if;

  if coalesce(btrim(p_titulo), '') = '' then
    raise exception 'Ponle un título a tu video.' using errcode = 'P0001';
  end if;

  if p_video_url !~* '^https?://' then
    raise exception 'El video tiene que ser una dirección que empiece por https://.'
      using errcode = 'P0001';
  end if;

  /* Las bases vigentes del concurso. Si no hay bases publicadas no se puede
     aceptar nada, y entonces tampoco se puede competir: la aceptación apunta
     a una VERSIÓN concreta, porque "aceptó los términos" sin decir cuáles no
     sirve para nada el día que haya una discusión. */
  select v.id into v_version
    from public.legal_document_versions v
    join public.legal_documents d on d.id = v.document_id
   where d.type = 'RULES'
     and v.status = 'EFFECTIVE'
     and exists (
       select 1 from public.contests c
        where c.id = p_concurso and c.rules_document_id = d.id
     )
   order by v.version desc
   limit 1;

  if v_version is null then
    -- Sin bases enlazadas al concurso, se admite cualquier RULES vigente de
    -- la jurisdicción. Si tampoco hay, no hay inscripción.
    select v.id into v_version
      from public.legal_document_versions v
      join public.legal_documents d on d.id = v.document_id
     where d.type = 'RULES' and v.status = 'EFFECTIVE'
     order by v.version desc
     limit 1;
  end if;

  if v_version is null then
    raise exception 'Este concurso todavía no tiene bases publicadas, así que no se puede aceptar nada.'
      using errcode = 'P0001';
  end if;

  -- Las cuatro casillas son obligatorias, y se comprueban aquí y no solo en
  -- el formulario: un formulario se salta con una petición.
  if not (coalesce((p_aceptado->>'bases')::boolean, false)
          and coalesce((p_aceptado->>'material_propio')::boolean, false)
          and coalesce((p_aceptado->>'derechos')::boolean, false)
          and coalesce((p_aceptado->>'uso_de_imagen')::boolean, false)) then
    raise exception 'Falta aceptar las bases, la autoría, los derechos y el uso de imagen.'
      using errcode = 'P0001';
  end if;

  insert into public.participants (user_id, contest_id, category_id, status)
  values (v_yo, p_concurso, p_categoria, 'REGISTERED')
  returning id into v_participante;

  /* El video entra como ENVIADO con los derechos DECLARADOS, no aclarados:
     lo que acaba de pasar es que alguien dijo que el material es suyo, no que
     alguien lo haya comprobado. Eso lo hace la revisión. */
  insert into public.videos (user_id, contest_id, category_id, title, description,
                             master_url, duration_s, status, rights_status)
  values (v_yo, p_concurso, p_categoria, btrim(p_titulo),
          nullif(btrim(coalesce(p_descripcion, '')), ''),
          p_video_url, p_duracion, 'SUBMITTED', 'DECLARED')
  returning id into v_video;

  insert into public.release_acceptances (user_id, version_id, participant_id,
                                          video_id, contest_id,
                                          accepted_checkboxes, user_agent, locale)
  values (v_yo, v_version, v_participante, v_video, p_concurso,
          p_aceptado, p_user_agent, 'es');

  return jsonb_build_object(
    'participante', v_participante,
    'video', v_video,
    'edad', v_edad,
    'categoria', coalesce(v_categoria.name, 'sin categoría')
  );
end;
$$;

revoke all on function public.inscribirme_en_concurso(
  uuid, uuid, text, text, text, integer, jsonb, text) from public;
grant execute on function public.inscribirme_en_concurso(
  uuid, uuid, text, text, text, integer, jsonb, text) to authenticated;

comment on function public.inscribirme_en_concurso is
  'La única puerta por la que alguien se inscribe a sí mismo. Inscripción, '
  'video y aceptación de bases ocurren en la misma transacción: un '
  'participante sin consentimiento registrado es un agujero legal, no un '
  'registro a medias.';

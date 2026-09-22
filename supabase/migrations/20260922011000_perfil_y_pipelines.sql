-- ---------------------------------------------------------------------------
-- Perfil obligatorio, foto, y los dos embudos del CRM.
--
-- Tres cosas que van juntas porque se alimentan entre sí:
--
--   1. El perfil deja de ser opcional. Sin país, ciudad, nombre, fecha de
--      nacimiento y WhatsApp no se puede segmentar, ni saber en qué categoría
--      cae alguien, ni avisarle que pasó a semifinal.
--   2. La foto convierte la ficha en un perfil de red social, que es lo que
--      hace que alguien vuelva a consumir humor y no solo a concursar.
--   3. Dos embudos separados: AUDIENCIA (consume) y CONCURSANTES (compite).
--      Una misma persona puede estar en los dos a la vez, y eso está bien:
--      son dos relaciones distintas con la plataforma. Mezclarlas haría que
--      "conversión" no signifique nada.
--
-- Las oportunidades se crean SOLAS con lo que la persona hace. Si hubiera que
-- crearlas a mano, el embudo estaría vacío la semana dos.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1 · Los datos que ahora se piden.
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists whatsapp text;

comment on column public.users.whatsapp is
  'Número de WhatsApp en formato internacional. Se guarda aparte de `phone` '
  'porque mucha gente usa un número distinto para WhatsApp, y es el canal por '
  'el que de verdad se entera de que pasó a semifinal.';

-- Formato internacional o nada. Un número sin prefijo de país no sirve para
-- escribir a alguien en otro país, que es medio público de esta plataforma.
alter table public.users drop constraint if exists users_whatsapp_formato;
alter table public.users add constraint users_whatsapp_formato
  check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{6,14}$');

/* Edad mínima 13 años para tener cuenta. Es el piso de COPPA en EE. UU.: por
   debajo de 13 no se pueden recoger datos sin consentimiento parental
   verificable, y ese flujo no existe. Concursar sigue siendo desde 18, que es
   otra regla y vive en las categorías del concurso.

   Ojo: el RGPD europeo usa 16 por defecto. El día que se abra España hay que
   revisar esto. */
alter table public.users drop constraint if exists users_edad_minima;
alter table public.users add constraint users_edad_minima
  check (
    birth_date is null
    or birth_date <= (current_date - interval '13 years')::date
  );

/* Qué significa "perfil completo" lo decide la base, no cada pantalla. Si lo
   calculara la aplicación, el formulario y el CRM acabarían discrepando sobre
   quién está completo. */
alter table public.users drop column if exists profile_complete;
alter table public.users add column profile_complete boolean
  generated always as (
    first_name is not null and length(trim(first_name)) > 0
    and last_name  is not null and length(trim(last_name))  > 0
    and country_id is not null
    and city_id    is not null
    and birth_date is not null
    and whatsapp   is not null
  ) stored;

create index if not exists users_perfil_incompleto
  on public.users (profile_complete) where profile_complete = false;

-- ---------------------------------------------------------------------------
-- 2 · Foto de perfil.
--
-- Bucket público: una foto de perfil que hay que firmar para mostrar no sirve
-- en un muro ni en una ficha pública. Lo que se protege es quién puede
-- ESCRIBIR, y cada quien solo escribe dentro de su propia carpeta.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3 · Los dos embudos.
-- ---------------------------------------------------------------------------

-- El de participantes ya existía con otro nombre; se reemplaza por los dos
-- definitivos sin perder oportunidades: se reasignan al nuevo.
insert into public.crm_pipelines (slug, name, entity_type) values
  ('audiencia',    'Audiencia',    'AUDIENCE'),
  ('concursantes', 'Concursantes', 'CONTESTANT')
on conflict (slug) do nothing;

-- Audiencia: de curioso a cliente.
insert into public.crm_stages (pipeline_id, name, "order", probability, sla_hours)
select p.id, e.name, e.orden, e.prob, e.sla
  from public.crm_pipelines p,
       (values
         ('Registrado',      1::smallint, 10::smallint, null::integer),
         ('Perfil completo', 2,           25,           72),
         ('Consumió',        3,           45,           null),
         ('Votó',            4,           65,           null),
         ('Recurrente',      5,           80,           null),
         ('Compró',          6,          100,           null)
       ) as e(name, orden, prob, sla)
 where p.slug = 'audiencia'
   and not exists (select 1 from public.crm_stages s where s.pipeline_id = p.id);

-- Concursantes: incluye "Interesado", que es quien dijo que quiere concursar
-- pero todavía no se inscribió. Sin esa etapa no hay a quién perseguir.
insert into public.crm_stages (pipeline_id, name, "order", probability, sla_hours)
select p.id, e.name, e.orden, e.prob, e.sla
  from public.crm_pipelines p,
       (values
         ('Interesado',      1::smallint,  10::smallint, 48::integer),
         ('Registrado',      2,            25,           null),
         ('Perfil completo', 3,            40,           72),
         ('Inscrito',        4,            60,           null),
         ('Video subido',    5,            80,           null),
         ('Video aprobado',  6,            95,           null),
         ('Compitiendo',     7,           100,           null)
       ) as e(name, orden, prob, sla)
 where p.slug = 'concursantes'
   and not exists (select 1 from public.crm_stages s where s.pipeline_id = p.id);

-- ---------------------------------------------------------------------------
-- 4 · Mover a alguien de etapa.
--
-- Una sola función para los dos embudos. Nunca RETROCEDE: si alguien ya votó,
-- que vuelva a completar su perfil no lo devuelve a la casilla 2. Un embudo
-- que retrocede solo miente sobre el avance.
-- ---------------------------------------------------------------------------
create or replace function public.mover_en_embudo(
  p_user_id  uuid,
  p_pipeline text,
  p_etapa    text,
  p_titulo   text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacto uuid;
  v_pipeline uuid;
  v_etapa    uuid;
  v_orden    smallint;
  v_oport    uuid;
  v_orden_actual smallint;
begin
  select id into v_contacto from public.crm_contacts where user_id = p_user_id;
  if v_contacto is null then
    return;  -- sin ficha de CRM no hay embudo; el trigger de alta la crea
  end if;

  select id into v_pipeline from public.crm_pipelines where slug = p_pipeline;
  if v_pipeline is null then return; end if;

  select id, "order" into v_etapa, v_orden
    from public.crm_stages where pipeline_id = v_pipeline and name = p_etapa;
  if v_etapa is null then return; end if;

  select o.id, s."order" into v_oport, v_orden_actual
    from public.crm_opportunities o
    join public.crm_stages s on s.id = o.stage_id
   where o.contact_id = v_contacto and o.pipeline_id = v_pipeline
   limit 1;

  if v_oport is null then
    insert into public.crm_opportunities (pipeline_id, stage_id, contact_id, title, status)
    values (v_pipeline, v_etapa, v_contacto,
            coalesce(p_titulo,
              (select coalesce(u.display_name, u.email) from public.users u where u.id = p_user_id)),
            'OPEN');
  elsif v_orden > v_orden_actual then
    update public.crm_opportunities
       set stage_id = v_etapa, updated_at = now()
     where id = v_oport;
  end if;
end;
$$;

revoke all on function public.mover_en_embudo(uuid, text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5 · Lo que mueve los embudos solo.
-- ---------------------------------------------------------------------------

-- Al nacer la cuenta: entra en Audiencia.
create or replace function public.embudo_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mover_en_embudo(new.id, 'audiencia', 'Registrado');
  return new;
end;
$$;

drop trigger if exists users_embudo_alta on public.users;
create trigger users_embudo_alta
  after insert on public.users
  for each row execute function public.embudo_al_registrarse();

-- Al completar el perfil: avanza en los dos embudos donde esté.
create or replace function public.embudo_al_completar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_complete and not coalesce(old.profile_complete, false) then
    perform public.mover_en_embudo(new.id, 'audiencia', 'Perfil completo');
    perform public.mover_en_embudo(new.id, 'concursantes', 'Perfil completo');

    insert into public.domain_events (name, payload, user_id)
    values ('perfil.completado', jsonb_build_object('email', new.email), new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists users_embudo_perfil on public.users;
create trigger users_embudo_perfil
  after update on public.users
  for each row execute function public.embudo_al_completar_perfil();

-- Al inscribirse a un concurso: entra en Concursantes.
create or replace function public.embudo_al_inscribirse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mover_en_embudo(new.user_id, 'concursantes', 'Inscrito');

  insert into public.domain_events (name, payload, user_id)
  values ('concurso.inscripcion', jsonb_build_object('contest_id', new.contest_id), new.user_id);
  return new;
end;
$$;

drop trigger if exists participants_embudo on public.participants;
create trigger participants_embudo
  after insert on public.participants
  for each row execute function public.embudo_al_inscribirse();

-- Al subir y al aprobar un video.
create or replace function public.embudo_por_video()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.mover_en_embudo(new.user_id, 'concursantes', 'Video subido');
  elsif new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then
    perform public.mover_en_embudo(new.user_id, 'concursantes', 'Video aprobado');
  end if;
  return new;
end;
$$;

drop trigger if exists videos_embudo on public.videos;
create trigger videos_embudo
  after insert or update of status on public.videos
  for each row execute function public.embudo_por_video();

-- Al votar: la audiencia avanza. Es la señal más honesta de que alguien
-- consume de verdad y no solo pasó por la landing.
create or replace function public.embudo_al_votar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mover_en_embudo(new.user_id, 'audiencia', 'Votó');
  return new;
end;
$$;

drop trigger if exists votes_embudo on public.votes;
create trigger votes_embudo
  after insert on public.votes
  for each row execute function public.embudo_al_votar();

-- Al pagar una orden.
create or replace function public.embudo_al_comprar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'PAID' and old.status is distinct from 'PAID' then
    perform public.mover_en_embudo(new.user_id, 'audiencia', 'Compró');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_embudo on public.orders;
create trigger orders_embudo
  after update of status on public.orders
  for each row execute function public.embudo_al_comprar();

-- ---------------------------------------------------------------------------
-- 6 · Retroactivo. Las cuentas que ya existen también tienen que caer en su
--     embudo: un trigger que solo mira hacia adelante deja fuera a los de
--     ayer, y nadie sabe cuáles son.
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select id from public.users loop
    perform public.mover_en_embudo(r.id, 'audiencia', 'Registrado');
  end loop;

  for r in select id from public.users where profile_complete loop
    perform public.mover_en_embudo(r.id, 'audiencia', 'Perfil completo');
    perform public.mover_en_embudo(r.id, 'concursantes', 'Perfil completo');
  end loop;

  for r in select distinct user_id as id from public.participants loop
    perform public.mover_en_embudo(r.id, 'concursantes', 'Inscrito');
  end loop;

  for r in select distinct user_id as id from public.videos loop
    perform public.mover_en_embudo(r.id, 'concursantes', 'Video subido');
  end loop;

  for r in select distinct user_id as id from public.videos where status in ('APPROVED','PUBLISHED') loop
    perform public.mover_en_embudo(r.id, 'concursantes', 'Video aprobado');
  end loop;

  for r in select distinct user_id as id from public.votes loop
    perform public.mover_en_embudo(r.id, 'audiencia', 'Votó');
  end loop;

  for r in select distinct user_id as id from public.orders where status in ('PAID','COMPLETED') loop
    perform public.mover_en_embudo(r.id, 'audiencia', 'Compró');
  end loop;
end;
$$;

-- El embudo viejo queda vacío: sus oportunidades ya viven en los nuevos.
delete from public.crm_opportunities
 where pipeline_id in (select id from public.crm_pipelines where slug = 'participantes');
delete from public.crm_stages
 where pipeline_id in (select id from public.crm_pipelines where slug = 'participantes');
delete from public.crm_pipelines where slug = 'participantes';

-- ---------------------------------------------------------------------------
-- El repertorio de humoristas.
--
-- Hasta ahora una ficha de talento tenía datos de contratación pero nada que
-- mirar. Y a un humorista no lo contratan por su ficha: lo contratan porque
-- alguien vio dos minutos suyos y se rió.
--
-- Así que la ficha necesita tres cosas que no tenía: una foto, un video y una
-- dirección propia donde vivir.
-- ---------------------------------------------------------------------------

alter table public.talent_profiles add column if not exists handle        text;
alter table public.talent_profiles add column if not exists tagline       text;
alter table public.talent_profiles add column if not exists photo_url     text;
alter table public.talent_profiles add column if not exists photo_alt     text;
alter table public.talent_profiles add column if not exists reel_url      text;
alter table public.talent_profiles add column if not exists reel_title    text;
alter table public.talent_profiles add column if not exists display_order smallint not null default 100;

comment on column public.talent_profiles.reel_url is
  'El video de presentación. Es lo que de verdad contrata: nadie reserva a un '
  'humorista por leerle la biografía.';

comment on column public.talent_profiles.handle is
  'La dirección de su ficha: /humoristas/<handle>. Separado del handle de la '
  'cuenta porque el nombre artístico y el de usuario no tienen por qué '
  'coincidir, y el artístico es el que se enseña.';

-- Minúsculas, sin acentos ni espacios: va dentro de una URL.
alter table public.talent_profiles drop constraint if exists talent_handle_formato;
alter table public.talent_profiles add constraint talent_handle_formato
  check (handle is null or handle ~ '^[a-z0-9][a-z0-9_-]{2,39}$');

create unique index if not exists talent_handle_unico
  on public.talent_profiles (handle) where handle is not null;

create index if not exists talent_repertorio
  on public.talent_profiles (display_order, stage_name)
  where public_visible;

-- ---------------------------------------------------------------------------
-- Fichas de ejemplo, para que el repertorio no nazca vacío.
--
-- Van ANTES de la restricción nueva a propósito: 'La Ferrer' ya estaba
-- publicada sin foto ni video, y la restricción la rechazaría.
--
-- Las fotos son imágenes de escenario del propio sitio, no retratos reales.
-- Es un mockup y se nota, que es justo lo que debe pasar con un dato demo.
-- Todo esto cuelga de cuentas @demo.comicomania.test, así que se lo lleva
-- supabase/demo/quitar.sql con el resto.
-- ---------------------------------------------------------------------------
do $$
declare
  v_video text := 'https://voxvnbynvrxxehnlllma.supabase.co/storage/v1/object/public/demo/video-prueba.mp4';

  -- apodo, handle, frase, foto, alt, título del video, orden
  v_fichas text[][] := array[
    array['La Ferrer', 'la-ferrer',
          'Observacional, cero filtro, mucho barrio.',
          '/hero/escenario.webp', 'La Ferrer en el escenario, micrófono en mano',
          'Cinco minutos en el Teatro Martí', '1'],
    array['El Chino', 'el-chino',
          'Personajes y voces. Funciona en corporativo.',
          '/hero/live.webp', 'El Chino durante un show en vivo',
          'Set corporativo de veinte minutos', '2'],
    array['Kelly Sin Filtro', 'kelly-sin-filtro',
          'Veinte años y ya dice lo que los demás piensan.',
          '/hero/publico.webp', 'Kelly Sin Filtro frente al público',
          'Micrófono abierto en Wynwood', '3'],
    array['Beto Bravo', 'beto-bravo',
          'Tres décadas de oficio. El remate le sale sin mirar.',
          '/hero/talent.webp', 'Beto Bravo bajo la luz del escenario',
          'Cierre de gala, 2025', '4']
  ];
  v_f text[];
  v_id uuid;
begin
  foreach v_f slice 1 in array v_fichas loop
    select user_id into v_id
      from public.talent_profiles
     where stage_name = v_f[1];

    -- Las dos que faltan cuelgan de cuentas demo que sí existen.
    if v_id is null then
      select u.id into v_id
        from public.users u
       where u.email = case v_f[1]
               when 'Kelly Sin Filtro' then 'demo3@demo.comicomania.test'
               when 'Beto Bravo'       then 'demo6@demo.comicomania.test'
             end;
      if v_id is null then continue; end if;

      insert into public.talent_profiles (user_id, stage_name, bio, languages,
                                          comedy_styles, markets, set_durations,
                                          booking_contact, status)
      values (v_id, v_f[1],
              case v_f[1]
                when 'Kelly Sin Filtro' then
                  'Empezó a los diecisiete en un micrófono abierto de Miami y '
                  'no ha parado. Su material sale de la familia, del trabajo de '
                  'camarera y de todo lo que nadie dice en voz alta.'
                else
                  'Treinta años de tablas entre Caracas, Bogotá y Miami. '
                  'Abrió para los grandes, cerró galas y sigue probando '
                  'material nuevo un martes cualquiera.'
              end,
              array['es'], array['stand-up'], array['US.FL'], array[20, 40],
              'booking@demo.comicomania.test', 'ACTIVE');
    end if;

    update public.talent_profiles
       set handle        = v_f[2],
           tagline       = v_f[3],
           photo_url     = v_f[4],
           photo_alt     = v_f[5],
           reel_url      = v_video,
           reel_title    = v_f[6],
           display_order = v_f[7]::smallint,
           status        = 'ACTIVE',
           public_visible = true
     where user_id = v_id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lo que hace falta para poder publicar una ficha.
--
-- Una ficha pública sin foto, sin video y sin biografía es una entrada de
-- listín telefónico. El repertorio existe para que alguien mire y decida, y
-- una lista de nombres no sirve para decidir nada.
--
-- Esto es una regla, no un aviso en el formulario: la base rechaza publicar
-- una ficha a medias, venga de donde venga la escritura.
-- ---------------------------------------------------------------------------

-- Si quedó alguna ficha publicada sin material, deja de estarlo. Es preferible
-- a que la migración falle y a que el repertorio enseñe fichas vacías.
update public.talent_profiles
   set public_visible = false
 where public_visible
   and (handle is null or photo_url is null or reel_url is null
        or bio is null or length(btrim(bio)) < 40);

alter table public.talent_profiles drop constraint if exists visible_exige_activo;
alter table public.talent_profiles drop constraint if exists visible_exige_ficha_completa;
alter table public.talent_profiles add constraint visible_exige_ficha_completa
  check (
    not public_visible
    or (status = 'ACTIVE'
        and handle    is not null
        and photo_url is not null
        and reel_url  is not null
        and bio       is not null
        and length(btrim(bio)) >= 40)
  );

-- ---------------------------------------------------------------------------
-- Las columnas públicas, otra vez por permiso de columna.
--
-- La foto, el video y la bio son el escaparate y salen. El nombre legal y el
-- contacto de contratación se quedan dentro: publicar el repertorio no puede
-- equivaler a publicar el teléfono de cada humorista.
-- ---------------------------------------------------------------------------
revoke select on public.talent_profiles from anon, authenticated;

grant select (
  user_id, stage_name, bio, languages, comedy_styles, markets,
  travel_availability, set_durations, technical_rider, media_kit_url,
  manager_id, representation, status, public_visible, created_at, updated_at,
  handle, tagline, photo_url, photo_alt, reel_url, reel_title, display_order
) on public.talent_profiles to anon, authenticated;

grant insert, update, delete on public.talent_profiles to authenticated;

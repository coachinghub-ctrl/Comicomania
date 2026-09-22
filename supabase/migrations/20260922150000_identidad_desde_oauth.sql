-- ---------------------------------------------------------------------------
-- Quién eres cuando entras con Google, Apple o Microsoft.
--
-- El disparador que crea el COMICOMANIA ID solo miraba 'display_name', que es
-- lo que manda el enlace por correo. Los proveedores mandan otra cosa:
--
--   Google     → full_name, name, given_name, family_name, picture, avatar_url
--   Microsoft  → name, email
--   Apple      → full_name, y SOLO la primera vez que autorizas
--
-- Sin esto, quien entra con Google aparece llamándose como el trozo de su
-- correo antes de la arroba, y el perfil obligatorio le pide el nombre y el
-- apellido que el proveedor ya había dado.
--
-- Lo de Apple no es un detalle menor: si alguien autoriza, borra su cuenta y
-- vuelve, Apple ya no manda el nombre nunca más. Por eso se guarda la primera
-- vez y no se vuelve a pisar.
-- ---------------------------------------------------------------------------

/* De los muchos nombres que usan los proveedores, uno. El orden es el de
   fiabilidad: full_name lo mandan Google y Apple ya compuesto; name lo manda
   Microsoft; given_name + family_name es el plan B de Google. */
create or replace function public.nombre_desde_metadatos(p_meta jsonb)
returns text
language sql
immutable
as $$
  select nullif(btrim(coalesce(
    p_meta->>'full_name',
    p_meta->>'name',
    nullif(btrim(coalesce(p_meta->>'given_name', '') || ' ' ||
                 coalesce(p_meta->>'family_name', '')), ''),
    p_meta->>'display_name'
  )), '');
$$;

create or replace function public.avatar_desde_metadatos(p_meta jsonb)
returns text
language sql
immutable
as $$
  -- Google manda las dos; Microsoft ninguna; Apple nunca.
  select nullif(btrim(coalesce(p_meta->>'avatar_url', p_meta->>'picture')), '');
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type_id  uuid;
  v_level_id uuid;
  v_nombre   text;
  v_avatar   text;
  v_pila     text;
  v_apellido text;
begin
  v_nombre := public.nombre_desde_metadatos(new.raw_user_meta_data);
  v_avatar := public.avatar_desde_metadatos(new.raw_user_meta_data);

  /* Partir un nombre completo en dos es una heurística, no una verdad: hay
     quien tiene dos apellidos y quien tiene tres nombres. Se hace de todos
     modos porque el perfil pide los dos campos, y llegar con "Ana" y "Ruiz
     Peña" puestos es mejor que llegar con los dos vacíos. La persona puede
     corregirlo en su perfil, que es donde manda. */
  if v_nombre is not null and position(' ' in v_nombre) > 0 then
    v_pila     := split_part(v_nombre, ' ', 1);
    v_apellido := btrim(substr(v_nombre, position(' ' in v_nombre) + 1));
  else
    v_pila := v_nombre;
  end if;

  insert into public.users (id, email, email_verified_at, display_name,
                            first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    new.email_confirmed_at,
    coalesce(v_nombre, split_part(new.email, '@', 1)),
    v_pila,
    v_apellido,
    v_avatar
  )
  on conflict (id) do nothing;

  select id into v_type_id  from public.user_types  where slug = 'ESPECTADOR';
  select id into v_level_id from public.user_levels where slug = 'MEMBER';

  if v_type_id is not null then
    insert into public.user_type_assignments (user_id, user_type_id, source)
    values (new.id, v_type_id, 'SIGNUP')
    on conflict do nothing;
  end if;

  if v_level_id is not null then
    insert into public.user_level_assignments (user_id, user_level_id, reason)
    values (new.id, v_level_id, 'Alta de cuenta');
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Y la vuelta atrás, que va en la misma entrega que el disparador.
--
-- Quien ya tenía cuenta no vuelve a nacer, así que su fila no se enriquece
-- sola. Esto la rellena UNA vez, y solo donde está vacía: lo que una persona
-- escribió a mano en su perfil manda sobre lo que diga un proveedor.
-- ---------------------------------------------------------------------------
update public.users u
   set first_name = coalesce(u.first_name,
         case when position(' ' in public.nombre_desde_metadatos(a.raw_user_meta_data)) > 0
              then split_part(public.nombre_desde_metadatos(a.raw_user_meta_data), ' ', 1)
              else public.nombre_desde_metadatos(a.raw_user_meta_data) end),
       last_name  = coalesce(u.last_name,
         case when position(' ' in public.nombre_desde_metadatos(a.raw_user_meta_data)) > 0
              then btrim(substr(public.nombre_desde_metadatos(a.raw_user_meta_data),
                   position(' ' in public.nombre_desde_metadatos(a.raw_user_meta_data)) + 1))
         end),
       avatar_url = coalesce(u.avatar_url, public.avatar_desde_metadatos(a.raw_user_meta_data)),
       display_name = case
         when u.display_name is null
           or u.display_name = split_part(u.email, '@', 1)
         then coalesce(public.nombre_desde_metadatos(a.raw_user_meta_data), u.display_name)
         else u.display_name
       end
  from auth.users a
 where a.id = u.id
   and public.nombre_desde_metadatos(a.raw_user_meta_data) is not null
   and (u.first_name is null or u.avatar_url is null);

comment on function public.nombre_desde_metadatos is
  'El nombre que manda el proveedor de identidad, se llame como se llame el '
  'campo. Google usa full_name, Microsoft name, Apple full_name y solo la '
  'primera vez que autorizas.';

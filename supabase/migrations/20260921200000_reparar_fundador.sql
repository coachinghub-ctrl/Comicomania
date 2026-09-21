-- ---------------------------------------------------------------------------
-- El arranque del fundador tenía un agujero: solo corría DENTRO del trigger de
-- alta. Si la cuenta ya existía cuando se instaló el trigger, o si el trigger
-- salió temprano por algo que faltaba, no había forma de volver a intentarlo
-- salvo borrando la cuenta.
--
-- Acá se saca la lógica del trigger a una función normal, de modo que se pueda
-- invocar sobre cuentas que ya existen. Es idempotente: si el grant ya está,
-- no hace nada.
--
-- Al final se aplica al fundador. Si no se puede, la migración falla con el
-- diagnóstico completo en el mensaje: una migración que falla no deja nada a
-- medias, y el error dice exactamente qué pieza faltaba.
-- ---------------------------------------------------------------------------

create or replace function public.aplicar_acceso_fundador(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_fundador text;
  v_email_usuario  text;
  v_rol_owner      uuid;
  v_tipo_owner     uuid;
begin
  select value #>> '{}' into v_email_fundador
    from public.settings
   where key = 'owner_email' and scope_type = 'GLOBAL';

  if v_email_fundador is null then
    return 'sin settings.owner_email';
  end if;

  select email into v_email_usuario from public.users where id = p_user_id;
  if v_email_usuario is null then
    return 'el usuario no existe';
  end if;

  if lower(v_email_usuario) <> lower(v_email_fundador) then
    return 'no es el fundador';
  end if;

  select id into v_rol_owner from public.roles where slug = 'OWNER';
  if v_rol_owner is null then
    return 'no existe el rol OWNER';
  end if;

  -- Un solo grant de fundador, aunque la cuenta se borre y se vuelva a crear.
  if exists (
    select 1 from public.access_grants
     where user_id = p_user_id and role_id = v_rol_owner and scope_type = 'GLOBAL'
  ) then
    return 'ya tenía el grant';
  end if;

  insert into public.access_grants (
    user_id, role_id, scope_type, scope_id, scope_path,
    sections, actions, finance_level, reason
  )
  select p_user_id, r.id, 'GLOBAL', null, null,
         r.default_sections, r.default_actions, 'GLOBAL',
         'Fundador: grant de arranque desde settings.owner_email'
    from public.roles r
   where r.id = v_rol_owner;

  select id into v_tipo_owner from public.user_types where slug = 'BUSINESS_OWNER';
  if v_tipo_owner is not null then
    insert into public.user_type_assignments (user_id, user_type_id, source)
    values (p_user_id, v_tipo_owner, 'BOOTSTRAP')
    on conflict do nothing;
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, scope_type, section, action,
    object_type, object_id, new_value, result
  )
  values (
    p_user_id, 'OWNER', 'GLOBAL', 'ACCESS_CONTROL', 'CREATE',
    'access_grant', p_user_id::text,
    jsonb_build_object('motivo', 'arranque del fundador', 'email', v_email_usuario),
    'ALLOWED'
  );

  return 'grant creado';
end;
$$;

revoke all on function public.aplicar_acceso_fundador(uuid) from public, anon, authenticated;

-- El trigger de alta ahora solo delega: una sola copia de la lógica.
create or replace function public.otorgar_acceso_fundador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.aplicar_acceso_fundador(new.id);
  return new;
end;
$$;

-- Aplicarlo a la cuenta del fundador si ya existe.
do $$
declare
  v_email     text;
  v_user      uuid;
  v_resultado text;
  v_roles     int;
  v_usuarios  int;
  v_grants    int;
begin
  select value #>> '{}' into v_email
    from public.settings where key = 'owner_email' and scope_type = 'GLOBAL';

  select count(*) into v_roles    from public.roles;
  select count(*) into v_usuarios from public.users;
  select count(*) into v_grants   from public.access_grants;

  select id into v_user from public.users where lower(email) = lower(coalesce(v_email, ''));

  if v_user is null then
    -- Todavía no hay cuenta: el trigger lo hará al registrarse. No es un error.
    raise notice 'Fundador aún sin cuenta. roles=%, usuarios=%, grants=%',
      v_roles, v_usuarios, v_grants;
    return;
  end if;

  v_resultado := public.aplicar_acceso_fundador(v_user);

  if v_resultado not in ('grant creado', 'ya tenía el grant') then
    raise exception
      'No se pudo otorgar el acceso de fundador: %. owner_email=%, roles=%, usuarios=%, grants=%',
      v_resultado, coalesce(v_email, '(nulo)'), v_roles, v_usuarios, v_grants;
  end if;

  raise notice 'Fundador %: %. roles=%, usuarios=%, grants=%',
    v_email, v_resultado, v_roles, v_usuarios, v_grants;
end;
$$;

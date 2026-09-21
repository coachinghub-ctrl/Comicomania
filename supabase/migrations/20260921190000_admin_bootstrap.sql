-- Arranque del Admin Control Center.
--
-- Dos cosas que el sistema necesita para poder administrarse a sí mismo:
-- que alguien sea dueño desde el primer día, y que quien tenga permiso
-- pueda ver usuarios de SU territorio y solo de ese.

-- ---------------------------------------------------------------------------
-- El problema del huevo y la gallina: ACCESS_CONTROL.MANAGE solo lo puede
-- otorgar quien ya lo tiene, así que el primer dueño no puede nacer de un
-- grant. Nace de acá: el email del fundador queda en settings y, cuando esa
-- persona se registra, recibe el grant GLOBAL de OWNER automáticamente.
-- ---------------------------------------------------------------------------
-- La tabla de settings estaba en el ERD pero ninguna migración la había
-- creado todavía. Nace acá, que es donde primero hace falta.
create table if not exists public.settings (
  id          uuid primary key default public.uuid_generate_v7(),
  key         text not null,
  scope_type  public.scope_type not null default 'GLOBAL',
  scope_id    uuid,
  value       jsonb not null,
  updated_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Dos índices y no uno: en Postgres los NULL no chocan entre sí, así que un
-- único índice sobre (key, scope_type, scope_id) dejaría meter el mismo
-- ajuste global dos veces.
create unique index if not exists settings_scope_unico
  on public.settings (key, scope_type, scope_id) where scope_id is not null;
create unique index if not exists settings_global_unico
  on public.settings (key, scope_type) where scope_id is null;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;
create policy "ajustes visibles con permiso" on public.settings
  for select using (public.has_permission('SETTINGS', 'VIEW'));
create policy "ajustes editables con permiso" on public.settings
  for all using (public.has_permission('SETTINGS', 'CONFIGURE'))
  with check (public.has_permission('SETTINGS', 'CONFIGURE'));

insert into public.settings (key, scope_type, value)
select 'owner_email', 'GLOBAL', to_jsonb('servio@btlnetwork.com'::text)
 where not exists (
   select 1 from public.settings where key = 'owner_email' and scope_type = 'GLOBAL'
 );

create or replace function public.otorgar_acceso_fundador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_fundador text;
  v_rol_owner uuid;
  v_tipo_owner uuid;
begin
  select value #>> '{}' into v_email_fundador
    from public.settings
   where key = 'owner_email' and scope_type = 'GLOBAL';

  if v_email_fundador is null or lower(new.email) <> lower(v_email_fundador) then
    return new;
  end if;

  select id into v_rol_owner from public.roles where slug = 'OWNER';
  if v_rol_owner is null then
    return new;
  end if;

  -- Un solo grant de fundador, aunque la cuenta se borre y se vuelva a crear.
  if exists (
    select 1 from public.access_grants
     where user_id = new.id and role_id = v_rol_owner and scope_type = 'GLOBAL'
  ) then
    return new;
  end if;

  insert into public.access_grants (
    user_id, role_id, scope_type, scope_id, scope_path,
    sections, actions, finance_level, reason
  )
  select new.id, r.id, 'GLOBAL', null, null,
         r.default_sections, r.default_actions, 'GLOBAL',
         'Fundador: grant de arranque desde settings.owner_email'
    from public.roles r
   where r.id = v_rol_owner;

  select id into v_tipo_owner from public.user_types where slug = 'BUSINESS_OWNER';
  if v_tipo_owner is not null then
    insert into public.user_type_assignments (user_id, user_type_id, source)
    values (new.id, v_tipo_owner, 'BOOTSTRAP')
    on conflict do nothing;
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, scope_type, section, action,
    object_type, object_id, new_value, result
  )
  values (
    new.id, 'OWNER', 'GLOBAL', 'ACCESS_CONTROL', 'CREATE',
    'access_grant', new.id::text,
    jsonb_build_object('motivo', 'arranque del fundador', 'email', new.email),
    'ALLOWED'
  );

  return new;
end;
$$;

create trigger on_user_bootstrap_owner
  after insert on public.users
  for each row execute function public.otorgar_acceso_fundador();

-- ---------------------------------------------------------------------------
-- Listado de usuarios para el Admin.
--
-- El territorio del usuario se resuelve desde la base: su ciudad si la tiene,
-- si no su país. Un manager de Miami ve Miami y nada más; cambiar un id en la
-- URL no sirve de nada porque la fila simplemente no se devuelve.
-- ---------------------------------------------------------------------------
create or replace function public.path_de_usuario(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(c.path, p.path)
    from public.users u
    left join public.cities c    on c.id = u.city_id
    left join public.countries p on p.id = u.country_id
   where u.id = p_user_id;
$$;

create policy "usuarios visibles según territorio del grant" on public.users
  for select using (
    public.has_permission('USERS', 'VIEW', public.path_de_usuario(id))
  );

create policy "perfiles visibles según territorio del grant" on public.profiles
  for select using (
    public.has_permission('USERS', 'VIEW', public.path_de_usuario(user_id))
  );

create policy "asignaciones de tipo visibles con permiso" on public.user_type_assignments
  for select using (
    public.has_permission('USERS', 'VIEW', public.path_de_usuario(user_id))
  );

create policy "asignaciones de nivel visibles con permiso" on public.user_level_assignments
  for select using (
    public.has_permission('USERS', 'VIEW', public.path_de_usuario(user_id))
  );

-- ---------------------------------------------------------------------------
-- La lista de denegación se estaba evaporando.
--
-- `roles.denied_permissions` es lo que impide que un admin técnico emita un
-- reembolso o que un city manager se otorgue accesos. El guard del servidor la
-- lee junto con los grants del actor. Pero la única política de lectura sobre
-- `public.roles` exigía ACCESS_CONTROL.VIEW, y ocho de los diez roles base no
-- lo tienen: para ellos el join devolvía nulo, `denegados` llegaba vacío y la
-- prohibición desaparecía sin dejar rastro.
--
-- El fallo no rompía nada: ampliaba permisos en silencio, que es peor.
--
-- Acá se permite leer, de `roles`, exactamente las filas de los roles que uno
-- mismo tiene otorgados. Ver el nombre y las prohibiciones del propio rol no
-- revela nada: es información sobre uno mismo. El catálogo completo sigue
-- reservado a quien tiene ACCESS_CONTROL.VIEW.
--
-- La comprobación va dentro de una función SECURITY DEFINER para que la
-- política sobre `roles` no dispare la política sobre `access_grants` y las dos
-- se queden mirándose.
-- ---------------------------------------------------------------------------

create or replace function public.roles_de_mis_grants()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select role_id from public.access_grants where user_id = auth.uid();
$$;

revoke all on function public.roles_de_mis_grants() from public;
grant execute on function public.roles_de_mis_grants() to authenticated;

create policy "veo el rol de mis propios grants" on public.roles
  for select using (id in (select public.roles_de_mis_grants()));

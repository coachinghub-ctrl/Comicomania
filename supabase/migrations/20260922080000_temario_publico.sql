-- ---------------------------------------------------------------------------
-- El temario se lee entero; el contenido no.
--
-- FALLO ENCONTRADO: la política de `lessons` solo dejaba ver las lecciones
-- marcadas como muestra, así que en la página pública de un curso los módulos
-- salían con "0 lecciones". Protegía el contenido llevándose por delante los
-- títulos — y un temario que no se puede leer es la razón número uno por la
-- que alguien no compra un curso.
--
-- Es el mismo problema de filas contra columnas que ya apareció con
-- talent_profiles: RLS decide filas enteras. La fila de una lección lleva
-- DENTRO tanto el título (que vende) como asset_ref (que es el producto).
--
-- La herramienta correcta vuelve a ser permisos por COLUMNA:
--   · título, tipo, duración, orden y si es muestra → públicos
--   · asset_ref → solo quien está inscrito o administra
-- ---------------------------------------------------------------------------

-- La fila se ve siempre; lo que se protege son sus columnas.
drop policy if exists "lecciones de muestra, mías, o con permiso" on public.lessons;

create policy "el temario se lee siempre" on public.lessons
  for select using (true);

revoke select on public.lessons from anon, authenticated;

grant select (id, module_id, title, type, duration_s, "order", is_preview)
  on public.lessons to anon, authenticated;

/* asset_ref es el curso en sí: el video, el PDF, el enunciado del ejercicio.
   Se lee con una función que comprueba la inscripción, en vez de con una
   política de fila, porque la fila tiene que seguir siendo pública para que
   el temario se vea.

   Una lección de muestra la ve cualquiera: es lo que vende el curso. */
create or replace function public.contenido_de_leccion(p_leccion uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_asset jsonb;
  v_muestra boolean;
  v_curso uuid;
begin
  select l.asset_ref, l.is_preview, m.course_id
    into v_asset, v_muestra, v_curso
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
   where l.id = p_leccion;

  if v_asset is null then return null; end if;
  if v_muestra then return v_asset; end if;

  if exists (
    select 1 from public.course_enrollments e
     where e.course_id = v_curso and e.user_id = auth.uid()
  ) then
    return v_asset;
  end if;

  if public.has_permission('ACADEMY', 'VIEW') then
    return v_asset;
  end if;

  -- Ni inscrito, ni muestra, ni permiso: no hay contenido, y se dice con un
  -- null en vez de con un error. Quien mira el temario no está haciendo nada
  -- malo.
  return null;
end;
$$;

grant execute on function public.contenido_de_leccion(uuid) to anon, authenticated;

-- Los módulos ya eran públicos; se deja explícito por simetría.
drop policy if exists "temario visible" on public.course_modules;
create policy "temario visible" on public.course_modules
  for select using (true);

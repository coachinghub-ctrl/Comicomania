-- Métricas públicas del movimiento.
--
-- La landing no inventa cifras: las lee de acá. RLS impide que un anónimo
-- liste public.users, y está bien que así sea — pero contar en agregado no
-- expone a nadie. Esta función es SECURITY DEFINER y devuelve solo totales,
-- nunca filas.
--
-- Las métricas de videos, votos y eventos se agregan cuando existan sus
-- tablas (Fase E y J). Hasta entonces no aparecen, en vez de mostrar cero.

create or replace function public.metricas_publicas()
returns table (clave text, valor bigint)
language sql
stable
security definer
set search_path = public
as $$
  select 'usuarios'::text, count(*)::bigint
    from public.users
   where status = 'ACTIVE' and deleted_at is null
  union all
  select 'humoristas', count(distinct a.user_id)
    from public.user_type_assignments a
    join public.user_types t on t.id = a.user_type_id
   where t.slug = 'HUMORISTA'
  union all
  select 'ciudades', count(*) from public.cities where is_active
  union all
  select 'paises', count(*) from public.countries where is_active;
$$;

comment on function public.metricas_publicas is
  'Totales agregados para la landing. Devuelve conteos, nunca filas.';

revoke all on function public.metricas_publicas() from public;
grant execute on function public.metricas_publicas() to anon, authenticated;

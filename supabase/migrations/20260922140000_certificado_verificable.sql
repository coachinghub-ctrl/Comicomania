-- ---------------------------------------------------------------------------
-- El certificado, para poder verlo.
--
-- La tabla ya era legible por cualquiera —esa es la gracia de un certificado:
-- que quien lo recibe pueda enseñarlo y quien lo lee pueda comprobarlo— pero
-- la fila sola no sirve de nada. Dice una serie y una fecha; no dice de quién
-- es ni de qué curso.
--
-- Y lo que falta está en `users` y en `courses`, detrás de RLS. Un anónimo no
-- puede leer el nombre de otra persona, y hace bien.
--
-- La puerta correcta es estrecha: una función que, dada UNA serie, devuelve
-- exactamente lo que un certificado enseña —nombre, curso, fecha, horas— y
-- nada más. No el correo, no la ciudad, no el teléfono. Verificar un
-- certificado no puede convertirse en un buscador de personas.
-- ---------------------------------------------------------------------------

create or replace function public.certificado_por_serie(p_serie text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if coalesce(btrim(p_serie), '') = '' then
    return null;
  end if;

  select jsonb_build_object(
           'serie',    c.serial,
           'emitido',  c.issued_at,
           'nombre',   coalesce(
                         nullif(btrim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''),
                         u.display_name),
           'curso',    cur.title,
           'nivel',    cur.level,
           'horas',    case when cur.duration_min is not null
                            then round(cur.duration_min / 60.0)
                       end,
           'terminado', e.completed_at,
           'pdf',      c.pdf_url
         )
    into v
    from public.certificates c
    join public.course_enrollments e on e.id = c.enrollment_id
    join public.users u   on u.id = e.user_id
    join public.courses cur on cur.id = e.course_id
   where upper(c.serial) = upper(btrim(p_serie));

  -- Una serie que no existe devuelve null, no un error: quien la teclea mal
  -- no está haciendo nada malo.
  return v;
end;
$$;

revoke all on function public.certificado_por_serie(text) from public;
grant execute on function public.certificado_por_serie(text) to anon, authenticated;

comment on function public.certificado_por_serie is
  'Lo que un certificado enseña, por su número de serie: nombre, curso, '
  'fecha y horas. Nada más. Verificar un certificado no puede convertirse en '
  'un buscador de personas.';

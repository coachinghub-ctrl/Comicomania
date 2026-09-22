-- ---------------------------------------------------------------------------
-- Registrar interés en un producto SIN tener cuenta.
--
-- La tienda se ve sin registrarse: el registro llega al comprar, no al mirar.
-- Pero entonces quien pide aviso es anónimo, y un anónimo no puede escribir en
-- el CRM —RLS lo impide, y debe seguir impidiéndolo—.
--
-- La salida no es abrir la tabla: es abrir UNA puerta estrecha. Esta función
-- corre con permisos elevados pero solo hace una cosa, valida lo que recibe, y
-- no devuelve nada que permita averiguar quién más está anotado.
--
-- Concretamente, lo que NO hace:
--   · no dice si el correo ya estaba (eso permitiría enumerar la lista)
--   · no acepta nada más que correo y producto
--   · no deja escribir en ningún otro campo del contacto
-- ---------------------------------------------------------------------------

create or replace function public.registrar_interes_tienda(
  p_email    text,
  p_producto text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := lower(trim(p_email));
  v_contacto uuid;
  v_producto record;
  v_recientes int;
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'correo_invalido';
  end if;

  select id, name into v_producto
    from public.products
   where slug = p_producto and status = 'ACTIVE';
  if v_producto.id is null then
    raise exception 'producto_desconocido';
  end if;

  select id into v_contacto from public.crm_contacts where lower(email) = v_email;

  if v_contacto is null then
    insert into public.crm_contacts (email, source)
    values (v_email, 'TIENDA_AVISAME')
    returning id into v_contacto;
  end if;

  /* Tope simple contra el formulario apretado en bucle: un mismo contacto no
     deja más de diez avisos por hora. No es antifraude serio —eso es rate
     limit de verdad, más arriba— pero evita que una tarde aburrida llene la
     tabla de actividades. */
  select count(*) into v_recientes
    from public.crm_activities
   where contact_id = v_contacto
     and type = 'INTERES_PRODUCTO'
     and occurred_at > now() - interval '1 hour';

  if v_recientes >= 10 then
    return;  -- se ignora en silencio: decirlo enseñaría dónde está el tope
  end if;

  insert into public.crm_activities (contact_id, type, subject, body, direction)
  values (v_contacto, 'INTERES_PRODUCTO', v_producto.name,
          'Pidió aviso cuando abra la tienda.', 'IN');

  insert into public.domain_events (name, payload, contact_id)
  values ('tienda.interes',
          jsonb_build_object('producto', p_producto, 'nombre', v_producto.name),
          v_contacto);
end;
$$;

revoke all on function public.registrar_interes_tienda(text, text) from public;
grant execute on function public.registrar_interes_tienda(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo real de la tienda.
--
-- Estos NO son datos demo: son los cuatro productos oficiales, con sus fotos
-- de estudio. Por eso no llevan marca "demo-" ni los borra
-- supabase/demo/quitar.sql.
--
-- Los precios son una PROPUESTA. Están puestos para que la tienda se pueda ver
-- y probar, no porque alguien los haya decidido: hay que confirmarlos antes de
-- cobrar el primero.
-- ---------------------------------------------------------------------------

-- Faltaba dónde poner la foto. Una por producto alcanza para la parrilla; una
-- galería por producto llega cuando haya más de una toma por artículo.
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists image_alt text;

comment on column public.products.image_alt is
  'Descripción de la foto para quien no la ve. No es opcional por cortesía: '
  'sin esto la tienda es inutilizable con lector de pantalla.';

-- El orden en que se muestran. Sin esto, la parrilla sale en orden de
-- creación y el producto estrella queda donde caiga.
alter table public.products add column if not exists display_order smallint not null default 100;

do $$
declare
  v_bodega uuid;
  v_producto uuid;
begin
  -- Una bodega real, separada de la del demo.
  select id into v_bodega from public.inventory_locations where name = 'Bodega principal';
  if v_bodega is null then
    insert into public.inventory_locations (type, country_id, city_id, name)
    select 'WAREHOUSE', c.id,
           (select id from public.cities where path = 'US.FL.MIAMI'),
           'Bodega principal'
      from public.countries c where c.iso2 = 'US'
    returning id into v_bodega;
  end if;

  -- -------------------------------------------------------------------------
  -- Camiseta. Tallas reales, cada una con su existencia.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.products where slug = 'camiseta-el-humor-nos-une') then
    insert into public.products (slug, name, description, type, status,
                                 requires_shipping, weight_g, image_url, image_alt, display_order)
    values ('camiseta-el-humor-nos-une',
            'Camiseta EL HUMOR NOS UNE',
            'Negra, algodón pesado. La corona al frente y el manifiesto en la espalda: MÁS HUMOR, MÁS HISTORIAS, UN SOLO MOVIMIENTO.',
            'PHYSICAL', 'ACTIVE', true, 180,
            '/tienda/camiseta.webp',
            'Camiseta negra con la corona roja y COMICOMANÍA al frente, y EL HUMOR NOS UNE en la espalda',
            1)
    returning id into v_producto;


    insert into public.product_variants (product_id, sku, option_values, price, currency)
    values (v_producto, 'CM-TEE-S',  '{"talla": "S"}'::jsonb,  32, 'USD'),
           (v_producto, 'CM-TEE-M',  '{"talla": "M"}'::jsonb,  32, 'USD'),
           (v_producto, 'CM-TEE-L',  '{"talla": "L"}'::jsonb,  32, 'USD'),
           (v_producto, 'CM-TEE-XL', '{"talla": "XL"}'::jsonb, 32, 'USD');

    insert into public.inventory (variant_id, location_id, on_hand, low_stock_threshold)
    select v.id, v_bodega,
           case v.sku when 'CM-TEE-S' then 18 when 'CM-TEE-M' then 40
                      when 'CM-TEE-L' then 36 else 14 end,
           8
      from public.product_variants v where v.product_id = v_producto;
  end if;

  -- -------------------------------------------------------------------------
  -- Gorra.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.products where slug = 'gorra-corona') then
    insert into public.products (slug, name, description, type, status,
                                 requires_shipping, weight_g, image_url, image_alt, display_order)
    values ('gorra-corona',
            'Gorra COMICOMANÍA',
            'Negra, visera con vivo rojo y la corona bordada. Talla única ajustable.',
            'PHYSICAL', 'ACTIVE', true, 120,
            '/tienda/gorra.webp',
            'Gorra negra con la corona roja bordada y COMICOMANÍA en blanco, visera con vivo rojo',
            2)
    returning id into v_producto;

    insert into public.product_variants (product_id, sku, option_values, price, currency)
    values (v_producto, 'CM-CAP-U', '{"talla": "Única"}'::jsonb, 28, 'USD');

    insert into public.inventory (variant_id, location_id, on_hand, low_stock_threshold)
    select v.id, v_bodega, 50, 10
      from public.product_variants v where v.product_id = v_producto;
  end if;

  -- -------------------------------------------------------------------------
  -- Pulseras. Se venden como juego de tres, que es como están fotografiadas.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.products where slug = 'pulseras-movimiento') then
    insert into public.products (slug, name, description, type, status,
                                 requires_shipping, weight_g, image_url, image_alt, display_order)
    values ('pulseras-movimiento',
            'Pulseras del movimiento · juego de 3',
            'Silicona. Una negra con la corona, una roja con EL HUMOR NOS UNE, y una con TALENTO · CULTURA · COMUNIDAD. Se llevan juntas.',
            'PHYSICAL', 'ACTIVE', true, 40,
            '/tienda/pulseras.webp',
            'Tres pulseras de silicona apiladas: dos negras y una roja, con la corona y los lemas del movimiento',
            3)
    returning id into v_producto;

    insert into public.product_variants (product_id, sku, option_values, price, currency)
    values (v_producto, 'CM-BAND-3', '{"juego": "3 piezas"}'::jsonb, 12, 'USD');

    insert into public.inventory (variant_id, location_id, on_hand, low_stock_threshold)
    select v.id, v_bodega, 120, 25
      from public.product_variants v where v.product_id = v_producto;
  end if;

  -- -------------------------------------------------------------------------
  -- Taza.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.products where slug = 'taza-corona') then
    insert into public.products (slug, name, description, type, status,
                                 requires_shipping, weight_g, image_url, image_alt, display_order)
    values ('taza-corona',
            'Taza COMICOMANÍA',
            'Cerámica blanca con interior y asa rojos. 11 oz. Apta para lavavajillas.',
            'PHYSICAL', 'ACTIVE', true, 380,
            '/tienda/taza.webp',
            'Taza blanca con interior y asa rojos, con la corona y COMICOMANÍA en negro',
            4)
    returning id into v_producto;

    insert into public.product_variants (product_id, sku, option_values, price, currency)
    values (v_producto, 'CM-MUG-11', '{"tamaño": "11 oz"}'::jsonb, 18, 'USD');

    insert into public.inventory (variant_id, location_id, on_hand, low_stock_threshold)
    select v.id, v_bodega, 7, 10   -- entra bajo mínimo a propósito: se ve el aviso
      from public.product_variants v where v.product_id = v_producto;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lo que la tienda pública necesita saber, sin exponer el inventario.
--
-- Cuántas unidades quedan es dato de negocio: decirlo invita a calcular
-- ventas. Lo que la gente necesita saber es si puede comprar, y si queda
-- poco. Esta función devuelve eso y nada más.
-- ---------------------------------------------------------------------------
create or replace function public.disponibilidad_publica(p_variant_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(sum(available), 0) <= 0 then 'AGOTADO'
    when coalesce(sum(available), 0) <= max(low_stock_threshold) then 'ULTIMAS'
    else 'DISPONIBLE'
  end
  from public.inventory where variant_id = p_variant_id;
$$;

grant execute on function public.disponibilidad_publica(uuid) to anon, authenticated;

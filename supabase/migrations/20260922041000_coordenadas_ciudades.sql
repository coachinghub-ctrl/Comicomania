-- ---------------------------------------------------------------------------
-- Coordenadas de las ciudades sembradas.
--
-- La columna existía desde el primer día pero estaba vacía, así que cualquier
-- mapa salía en blanco. Son las coordenadas del centro de cada ciudad, con la
-- precisión que hace falta para poner un punto en un mapa: cuatro decimales
-- son unos diez metros, de sobra.
-- ---------------------------------------------------------------------------
update public.cities set latitude = c.lat, longitude = c.lon
  from (values
    ('US.FL.MIAMI',     25.7617,  -80.1918),
    ('US.FL.ORLANDO',   28.5383,  -81.3792),
    ('US.FL.TAMPA',     27.9506,  -82.4572),
    ('US.NY.NYC',       40.7128,  -74.0060),
    ('US.TX.HOUSTON',   29.7604,  -95.3698),
    ('MX.CDMX.CDMX',    19.4326,  -99.1332),
    ('CO.CUN.BOGOTA',    4.7110,  -74.0721),
    ('CO.ANT.MEDELLIN',  6.2442,  -75.5812),
    ('ES.MAD.MADRID',   40.4168,   -3.7038)
  ) as c(path, lat, lon)
 where public.cities.path = c.path;

-- ---------------------------------------------------------------------------
-- De dónde es la gente, agregado.
--
-- Devuelve CONTEOS, nunca filas: un mapa no necesita saber quién es cada
-- punto, y exponer las personas para dibujar un círculo sería regalar la base
-- de usuarios a cambio de un gráfico.
--
-- Respeta el territorio de quien pregunta: un manager de Miami ve Miami. Eso
-- lo resuelve has_permission sobre el path de cada ciudad, igual que el resto.
-- ---------------------------------------------------------------------------
create or replace function public.geografia_de_usuarios()
returns table (
  ciudad    text,
  pais      text,
  path      text,
  latitud   numeric,
  longitud  numeric,
  personas  bigint,
  inscritos bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.name,
    co.name,
    ci.path,
    ci.latitude,
    ci.longitude,
    count(distinct u.id),
    count(distinct p.id)
  from public.cities ci
  join public.countries co on co.id = ci.country_id
  left join public.users u        on u.city_id = ci.id
  left join public.participants p on p.user_id = u.id
  where public.has_permission('PARTICIPANTS', 'VIEW', ci.path)
  group by ci.name, co.name, ci.path, ci.latitude, ci.longitude
  having count(distinct u.id) > 0
  order by count(distinct u.id) desc;
$$;

grant execute on function public.geografia_de_usuarios() to authenticated;

-- Sin ciudad puesta no se puede ubicar a nadie, y conviene saber cuántos son:
-- si la mitad de la gente no tiene ciudad, el mapa miente por omisión.
create or replace function public.usuarios_sin_ubicar()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.users
   where city_id is null
     and public.has_permission('PARTICIPANTS', 'VIEW');
$$;

grant execute on function public.usuarios_sin_ubicar() to authenticated;

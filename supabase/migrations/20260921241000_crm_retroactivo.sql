-- ---------------------------------------------------------------------------
-- Las cuentas que ya existían cuando se instaló el CRM no tienen ficha: el
-- trigger solo corre hacia adelante. Es el mismo error que ya apareció con el
-- arranque del fundador, así que esta vez va resuelto de entrada.
--
-- Idempotente: se puede volver a correr sin duplicar nada.
-- ---------------------------------------------------------------------------
insert into public.crm_contacts (user_id, email, first_name, last_name, country_id, city_id, source)
select u.id, u.email, u.first_name, u.last_name, u.country_id, u.city_id, 'BACKFILL'
  from public.users u
 where not exists (
   select 1 from public.crm_contacts c where c.user_id = u.id
 )
   and not exists (
   select 1 from public.crm_contacts c where lower(c.email) = lower(u.email)
 );

-- Las que ya estaban como lead con el mismo email se adoptan en vez de
-- duplicarse.
update public.crm_contacts c
   set user_id = u.id, updated_at = now()
  from public.users u
 where c.user_id is null
   and lower(c.email) = lower(u.email);

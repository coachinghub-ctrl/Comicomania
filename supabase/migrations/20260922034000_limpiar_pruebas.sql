-- Quita los dos contactos que dejé al probar el formulario de la tienda.
-- Son de dominio @ejemplo.test, así que no hay riesgo de llevarse uno real.
delete from public.domain_events
 where name = 'tienda.interes'
   and contact_id in (select id from public.crm_contacts where email like '%@ejemplo.test');
delete from public.crm_activities
 where contact_id in (select id from public.crm_contacts where email like '%@ejemplo.test');
delete from public.crm_contacts where email like '%@ejemplo.test';

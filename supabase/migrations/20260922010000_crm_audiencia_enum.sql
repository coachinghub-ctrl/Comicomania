-- ---------------------------------------------------------------------------
-- El CRM necesita un pipeline de AUDIENCIA: quien viene a consumir humor no
-- es un aspirante a concursante, y meterlos en el mismo embudo hace que
-- ninguno de los dos números signifique nada.
--
-- Va en su propia migración porque Postgres no deja USAR un valor de enum en
-- la misma transacción en la que se agrega.
-- ---------------------------------------------------------------------------
alter type public.crm_entity add value if not exists 'AUDIENCE';

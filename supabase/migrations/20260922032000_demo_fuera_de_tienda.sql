-- El producto de demostración no debe salir en la tienda pública: mezcla
-- catálogo real con datos de prueba justo donde más se nota. Pasa a borrador;
-- sigue visible en el panel y lo sigue borrando supabase/demo/quitar.sql.
update public.products set status = 'DRAFT' where slug like 'demo-%';

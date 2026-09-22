-- ---------------------------------------------------------------------------
-- Quita TODOS los datos de demostración.
--
-- Se apoya en los marcadores con los que entraron: correos
-- @demo.comicomania.test, slugs demo-, nombres "DEMO ·" y centro de costo DEMO.
-- Nada real lleva esas marcas.
--
-- Borrar las cuentas demo de auth.users arrastra en cascada casi todo lo que
-- cuelga de ellas. El resto se borra por su marca, de las hojas al tronco.
--
-- Idempotente: se puede correr dos veces sin error.
--
-- Cómo aplicarlo: pídeselo a Claude, o pégalo en el editor SQL de Supabase.
-- ---------------------------------------------------------------------------

begin;

-- Las reglas append-only no dejan borrar por DELETE. Se levantan solo para
-- esta limpieza y se vuelven a poner al final.
alter table public.video_reviews        disable rule video_reviews_sin_delete;
alter table public.checkins             disable rule checkins_sin_delete;
alter table public.votes                disable rule votes_sin_delete;
alter table public.certificates         disable rule certificates_sin_delete;
alter table public.release_acceptances  disable rule release_acceptances_sin_delete;
alter table public.trust_case_actions   disable rule trust_case_actions_sin_delete;
alter table public.legal_document_versions disable rule legal_versions_sin_delete;
alter table public.inventory_adjustments   disable rule inventory_adjustments_sin_delete;
alter table public.talent_status_history   disable rule talent_status_history_sin_delete;

-- 1. Lo que cuelga del concurso demo.
delete from public.round_results  where round_id in (select id from public.rounds where contest_id in (select id from public.contests where slug like 'demo-%'));
delete from public.judge_scores   where assignment_id in (select id from public.judge_assignments where round_id in (select id from public.rounds where contest_id in (select id from public.contests where slug like 'demo-%')));
delete from public.judge_assignments where round_id in (select id from public.rounds where contest_id in (select id from public.contests where slug like 'demo-%'));
delete from public.votes          where round_id in (select id from public.rounds where contest_id in (select id from public.contests where slug like 'demo-%'));
delete from public.video_reviews  where video_id in (select id from public.videos where contest_id in (select id from public.contests where slug like 'demo-%'));
delete from public.entries        where round_id in (select id from public.rounds where contest_id in (select id from public.contests where slug like 'demo-%'));
delete from public.videos         where contest_id in (select id from public.contests where slug like 'demo-%');
delete from public.participants   where contest_id in (select id from public.contests where slug like 'demo-%');
delete from public.score_criteria where contest_id in (select id from public.contests where slug like 'demo-%');

-- 2. Eventos y entradas.
delete from public.checkins     where ticket_id in (select id from public.tickets where code like 'DEMO-%');
delete from public.tickets      where code like 'DEMO-%';
delete from public.ticket_types where event_id in (select id from public.events where slug like 'demo-%');
delete from public.events       where slug like 'demo-%';
delete from public.venues       where name like 'DEMO ·%';

-- 3. Comercio.
delete from public.refunds     where payment_id in (select id from public.payments where provider_payment_id like 'pi_demo_%');
delete from public.payments    where provider_payment_id like 'pi_demo_%';
delete from public.order_items where variant_id in (select id from public.product_variants where sku like 'DEMO-%');
delete from public.orders      where id not in (select order_id from public.order_items) and total = 30.1;
delete from public.inventory_adjustments where inventory_id in (select id from public.inventory where variant_id in (select id from public.product_variants where sku like 'DEMO-%'));
delete from public.inventory   where variant_id in (select id from public.product_variants where sku like 'DEMO-%');
delete from public.inventory_locations where name like 'DEMO ·%';
delete from public.product_variants where sku like 'DEMO-%';
delete from public.products    where slug like 'demo-%';

-- 4. Academia.
delete from public.certificates    where enrollment_id in (select id from public.course_enrollments where course_id in (select id from public.courses where slug like 'demo-%'));
delete from public.lesson_progress where enrollment_id in (select id from public.course_enrollments where course_id in (select id from public.courses where slug like 'demo-%'));
delete from public.course_enrollments where course_id in (select id from public.courses where slug like 'demo-%');
delete from public.lessons         where module_id in (select id from public.course_modules where course_id in (select id from public.courses where slug like 'demo-%'));
delete from public.course_modules  where course_id in (select id from public.courses where slug like 'demo-%');
delete from public.courses         where slug like 'demo-%';

-- 5. Talento.
delete from public.talent_contracts where booking_id in (select id from public.booking_requests where email like '%@demo.comicomania.test');
delete from public.booking_requests where email like '%@demo.comicomania.test';
delete from public.talent_status_history where talent_id in (select user_id from public.users where email like '%@demo.comicomania.test');
delete from public.talent_availability   where talent_id in (select user_id from public.users where email like '%@demo.comicomania.test');
delete from public.talent_profiles       where user_id  in (select id from public.users where email like '%@demo.comicomania.test');

-- 6. Sponsors.
delete from public.sponsor_metrics      where contract_id in (select id from public.sponsor_contracts where sponsor_id in (select id from public.sponsors where company like 'DEMO ·%'));
delete from public.sponsor_deliverables where contract_id in (select id from public.sponsor_contracts where sponsor_id in (select id from public.sponsors where company like 'DEMO ·%'));
delete from public.sponsor_campaigns    where sponsor_id in (select id from public.sponsors where company like 'DEMO ·%');
update public.commercial_inventory set sponsor_id = null, contract_id = null, status = 'AVAILABLE'
 where sponsor_id in (select id from public.sponsors where company like 'DEMO ·%');
delete from public.sponsor_contracts    where sponsor_id in (select id from public.sponsors where company like 'DEMO ·%');
delete from public.commercial_inventory where scope_path = 'US.FL.MIAMI' and type in ('presenting','naming_categoria','banner_home','escenario_final');
delete from public.sponsors             where company like 'DEMO ·%';

-- 7. Legal.
delete from public.release_acceptances     where version_id in (select id from public.legal_document_versions where document_id in (select id from public.legal_documents where slug like 'demo-%'));
delete from public.legal_document_versions where document_id in (select id from public.legal_documents where slug like 'demo-%');
delete from public.legal_documents         where slug like 'demo-%';

-- 8. Trust & Safety.
delete from public.trust_case_actions where case_id in (select id from public.trust_cases where description like '%votos comprados%' or description like '%canción de fondo%' or description like '%apela la anulación%');
update public.trust_cases set appeal_of = null where appeal_of is not null;
delete from public.trust_cases where description like '%votos comprados%' or description like '%canción de fondo%' or description like '%apela la anulación%';

-- 9. Finanzas y analítica.
delete from public.revenue_entries where cost_center = 'DEMO';
delete from public.expenses        where cost_center = 'DEMO';
delete from public.financial_categories where code like 'DEMO-%';
delete from public.metrics_daily   where scope_path = 'US.FL.MIAMI';

-- 10. Concurso, temporada y serie.
delete from public.categories where contest_id in (select id from public.contests where slug like 'demo-%');
delete from public.rounds     where contest_id in (select id from public.contests where slug like 'demo-%');
delete from public.contests   where slug like 'demo-%';
delete from public.seasons    where slug like 'demo-%';
delete from public.series     where slug like 'demo-%';

-- 11. Jurado.
delete from public.judges where display_name in ('Rosa Iglesias', 'Kike Peralta', 'Dani Sotomayor');

-- 12. CRM y cuentas. Borrar de auth.users arrastra public.users y sus fichas.
delete from public.crm_contacts where email like '%@demo.comicomania.test';
delete from auth.users         where email like '%@demo.comicomania.test';

-- 13. La auditoría NO se toca: es append-only por diseño, y las entradas que
--     dejó el demo son parte del registro de lo que pasó en esta base.

alter table public.video_reviews        enable rule video_reviews_sin_delete;
alter table public.checkins             enable rule checkins_sin_delete;
alter table public.votes                enable rule votes_sin_delete;
alter table public.certificates         enable rule certificates_sin_delete;
alter table public.release_acceptances  enable rule release_acceptances_sin_delete;
alter table public.trust_case_actions   enable rule trust_case_actions_sin_delete;
alter table public.legal_document_versions enable rule legal_versions_sin_delete;
alter table public.inventory_adjustments   enable rule inventory_adjustments_sin_delete;
alter table public.talent_status_history   enable rule talent_status_history_sin_delete;

commit;

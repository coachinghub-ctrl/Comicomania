# 09 · Database ERD

> Entregable 69. Cubre las ~130 tablas del brief §133, agrupadas por engine. Notación compacta: `PK` clave primaria, `FK→` referencia, `U()` único, `IX()` índice, `†` append-only / inmutable.

## Convenciones globales
- IDs `uuid v7` (ordenables por tiempo, no adivinables). Todas las tablas: `created_at`, `updated_at`; borrado lógico con `deleted_at` donde aplique.
- Toda tabla operable lleva `country_id` y, cuando corresponde, `city_id` — es la llave del modelo de acceso, analítica y finanzas.
- Dinero: `numeric(14,4)` + `currency char(3)` + `amount_base` con `fx_rate`. Nunca floats.
- Tiempo: `timestamptz` en UTC + `timezone` del objeto cuando importa mostrarlo en hora local.
- Configuración flexible: `jsonb` validado con Zod en la capa de aplicación y con `CHECK` cuando es crítico.

---

## A. Identidad y acceso
```
users(PK id, U(email), U(handle), email_verified_at, phone, phone_verified_at,
      first_name, last_name, display_name, avatar_url, dob_enc, FK→countries,
      FK→regions, FK→cities, locale, timezone, marketing_opt_in, status,
      mfa_enabled, U(referral_code), last_active_at, deleted_at)
profiles(PK user_id FK→users, stage_name, bio, socials jsonb, photo_file_id,
         profile_completeness int)
accounts(PK id, FK→users, provider, provider_account_id, U(provider,provider_account_id))
sessions(PK id, FK→users, token_hash, expires_at, ip, user_agent, mfa_at)

user_types(PK id, U(slug), name, is_public, requires_profile)
user_type_assignments(PK id, FK→users, FK→user_types, U(user_id,user_type_id), source)
user_levels(PK id, U(slug), track, name, rank, criteria_json, benefits_json)
user_level_assignments(PK id, FK→users, FK→user_levels, granted_at, revoked_at, reason)

roles(PK id, U(slug), name, is_system, default_sections[], default_actions[],
      denied_permissions[])
permissions(PK id, section, action, requires_mfa, U(section,action))
role_permissions(FK→roles, FK→permissions, PK(role_id,permission_id))
access_grants(PK id, FK→users, FK→roles, scope_type, scope_id, sections[], actions[],
              finance_level, starts_at, ends_at, status, FK granted_by→users, reason,
              IX(user_id,status,ends_at))
scopes_tree(PK id, type, U(path))        -- 'US', 'US.FL', 'US.FL.MIA'
teams(PK id, name, FK→countries, FK→cities) · team_members(FK→teams, FK→users, role)
invitations(PK id, email, FK→roles, scope_type, scope_id, token_hash, expires_at,
            accepted_at, FK invited_by→users)
access_history†(PK id, FK→users, FK→access_grants, change_type, before jsonb,
                after jsonb, FK actor→users, created_at)
audit_logs†(PK id, FK actor_user_id→users, actor_role, scope_type, scope_id, section,
            action, object_type, object_id, previous_value jsonb, new_value jsonb,
            result, ip, user_agent, request_id, prev_hash, hash, created_at,
            IX(object_type,object_id), IX(actor_user_id,created_at))
```

## B. Geografía y localización
```
countries(PK id, U(iso2), name, currency_default, locale_default, tax_mode, legal_jurisdiction)
regions(PK id, FK→countries, U(country_id,slug), name)
cities(PK id, FK→countries, FK→regions, U(country_id,slug), name, timezone, geo)
translations(PK id, entity_type, entity_id, locale, field, value, U(entity_type,entity_id,locale,field))
prices(PK id, entity_type, entity_id, FK→countries, currency, amount, U(entity_type,entity_id,country_id))
```

## C. Contest Engine
```
series(PK id, U(slug), name, brand, description, status)
seasons(PK id, FK→series, U(series_id,slug), name, year, starts_at, ends_at, status)
contests(PK id, FK→seasons, U(slug), name, status, FK→countries, FK→cities,
         timezone, registration_opens_at, registration_closes_at, submission_deadline,
         age_reference_date,
         prize jsonb, landing_config jsonb, FK template_id→contest_templates,
         FK created_by→users, IX(status,country_id,city_id))
contest_geographies(PK id, FK→contests, scope_type, scope_id, U(contest_id,scope_type,scope_id))
contest_templates(PK id, name, config jsonb, FK→series, created_by)
contest_eligibility(PK id, FK→contests, rules jsonb)
video_requirements(PK id, FK→contests, rules jsonb)
rounds(PK id, FK→contests, order, name, type, starts_at, ends_at, status,
       scoring_config jsonb, vote_rules jsonb, U(contest_id,order))
categories(PK id, FK→contests, U(contest_id,slug), name, order, description,
           assignment, min_age, max_age, eligibility jsonb, min_participants,
           FK merge_into→categories, prize jsonb, status)
prizes(PK id, FK→contests, FK→categories, FK→rounds, rank, description, value,
       currency, sponsor_id)
advancement_rules(PK id, FK→rounds, FK→categories, scope enum('ROUND','CATEGORY'),
                  mode, value, tie_breakers[], auto_resolve)
qualification_links(PK id, FK from_contest_id→contests, FK from_round_id→rounds,
                    FK to_contest_id→contests, slots, criteria, criteria_config jsonb,
                    auto_advance, status)

participants(PK id, FK→users, FK→contests, FK→categories, status, registered_at,
             age_at_reference, age_verification, eligibility_snapshot jsonb, U(user_id,contest_id), IX(contest_id,status))
participant_profiles(PK participant_id FK→participants, stage_name, bio, photo_file_id, socials jsonb)
entries(PK id, FK→participants, FK→rounds, FK→videos, status, submitted_at,
        U(participant_id,round_id))
participant_contest_history(PK id, FK→users, FK→contests, FK→rounds, result,
                            final_score, rank, created_at)
round_results†(PK id, FK→rounds, FK→participants, jury_score, audience_score,
               final_score, rank, advanced bool, config_snapshot jsonb, resolved_at)

judges(PK id, FK user_id?→users, display_name, bio, photo_file_id, country_id, status)
judge_assignments(PK id, FK→judges, FK→rounds, FK→entries, due_at, status,
                  U(judge_id,entry_id))
score_criteria(PK id, FK→contests, slug, name, weight, description, order)
judge_scores(PK id, FK→judge_assignments, criteria_scores jsonb, total, comment,
             submitted_at, locked_at, reopened_by, reopen_reason,
             U(judge_assignment_id))

vote_rules(PK id, FK→rounds, config jsonb)
votes(PK id, FK→rounds, FK→participants, FK→categories, FK user_id→users, status,
      created_at, U(round_id,participant_id,user_id) WHERE status='VALID',
      IX(round_id,category_id,participant_id,status))
vote_signals†(PK vote_id FK→votes, ip_hash, asn, is_datacenter, device_fp_hash,
              user_agent, referrer, geo, risk_score)
vote_audit†(PK id, FK→votes, action, reason, FK actor→users, created_at)
```

## D. Contenido y derechos
```
files(PK id, bucket, key, mime, size_bytes, sha256, uploaded_by, virus_scan_status, created_at)
videos(PK id, FK→users, FK→contests, FK→rounds, FK→categories, title, description,
       status, rights_status, duration_s, thumbnail_file_id, master_file_id,
       published_at, IX(status), IX(contest_id,status))
video_uploads(PK id, FK→videos, upload_id, parts jsonb, bytes_total, bytes_done,
              status, error)
video_validations(PK id, FK→videos, probe jsonb, passed bool, failures jsonb, created_at)
video_reviews†(PK id, FK→videos, FK reviewer→users, decision, comment,
               timecodes jsonb, created_at)
youtube_assets(PK id, FK→videos, U(youtube_video_id), channel_id, privacy_status,
               upload_status, processing_status, thumbnail_url, published_at,
               last_sync_at, error_code, error_message, quota_cost)
content_distributions(PK id, FK→videos, channel, external_id, url, published_at, metrics jsonb)

legal_documents(PK id, U(slug,jurisdiction), type, name)
legal_document_versions†(PK id, FK→legal_documents, version, body_md, body_hash,
                         effective_from, effective_to, status, created_by,
                         U(document_id,version))
release_acceptances†(PK id, FK→users, FK→participants, FK→videos, FK→contests,
                     FK→legal_document_versions, accepted_checkboxes jsonb, ip,
                     user_agent, locale, accepted_at, IX(user_id), IX(video_id))
third_party_declarations(PK id, FK→videos, kind, description, owner, has_release,
                         evidence_file_id, status, reviewed_by, reviewed_at)
content_rights(PK video_id FK→videos, status, restrictions jsonb, expires_at, notes)
talent_releases / sponsor_releases / music_clearances  -- misma forma que third_party_declarations
consents(PK id, FK→users, kind, granted, channel, country_id, version_id, ip, created_at)
```

## E. Comunidad
```
follows(PK id, FK follower→users, target_type, target_id, U(follower,target_type,target_id))
favorites(PK id, FK→users, entity_type, entity_id, U(user_id,entity_type,entity_id))
user_activity†(PK id, FK→users, verb, object_type, object_id, city_id, created_at,
               IX(user_id,created_at))
feed_items(PK id, actor_type, actor_id, verb, object_type, object_id, audience,
           FK→cities, published_at, weight, IX(audience,city_id,published_at))
notifications(PK id, FK→users, type, payload jsonb, channels[], read_at, created_at)
notification_preferences(FK→users, channel, type, enabled, PK(user_id,channel,type))
referrals(PK id, FK referrer→users, FK referred→users, code, source, conversion_type,
          converted_at, U(referred_user_id))
points_ledger†(PK id, FK→users, delta, reason, source_event_id, balance_after, created_at)
```

## F. Commerce
```
carts(PK id, FK→users, FK→countries, currency, status, expires_at)
cart_items(PK id, FK→carts, sellable_type, sellable_id, variant_id, qty, unit_price, metadata)
orders(PK id, U(number), FK→users, FK→carts, subtotal, discount, tax, shipping, total,
       currency, status, FK→countries, FK→cities, utm jsonb, placed_at,
       IX(user_id,placed_at), IX(status))
order_items(PK id, FK→orders, sellable_type, sellable_id, variant_id, qty, unit_price,
            discount, tax, total, fulfillment_status, metadata)
payments(PK id, FK→orders, provider, U(provider_payment_id), amount, currency, status,
         method, fee, net, paid_at)
refunds(PK id, FK→payments, amount, reason, FK actor→users, status, refunded_at)
coupons(PK id, U(code), type, value, scope jsonb, max_uses, used, per_user_limit,
        starts_at, ends_at, status)
entitlements(PK id, FK→users, kind, ref_type, ref_id, source_type, source_id,
             starts_at, ends_at, status, IX(user_id,kind,status))
inventory_reservations(PK id, sellable_type, sellable_id, qty, FK→carts, expires_at)

products(PK id, U(slug), name, description, type, status, FK→talent_profiles,
         FK→sponsors, FK→contests, FK→seasons, requires_shipping, weight_g, dimensions jsonb)
product_variants(PK id, FK→products, U(sku), option_values jsonb, price, compare_price,
                 currency, cost, status)
collections(PK id, U(slug), type, ref_id, name, status)
product_collections(FK→products, FK→collections, PK(product_id,collection_id))
inventory_locations(PK id, type, FK→countries, FK→cities, name)
inventory(PK id, FK→product_variants, FK→inventory_locations, on_hand, reserved,
          low_stock_threshold, U(variant_id,location_id))
inventory_adjustments†(PK id, FK→inventory, delta, reason, actor_user_id, created_at)
product_availability(PK id, FK→products, FK→countries, FK→cities, starts_at, ends_at)
shipping_zones(PK id, name, countries[], regions[], postal_patterns[])
shipping_rates(PK id, FK→shipping_zones, name, price, currency, min_total, max_weight_g)
shipments(PK id, FK→orders, carrier, U(tracking_number), status, shipped_at, delivered_at)

membership_plans(PK id, U(slug), name, price, currency, interval, trial_days,
                 FK→countries, benefits jsonb, stripe_price_id, status)
membership_subscriptions(PK id, FK→users, FK→membership_plans,
                         U(stripe_subscription_id), status, current_period_end,
                         cancel_at, trial_ends_at)
benefits(PK id, U(slug), name, type, target_scope jsonb, rule_json, value,
         max_uses, per_user_limit, starts_at, ends_at, status)
benefit_grants(PK id, FK→users, FK→benefits, source_type, source_id, uses,
               granted_at, expires_at)
```

## G. Eventos, experiencias, tours, academia
```
venues(PK id, name, address, FK→cities, geo, capacity, map_url)
events(PK id, U(slug), name, type, FK→venues, online_url, starts_at, ends_at, timezone,
       FK→countries, FK→cities, FK→tours, FK→contests, capacity, status,
       sales_start, sales_end, IX(city_id,starts_at))
event_talent(FK→events, FK→talent_profiles, role, PK(event_id,talent_id))
ticket_types(PK id, FK→events, name, kind, price, currency, quantity, per_user_limit,
             sales_start, sales_end, benefits jsonb, status)
tickets(PK id, FK→order_items, FK→events, FK→ticket_types, FK→users, holder_name,
        U(code), qr_secret, status, issued_at, IX(event_id,status))
checkins†(PK id, FK→tickets, gate, FK staff→users, scanned_at, device_id, result,
          U(ticket_id) WHERE result='OK')
experiences(PK id, U(slug), name, type, FK→events, FK→talent_profiles, capacity,
            price, currency, starts_at, ends_at, status)
experience_bookings(PK id, FK→experiences, FK→users, FK→entitlements, slot_at, status)
tours(PK id, U(slug), name, FK→seasons, status)
tour_stops(PK id, FK→tours, FK→events, order, U(tour_id,event_id))

courses(PK id, U(slug), title, FK instructor→users, level, language, price, currency,
        cover_file_id, preview_video_id, duration_min, status)
course_modules(PK id, FK→courses, title, order)
lessons(PK id, FK→course_modules, title, type, asset_ref jsonb, duration_s, order, is_preview)
course_enrollments(PK id, FK→users, FK→courses, source, FK→entitlements, started_at,
                   completed_at, progress_pct, U(user_id,course_id))
lesson_progress(PK id, FK→course_enrollments, FK→lessons, seconds_watched,
                completed_at, U(enrollment_id,lesson_id))
certificates(PK id, FK→course_enrollments, U(serial), issued_at, pdf_file_id)
```

## H. Talento, CRM, sponsors, licensing, finanzas
```
talent_profiles(PK user_id FK→users, stage_name, legal_name_enc, bio, languages[],
                comedy_styles[], categories[], markets[], travel_availability,
                set_durations[], technical_rider, media_kit_file_id, booking_contact,
                FK manager→users, representation, status, public_visible)
talent_status_history†(PK id, FK→talent_profiles, from_status, to_status,
                       FK changed_by→users, reason, created_at)
talent_availability(PK id, FK→talent_profiles, starts_at, ends_at, type)
booking_requests(PK id, FK client_user_id→users, client_company, contact_name, email,
                 phone, FK→talent_profiles, event_type, event_date, FK→cities,
                 budget_amount, currency, status, FK owner→users)
talent_contracts(PK id, FK→booking_requests, FK→talent_profiles, document_file_id,
                 signed_at, fee_amount, commission_pct, currency, terms jsonb, status)
talent_financials(PK id, FK→booking_requests, booking_value, talent_fee, commission,
                  travel_cost, production_cost, taxes, net_revenue, payout_amount,
                  payout_status, paid_at)

crm_contacts(PK id, FK→users, email, phone, company, first_name, last_name,
             FK→countries, FK→cities, source, utm jsonb, FK owner→users, status)
crm_tags(PK id, U(slug), name, color) · crm_contact_tags(FK→crm_contacts, FK→crm_tags)
crm_activities†(PK id, FK→crm_contacts, type, subject, body, direction,
                FK actor→users, occurred_at, source_event_id)
crm_pipelines(PK id, U(slug), name, entity_type)
crm_stages(PK id, FK→crm_pipelines, name, order, probability, sla_hours)
crm_opportunities(PK id, FK→crm_pipelines, FK→crm_stages, FK→crm_contacts, title,
                  amount, currency, FK→countries, FK→cities, FK owner→users,
                  expected_close, status, lost_reason)
segments(PK id, U(slug), name, definition jsonb, is_dynamic, last_computed_at)
campaigns(PK id, name, channel, FK→segments, content jsonb, utm jsonb, scheduled_at,
          sent_at, status, FK→countries, FK→cities)
marketing_consents(PK id, FK→users, channel, granted, country_id, source, created_at)

sponsors(PK id, company, category, contact_name, email, phone, FK→countries,
         FK→cities, status, FK owner→users, logo_file_id)
sponsor_contracts(PK id, FK→sponsors, FK→seasons, FK→contests, value, currency,
                  starts_at, ends_at, exclusivity jsonb, document_file_id, status)
sponsor_deliverables(PK id, FK→sponsor_contracts, FK→commercial_inventory,
                     description, due_at, status, evidence_file_id, delivered_at)
sponsor_campaigns(PK id, FK→sponsors, FK→sponsor_contracts, name, assets jsonb,
                  utm jsonb, placements[], starts_at, ends_at)
commercial_inventory(PK id, type, scope_type, scope_id, FK→seasons, FK→contests,
                     starts_at, ends_at, price, currency, exclusivity, status, FK→sponsors)

licenses(PK id, licensee_name, contact, territory_scope jsonb, property_type,
         rights jsonb, starts_at, ends_at, exclusivity, contract_value,
         minimum_guarantee, royalty_pct, reporting_frequency, status, document_file_id)
license_royalties(PK id, FK→licenses, period_start, period_end, reported_revenue,
                  royalty_due, paid_at, status)

financial_categories(PK id, kind, name, FK parent→financial_categories, U(code))
revenue_entries(PK id, source, FK→orders, amount, currency, fx_rate, amount_base, tax,
                net, FK→countries, FK→cities, FK→contests, FK→events, FK→seasons,
                cost_center, occurred_at, IX(occurred_at,country_id,city_id))
expenses(PK id, FK→financial_categories, vendor, amount, currency, fx_rate,
         amount_base, tax, description, receipt_file_id, invoice_number, FK→seasons,
         FK→contests, FK→events, FK→countries, FK→cities, cost_center,
         payment_method, paid_at, FK created_by→users, FK approved_by→users)
```

## I. Contenido editorial, automatización, plataforma
```
content_pages(PK id, U(slug), locale, title, blocks jsonb, seo jsonb, status, published_at)
articles(PK id, U(slug), locale, title, excerpt, body_md, cover_file_id, FK→cities,
         author_user_id, status, published_at)
banners(PK id, placement, FK→sponsors, asset_file_id, url, FK→countries, FK→cities,
        starts_at, ends_at, status)
faqs(PK id, FK→contests, question, answer, order, locale)

domain_events†(PK id, name, payload jsonb, actor_user_id, object_type, object_id,
               country_id, city_id, occurred_at, published_at, IX(name,occurred_at),
               IX(published_at) WHERE published_at IS NULL)
automations(PK id, name, trigger_event, conditions jsonb, status, version,
            suppression jsonb, FK→countries, FK→cities)
automation_steps(PK id, FK→automations, order, type, config jsonb)
automation_runs(PK id, FK→automations, FK→users, status, current_step, started_at,
                ended_at, error, U(automation_id,user_id,dedupe_key))
email_logs†(PK id, FK→users, template, subject, provider_id, status, opened_at,
            clicked_at, created_at)

attribution_touches†(PK id, FK→users, utm jsonb, landing, FK→contests, FK→countries,
                     FK→cities, platform, creative, occurred_at)
metrics_daily(PK id, date, metric, FK→countries, FK→cities, FK→contests, entity_type,
              entity_id, value, U(date,metric,country_id,city_id,contest_id,entity_type,entity_id))
trust_cases(PK id, type, FK reporter→users, object_type, object_id, description,
            status, priority, FK assignee→users, resolution, sla_due_at, resolved_at)
trust_case_actions†(PK id, FK→trust_cases, action, FK actor→users, notes, created_at)
settings(PK id, U(key,scope_type,scope_id), value jsonb, updated_by)
feature_flags(PK id, U(key), enabled, rules jsonb)
```

---

## Relaciones críticas que sostienen todo el modelo

1. `users 1—N access_grants` → **toda** autorización sale de aquí.
2. `users 1—1 talent_profiles`, `users 1—N participants`, `users 1—N crm_contacts` → una identidad, muchos papeles, cero duplicados.
3. `contests 1—N rounds 1—N entries 1—1 videos` → el video siempre sabe a qué ronda y concurso pertenece, y por tanto a qué ciudad y país: eso alimenta el scope de acceso.
4. `videos 1—N release_acceptances` con `legal_document_versions` → no hay publicación sin derecho demostrable, con la versión exacta aceptada.
5. `orders 1—N order_items → entitlements` → una compra, un permiso de acceso, sin importar qué se compró.
6. `domain_events` → CRM, automatizaciones y analítica. Ningún engine lee las tablas de otro.
7. `audit_logs` encadenado por hash → la trazabilidad es verificable, no confiable "de palabra".

## Índices y rendimiento — puntos calientes conocidos
- `votes`: partición por `round_id` cuando supere ~50 M filas; conteos públicos desde vista materializada.
- `domain_events`: partición mensual + archivado a almacenamiento frío a los 12 meses.
- `user_activity` y `audit_logs`: partición mensual.
- Landings públicas: ISR con revalidación por webhook al publicar; nada de consultas pesadas en el camino del visitante.

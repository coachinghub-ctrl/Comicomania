# 08 · CRM, sponsors, inventario comercial, licensing, finanzas, automatización e inteligencia

> Entregables: 55 (CRM), 56 (Sponsor), 57 (Commercial Inventory), 58 (Licensing), 59 (Finance), 60 (Intelligence), 61 (Analytics), 62 (Automation), 63 (Referral), 64 (Loyalty); brief 98–127.

## 55. CRM Architecture

El CRM **no duplica usuarios**. Un contacto es un COMICOMANIA ID; los leads sin cuenta (sponsors, clientes de talento, prensa) viven en `crm_contacts` con `user_id` nulo y se fusionan al crear cuenta.

```
crm_contacts(id, user_id?, email, phone, company, first_name, last_name,
             country_id, city_id, source, utm jsonb, owner_user_id, status, created_at)
crm_tags / crm_contact_tags
crm_activities(id, contact_id, type, subject, body, direction, actor_user_id,
               occurred_at, source_event_id)      -- timeline alimentado por el bus de eventos
crm_pipelines(id, slug, name, entity_type)        -- CONTESTANT | SPONSOR | TALENT | SUPPORT
crm_stages(id, pipeline_id, name, order, probability, sla_hours)
crm_opportunities(id, pipeline_id, stage_id, contact_id, title, amount, currency,
                  country_id, city_id, owner_user_id, expected_close, status, lost_reason)
segments(id, name, definition jsonb, is_dynamic, last_computed_at)
```

- **Un solo motor de pipelines** sirve a participantes (103), sponsors (104), talento (105) y soporte. Cambian los stages, no el código.
- **Segmentos dinámicos**: JSON evaluado contra el almacén de eventos y atributos (`país = MX AND tipo = HUMORISTA AND votos > 0 AND sin compra`). El mismo segmento alimenta campañas, automatizaciones y dashboards.
- Perfil 360 (brief 102): identidad, tipos, niveles, tags, geo, fuente y UTM, historial de concursos, votos, videos, follows, entradas, eventos, cursos, órdenes, membresía, gasto total, última actividad, notas y automatizaciones activas.
- Cumplimiento: consentimiento de marketing por canal y país (`marketing_consents`), baja en un clic, y bloqueo de envíos a quien no consintió. Requisito legal en la UE y buena práctica en LATAM y EE. UU.

## 62. Automation Architecture

```
domain_events (outbox)  →  bus (Inngest)  →  automations
automations(id, name, trigger_event, conditions jsonb, status, version,
            suppression jsonb, country_id?, city_id?)
automation_steps(id, automation_id, order, type enum('DELAY','EMAIL','PUSH','TAG',
                 'LEVEL','SEGMENT','WEBHOOK','TASK','BRANCH'), config jsonb)
automation_runs(id, automation_id, user_id, status, current_step, started_at, ended_at, error)
```

- Disparadores = eventos de dominio con nombre estable. Las 17 automatizaciones del brief (§106) son configuración, no desarrollo.
- **Supresión obligatoria**: tope de frecuencia (máx. N emails de marketing por semana), horas de silencio por timezone del usuario, exclusión si ya ejecutó la acción objetivo, y respeto de consentimiento.
- **Versionado y dry-run**: antes de activar, se ve a cuántas personas impactaría y con qué contenido. Una automatización mal hecha a 50.000 personas no se deshace.
- Reintentos idempotentes: cada paso lleva clave `(run_id, step_id)`.

## 56. Sponsor Architecture
```
sponsors(id, company, category, contact_name, email, phone, country_id, city_id,
         status, owner_user_id, logo_file_id)
sponsor_contracts(id, sponsor_id, season_id?, contest_id?, value, currency,
                  starts_at, ends_at, exclusivity jsonb, document_file_id, status)
sponsor_deliverables(id, contract_id, inventory_item_id, description, due_at,
                     status, evidence_file_id, delivered_at)
sponsor_campaigns(id, sponsor_id, contract_id, name, assets jsonb, utm jsonb,
                  placements[], starts_at, ends_at)
```

## 57. Commercial Inventory Architecture
El inventario comercial se modela como **producto vendible con disponibilidad**, igual que una entrada:
```
commercial_inventory(id, type, scope_type, scope_id, season_id?, contest_id?,
                     starts_at, ends_at, price, currency, exclusivity,
                     status enum('AVAILABLE','HELD','SOLD','DELIVERED'), sponsor_id?)
```
Tipos: presenting, global, country, city, contest, voting, academy, event, video, homepage banner, participant page, email, stage, naming rights de categoría, branded content.
Con esto el equipo comercial responde en segundos "¿qué me queda por vender en México para la temporada 2027?" — que es la pregunta que hoy nadie puede responder sin una hoja de cálculo.

## 100. Sponsor reporting
Se reportan **solo métricas medibles por la plataforma**: impresiones de placement propio, clics, CTR, registros atribuidos, usos de código promocional, ventas de entradas atribuidas, conversiones de landing, geografía y entregables cumplidos con evidencia. Las estimaciones se etiquetan como estimaciones. Nunca se presenta un número estimado como resultado real.

## 58. Licensing Architecture
```
licenses(id, licensee_name, contact, territory_scope, property_type, rights jsonb,
         starts_at, ends_at, exclusivity, contract_value, minimum_guarantee,
         royalty_pct, reporting_frequency, status, document_file_id)
license_royalties(license_id, period_start, period_end, reported_revenue,
                  royalty_due, paid_at, status)
```
Propiedades licenciables: marca, formato de concurso, contenido, serie, merchandising, territorios, derechos de medios, versiones internacionales. En MVP es registro y visibilidad; la operación completa es Fase 2.

## 59. Finance Architecture
No reemplaza contabilidad formal; es **gestión de negocio con datos reales de la plataforma**.

```
financial_categories(id, kind enum('REVENUE','EXPENSE'), name, parent_id, code)
revenue_entries(id, source enum('TICKETS','STORE','ACADEMY','MEMBERSHIPS','SPONSORS',
                'BOOKINGS','EXPERIENCES','LICENSING','TOURS','OTHER'),
                order_id?, amount, currency, fx_rate, amount_base, tax, net,
                country_id, city_id, contest_id?, event_id?, season_id?,
                cost_center, occurred_at)
expenses(id, category_id, vendor, amount, currency, fx_rate, amount_base, tax,
         description, receipt_file_id, invoice_number, season_id?, contest_id?,
         event_id?, country_id, city_id, cost_center, payment_method, paid_at,
         created_by, approved_by)
```
- Los ingresos se **derivan automáticamente** de las órdenes pagadas (job de cierre diario), no se cargan a mano.
- Toda fila financiera lleva país, ciudad y centro de costo: eso es lo que hace posible el `finance_level` de los grants y el P&L por ciudad, por evento, por concurso y por tour.
- Moneda base configurable (USD) con `fx_rate` congelado a la fecha del hecho.
- Dashboard (brief 111): ingreso bruto y neto, gastos, margen bruto y operativo, caja, desglose por fuente, por país, por ciudad, por concurso, por evento, por curso y por colección.
- Exportación a contabilidad (CSV/Xero/QuickBooks) con permiso `FINANCE · EXPORT` + MFA.

## 60/61. Intelligence & Analytics Architecture

```
domain_events (append-only, crudo)
   ↓ job nocturno + refresco incremental
metrics_daily(date, metric, country_id, city_id, contest_id?, entity_type?, entity_id?, value)
   ↓
dashboards (ejecutivo, por ciudad, por concurso, por evento, por curso, por sponsor)
```

- **Una tabla de hechos y una de rollups** en MVP. Postgres aguanta perfectamente este volumen; se migra a ClickHouse/Tinybird solo cuando los rollups tarden más de 60 s.
- Dimensiones estándar en todo: fecha, país, ciudad, concurso, temporada, fuente/UTM, tipo de usuario.
- Secciones del dashboard ejecutivo (brief 114–123): Audiencia · Comunidad · Concurso · Contenido · Eventos · Academia · Talento · Tienda · Membresías · Sponsors · CRM · Marketing · Finanzas · Mapa geográfico.
- **Atribución** (brief 35): `attribution_touches(user_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing, contest_id, country_id, city_id, platform, creative, occurred_at)` con modelo *first touch* y *last touch* guardados en el usuario, y multi-touch disponible por consulta. Server-side también (Meta CAPI / TikTok Events API) porque el navegador ya no entrega la mitad de las señales.
- Cada número del dashboard tiene su **definición escrita** y clicable. Sin diccionario de métricas, dos personas discuten con dos cifras distintas.

## 142. AI-ready (sin autoridad final)
Preparado por diseño: transcripción y subtítulos de video, etiquetado de contenido, asistencia de moderación, generación de metadatos y SEO, recomendaciones, búsqueda semántica, segmentación de CRM, scoring de leads y soporte.
**Prohibido como autoridad única:** elegir ganadores, evaluar talento, y decidir de forma definitiva la validez de votos. La IA propone; una persona con permiso decide y queda en auditoría.

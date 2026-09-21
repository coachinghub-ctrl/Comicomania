# 07 · Commerce: carrito único, tienda, membresías, beneficios, eventos, experiencias, tours y academia

> Entregables: 45 (Commerce), 46 (Store), 47 (Product), 48 (Cart & Checkout), 49 (Membership), 50 (Benefits), 51 (Events & Ticketing), 52 (Experiences), 53 (Tours), 54 (Academy); brief 61–70, 80–96.

## 45. Commerce Architecture — una sola columna

**Decisión fundacional:** entradas, merch, cursos, membresías y experiencias **no son cinco sistemas**. Son cinco `sellable_type` sobre la misma columna vertebral.

```
carts → cart_items → orders → order_items → payments → entitlements
                                    ├─ refunds
                                    └─ fulfillments (por tipo de ítem)
```

```sql
order_items(id, order_id, sellable_type, sellable_id, variant_id?, qty,
            unit_price, currency, discount, tax, total, fulfillment_status,
            metadata jsonb)
-- sellable_type: TICKET_TYPE | PRODUCT_VARIANT | COURSE | MEMBERSHIP_PLAN | EXPERIENCE | DONATION
```

**Entitlements** es la pieza que hace simple todo lo demás:
```sql
entitlements(id, user_id, kind, ref_type, ref_id, source_type, source_id,
             starts_at, ends_at, status, metadata)
-- kind: EVENT_ACCESS | COURSE_ACCESS | MEMBERSHIP | BENEFIT | EXPERIENCE | DIGITAL_DOWNLOAD
```
Comprar un curso, recibirlo por membresía o ganarlo como premio producen la *misma* fila. `MI COMICOMANIA` (brief 125) es una sola consulta a `entitlements`. El control de acceso a una lección o a un stream es una sola función.

### 48. Cart & Checkout
- Carrito mixto real: entrada + camiseta + experiencia + curso en una compra.
- **Reserva de inventario con TTL** (15 min) para entradas y ediciones limitadas: `inventory_reservations`. Sin esto se vende de más en el minuto pico del lanzamiento.
- Stripe Payment Element; Apple/Google Pay; 3DS cuando el emisor lo exija; Stripe Tax para impuestos por país; cupones y códigos promocionales propios (`coupons`) validados en servidor.
- **La orden se confirma por webhook** (`payment_intent.succeeded`), nunca por el retorno del navegador. Webhooks idempotentes con `stripe_event_id` único.
- Envío mixto: si la orden tiene ítems físicos, se piden datos de envío; los digitales se entregan igual aunque el envío falle.
- Recuperación de carrito abandonado por automatización.

## 46/47. Store y Producto
```
products(id, name, slug, description, category_id, collection_ids[], type enum('PHYSICAL','DIGITAL'),
         status, talent_id?, sponsor_id?, contest_id?, season_id?, weight_g, dimensions,
         requires_shipping, created_at)
product_variants(id, product_id, sku, option_values jsonb, price, compare_price,
                 currency, cost, barcode, status)
inventory(variant_id, location_id, on_hand, reserved, available GENERATED, low_stock_threshold)
inventory_locations(id, type enum('WAREHOUSE','EVENT','POD','DIGITAL'), country_id, city_id)
collections(id, type enum('GLOBAL','COUNTRY','CITY','CONTEST','SEASON','EVENT','TALENT','LIMITED'), ref_id)
product_availability(product_id, country_id?, city_id?, starts_at, ends_at)
```
Variantes por talla, color, estilo, edición, país y ciudad. Disponibilidad geográfica real: una colección de Medellín no se muestra ni se vende en Miami si así se configura.

Fulfillment: interno, tercero, **print-on-demand** (Printful/Printify en F2), **retiro en evento** (`EVENT_PICKUP`, muy relevante para merch de finales) y entrega digital.

## 90. Merchandising de evento
Al comprar una entrada, upsell en el mismo carrito: camiseta oficial, experiencia VIP, meet & greet. Opción "compro online, retiro en el evento" que descuenta de `inventory_locations` tipo EVENT. Esa combinación es la de mayor margen del modelo y debe estar en MVP.

## 51. Events & Ticketing
```
venues(id, name, address, city_id, geo, capacity, map_url)
events(id, name, slug, type, description, starts_at, ends_at, timezone, venue_id?,
       online_url?, city_id, country_id, capacity, status, tour_id?, contest_id?,
       talent_ids[], sponsor_ids[], sales_start, sales_end)
ticket_types(id, event_id, name, kind enum('GENERAL','VIP','PREMIUM','EARLY_BIRD','VIRTUAL','PROMO','COMP'),
             price, currency, quantity, per_user_limit, sales_start, sales_end, benefits jsonb, status)
tickets(id, order_item_id, event_id, ticket_type_id, user_id, holder_name,
        code, qr_secret, status enum('VALID','USED','VOID','TRANSFERRED'), issued_at)
checkins(id, ticket_id, gate, staff_user_id, scanned_at, device_id, result)
```
- **QR**: token firmado (HMAC) con `ticket_id` + versión; rotación al transferir. Validación server-side.
- **Scanner PWA offline-tolerante**: descarga el padrón del evento, valida localmente, sincroniza al recuperar red, y detecta duplicados por `ticket_id` con resolución "primer scan gana + alerta". En puerta no hay wifi confiable; esto no es opcional.
- Override manual con motivo y auditoría. Reporte de asistencia y no-show.
- **Eventos online**: acceso por `entitlement`, URL firmada de corta vida, ventana de acceso, watermark con el email del usuario (disuade la reventa del link).

## 52. Experiences
Entidad separada de los eventos: meet & greet, backstage, ensayo, cena VIP, taller, sesión privada. Se venden solas, como add-on de una entrada, o se otorgan como beneficio de membresía o de sponsor. Tienen cupo, ventana, talento asociado y su propio `entitlement`. `experience_bookings` guarda la reserva con horario.

## 53. Tours
`tours(id, name, season_id, talent_ids[], status)` + `tour_stops(tour_id, event_id, order)`. Un tour es una agrupación con P&L propio: agrega tickets, merch, gastos y márgenes de todas sus paradas. Sirve para decidir si la gira funciona ciudad por ciudad.

## 49. Membership Architecture
```
membership_plans(id, slug, name, price, currency, interval enum('MONTH','YEAR'),
                 trial_days, country_id?, benefits jsonb, stripe_price_id, status)
membership_subscriptions(id, user_id, plan_id, stripe_subscription_id, status,
                         current_period_end, cancel_at, trial_ends_at, created_at)
```
Planes FREE / FAN / PREMIUM / VIP, configurables y por país. Alta, upgrade, downgrade con prorrateo, cancelación, renovación, y **dunning** (reintentos + emails + degradación a FREE tras fallo definitivo). La suscripción produce `entitlements` y `benefit_grants`; al vencer, se revocan por job.

## 50. Benefits Engine
```
benefits(id, slug, name, type enum('DISCOUNT_PCT','DISCOUNT_FIXED','EARLY_ACCESS',
        'FREE_ITEM','VIP_ACCESS','EXCLUSIVE_CONTENT','PRIORITY'),
        target_scope jsonb,      -- {"section":"STORE"} | {"event_id":…} | {"course_id":…}
        rule_json,               -- condiciones: nivel, membresía, país, ciudad, concurso, sponsor
        value, max_uses, per_user_limit, starts_at, ends_at, status)
benefit_grants(id, user_id, benefit_id, source_type, source_id, uses, granted_at, expires_at)
```
Un solo evaluador de beneficios corre en el carrito, en el checkout, en la compra de entradas y en la academia. Restricción implementada: `target_scope.section` **no puede** ser `VOTING` ni `SCORING`.

## 54. Academy Architecture
```
courses(id, slug, title, instructor_user_id, level, language, price, currency,
        cover_file_id, preview_video_id, duration_min, status, country_availability[])
course_modules(id, course_id, title, order)
lessons(id, module_id, title, type enum('VIDEO','PDF','TEXT','LIVE','ASSIGNMENT'),
        asset_ref, duration_s, order, is_preview)
course_enrollments(id, user_id, course_id, source enum('PURCHASE','MEMBERSHIP','BENEFIT','GRANT'),
                   entitlement_id, started_at, completed_at, progress_pct)
lesson_progress(enrollment_id, lesson_id, seconds_watched, completed_at)
certificates(id, enrollment_id, serial, issued_at, pdf_file_id)      -- F2
```
Modelos de negocio soportados desde el día uno por configuración: curso suelto, bundle, masterclass, cohorte en vivo, acceso por membresía, descuento a participantes, acceso VIP. Video de curso en YouTube unlisted (MVP) o Mux (si se exige DRM/anti-descarga).

## 66. Pagos — detalles que evitan dolor
- Multi-moneda con precio base por país; nunca conversión en cliente.
- `payments` y `refunds` como tablas propias (no depender de Stripe como base de datos).
- Refunds totales y parciales con permiso `ORDERS · REFUND` + MFA, motivo obligatorio y auditoría.
- Facturas/recibos por país; numeración por entidad legal operadora.
- Conciliación diaria automática Stripe ↔ `payments`, con reporte de diferencias.

# 01 · Arquitectura de producto, seis engines, stack y sitemap

> Entregables: 4 (Six Engines), 5 (Product Architecture), 6 (Sitemap), 30/31 (multi-país / multi-ciudad), 129 (Localization), 134 (Tech Stack), 135 (Mobile First), 139 (qué no hard-codear).

## 4. Six Engines Architecture

Cada engine es un **módulo de dominio** con sus propias tablas, sus propios casos de uso y una frontera explícita. Se comunican por **eventos de dominio**, no por lecturas cruzadas a las tablas del vecino.

| Engine | Responsabilidad | Publica | Consume |
|---|---|---|---|
| **COMMUNITY** | follows, favoritos, feed, notificaciones, referidos, loyalty | `talent.followed`, `content.saved`, `referral.converted` | eventos de todos los demás |
| **CONTEST** | series, seasons, contests, rondas, categorías, participantes, jurado, scoring, votos, avance | `contest.published`, `participant.registered`, `vote.cast`, `round.resolved` | `video.published`, `user.registered` |
| **CONTENT** | CMS, páginas, videos, distribución, YouTube, clips, SEO | `video.submitted`, `video.published` | `contest.*` |
| **COMMERCE** | carrito, órdenes, pagos, tickets, productos, cursos, membresías, experiencias, entitlements | `order.paid`, `entitlement.granted`, `refund.issued` | `event.*`, `course.*`, `membership.*` |
| **TALENT** | perfil profesional, status, disponibilidad, booking, contratos, liquidaciones | `talent.status_changed`, `booking.confirmed` | `contest.*`, `event.*`, `academy.*` |
| **INTELLIGENCE** | ingest de eventos, rollups, dashboards, atribución, reportes | — | todo el bus de eventos |

**Capas transversales** (librerías compartidas, no engines): Identity, Access Control, CRM, Automation, Payments, Rights & Releases, Localization, Security, Audit, Trust & Safety, Notifications.

### Regla de frontera
- Lectura entre engines: por **servicio público del engine** (`contestService.getPublicStanding()`), nunca por SQL directo a sus tablas.
- Escritura entre engines: **solo por evento**. `order.paid` → COMMUNITY otorga puntos, TALENT no se entera, INTELLIGENCE lo cuenta.
- Excepción autorizada: el ID (users) es lectura directa para todos, porque es la raíz.

## 5. Product Architecture (capas)

```
┌─ CLIENTES ─────────────────────────────────────────────────────┐
│ Web pública (SSR/ISR) · App de usuario · Admin Control Center  │
│ Judge App (PWA) · Scanner de check-in (PWA) · Apps nativas F2  │
└────────────────────────────────────────────────────────────────┘
                 │ tRPC (interno)   │ REST /api/v1 (externo/futuro móvil)
┌─ APPLICATION ──────────────────────────────────────────────────┐
│ Casos de uso por engine · Guard de autorización (obligatorio)  │
│ Validación Zod · Idempotencia · Rate limiting                  │
└────────────────────────────────────────────────────────────────┘
┌─ DOMAIN ───────────────────────────────────────────────────────┐
│ Reglas puras y testeables: scoring, avance, elegibilidad,      │
│ integridad de voto, resolución de permisos, precios, beneficios│
└────────────────────────────────────────────────────────────────┘
┌─ INFRASTRUCTURE ───────────────────────────────────────────────┐
│ Postgres+Prisma · R2/S3 · YouTube API · Stripe · Resend        │
│ Inngest (jobs durables) · Media Worker (ffprobe/AV) · Sentry   │
└────────────────────────────────────────────────────────────────┘
```

**Outbox pattern**: toda mutación relevante escribe, en la misma transacción, una fila en `domain_events`. Un job la publica al bus. Así el CRM, las automatizaciones y la analítica nunca pierden un evento ni bloquean la request del usuario.

## 134. Tech Stack — decisión y justificación

| Capa | Decisión | Por qué (y qué descartamos) |
|---|---|---|
| Frontend + BFF | **Next.js 16 App Router, React 19, TypeScript, Tailwind v4** | SEO real para landings por ciudad y perfiles de humoristas (ISR), un solo lenguaje, despliegue por preview. |
| API interna | **tRPC** | Tipado extremo a extremo; el Admin es la mayor superficie y cambia rápido. |
| API externa | **REST /api/v1 + OpenAPI** | Necesario para apps nativas (F2), portal de sponsors y partners. Se genera desde los mismos casos de uso. |
| Base de datos | **PostgreSQL** (Neon o Supabase) | Transacciones fuertes para votos/órdenes, constraints reales, JSONB para configuración, RLS como segunda muralla. |
| ORM | **Prisma** + SQL crudo para analítica | Velocidad de equipo; los rollups se escriben en SQL. |
| Auth | **Auth.js v5** sobre tablas propias (magic link + OAuth Google/Apple/Facebook) | El ID es el activo del negocio: no se alquila. Clerk descartado por costo por MAU a escala de comunidad y por el modelo de grants propio que igual hay que construir. |
| Jobs / workflows | **Inngest** (steps durables, reintentos, cron) | Subidas a YouTube, validación de video, automatizaciones y rollups necesitan durabilidad sin operar Redis. Alternativa si se exige self-host: BullMQ + Redis en el worker. |
| Almacenamiento | **Cloudflare R2** (S3-compatible) | Sin costo de egress — decisivo con video. Subida directa multipart presignada desde el navegador. |
| Procesamiento de video | **Media Worker** en contenedor (Fly.io/Railway) con ffprobe + ClamAV | Serverless no sirve para ffmpeg sostenido. |
| Distribución de video | **YouTube Data API v3** al canal oficial + IFrame Player | Costo cero de entrega, alcance propio, monetización del canal. **Riesgo crítico: cuota** (ver 14-riesgos). |
| Streaming premium (F2) | Mux | Solo si se venden eventos online con control de acceso estricto. |
| Pagos | **Stripe** (Checkout/Elements, Tax, Billing, Connect en F2) | Multi-moneda, impuestos, suscripciones, payouts a talento. |
| Email | **Resend** + React Email | Plantillas versionadas en el repo. |
| Búsqueda | Postgres FTS + `pg_trgm` (MVP) → Typesense (F2) | No introducir infraestructura antes de tener catálogo. |
| Analítica | Eventos propios en Postgres + rollups; GA4 y pixeles solo para adquisición | La verdad del negocio es interna. |
| Observabilidad | Sentry + Axiom/Better Stack + health checks | |
| Infra | Vercel (web) · Fly.io (media worker) · Neon/Supabase (db) · R2 · Inngest | |

**Monorepo** pnpm + Turborepo. Una sola app Next con route groups `(marketing)`, `(app)`, `(admin)` — no tres deploys: comparten sesión, diseño y guard de autorización. Los packages (`db`, `authz`, `ui`, `contracts`, `jobs`, `domain`) permiten extraer servicios después sin reescribir.

## 135. Mobile first
Se diseña y se implementa primero en 360–430 px: registro, subida de video (con reintento y progreso real), votación, perfiles, checkout, entradas con QR, academia. El Admin se diseña desktop-first pero **Video Review, Judge App y Check-in son móviles obligatorios** — se usan de pie, en un venue, con mala conexión.

## 6. Sitemap

### Público (`/[locale]/…`)
```
/                         home
/que-es                   qué es COMICOMANIA
/comunidad                comunidad
/concursos                índice de concursos activos
/concursos/[pais]/[ciudad]/[slug]     landing localizada del concurso
/concursos/[…]/participantes          grilla de participantes
/concursos/[…]/votar                  votación
/concursos/[…]/bases                  reglas + FAQ + jurado + premios
/humoristas                           directorio
/humoristas/[handle]                  perfil público
/videos            /videos/[slug]
/eventos           /eventos/[slug]    /eventos/[slug]/entradas
/academia          /academia/[curso]
/tienda            /tienda/[coleccion]   /tienda/producto/[slug]
/talent            /talent/[handle]      /talent/contratar
/membresias
/sponsors          /sponsors/contacto
/noticias          /noticias/[slug]
/contacto  /legal/[doc]  /ayuda  /reportar
/login  /registro  /verificar
```

### Área del usuario (`/mi`)
```
/mi                       MI COMICOMANIA (next best action)
/mi/perfil                /mi/perfil/artista
/mi/participacion         estado en concursos
/mi/videos                subir · estado · feedback
/mi/votos  /mi/favoritos  /mi/siguiendo
/mi/entradas  /mi/eventos  /mi/experiencias
/mi/academia  /mi/academia/[curso]
/mi/ordenes   /mi/membresia  /mi/beneficios  /mi/cupones
/mi/referidos /mi/notificaciones /mi/privacidad (consentimientos, datos, borrado)
```

### Jurado y operación de campo
```
/jurado                   videos asignados · deadlines
/jurado/[videoId]         reproductor + rúbrica
/checkin                  scanner PWA
```

### Admin (`/admin`) — ver entregable 137
```
/admin (dashboard) · comunidad · usuarios · acceso · crm · series · temporadas
concursos · builder · plantillas · paises · ciudades · participantes · videos
review · jurado · scoring · votacion · campanas · segmentos · contenido
eventos · ticketing · tienda(productos/colecciones/inventario/ordenes/envios)
membresias · experiencias · tours · academia · talento · bookings · sponsors
inventario-comercial · licensing · finanzas · analytics · automatizaciones
legal · trust-safety · auditoria · reportes · configuracion
```

## 30/31/129. Multi-país, multi-ciudad, localización

- `countries` → `regions` → `cities`, con `timezone`, `locale_default`, `currency_default`, `tax_mode`, `legal_jurisdiction`.
- Todo objeto operable (concurso, evento, producto, campaña, sponsor, orden, grant) guarda `country_id` y, cuando aplica, `city_id`. **Ese par es la llave de todo el modelo de acceso, analítica y finanzas.**
- Rutas con `locale` (`es`, `en`, `pt` preparado). Contenido traducible con tabla `translations(entity, entity_id, locale, field, value)` para lo editorial; `next-intl` para la UI.
- Moneda: precios base por país (`prices(entity, country_id, currency, amount)`); Stripe Tax para impuestos; nunca convertir en el cliente.
- Fechas siempre `timestamptz` en UTC; se renderizan en el timezone de la ciudad del objeto, no del navegador (una final en Miami se anuncia en hora de Miami).
- Documentos legales por jurisdicción y versión (ver 05-video-y-derechos).

## 139. Prohibido hard-codear
Miami, USA, 2027, un concurso, un país, una ciudad, una estructura de rondas, un modelo de scoring, una carta de consentimiento, un sponsor, una membresía, una moneda, una colección, un tipo de usuario, un nivel, una regla de voto, un criterio de jurado, un método de pago, un idioma.

Control: un test de CI (`no-hardcoded-locale.test.ts`) falla el build si aparecen literales de ciudad/país/año en `src/**` fuera de seeds y fixtures.

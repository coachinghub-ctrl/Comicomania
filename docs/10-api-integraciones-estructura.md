# 10 · API, integraciones y estructura de carpetas

> Entregables: 70 (API Architecture), 71 (Integration Architecture), 72 (Folder Structure), 130 (Global Search).

## 70. API Architecture

Dos superficies, un solo núcleo de casos de uso:

| Superficie | Uso | Tecnología |
|---|---|---|
| **tRPC** `/api/trpc` | Web y Admin propios | Tipado extremo a extremo, sin contratos duplicados |
| **REST** `/api/v1` | Apps nativas (F2), portal de sponsors, partners, scanner | OpenAPI 3.1 generado; versionada |
| **Webhooks entrantes** `/api/webhooks/{stripe,youtube,resend,inngest}` | Proveedores | Verificación de firma obligatoria |
| **Webhooks salientes** | Sponsors/partners (F2) | Firmados HMAC, con reintentos |

### Convenciones REST
```
GET    /api/v1/contests?country=us&city=miami&status=voting&cursor=…&limit=20
GET    /api/v1/contests/{id}
POST   /api/v1/contests/{id}/participants        Idempotency-Key requerido
POST   /api/v1/rounds/{id}/votes                 Idempotency-Key requerido
POST   /api/v1/uploads/init  ·  /complete
GET    /api/v1/me  ·  /me/entitlements  ·  /me/tickets
POST   /api/v1/orders  ·  /orders/{id}/pay
GET    /api/v1/talent?city=…&style=…&available_from=…
POST   /api/v1/tickets/{code}/checkin            (scanner, tolerante a offline)
```
- **Paginación por cursor** siempre (offset se rompe con datos vivos como votos).
- **Errores** con `application/problem+json`: `{type, title, status, detail, code, requestId}`. Códigos de dominio estables (`VOTE_ALREADY_CAST`, `RIGHTS_NOT_CLEARED`, `SCOPE_FORBIDDEN`, `INVENTORY_UNAVAILABLE`).
- **Idempotencia** obligatoria en todo POST que mueva dinero, votos o estado de video.
- **Rate limits** por identidad + IP, con cabeceras `RateLimit-*`. Límites más estrictos en votación y en login.
- **Autorización**: cada handler llama `authorize()` antes de tocar datos. Sin excepciones; hay un test de arquitectura que lo verifica.
- **Versionado**: `/v1` estable; cambios incompatibles van a `/v2`. Los campos nuevos no rompen.
- **PII**: nunca en query strings; nunca en logs; respuestas filtradas por visibilidad según el actor.

## 71. Integration Architecture

| Integración | Dirección | Notas críticas |
|---|---|---|
| **YouTube Data API v3** | salida + polling | OAuth de canal de marca, refresh token cifrado y rotado; presupuesto de cuota (ver 05); reintento con backoff; sync nocturno de estado y métricas |
| **Stripe** | ambas | Checkout/Elements, Tax, Billing, Connect (F2). Webhooks idempotentes; la orden se confirma solo por webhook |
| **Cloudflare R2** | salida | Subidas presignadas multipart; lectura por URL firmada de corta vida |
| **Resend** | salida | Transaccional + campañas; webhooks de entrega/apertura/clic a `email_logs`; supresión de bounces |
| **Inngest** | ambas | Jobs durables: distribución de video, rollups, automatizaciones, dunning, cierres |
| **Sentry / Axiom** | salida | Errores y logs con `requestId` correlacionado |
| **Meta CAPI · TikTok Events · GA4** | salida | Atribución server-side; solo con consentimiento; sin PII en claro (hash) |
| **Turnstile** | entrada | Desafío solo ante riesgo en votación y registro |
| **Twilio** (opcional) | salida | Verificación de teléfono para concursos que la exijan |
| **Print-on-demand** (F2) | ambas | Printful/Printify: creación de orden y tracking |
| **Mux / Cloudflare Stream** (condicional) | salida | Plan B de reproducción y eventos online con control de acceso |

Regla: **todo proveedor externo se toca solo desde `packages/integrations/<proveedor>`**, con una interfaz propia. Ningún caso de uso importa el SDK de Stripe o de YouTube directamente. Eso hace posible cambiar de proveedor y, sobre todo, testear sin red.

## 130. Global Search
Un endpoint `/api/v1/search?q=…` con resultados agrupados por entidad y **filtrados por el scope del actor**: usuarios, humoristas, talento, videos, concursos, eventos, cursos, productos, órdenes, sponsors, contactos de CRM. Postgres FTS + `pg_trgm` para tolerancia a errores de tipeo; `search_documents(entity_type, entity_id, tsv, country_id, city_id)` mantenida por triggers. Migración a Typesense cuando el catálogo o la latencia lo pidan.

## 72. Folder Structure

```
comicomania/
├─ apps/
│  └─ web/                              # Next.js 15 — público + /mi + /admin + /jurado + /checkin
│     ├─ src/app/
│     │  ├─ (marketing)/[locale]/       # home, qué es, concursos, humoristas, videos,
│     │  │                              # eventos, academia, tienda, talent, membresías, sponsors
│     │  ├─ (app)/mi/                   # área del usuario
│     │  ├─ (judge)/jurado/             # PWA de jurado
│     │  ├─ (ops)/checkin/              # PWA de check-in
│     │  ├─ (admin)/admin/              # Admin Control Center
│     │  └─ api/{trpc,v1,webhooks}/
│     ├─ src/components/                # composiciones de página
│     └─ src/server/                    # routers tRPC (solo orquestan casos de uso)
├─ packages/
│  ├─ domain/                           # ★ reglas puras, sin I/O, 100% testeadas
│  │  ├─ scoring/  voting/  advancement/  eligibility/
│  │  ├─ pricing/  benefits/  rights/     nextaction/
│  ├─ authz/                            # grants, contención de scope, matriz, guard, tests dorados
│  ├─ db/                               # Prisma schema, migraciones, seeds, repositorios, RLS
│  ├─ contracts/                        # esquemas Zod + tipos compartidos + eventos de dominio
│  ├─ ui/                               # design system: tokens, primitivas, componentes
│  ├─ jobs/                             # funciones Inngest
│  ├─ integrations/                     # youtube/ stripe/ r2/ resend/ analytics/ turnstile/
│  ├─ i18n/                             # mensajes por locale
│  └─ analytics/                        # definiciones de métricas + rollups SQL
├─ services/
│  └─ media-worker/                     # ffprobe, ffmpeg (clips 9:16), ClamAV, miniaturas
├─ docs/                                # este documento
├─ e2e/                                 # Playwright
└─ ops/                                 # IaC, runbooks, backups, scripts de restore
```

**Reglas de dependencia (verificadas en CI con `dependency-cruiser`)**
- `domain` no importa nada de infraestructura. Ni Prisma, ni fetch, ni fecha del sistema (se inyecta el reloj).
- `app` puede importar `domain`, `authz`, `db`, `contracts`, `ui`.
- `db` no importa `domain`.
- Ningún engine importa los repositorios de otro engine.

# COMICOMANIA DIGITAL ENGINE™ — Arquitectura completa (previa a desarrollo)

Documento de arquitectura y producto que responde a los **83 entregables del §144** del Prompt Maestro.
Estado: **esperando aprobación (§145 Approval Gate).** No se ha escrito código de producto.

## Cómo leer esto

| Si eres… | Leé primero |
|---|---|
| Dueño del negocio | `00`, `13` (MVP y roadmap), `14` (decisiones, riesgos y preguntas abiertas) |
| Product / operación | `03` (journeys), `04` (concursos), `11` (wireframes), `13` |
| Desarrollo | `01` (stack), `02` (acceso), `09` (ERD), `10` (API y carpetas), `12` (seguridad y testing) |
| Legal | `05` (derechos y consentimiento), `12` (privacidad y Trust & Safety) |

## Capítulos

| Archivo | Contenido |
|---|---|
| [00-vision-y-estrategia.md](00-vision-y-estrategia.md) | Visión ejecutiva, estrategia de comunidad, mapa del ecosistema, North Star, filtro de producto |
| [01-arquitectura-y-stack.md](01-arquitectura-y-stack.md) | Seis engines, capas, stack con justificación, sitemap, multi-país, localización |
| [02-identidad-y-acceso.md](02-identidad-y-acceso.md) | COMICOMANIA ID, tipos, niveles, roles, matriz de permisos, territorios, aislamiento, auditoría |
| [03-journeys.md](03-journeys.md) | Los 14 journeys + motor de "siguiente paso" |
| [04-contest-engine.md](04-contest-engine.md) | Series/temporadas, builder, plantillas, campeonatos, jurado, scoring, votación, antifraude |
| [05-video-y-derechos.md](05-video-y-derechos.md) | Workflow de video, YouTube, cuota, derechos, versionado de consentimiento |
| [06-comunidad-y-talento.md](06-comunidad-y-talento.md) | Community, referidos, loyalty, Talent, booking, alumni |
| [07-commerce.md](07-commerce.md) | Carrito único, tienda, eventos, ticketing, membresías, beneficios, experiencias, tours, academia |
| [08-crm-sponsors-finanzas-intelligence.md](08-crm-sponsors-finanzas-intelligence.md) | CRM, automatización, sponsors, inventario comercial, licensing, finanzas, analítica |
| [09-erd.md](09-erd.md) | Modelo de datos completo (~130 tablas) |
| [10-api-integraciones-estructura.md](10-api-integraciones-estructura.md) | API, integraciones, búsqueda global, estructura de carpetas |
| [11-design-system-wireframes.md](11-design-system-wireframes.md) | Design system y mapa de wireframes |
| [12-seguridad-trust-safety-operacion.md](12-seguridad-trust-safety-operacion.md) | Seguridad, privacidad, Trust & Safety, testing, despliegue, backups |
| [13-mvp-backlog-roadmap.md](13-mvp-backlog-roadmap.md) | MVP, backlog con estimación, roadmap A–P, criterios de aceptación, Fase 2 |
| [14-decisiones-riesgos-preguntas.md](14-decisiones-riesgos-preguntas.md) | ADRs, riesgos y las 10 preguntas que hay que responder antes de programar |

## Mapa de los 83 entregables

| # | Entregable | Dónde |
|---|---|---|
| 1 | Executive Product Vision | 00 |
| 2 | Community Strategy | 00 |
| 3 | Business Ecosystem Map | 00 |
| 4 | Six Engines Architecture | 01 |
| 5 | Product Architecture | 01 |
| 6 | Complete Sitemap | 01 |
| 7 | User Types | 02 |
| 8 | User Levels | 02 |
| 9 | Roles | 02 |
| 10 | Permission Matrix | 02 |
| 11 | Territory Scope Model | 02 |
| 12 | Section Scope Model | 02 |
| 13 | Access Control Model | 02 |
| 14–28 | Los 14 journeys | 03 |
| 29 | Contest Engine Architecture | 04 |
| 30 | Multi-Country Architecture | 01, 04 |
| 31 | Multi-City Architecture | 01, 04 |
| 32 | Contest Builder Architecture | 04 |
| 33 | Championship Architecture | 04 |
| 34 | Jury Architecture | 04 |
| 35 | Scoring Architecture | 04 |
| 36 | Voting Architecture | 04 |
| 37 | Anti-Fraud Model | 04 |
| 38 | YouTube Integration Architecture | 05 |
| 39 | Video Workflow | 05 |
| 40 | Content Rights Architecture | 05 |
| 41 | Consent Versioning Architecture | 05 |
| 42 | Community Architecture | 06 |
| 43 | Talent Architecture | 06 |
| 44 | Booking Architecture | 06 |
| 45 | Commerce Architecture | 07 |
| 46 | Store Architecture | 07 |
| 47 | Product Architecture | 07 |
| 48 | Cart & Checkout Architecture | 07 |
| 49 | Membership Architecture | 07 |
| 50 | Benefits Architecture | 07 |
| 51 | Events & Ticketing Architecture | 07 |
| 52 | Experiences Architecture | 07 |
| 53 | Tours Architecture | 07 |
| 54 | Academy Architecture | 07 |
| 55 | CRM Architecture | 08 |
| 56 | Sponsor Architecture | 08 |
| 57 | Commercial Inventory Architecture | 08 |
| 58 | Licensing Architecture | 08 |
| 59 | Finance Architecture | 08 |
| 60 | Intelligence Architecture | 08 |
| 61 | Analytics Architecture | 08 |
| 62 | Automation Architecture | 08 |
| 63 | Referral Architecture | 06 |
| 64 | Loyalty Architecture | 06 |
| 65 | Localization Architecture | 01 |
| 66 | Security Architecture | 12 |
| 67 | Trust & Safety Model | 12 |
| 68 | Access Control Architecture | 02 |
| 69 | Database ERD | 09 |
| 70 | API Architecture | 10 |
| 71 | Integration Architecture | 10 |
| 72 | Folder Structure | 10 |
| 73 | Wireframe Map | 11 |
| 74 | Design System | 11 |
| 75 | MVP Definition | 13 |
| 76 | Product Backlog | 13 |
| 77 | Development Roadmap | 13 |
| 78 | Testing Strategy | 12 |
| 79 | Security Testing Strategy | 12 |
| 80 | Deployment Strategy | 12 |
| 81 | Backup & Recovery Strategy | 12 |
| 82 | Acceptance Criteria | 13 |
| 83 | Phase 2 Roadmap | 13 |

## Las cinco ideas que sostienen todo

1. **Un ID, un historial.** Ningún módulo crea usuarios ni duplica perfiles.
2. **La autoridad se otorga, no se hereda.** Solo un grant (persona + rol + territorio + sección + acción + ventana) da acceso, y el territorio se resuelve desde el objeto, nunca desde la URL.
3. **El concurso es configuración.** Abrir Orlando después de Miami no toca el código.
4. **Nada se publica sin derechos demostrables**, atados a la versión exacta del documento aceptado.
5. **Una sola columna comercial.** Entradas, merch, cursos, membresías y experiencias comparten carrito, orden y entitlements.

## Siguiente paso (§145)

Se requiere aprobación antes de construir. Las **10 preguntas abiertas** de [14-decisiones-riesgos-preguntas.md](14-decisiones-riesgos-preguntas.md) deben responderse primero: la ciudad y fecha del primer concurso, si se admiten menores, la entidad legal por país y el alcance de la primera entrega determinan el plan real.

Con la aprobación, la ejecución arranca por **Fase A (Design System)** y **Fase B (COMICOMANIA ID)**, en paralelo.

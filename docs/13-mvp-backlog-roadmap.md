# 13 · MVP, backlog, roadmap, criterios de aceptación y Fase 2

> Entregables: 75 (MVP Definition), 76 (Product Backlog), 77 (Development Roadmap), 82 (Acceptance Criteria), 83 (Phase 2 Roadmap).

## Una advertencia antes del plan

El MVP del brief (§140) contiene **34 módulos**, incluyendo commerce completo, academia, talento, sponsors, finanzas y analítica. Construido de una sola vez, eso son 9–12 meses antes de ver a un solo humorista subir un video, y el riesgo no es técnico: es que la primera ciudad se lance tarde y sin aprendizaje.

Propuesta: **el alcance del brief se respeta íntegro, pero se ordena en cuatro entregas** (R1–R4). R1 es el corte mínimo que permite operar un concurso real de punta a punta y cobrar dinero. Cada entrega posterior es aditiva y no reescribe nada, porque la arquitectura ya contempla todo el modelo desde el día uno (la base de datos y los engines se diseñan completos; se implementa por partes).

Si la decisión es lanzar todo junto, el plan también funciona: se ejecutan las mismas fases sin liberar hasta R4. Es una decisión de negocio, no de ingeniería.

---

## 75. MVP Definition

### R1 — "Una ciudad, de punta a punta" (semanas 1–14)
El criterio: **abrir COMICOMANIA Miami, recibir 300 videos, revisarlos, publicarlos, que el público vote, que un jurado evalúe, anunciar ganador y vender entradas a la final.**

Incluye:
- Website institucional (Home, Qué es, Concursos, Humoristas, Videos, Contacto, Legal)
- COMICOMANIA ID: registro, verificación, perfil, tipos, niveles, MI COMICOMANIA
- Access Control completo (grants, territorios, secciones, acciones, Access Builder, auditoría) — **no se pospone**: es la columna del Admin y retrofitearlo es carísimo
- Países y ciudades
- Contest Engine: series, temporadas, Contest Builder, plantillas, rondas, categorías, elegibilidad, landings localizadas
- Inscripción de participantes
- Subida de video, validación técnica, consentimiento versionado, declaración de terceros
- Integración YouTube + Video Review Center
- Jurado, scoring configurable, votación pública con antifraude
- Comunidad base: follows, favoritos, notificaciones, perfiles públicos
- Eventos + ticketing + Stripe + check-in con QR
- Automatizaciones esenciales (10 flujos)
- Dashboard con North Star y embudo del concurso
- Trust & Safety básico (reportar, cola de casos)

### R2 — "Monetizar la comunidad" (semanas 15–22)
Tienda (productos, variantes, colecciones, inventario, carrito mixto, envíos, retiro en evento) · Academia (catálogo, LMS, progreso) · Membresías y Benefits Engine · Experiencias · CRM completo con pipelines y segmentos · Campañas.

### R3 — "Escalar a más ciudades y vender el ecosistema" (semanas 23–30)
Championship y qualification links · Duplicación masiva de concursos · Sponsors e Inventario Comercial con reportes · Talent Foundation (perfiles, status, búsqueda) · Finanzas (ingresos derivados, gastos, P&L por ciudad) · Geo Analytics · Tours.

### R4 — "Profundidad de negocio" (semanas 31–38)
Booking de talento operativo · Licensing · Intelligence avanzada · Loyalty y embajadores · Referidos con metas · Certificados de Academia · Portal de sponsors.

### Fuera del MVP, explícitamente
Feed social con posts y comentarios, apps nativas, marketplace de talento, print-on-demand, gamificación avanzada, recomendaciones con IA, creator monetization, programa de afiliados.

---

## 76. Product Backlog (épicas y puntos)

Escala: 1 punto ≈ medio día de una persona. Equipo supuesto: 2 full-stack senior, 1 full-stack semi, 1 diseñador, 1 QA/DevOps a medio tiempo, 1 PM/PO (el dueño o su designado).

| # | Épica | Entrega | Pts | Dependencias |
|---|---|---|---|---|
| E01 | Fundaciones (monorepo, CI, entornos, observabilidad) | R1 | 20 | — |
| E02 | Design System + tokens + componentes base | R1 | 34 | E01 |
| E03 | COMICOMANIA ID (auth, perfil, tipos, niveles, MI COMICOMANIA) | R1 | 40 | E01 |
| E04 | **Access Control** (grants, scopes, guard, Access Builder, auditoría, RLS) | R1 | 55 | E03 |
| E05 | Geografía y localización | R1 | 15 | E01 |
| E06 | Contest Engine núcleo (series, temporadas, contests, rondas, categorías) | R1 | 45 | E04, E05 |
| E07 | Contest Builder + plantillas + duplicación | R1 | 40 | E06 |
| E08 | Landings localizadas + SEO + ISR | R1 | 25 | E06, E02 |
| E09 | Inscripción y perfil de participante | R1 | 25 | E03, E06 |
| E10 | Subida de video (multipart, progreso, reintento) | R1 | 35 | E09 |
| E11 | Media Worker (ffprobe, AV, miniaturas, clips 9:16) | R1 | 30 | E10 |
| E12 | **Rights & Consent** (documentos, versiones, aceptaciones, terceros) | R1 | 35 | E10 |
| E13 | YouTube (OAuth, subida resumible, sync, gestor de cuota) | R1 | 40 | E11 |
| E14 | Video Review Center | R1 | 30 | E13, E04 |
| E15 | Jurado (asignaciones, rúbrica, bloqueo, deadlines) | R1 | 35 | E06 |
| E16 | Scoring Engine + resolución de rondas | R1 | 30 | E15 |
| E17 | Votación + antifraude + panel | R1 | 45 | E06, E03 |
| E18 | Comunidad base (follows, favoritos, notificaciones, perfiles) | R1 | 30 | E03 |
| E19 | Eventos + ticketing + QR + check-in PWA | R1 | 45 | E20 |
| E20 | Commerce núcleo (carrito, órdenes, Stripe, entitlements, refunds) | R1 | 50 | E03 |
| E21 | Automatizaciones + eventos de dominio + email | R1 | 35 | E03 |
| E22 | Dashboard + métricas + North Star | R1 | 25 | E21 |
| E23 | Trust & Safety básico | R1 | 20 | E04 |
| E24 | Endurecimiento, carga, pentest, accesibilidad | R1 | 35 | todas |
| | **Subtotal R1** | | **~820 pts** | |
| E25 | Tienda + productos + inventario + envíos | R2 | 70 | E20 |
| E26 | Academia + LMS | R2 | 55 | E20 |
| E27 | Membresías + Benefits Engine | R2 | 45 | E20 |
| E28 | Experiencias | R2 | 20 | E19 |
| E29 | CRM completo + segmentos + campañas | R2 | 60 | E21 |
| E30 | Championship + qualification links | R3 | 30 | E16 |
| E31 | Sponsors + Inventario Comercial + reportes | R3 | 50 | E22 |
| E32 | Talent Foundation | R3 | 40 | E18 |
| E33 | Finanzas + P&L por ciudad | R3 | 50 | E20 |
| E34 | Geo Analytics + Intelligence | R3 | 40 | E22 |
| E35 | Tours | R3 | 20 | E19 |
| E36 | Booking operativo + payouts | R4 | 55 | E32, E33 |
| E37 | Licensing | R4 | 25 | E33 |
| E38 | Loyalty + referidos + embajadores | R4 | 40 | E18 |
| E39 | Certificados + portal de sponsors | R4 | 35 | E26, E31 |

## 77. Development Roadmap (fases A–P del brief, con calendario)

Supuesto: arranque **1 de octubre de 2026**. Sprints de dos semanas.

| Fase | Contenido | Semanas | Fecha estimada |
|---|---|---|---|
| **A** Design System | Tokens, componentes, plantillas de página | 1–3 | Oct 2026 |
| **B** Core Identity | COMICOMANIA ID, perfiles, tipos, niveles | 2–5 | Oct–Nov 2026 |
| **C** Access Control | Grants, scopes, guard, Access Builder, auditoría | 4–7 | Nov 2026 |
| **D** Community Core | Follows, favoritos, notificaciones, perfiles públicos | 6–8 | Nov–Dic 2026 |
| **E** Contest Engine | Series, temporadas, builder, plantillas, landings | 6–11 | Nov–Dic 2026 |
| **F** Video + YouTube | Subida, validación, derechos, distribución, review | 9–13 | Dic 2026–Ene 2027 |
| **G** Jurado + Votación | Rúbricas, scoring, votación, antifraude | 11–14 | Ene 2027 |
| **H** CRM | Eventos de dominio, automatizaciones, contactos | 12–15 | Ene–Feb 2027 |
| **I** Commerce | Carrito, órdenes, Stripe, entitlements | 13–17 | Feb 2027 |
| **J** Events | Ticketing, QR, check-in | 16–19 | Feb–Mar 2027 |
| — | **🚀 R1: apertura de inscripciones COMICOMANIA ciudad 1** | **14** | **Ene 2027** |
| **K** Academy | Catálogo, LMS, progreso | 18–22 | Mar–Abr 2027 |
| **L** Talent | Perfiles, status, búsqueda | 23–26 | Abr–May 2027 |
| **M** Sponsors | Inventario comercial, contratos, reportes | 24–28 | May–Jun 2027 |
| **N** Finance + Intelligence | P&L, dashboards, geo analytics | 27–31 | Jun–Jul 2027 |
| **O** Testing + Security | Carga, pentest, accesibilidad, simulacros | continuo + 32–34 | Jul 2027 |
| **P** Launch | Lanzamiento multi-ciudad | 35–38 | Ago–Sep 2027 |

Hitos duros:
- **Semana 8**: primer concurso creado de punta a punta en staging por un no-desarrollador usando el Builder.
- **Semana 10**: solicitud de ampliación de cuota a YouTube enviada (tarda semanas; si se pide en la 20, se llega tarde).
- **Semana 13**: primer video real subido, revisado y publicado en el canal oficial.
- **Semana 14**: R1 en producción, inscripciones abiertas.
- **Semana 20**: primera final con entradas vendidas y check-in real.
- **Semana 24**: segunda ciudad abierta **sin una línea de código nuevo** (prueba de fuego del motor).

## 82. Acceptance Criteria (los que deciden si esto está bien construido)

**Del motor de concursos**
1. Un operador sin acceso al código crea y publica un concurso completo en <20 min, y lo duplica a otra ciudad en <10 min.
2. Cambiar el peso jurado/público de 70/30 a 50/50 es un cambio de configuración y recalcula al resolver la ronda, conservando el snapshot anterior.
3. Un campeonato de 3 ciudades → final estatal → final nacional se configura sin desarrollo.

**De acceso y aislamiento**
4. Un operador con grant `CITY=Miami` recibe 404/403 en las 40 rutas del test de aislamiento hacia datos de Orlando, y cada intento queda auditado.
5. Un grant temporal expira solo, sin intervención, y la sesión activa pierde el acceso en ≤60 s.
6. El Super Admin técnico no puede emitir un refund ni cambiar un ganador, ni siquiera por API.

**De video y derechos**
7. Ningún video alcanza `PUBLISHED` sin una aceptación de carta vinculada a una versión vigente para su jurisdicción. Intentarlo por API devuelve `RIGHTS_NOT_CLEARED`.
8. Publicar una nueva versión de la carta no altera ninguna aceptación previa; las anteriores siguen consultables con su texto exacto.
9. Una subida de 500 MB en 4G sobrevive a un corte de red de 30 s y se reanuda.

**De votación**
10. Un usuario verificado no puede votar dos veces al mismo participante en la misma ronda por ninguna vía (UI, API, reintento, carrera concurrente). Test de concurrencia con 100 peticiones simultáneas: 1 voto.
11. 10.000 votos/minuto sostenidos durante 10 minutos con p95 < 500 ms y cero votos perdidos o duplicados.
12. Invalidar un lote de votos exige motivo, no borra filas y queda en auditoría con valor anterior.

**De comercio**
13. Una orden con entrada + camiseta + curso genera un solo pago, tres fulfillments independientes y los entitlements correctos.
14. No hay sobreventa de entradas con 2.000 checkouts simultáneos sobre un cupo de 500.
15. Un refund parcial ajusta ingresos, entitlements e inventario de forma consistente.

**De operación**
16. Restauración completa desde backup en <1 h, demostrada en simulacro con cronómetro.
17. Cada número del dashboard tiene definición escrita y accesible desde la propia métrica.
18. Todo el flujo de participante funciona en un teléfono de gama media con conexión 4G lenta.

## 83. Phase 2 Roadmap

| Trimestre | Contenido |
|---|---|
| **Q4 2027** | Feed social (posts, comentarios, reacciones) con moderación · Comunidades por ciudad · Gamificación y loyalty avanzado |
| **Q1 2028** | Apps nativas iOS/Android (Expo) con push · Notificaciones enriquecidas · Offline en academia |
| **Q2 2028** | Talent Marketplace (booking self-service) · Payouts con Stripe Connect · Portal de sponsors en autoservicio |
| **Q3 2028** | Print-on-demand · Tienda avanzada (bundles, suscripción de merch) · Colecciones de talento con revenue share |
| **Q4 2028** | Licensing avanzado y versiones internacionales · Programa de afiliados · Creator monetization |
| **Continuo** | IA: transcripción, subtítulos, etiquetado, asistencia de moderación, recomendaciones, búsqueda semántica, scoring de leads — siempre con decisión humana final |

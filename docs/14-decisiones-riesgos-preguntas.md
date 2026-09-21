# 14 · Decisiones de arquitectura, riesgos y preguntas abiertas

Este capítulo no estaba en la lista de 83 entregables. Está aquí porque es lo que hace que la lista sirva para decidir.

## Decisiones (ADR resumidos)

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| **D01** | Monolito modular en Next.js con engines separados por frontera lógica | Microservicios desde el día uno | Un equipo pequeño con microservicios gasta el 40% del tiempo en plomería. Las fronteras están definidas: extraer un engine después es un trabajo de días, no una reescritura. |
| **D02** | Identidad propia (Auth.js + tablas propias) | Clerk / Auth0 | El COMICOMANIA ID *es* el activo del negocio. Además, tipos, niveles y grants hay que construirlos igual; alquilar solo el login añade costo por MAU y una dependencia en la raíz del modelo. |
| **D03** | Un solo `orders` para todo lo vendible | Ticketing, tienda, LMS y membresías separados | El carrito mixto y el "MY COMICOMANIA" unificado del brief son imposibles de lograr bien con cuatro sistemas. Esta es la decisión que más trabajo futuro ahorra. |
| **D04** | Autorización por *grant* (sujeto+rol+territorio+sección+acción+ventana) | RBAC plano por rol | Es literalmente el requisito del dueño (§10, §13–17). Un RBAC plano no expresa "Miami, solo videos, marzo a junio". |
| **D05** | Scope resuelto desde el objeto, nunca desde el request | Filtrar por parámetros del cliente | Es la única forma de cumplir §18 (data isolation) contra manipulación de URL, ID o API. |
| **D06** | R2 como almacenamiento y reproducción durante la competencia; YouTube como canal de alcance | YouTube como almacenamiento y reproductor único | *Revisada tras verificar los límites reales (sept. 2026).* La cuota ya no obliga, pero el reproductor de YouTube se lleva al votante justo antes de votar, mete publicidad de terceros sobre el video de un participante y no permite retirar contenido al instante. Servir desde R2 cuesta ~USD 0,40/mes para 300 videos de 2 min, con egress cero. |
| **D14** | Categorías por edad con asignación automática y fecha de referencia congelada | Competencia abierta o categoría auto-declarada | Evita el fraude de categoría y el cambio de categoría a mitad de concurso por cumpleaños. El modelo de categorías es genérico: sirve igual para estilo, universitarios o nivel. |
| **D07** | Reglas de negocio como datos (JSON validado) con intérpretes puros | Reglas en código | §139 exige no hard-codear nada. Además hace testeable el corazón del concurso. |
| **D08** | Normalización z-score por juez, activable | Promedio simple | Sin normalización, el resultado depende de qué juez te tocó. Es un riesgo reputacional y legal en un concurso con premio. |
| **D09** | Voto del público como proporción de votos válidos | Votos como puntos absolutos | Hace comparables rondas y ciudades de tamaños muy distintos. |
| **D10** | Inngest para jobs durables | Redis + BullMQ autogestionado | Menos operación para un equipo pequeño. Si se exige self-host, el cambio está aislado en `packages/jobs`. |
| **D11** | Postgres para analítica en MVP, con rollups | ClickHouse/warehouse desde el inicio | No se introduce infraestructura antes de tener el problema. El punto de migración está definido (rollups > 60 s). |
| **D12** | Auditoría append-only con encadenamiento hash | Tabla de logs normal | En un concurso con premio y dinero, la trazabilidad tiene que ser verificable, no una promesa. |
| **D13** | Cuatro entregas (R1–R4) en vez de un MVP monolítico | Lanzar todo junto | Reduce el tiempo hasta el primer concurso real de ~10 meses a ~3,5, sin recortar el alcance final. |

## Riesgos

| Riesgo | Impacto | Prob. | Mitigación |
|---|---|---|---|
| ~~Cuota de YouTube Data API~~ → **límites de canal nuevo** | 🟡 Retrasa la difusión | Media | *Riesgo degradado:* desde junio de 2026 la API da 100 subidas/día en un cupo propio. Queda el límite no publicado del canal: verificarlo desde el día uno, subir de forma sostenida y pedir ampliación antes de la 2.ª ciudad |
| **Fraude de votos organizado** | 🔴 Credibilidad del concurso | Alta (siempre pasa) | Antifraude por capas, revisión humana, bases legales que lo contemplen, comunicación clara, pentest previo |
| **Alcance del MVP** | 🔴 Lanzamiento tardío | Alta | Entregas R1–R4; congelar alcance de R1 por contrato interno |
| **Derechos de música en los videos** | 🟠 Claims y bloqueos en YouTube | Alta | Declaración obligatoria de terceros, revisión, recomendación explícita de no usar música comercial en las bases |
| **Pico de tráfico en votación/venta** | 🟠 Caída en el peor momento | Media | Pruebas de carga previas, caché y vistas materializadas, rate limits, modo degradado de solo lectura |
| **Cumplimiento multi-país** (privacidad, sorteos/concursos, impuestos) | 🟠 Multas, rehacer flujos | Media | Revisión legal por jurisdicción antes de abrir cada país; documentos versionados por jurisdicción |
| **Menores de edad participando** | 🟠 Legal y reputacional | Media | Por defecto 18+; si se abre, consentimiento de tutor y flujo aparte |
| **Dependencia de una sola persona clave** | 🟠 Continuidad | Media | Documentación viva, pair programming, runbooks, sin "dueño único" de un engine |
| **Sobreventa de entradas** | 🟡 Operativo en puerta | Media | Reservas con TTL y constraints; probado con 2.000 checkouts simultáneos |
| **Costo de infraestructura al escalar video** | 🟡 Margen | Media | R2 sin egress, YouTube como entrega, revisión de costos por ciudad en el P&L |

## Preguntas abiertas (necesitan decisión del dueño antes de programar)

1. **Ciudad y fecha del primer concurso.** Define todo el calendario y la jurisdicción legal del primer set de documentos.
2. **¿Se admiten menores de 18?** *Ahora es más urgente:* al dividir por categorías de edad, una categoría juvenil es lo primero que se pide. Admitir menores activa consentimiento verificable del tutor, minimización de datos, moderación previa obligatoria, restricciones publicitarias y obligaciones adicionales si algún participante fuera menor de 13. Hay que responderla antes de escribir el flujo de inscripción.
3. **Entidad legal operadora por país.** Determina facturación, impuestos, cuentas de Stripe y numeración de comprobantes.
4. **¿Un canal de YouTube global o uno por país?** Afecta la cuota, la marca y la audiencia. Recomendación: uno global con playlists por ciudad en R1.
5. **¿El premio es en efectivo?** Si lo es, hay retenciones, formularios fiscales (W-9/W-8BEN en EE. UU.) y requisitos de identidad que hoy no están modelados.
6. **¿Lanzar R1 solo, o esperar a R4?** Es la decisión con mayor impacto en el calendario.
7. **Presupuesto y equipo.** El roadmap asume ~4,5 personas. Con 2 se duplica el calendario; con 7 no se reduce a la mitad.
8. **Nombre y propiedad de la cuenta de Stripe, dominio y canal**: deben estar a nombre de la empresa, no de una persona, desde el día uno.
9. **¿Membresía desde R1 o desde R2?** Recomendación: R2, para no dividir la atención del lanzamiento.
10. **Idiomas de lanzamiento.** Español y/o inglés en R1; el modelo ya soporta ambos, pero cada idioma es trabajo editorial real y continuo.

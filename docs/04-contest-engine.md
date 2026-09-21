# 04 · Contest Engine: series, geografía, builder, campeonatos, jurado, scoring, votación y antifraude

> Entregables: 29 (Contest Engine Architecture), 32 (Contest Builder), 33 (Championship), 34 (Jury), 35 (Scoring), 36 (Voting), 37 (Anti-Fraud), más 27–38 y 53–60 del brief.

## 29. Arquitectura del motor

```
brand
 └─ series                (COMICOMANIA EL CONCURSO · UNIVERSITARIOS · NUEVOS TALENTOS)
     └─ seasons           (2027, 2027-B)
         └─ contests      (edición ejecutable: "COMICOMANIA MIAMI 2027")
             ├─ contest_geographies   (1..n ciudades/regiones/países)
             ├─ contest_eligibility   (reglas como datos)
             ├─ rounds (orden, tipo, fechas, config de scoring y voto)
             │   └─ categories
             ├─ participants  →  entries (1 por participante × ronda)  →  videos
             ├─ judge_assignments → judge_scores
             ├─ votes
             └─ qualification_links (aristas hacia otros contests)
```

**Decisión clave:** `participant` (la persona dentro de un concurso) y `entry` (su envío en una ronda) son entidades separadas. Sin esa separación, las rondas múltiples, la re-subida de video y el avance entre concursos se vuelven imposibles de modelar limpiamente.

### Estados
- `contest`: `DRAFT → SCHEDULED → OPEN_REGISTRATION → SUBMISSIONS_OPEN → IN_REVIEW → VOTING → JUDGING → RESULTS → CLOSED → ARCHIVED` (las fases pueden solaparse por ronda).
- `participant`: `REGISTERED → PROFILE_COMPLETE → SUBMITTED → QUALIFIED → ELIMINATED → SEMIFINALIST → FINALIST → WINNER → ALUMNI` (+ `DISQUALIFIED` con motivo y auditoría).
- `round`: `PENDING → OPEN → LOCKED → SCORING → RESOLVED`.

### Reglas como datos
`contest_eligibility` guarda JSON evaluado por un intérprete puro y testeado:
```json
{"all":[{"age_min":18},{"residency":{"country":"US","cities":["miami","hialeah"]}},
        {"prior_participation":{"series":"main","max_wins":0}},
        {"requires":["email_verified"]}]}
```
El mismo intérprete se usa en el formulario (validación en vivo) y en el servidor (verdad).

## Categorías del concurso — clasificación por edad y por cualquier otro eje

Decisión tomada: **los participantes no compiten todos contra todos.** El concurso se divide en categorías, y la edad es el primer eje.

### El modelo es genérico; la edad es un caso especial indexado

```sql
categories(
  id, contest_id, slug, name, order, description,
  assignment    enum('AUTO','SELF','ADMIN') default 'AUTO',
  min_age int null, max_age int null,        -- desnormalizado para validar e indexar
  eligibility   jsonb,                       -- cualquier otro criterio
  min_participants int null,                 -- umbral de viabilidad
  merge_into_category_id uuid null,          -- a dónde se fusiona si no llega
  prize jsonb, status,
  UNIQUE(contest_id, slug)
)
```

El mismo mecanismo sirve, sin código nuevo, para: **edad**, estilo (stand-up, improvisación, personajes), universitarios vs. abiertos, amateur vs. profesional, idioma de la rutina, o categorías de sponsor. La edad solo tiene columnas propias porque se valida y se consulta constantemente.

### Las seis reglas que hacen que funcione en la vida real

**1. Fecha de referencia de la edad — fija, por concurso.**
`contests.age_reference_date`, por defecto la **fecha de cierre de inscripciones**. Sin esto, alguien que cumple años a mitad del concurso cambiaría de categoría entre la ronda 1 y la final. Es el error clásico que arruina un concurso ya andando; se define una vez, se congela en `participants.age_at_reference` y no se recalcula nunca más.

**2. Asignación automática, no elegida.**
Con `assignment = 'AUTO'`, la categoría sale de la fecha de nacimiento verificada. El participante la ve, no la escoge. Elimina de raíz el fraude de categoría (inscribirse como juvenil teniendo 30).

**3. Verificación de edad en dos tiempos.**
Pedir documento al inscribirse mata la conversión. Pedirlo nunca es un problema legal el día que se entrega un premio. La solución es escalonada:
`participants.age_verification`: `DECLARED → DOCUMENT_REQUESTED → VERIFIED → MISMATCH`.
Se declara al inscribirse; se exige documento **solo al clasificar a semifinal o final**. Un `MISMATCH` dispara un caso de Trust & Safety, no una descalificación automática.

**4. Fusión automática si una categoría no llega al mínimo.**
Con 60 inscritos y 5 categorías quedan 12 por categoría y el concurso se siente vacío. `min_participants` + `merge_into_category_id` permiten que, al cerrar inscripciones, el sistema avise: *"MASTER 40+ tiene 9 participantes; el mínimo es 20. ¿Fusionar con ADULTO 26–39?"*. La fusión la confirma una persona, queda auditada y se notifica a los afectados. Regla práctica: **no lanzar una categoría que no espere al menos 20–25 participantes.**

**5. Cada categoría es un concurso dentro del concurso.**
- **Avance**: `advancement_rules.scope` = `ROUND` (global) o `CATEGORY` (top 3 de cada categoría). Por defecto, `CATEGORY`.
- **Jurado**: `judge_assignments` puede filtrarse por categoría, para jueces especializados.
- **Scoring**: `rounds.scoring_config` admite override por categoría — a un juvenil de 16 años no se le pesa igual la presencia escénica que a un profesional de 35.
- **Votación**: y esto es importante — la proporción de votos se calcula **por ronda *y* categoría**, no globalmente. Si una categoría tiene 200 participantes y otra 20, un porcentaje global distorsiona el resultado de la pequeña.
- **Premios**: tabla `prizes(contest_id, category_id, round_id, rank, description, value, currency)`. Cada categoría puede tener su premio, y puede existir además un premio absoluto.
- **Landing**: filtro por categoría en la grilla de participantes y en la votación, con la categoría visible en cada tarjeta.

**6. Final absoluta, opcional.**
Si se quiere un campeón único, el ganador de cada categoría pasa a una final cruzada. No requiere nada nuevo: son `qualification_links` con `criteria = 'WINNER'` desde cada categoría hacia el contest de la final absoluta.

### Ejemplo de configuración (editable desde el Contest Builder, paso 8)

| Categoría | Rango | Mín. | Notas |
|---|---|---|---|
| JUVENIL | 16–17 | 20 | **Solo si se decide admitir menores** — activa consentimiento de tutor, datos minimizados y moderación previa obligatoria |
| JOVEN | 18–25 | 25 | |
| ADULTO | 26–39 | 25 | |
| MASTER | 40+ | 20 | Fusiona con ADULTO si no llega |

Recomendación para la primera ciudad: **tres categorías de adultos** (18–25, 26–39, 40+). Con ~300 inscritos quedan ~100 por categoría, que es un concurso vivo en cada una. Sumar más ejes (estilo, universitarios) recién cuando el volumen lo justifique.

> ⚠️ **La categoría juvenil no es una decisión de producto, es una decisión legal.** Admitir menores de 18 activa consentimiento verificable del tutor, minimización de datos (no mostrar ciudad exacta ni redes personales), moderación previa obligatoria del contenido, restricciones publicitarias, y en Estados Unidos obligaciones adicionales si algún participante fuera menor de 13. Es la pregunta abierta #2 de `14-decisiones-riesgos-preguntas.md` y hay que responderla **antes** de escribir el flujo de inscripción, no después.

## 30/31. Multi-país y multi-ciudad
Un `contest` puede cubrir una ciudad, varias ciudades, una región o un país entero (`contest_geographies`). El participante se ancla a la geografía por su residencia declarada y verificada; los conflictos los resuelve el operador con log. Las landings se generan por geografía: `/concursos/us/miami/2027`, `/concursos/mx/cdmx/2027`.

## 32. Contest Builder (wizard de 14 pasos)
Pasos: Información básica · Serie/Temporada · Ubicación · Elegibilidad · Fechas · Requisitos de video · Rondas · Categorías · Scoring · Votación · Landing · Sponsors · Campaña · Publicar.

Comportamiento:
- **Guardado incremental** en `DRAFT`; se puede abandonar y volver.
- **Validación de publicación**: no se publica sin bases legales, carta de consentimiento vigente para la jurisdicción, al menos una ronda, criterios de scoring que sumen 100%, y fechas coherentes.
- **Plantillas**: `contest_templates` guarda un snapshot JSONB de toda la configuración. `Duplicar` crea un concurso nuevo copiando reglas, rondas, scoring, requisitos y automatizaciones, y pide explícitamente lo que **debe** cambiar: ciudad, fechas, sponsors, campaña, premios.
- **Vista previa** de la landing antes de publicar.

Miami → Orlando debe tomar **menos de 10 minutos** sin intervención de desarrollo. Ese es el criterio de aceptación del motor.

## 33. Championship Architecture
El avance entre concursos es un **grafo**, no una jerarquía fija:

```
qualification_links(
  id, from_contest_id, from_round_id, to_contest_id,
  slots int, criteria enum('WINNER','TOP_N','BEST_SCORE_POOL','WILDCARD','MANUAL'),
  criteria_config jsonb, auto_advance bool, status)
```

Miami/Orlando/Tampa → Florida Final → USA Final → International Final se expresa con seis aristas y cero código nuevo. Los wildcards ("los 3 mejores puntajes entre no ganadores de todas las ciudades") son un `BEST_SCORE_POOL` sobre varios `from_contest_id`. El historial completo queda en `participant_contest_history` colgando del COMICOMANIA ID.

## 34. Jury Architecture
- `judges` (perfil público del jurado) ≠ `users` con rol JUDGE (acceso). Un juez invitado tiene ambas cosas.
- `judge_assignments(judge_id, round_id, entry_id, due_at, status)` — asignación explícita; un juez solo ve lo asignado.
- **Reparto**: manual, equitativo automático, o por categoría. Regla de conflicto de interés: el sistema bloquea la asignación si el juez y el participante comparten ciudad+apellido declarado o si el operador marca conflicto.
- `judge_scores(assignment_id, criteria_scores jsonb, comment, submitted_at, locked_at)`.
- **Ciego**: hasta enviar, ningún juez ve notas ajenas; tras el envío, `LOCK`. Reabrir exige `SCORING.EDIT` con MFA, motivo y queda en auditoría con valor anterior y nuevo.
- Deadlines con recordatorios automáticos y panel de progreso por juez.

## 35. Scoring Architecture
Configuración por concurso/ronda/categoría:
```json
{"criteria":[{"slug":"originalidad","weight":30},{"slug":"risa","weight":25},
             {"slug":"presencia","weight":15},{"slug":"creatividad","weight":15},
             {"slug":"conexion","weight":15}],
 "scale":{"min":1,"max":10,"step":0.5},
 "mix":{"jury":70,"audience":30},
 "normalization":"z_score_per_judge",
 "audience_transform":"share_of_valid_votes",
 "tie_breakers":["jury_score","criteria:risa","earliest_submission"],
 "drop_extremes":false}
```

Decisiones técnicas relevantes:
- **Normalización por juez (z-score)**: corrige jueces duros y jueces blandos. Sin esto, el resultado depende de a quién te tocó. Configurable, activada por defecto.
- **Voto del público como proporción**, no como puntos absolutos: `audience_points = (votos_válidos_participante / votos_válidos_ronda) × peso`. Así una ronda con 200 votos y otra con 20.000 son comparables.
- El cálculo es una **función pura** (`packages/domain/scoring`) con tests de tabla: mismo input, mismo resultado, reproducible y auditable. Los resultados se **materializan** en `round_results` al resolver la ronda, con el snapshot de la configuración usada. Cambiar la configuración después no reescribe la historia.

## 36. Voting Architecture
- **Nunca voto anónimo.** Requisito mínimo: usuario con email verificado.
- Regla por defecto: `1 usuario × 1 voto × participante × ronda`. Todo configurable en `vote_rules`: votos por usuario por ronda, por día, por participante, exigir teléfono verificado, antigüedad mínima de cuenta, exigir membresía (no recomendado), ventana horaria.
- Garantía de unicidad en la base de datos:
  `UNIQUE (round_id, participant_id, user_id) WHERE status = 'VALID'` — una constraint, no una comprobación en código.
- Idempotencia: cada POST lleva `Idempotency-Key`; el reintento del móvil no duplica ni da error confuso.
- La intención de voto sobrevive al registro (se guarda `pending_vote` en sesión y se ejecuta tras verificar).
- Conteos públicos desde una vista materializada refrescada cada N segundos, nunca `COUNT(*)` en caliente.

## 37. Anti-Fraud Model
Defensa por capas, con la premisa de que **ningún voto se borra**: se marca.

`votes.status`: `VALID | SUSPECT | INVALIDATED | PENDING_REVIEW`

| Capa | Mecanismo |
|---|---|
| Identidad | email verificado obligatorio; teléfono opcional configurable; bloqueo de dominios desechables; antigüedad mínima |
| Transporte | rate limit por usuario, IP y dispositivo; CAPTCHA (Turnstile) solo ante riesgo, no por defecto |
| Señales | `vote_signals(vote_id, ip_hash, asn, is_datacenter, device_fp_hash, ua, referrer, geo, created_at)` |
| Velocidad | votos/minuto por participante contra su línea base; alerta y modo revisión automática al superar umbral |
| Grafo | cuentas creadas en ráfaga desde el mismo ASN/fingerprint que votan al mismo participante |
| Humano | cola de revisión: el operador ve el clúster sospechoso y decide; invalidar exige motivo y queda auditado |
| Transparencia | las bases del concurso explican que los votos fraudulentos se anulan y que la decisión final es del comité |

Métricas del panel de votación: total, válidos, sospechosos, invalidados, por participante, por país, por ciudad, por fecha, velocidad, fuente (UTM), y tasa de conversión ver→votar.

**Lo que no hacemos**: no usamos IA como autoridad final para invalidar votos ni para elegir ganadores (brief 142). La IA propone clústeres; la persona decide.

## 60. Conversión post-voto
Después de confirmar el voto, una sola pantalla con: seguir al talento, ver 3 participantes recomendados de su ciudad, entradas del evento final, y "cómo participar la próxima temporada". Es el punto de mayor intención del embudo y se mide como tal.

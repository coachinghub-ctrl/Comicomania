# 02 · COMICOMANIA ID, tipos, niveles, roles, permisos y aislamiento

> Entregables: 7 (User Types), 8 (User Levels), 9 (Roles), 10 (Permission Matrix), 11 (Territory Scope), 12 (Section Scope), 13 (Access Control Model), 68 (Access Control Architecture), 18 (Data Isolation), 19 (Financial Access), 20 (Super Admin), 21 (Access Audit), 132 (Audit).

## Principio rector

> **Tipo ≠ Nivel ≠ Rol.**
> El **tipo** describe qué es la persona. El **nivel** describe cuánto ha avanzado y qué beneficios recibe. El **rol con grant** es la *única* fuente de autoridad administrativa.
> Subir de nivel jamás otorga permisos. Tener un tipo jamás otorga permisos. Solo un grant otorga permisos.

## COMICOMANIA ID

Un registro `users` por persona. Todo lo demás cuelga de ahí.

```
users(id, email, email_verified_at, phone, phone_verified_at, password_hash?,
      first_name, last_name, display_name, handle, avatar_url, dob_enc,
      country_id, region_id, city_id, locale, timezone, marketing_opt_in,
      status, mfa_enabled, referral_code, created_at, last_active_at, deleted_at)
```

- `handle` único global: sirve para `/humoristas/[handle]` y `/talent/[handle]`.
- Fusión de cuentas (`merge_user(from,to)`) obligatoria desde el día uno: la gente se registra dos veces. Reasigna votos, órdenes, participaciones y consentimientos con log.
- Borrado: soft delete + anonimización (DSAR). Los votos y órdenes se conservan anonimizados por integridad del concurso y contable.

## 7. User Types (catálogo, no enum de código)

`user_types(slug, name, is_public, requires_profile, created_at)`
`user_type_assignments(user_id, user_type_id, assigned_at, source)`

Iniciales: `HUMORISTA`, `ESPECTADOR`, `ESTUDIANTE`, `BUSINESS_OWNER`, `BUSINESS_OPERATOR`, `JUDGE`, `SPONSOR_CONTACT`, `TALENT_CLIENT`, `AMBASSADOR`.

Un usuario puede tener varios. Cada tipo activa secciones de UI y campos de perfil, **no permisos**.

## 8. User Levels (por track, configurables)

`user_levels(slug, track, name, rank, criteria_json, benefits_json)`
`user_level_assignments(user_id, level_id, granted_at, revoked_at, reason)` — historial, nunca update destructivo.

| Track | Niveles |
|---|---|
| community | MEMBER · ACTIVE_MEMBER · INSIDER · VIP · AMBASSADOR |
| comedian | REGISTERED_COMEDIAN · CONTESTANT · ALUMNI · DEVELOPING_TALENT · FEATURED_TALENT · COMICOMANIA_TALENT · REPRESENTED_TALENT |
| student | STUDENT · ACTIVE_STUDENT · GRADUATE · CERTIFIED · ADVANCED |
| operator | ASSISTANT · OPERATOR · MANAGER · DIRECTOR · EXECUTIVE |

`criteria_json` permite automatizar ascensos (ej. `{"all":[{"event":"order.paid","count":1},{"event":"vote.cast","count":5}]}`). El nivel operator es **descriptivo** (aparece en el organigrama y en el directorio interno); su autoridad real sigue estando en los grants.

## 9. Roles

`roles(slug, name, description, is_system, default_sections[], default_actions[], denied_permissions[])`

Roles base: `OWNER`, `SUPER_ADMIN_TECH`, `COUNTRY_DIRECTOR`, `CITY_MANAGER`, `CONTEST_MANAGER`, `CONTENT_REVIEWER`, `JUDGE_COORDINATOR`, `JUDGE`, `CRM_AGENT`, `COMMERCE_MANAGER`, `EVENT_OPS`, `ACADEMY_MANAGER`, `TALENT_MANAGER`, `SPONSOR_MANAGER`, `FINANCE_VIEWER`, `FINANCE_MANAGER`, `SUPPORT_AGENT`, `LEGAL_REVIEWER`, `AUDITOR` (solo lectura, todo).

El rol es una **plantilla** de secciones+acciones. El grant puede recortarla, nunca ampliarla más allá de lo que el otorgante posee.

## 13/68. Modelo de Access Control — el grant

```sql
access_grants(
  id, user_id, role_id,
  scope_type    enum('GLOBAL','COUNTRY','REGION','CITY','CONTEST','EVENT','VENUE'),
  scope_id      uuid null,            -- null solo si GLOBAL
  sections      text[],               -- subconjunto de role.default_sections
  actions       text[],               -- subconjunto de role.default_actions
  finance_level enum('NONE','LOCAL','CITY','COUNTRY','GLOBAL') default 'NONE',
  starts_at timestamptz, ends_at timestamptz null,
  status enum('ACTIVE','SUSPENDED','EXPIRED','REVOKED'),
  granted_by uuid, reason text, created_at
)
```

**Resolución de autoridad** (una sola función, un solo lugar):

```ts
authorize(actor, {
  section: 'VIDEO_REVIEW',
  action:  'APPROVE',
  object:  { type: 'video', id }          // el scope se DERIVA del objeto, no del request
}): void   // lanza ForbiddenError
```

Algoritmo:
1. Cargar grants `ACTIVE` y vigentes del actor (cache por request, TTL 60 s, invalidado por `grant.changed`).
2. Resolver el **scope real del objeto** desde la base de datos (`video → entry → contest → city → region → country`). Nunca desde parámetros del cliente.
3. Un grant aplica si `containment(grant.scope, object.scope)` es verdadero: `GLOBAL ⊃ COUNTRY ⊃ REGION ⊃ CITY ⊃ {CONTEST, EVENT, VENUE}`.
4. Debe incluir la sección y la acción pedidas.
5. Restar `role.denied_permissions` (deny gana siempre).
6. Si la acción está marcada `requires_mfa`, exigir sesión con 2FA reciente (< 12 h).
7. Registrar en `audit_logs` toda decisión de escritura (permitida o denegada).

### 11. Territory Scope Model
Los territorios son un árbol materializado (`path` tipo `US.FL.MIA`) para que la contención sea una comparación de prefijo y no un recorrido recursivo. Un operador puede tener varios grants (multi-ciudad = varios grants o un grant por ciudad; multi-país = grants por país).

Ejemplo pedido en el brief: Operador A con grant `CITY = Miami`. Consulta `/admin/participantes?cityId=orlando` → el guard resuelve el scope del recurso pedido (Orlando), no encuentra contención, devuelve 403 y escribe el intento en auditoría. Si en vez de filtro usa un ID directo (`/admin/participantes/<id de Orlando>`), el guard resuelve el scope del objeto y también falla. **No existe ruta por la que un ID adivinado entregue datos de otro territorio.**

### 12. Section Scope Model
Secciones (catálogo cerrado, versionado):
`COMMUNITY, USERS, ACCESS_CONTROL, CRM, SERIES, SEASONS, CONTESTS, PARTICIPANTS, VIDEOS, VIDEO_REVIEW, JUDGES, SCORING, VOTING, CAMPAIGNS, CONTENT, EVENTS, TICKETING, STORE, PRODUCTS, INVENTORY, ORDERS, SHIPPING, MEMBERSHIPS, EXPERIENCES, TOURS, ACADEMY, TALENT, BOOKINGS, SPONSORS, COMMERCIAL_INVENTORY, LICENSING, FINANCE, ANALYTICS, AUTOMATIONS, LEGAL, TRUST_SAFETY, AUDIT, REPORTS, SETTINGS, INFRA`

Acciones: `VIEW, CREATE, EDIT, DELETE, APPROVE, REJECT, PUBLISH, UNPUBLISH, ASSIGN, EXPORT, IMPORT, REFUND, PAY, INVITE, CONFIGURE, MANAGE`.

## 10. Permission Matrix (extracto — la matriz completa vive en `packages/authz/matrix.ts` y se testea)

`•` permitido · `—` no · `M` requiere MFA · `O` solo OWNER

| Sección / Acción | OWNER | SUPER_ADMIN_TECH | COUNTRY_DIRECTOR | CITY_MANAGER | CONTEST_MANAGER | CONTENT_REVIEWER | JUDGE | FINANCE_MANAGER | SUPPORT_AGENT | AUDITOR |
|---|---|---|---|---|---|---|---|---|---|---|
| ACCESS_CONTROL · VIEW | • M | • | — | — | — | — | — | — | — | • |
| ACCESS_CONTROL · MANAGE | • M | — | — | — | — | — | — | — | — | — |
| CONTESTS · CREATE | • | — | • | • | • | — | — | — | — | — |
| CONTESTS · PUBLISH | • | — | • | • | — | — | — | — | — | — |
| PARTICIPANTS · VIEW | • | — | • | • | • | • | — | — | • | • |
| VIDEO_REVIEW · APPROVE | • | — | • | • | • | • | — | — | — | — |
| VIDEOS · PUBLISH | • | — | • | • | — | • | — | — | — | — |
| SCORING · CONFIGURE | • | — | • | — | • | — | — | — | — | — |
| SCORING · EDIT (reabrir nota) | • M | — | • M | — | — | — | — | — | — | — |
| JUDGES · ASSIGN | • | — | • | • | • | — | — | — | — | — |
| JUDGES · VIEW (mis videos) | • | — | • | • | • | — | • | — | — | • |
| VOTING · VIEW | • | — | • | • | • | — | — | — | • | • |
| VOTING · MANAGE (invalidar) | • M | — | • M | — | — | — | — | — | — | — |
| ORDERS · REFUND | • M | — | • M | — | — | — | — | • M | — | — |
| FINANCE · VIEW | • | — | • (país) | • (ciudad) | — | — | — | • | — | • |
| FINANCE · EXPORT | • M | — | • M | — | — | — | — | • M | — | • |
| LEGAL · CONFIGURE | • M | — | — | — | — | — | — | — | — | — |
| TRUST_SAFETY · MANAGE | • | — | • | • | — | • | — | — | • | — |
| AUDIT · VIEW | • | • | • (su país) | — | — | — | — | — | — | • |
| SETTINGS · CONFIGURE | • M | — | — | — | — | — | — | — | — | — |
| INFRA · MANAGE | — | • M | — | — | — | — | — | — | — | — |
| Cambiar ganador de concurso | O M | — | — | — | — | — | — | — | — | — |

**Reglas duras de la matriz**
1. `ACCESS_CONTROL · MANAGE` es exclusivo del OWNER (y de quien el OWNER delegue explícitamente con grant temporal).
2. Nadie puede otorgar lo que no tiene: `grant ⊆ grants del otorgante` (validado en servidor).
3. `SUPER_ADMIN_TECH` tiene INFRA y AUDIT, y tiene **denegado por lista**: `ORDERS.REFUND`, `FINANCE.*`, `SCORING.EDIT`, `VOTING.MANAGE`, `CONTESTS.RESULT_CHANGE`, `TALENT.CONTRACT`.
4. `AUDITOR` es global de solo lectura, sin EXPORT de PII.
5. Acciones marcadas `M` exigen MFA vigente.

## 17. Access Builder (wizard de 6 pasos)
1. Usuario (buscar por email/handle; invitar si no existe → `invitations`)
2. Territorio (árbol con checkboxes; multi-selección genera varios grants)
3. Secciones (agrupadas por engine, con "seleccionar plantilla de rol")
4. Acciones (matriz sección × acción, con presets `Solo lectura`, `Operación`, `Aprobación`)
5. Período (permanente / rango con fecha de fin obligatoria para temporales) + nivel financiero
6. Revisión: muestra **en lenguaje natural** lo que la persona podrá hacer ("Podrá aprobar y publicar videos del concurso de Miami entre el 1 de marzo y el 30 de junio; no podrá ver finanzas") → Activar.

Al activar: email al beneficiario, notificación al OWNER, fila en `access_history` y en `audit_logs`.

## 18. Data Isolation (cuatro murallas)

1. **UI**: el menú y los botones se renderizan desde los permisos efectivos (evita confusión, no es seguridad).
2. **Caso de uso**: `authorize()` obligatorio. Un test de arquitectura falla el build si un procedure de admin no invoca el guard.
3. **Consulta**: todo repositorio de admin recibe `scopeFilter(actor, section)` que inyecta `WHERE city_id IN (...) OR country_id IN (...)`. Las listas no pueden construirse sin él (el tipo `ScopedQuery` lo exige en compilación).
4. **Base de datos**: RLS en Postgres sobre las tablas sensibles usando `SET LOCAL app.actor_id`; políticas que repiten la contención de territorio. Es defensa en profundidad contra un bug de aplicación.

Además: los IDs públicos son **UUIDv7** (no secuenciales) y los endpoints de admin devuelven 404 (no 403) cuando el objeto existe pero está fuera de territorio, para no filtrar existencia.

## 19. Financial Access
`finance_level` en el grant: `NONE | LOCAL | CITY | COUNTRY | GLOBAL`.
- `LOCAL`: solo los objetos que la persona gestiona (su evento, su concurso).
- `CITY`: P&L de la ciudad — ingresos por tickets/tienda/academia y gastos imputados a esa ciudad.
- `COUNTRY`: consolidado del país, sin consolidado global ni costos corporativos.
- `GLOBAL`: todo, incluyendo salarios, licensing y corporativo. Requiere MFA para VIEW.
Los costos corporativos se marcan `cost_center = CORPORATE` y quedan fuera de cualquier nivel inferior a GLOBAL.

## 20. Owner vs Super Admin técnico
Dos personas distintas, dos roles distintos, sin superposición. El técnico opera la plataforma; el dueño opera el negocio. Toda acción del técnico sobre datos de negocio queda auditada y requiere un grant temporal de emergencia ("break-glass"): máximo 4 horas, motivo obligatorio, notificación inmediata al OWNER, expiración automática, reporte posterior.

## 21/132. Auditoría
```
audit_logs(id, actor_user_id, actor_role, scope_type, scope_id, section, action,
           object_type, object_id, previous_value jsonb, new_value jsonb,
           result enum('ALLOWED','DENIED'), ip, user_agent, request_id,
           created_at, prev_hash, hash)
```
- **Append-only** (sin UPDATE/DELETE por permisos de base de datos), con **encadenamiento hash** (`hash = sha256(prev_hash || row)`) para hacer evidente cualquier manipulación.
- Eventos obligatorios: cambios de rol/permiso/scope, aprobación y publicación de video, invalidación de votos, reapertura de notas, refunds, cambios de resultado o ganador, cambio de status de talento, cambios de documento legal, cambios financieros, logins de admin, exportaciones de datos, accesos denegados.
- Retención 7 años; exportación firmada para auditorías externas.

# 12 · Seguridad, Trust & Safety, testing, despliegue y recuperación

> Entregables: 65 (Localization ya en 01), 66 (Security), 67 (Trust & Safety), 78 (Testing), 79 (Security Testing), 80 (Deployment), 81 (Backup & Recovery); brief 128, 131, 132.

## 66. Security Architecture

### Identidad y sesión
- Verificación de email obligatoria para votar, participar y comprar.
- Magic link + OAuth; contraseña opcional con Argon2id si se habilita.
- **2FA (TOTP) obligatorio** para cualquier usuario con grant en `FINANCE`, `ACCESS_CONTROL`, `VIDEO_REVIEW`, `VOTING`, `SCORING`, `LEGAL`, `SETTINGS`, `INFRA`.
- Sesiones con rotación de token, expiración por inactividad (30 días usuarios / 12 horas admin), revocación remota, y listado de dispositivos.
- Protección de credenciales: rate limit progresivo, bloqueo temporal, alerta por login desde país nuevo.

### Autorización
Ver 02. Resumen: RBAC + scope territorial + sección + acción + ventana temporal, con deny-list, resolución del scope desde el objeto (no desde el request), filtros de consulta obligatorios y RLS como segunda muralla.

### Aplicación
| Amenaza | Control |
|---|---|
| IDOR / enumeración | UUIDv7, scope resuelto desde el objeto, 404 en vez de 403 fuera de territorio |
| XSS | React por defecto + CSP estricta (`script-src 'self'` + nonce), sanitización del contenido editorial |
| CSRF | Cookies `SameSite=Lax` + doble submit en formularios sensibles |
| SQLi | Prisma parametrizado; SQL crudo solo con parámetros tipados y revisión obligatoria |
| Subida de archivos | Tipo MIME real por sniffing, extensión en lista blanca, tamaño máximo, antivirus, almacenamiento fuera del dominio de la app, nombres generados |
| SSRF | Lista blanca de destinos para cualquier fetch server-side |
| Secretos | Vercel/Fly env + rotación semestral; nunca en el repo; escaneo de secretos en CI |
| Datos | TLS en tránsito, cifrado en reposo, **cifrado a nivel de columna** para fecha de nacimiento, teléfono, nombre legal de talento y datos fiscales |
| Abuso | Rate limits por ruta; Turnstile por riesgo; detección de bots en votación |
| Dependencias | Renovate + `npm audit` + SCA en CI; build reproducible |

### Privacidad y cumplimiento (multi-país lo vuelve obligatorio)
- Base legal por finalidad y país; consentimiento de marketing granular y revocable.
- **DSAR**: exportar mis datos y eliminar mi cuenta desde `/mi/privacidad`, con SLA de 30 días y anonimización que preserva integridad de concursos y contabilidad.
- Retención: eventos crudos 24 meses; logs 12 meses; auditoría 7 años; video master según reglas del concurso y de la carta.
- Menores: si un concurso admite <18, consentimiento de tutor obligatorio y datos minimizados. Por defecto, 18+.
- Encargados de tratamiento documentados (Stripe, Google, Cloudflare, Resend) y DPA firmados.

## 67/128. Trust & Safety

```
trust_cases(id, type, reporter_user_id, object_type, object_id, description,
            status, priority, assignee_user_id, sla_due_at, resolution, resolved_at)
trust_case_actions†(id, case_id, action, actor_user_id, notes, created_at)
```
- Tipos: contenido reportado, usuario reportado, reclamo de copyright (DMCA), apelación, disputa de concurso, disputa de votación, acoso, problema técnico.
- Estados: `OPEN → UNDER_REVIEW → ACTION_REQUIRED → RESOLVED | REJECTED → APPEALED`.
- Acciones posibles: ocultar contenido, despublicar, descalificar participante (con auditoría), suspender usuario, invalidar votos, advertir, cerrar sin acción.
- **DMCA**: recepción, notificación al participante, despublicación preventiva, contra-notificación, restitución o bloqueo definitivo. Todo con plazos y evidencia.
- **Apelación garantizada** para descalificaciones y suspensiones: la revisa alguien distinto de quien tomó la decisión.
- Reglas de convivencia públicas y visibles antes de participar y de comentar (F2).
- Moderación asistida por IA en la cola (clasificación, prioridad), **nunca** como decisión final.

## 78. Testing Strategy

| Nivel | Alcance | Herramienta | Criterio |
|---|---|---|---|
| Unitario de dominio | scoring, avance, elegibilidad, reglas de voto, precios, beneficios, next action | Vitest | **Cobertura ≥95% en `packages/domain`** — es donde vive el negocio |
| **Tests dorados de autorización** | matriz sección×acción×territorio×rol | Vitest, tabla de ~300 casos | 100% de la matriz; un cambio de permisos que no actualice la tabla rompe el build |
| Integración | repositorios, transacciones, constraints (unicidad de voto, bloqueo de publicación sin derechos) | Vitest + Testcontainers (Postgres real) | Las constraints se prueban contra Postgres, no simuladas |
| Contrato | OpenAPI vs implementación; webhooks de Stripe/YouTube con payloads reales grabados | Schemathesis / fixtures | Sin llamadas reales en CI |
| E2E | 8 journeys críticos | Playwright | Ver abajo |
| Carga | votación y venta de entradas | k6 | 10.000 votos/min sostenidos; 2.000 checkouts en 5 min sin sobreventa |
| Accesibilidad | páginas públicas clave | axe + revisión manual | 0 violaciones críticas |
| Visual | componentes del design system | Chromatic/Playwright snapshots | Sin regresiones no aprobadas |

**Journeys E2E obligatorios**: registro+verificación · inscripción a concurso · subida de video con consentimiento · revisión y publicación · votación (incluida la unicidad) · evaluación de jurado con bloqueo · compra mixta con pago y entitlements · check-in con QR duplicado.

**Test de aislamiento** (crítico y explícito): un operador de Miami intenta 40 rutas distintas hacia datos de Orlando (query param, ID directo, endpoint REST, export, búsqueda global, webhook, API de analytics). Las 40 deben fallar y quedar en auditoría.

## 79. Security Testing Strategy
- SAST (CodeQL) y escaneo de secretos en cada PR; SCA de dependencias diario.
- **Fuzzing de autorización**: un arnés que recorre todos los endpoints con tokens de actores de distinto scope y compara contra la matriz esperada.
- DAST (ZAP) sobre staging en cada release.
- **Pentest externo obligatorio antes de abrir la votación pública** y antes de habilitar pagos en producción. Es el momento de máxima exposición (dinero + reputación + incentivo real para hacer trampa).
- Programa de reporte responsable (`/security.txt`) desde el lanzamiento.
- Revisión de permisos trimestral: quién tiene qué grant y por qué; expiración automática de los temporales.

## 80. Deployment Strategy
- Ramas: `main` (producción) ← `develop` ← features. Preview automático por PR con base de datos efímera sembrada.
- Entornos: **preview** (por PR) · **staging** (datos realistas anonimizados, integraciones en sandbox) · **production**.
- Migraciones **expand/contract**: primero agregar y desplegar, luego migrar datos, luego eliminar. Nunca una migración destructiva en el mismo deploy que el código que la necesita.
- Feature flags para todo lo grande (votación, checkout, nuevo engine): se despliega apagado y se enciende por ciudad.
- Despliegue progresivo: canary por porcentaje en Vercel; rollback en un clic; el worker de medios se despliega aparte.
- Checklist de release: migraciones aplicadas, flags revisadas, webhooks verificados, cuota de YouTube disponible, plan de rollback escrito, responsable de guardia designado.
- **Congelamiento de cambios** en las 48 horas previas al cierre de votación y a una final en vivo.

## 81. Backup & Recovery Strategy
- Postgres: **PITR continuo** (7 días) + snapshot diario (30 días) + mensual (12 meses), en región distinta.
- R2: versionado de objetos + replicación del bucket de masters; los masters de video son irrecuperables si se pierden (el participante ya no los tiene).
- Secretos: respaldo cifrado offline con custodia dividida.
- **Objetivos: RPO ≤ 5 minutos, RTO ≤ 1 hora** para la plataforma; RTO ≤ 15 minutos para votación durante una ronda activa (modo degradado de solo lectura antes que caída total).
- **Simulacro de restauración trimestral**, documentado, con cronómetro. Un backup que nunca se restauró no es un backup.
- Runbooks escritos: caída de la base, cuota de YouTube agotada, webhook de Stripe caído, ataque de votos, pérdida de un master, filtración de credenciales.
- Plan de continuidad para el evento en vivo: check-in offline, padrón exportado en PDF y CSV como último recurso.

# 00 · Visión, estrategia y principios

> Entregables cubiertos: 1 (Executive Product Vision), 2 (Community Strategy), 3 (Business Ecosystem Map), 124 (North Star), 143/146/147 (principios finales).

## 1. Executive Product Vision

**COMICOMANIA DIGITAL ENGINE™** es una plataforma propietaria de comunidad y entretenimiento cuyo activo central no es el concurso: es la **identidad persistente** de cada persona que toca la marca (COMICOMANIA ID) y el **historial acumulado** que cuelga de ella.

El concurso es el motor de adquisición de mayor conversión. La comunidad, el contenido, la academia, los eventos y el comercio son los motores de retención y monetización. La arquitectura debe reflejar exactamente eso: **el concurso es un objeto configurable dentro del sistema, nunca el sistema**.

Tres afirmaciones que ordenan todas las decisiones técnicas del documento:

1. **Una persona = un ID = un historial.** Ningún módulo crea usuarios propios. Ningún módulo guarda su propia copia del perfil.
2. **Todo lo local es dato, no código.** Ciudad, país, temporada, reglas de ronda, criterios de jurado, pesos de scoring, versiones legales, catálogos de niveles: filas en tablas, no constantes en el repositorio.
3. **La autoridad se otorga, no se hereda.** Nadie obtiene acceso por ser "manager" o por tener nivel alto. El acceso existe solo si hay una concesión explícita (grant) con territorio, sección, acción y ventana temporal.

### Qué estamos construyendo, en una línea
Una plataforma de comunidad de comedia, multi-país, con un motor de concursos ilimitados, un pipeline de video con control de derechos, y una columna comercial única (tickets + tienda + cursos + membresías + experiencias) sobre una sola identidad.

### Qué NO estamos construyendo (y conviene decirlo ahora)
- No una red social abierta (feed algorítmico, mensajería, muros). Fase 2, y acotada.
- No un reemplazo de YouTube. YouTube es la capa de distribución y almacenamiento de video; la plataforma es la capa de identidad, derechos, competencia y comercio.
- No un ERP contable. FINANCE es gestión y visibilidad de negocio, con exportación hacia la contabilidad formal.

## 2. Community Strategy

La comunidad se construye con **tres compromisos de producto**, no con un módulo:

| Compromiso | Implementación |
|---|---|
| Nunca dejar a un usuario sin siguiente paso | `next_best_action` calculada por estado del usuario, visible en todo dashboard (entregable 138) |
| Toda interacción deja huella en el ID | `user_activity` + `entitlements` + historial de concursos, sin borrado |
| El valor sobrevive al concurso | Alumni, seguidores, favoritos, academia y beneficios persisten entre temporadas |

**Escalera de compromiso** (define los eventos que la plataforma debe emitir y medir):

`Ver contenido` → `Crear ID` → `Seguir` → `Votar` → `Asistir/Comprar` → `Aprender` → `Participar` → `Referir` → `Representar la marca (Ambassador)`

Cada peldaño es un evento de dominio con nombre estable (`user.registered`, `talent.followed`, `vote.cast`, `order.paid`, `lesson.completed`, `referral.converted`). El CRM, las automatizaciones y la analítica consumen esos eventos; ningún módulo consulta las tablas de otro módulo para saber qué pasó.

### Estrategia por ciudad
La comunidad es global pero **se activa localmente**. Cada ciudad tiene: landing propia, concurso propio, eventos propios, colección de tienda propia, embajadores propios y un operador con acceso limitado a ese territorio. El costo marginal de abrir una ciudad debe ser **configuración + campaña**, jamás un deploy.

## 3. Business Ecosystem Map

```
                      ┌──────────────── COMICOMANIA ID ────────────────┐
                      │  perfil · tipos · niveles · consentimientos    │
                      │  historial · entitlements · CRM · actividad    │
                      └───────────────────────────────────────────────┘
        ┌───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
   COMMUNITY    CONTEST     CONTENT     COMMERCE     TALENT   INTELLIGENCE
   follows      series      CMS         cart         perfiles  métricas
   favoritos    seasons     videos      orders       status    dashboards
   feed         contests    YouTube     tickets      booking   rollups
   notif.       rounds      clips       store        contratos north star
   referidos    jurado      SEO         academia     payouts   atribución
                votos                   membresías
                           ▲            experiencias
                           │            tours
        ┌──────────────────┴──────────────────────────────────────────┐
        │  CAPAS TRANSVERSALES                                        │
        │  Access Control · CRM · Automation · Payments · Rights      │
        │  Localization · Security · Audit · Trust&Safety · Analytics │
        └─────────────────────────────────────────────────────────────┘

   ENTRADAS DE DINERO            SALIDAS DE DINERO
   tickets · tienda · cursos     premios · talento · producción
   membresías · sponsors         venue · marketing · tecnología
   bookings · licensing · tours  envíos · legal · comisiones
```

**Actores externos:** YouTube (distribución), Stripe (cobros), proveedores de merch/POD, venues, patrocinadores, medios, licenciatarios internacionales.

## 124. North Star Metric

**ACTIVE COMMUNITY MEMBERS (ACM-30)** = usuarios con COMICOMANIA ID que ejecutaron **al menos una acción de valor** en los últimos 30 días.

Acciones de valor (lista cerrada, versionada):
`vote.cast`, `talent.followed`, `content.watched (≥30s)`, `event.attended`, `order.paid`, `lesson.completed`, `contest.submitted`, `referral.converted`, `community.reacted` (Fase 2).

Métricas de apoyo (no sustituyen la North Star):
- **Activation rate**: % de registros que completan ≥1 acción de valor en 7 días.
- **Retención M1/M3**: % de ACM que siguen activos 1 y 3 meses después.
- **Contribución por ciudad**: ACM y revenue por ciudad, para decidir dónde abrir la siguiente.
- **Revenue per Active Member (RPAM)** mensual.

Seguidores en redes, views y suscriptores se reportan como **alcance**, nunca como comunidad.

## 143 · Filtro de producto

Toda feature propuesta responde por escrito:
1. ¿Qué paso de la escalera de compromiso mueve?
2. ¿Qué evento de dominio emite y qué métrica mueve?
3. ¿Requiere código nuevo o es configuración del motor existente?
4. Si la respuesta a (3) es "código nuevo": ¿por qué el motor no lo cubre y qué le falta al motor?

Si no pasa el filtro: simplificar, eliminar o mandar a Fase 2.

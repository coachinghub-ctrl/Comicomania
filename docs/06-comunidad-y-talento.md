# 06 · Community Architecture y Talent Architecture

> Entregables: 42 (Community), 43 (Talent), 44 (Booking); brief 24–26, 71–79, 107–109.

## 42. Community Architecture

MVP deliberadamente acotado: **no construimos una red social.** Construimos las primitivas que hacen que la gente vuelva.

```
follows(follower_user_id, target_type, target_id, created_at)      -- talento, concurso, ciudad, serie
favorites(user_id, entity_type, entity_id, created_at)             -- video, evento, producto, curso
user_activity(id, user_id, verb, object_type, object_id, city_id, created_at)
feed_items(id, actor_type, actor_id, verb, object_type, object_id,
           audience enum('GLOBAL','CITY','FOLLOWERS'), city_id, published_at, weight)
notifications(id, user_id, type, payload, read_at, channels[], created_at)
notification_preferences(user_id, channel, type, enabled)
```

- **Feed curado, no algorítmico** en MVP: se alimenta de eventos de dominio (nuevo video, nuevo participante, clasificado, ganador, backstage, entrevista, nuevo evento, nueva masterclass, nueva colección, contenido de sponsor) filtrados por ciudad y por a quién sigues. Orden: recencia × peso editorial. Es predecible, auditable y no requiere ML.
- **Notificaciones**: tabla única, entrega multicanal (in-app, email, push en F2), con preferencias por tipo y *frequency cap*. Todo respeta opt-in de marketing por país.
- Fase 2: posts, comentarios, reacciones, grupos, comunidades por ciudad. Cada una exige moderación previa (ver Trust & Safety) — no se abren sin capacidad operativa.

### 26. Perfiles públicos de humorista
`/humoristas/[handle]`: foto, nombre artístico, país, ciudad, bio, redes, videos, historial de concursos, seguidores, próximos eventos, formación en Academia, estado de talento. CTAs: SEGUIR · FAVORITO · VER · VOTAR · COMPRAR ENTRADA. Renderizado con ISR y datos estructurados (schema.org/Person) — estos perfiles son el principal activo de SEO del ecosistema.

### 107/108. Referidos y embajadores
`referral_code` en cada usuario; `referrals(referrer_id, referred_id, code, source, converted_at, conversion_type)`. Se mide: invitados, registros, participantes referidos, compradores de entradas, estudiantes, compradores de tienda. Los embajadores son un tipo de usuario con metas por ciudad/universidad y un panel propio (F2), construido sobre la misma tabla.

### 109. Loyalty
`points_ledger(user_id, delta, reason, source_event, balance_after, created_at)` — libro contable, no un contador mutable. Reglas configurables por acción. Los puntos canjean beneficios vía Benefits Engine.
**Regla dura, implementada en el servicio de votación:** ningún beneficio, nivel, membresía o punto puede alterar el peso de un voto. El motor de beneficios no puede apuntar a la sección `VOTING`.

## 43. Talent Architecture

`talent_profiles` es una extensión del COMICOMANIA ID, 1:1 con `users`, no una entidad paralela.

```
talent_profiles(user_id PK, stage_name, legal_name_enc, bio, languages[], comedy_styles[],
  categories[], markets[], travel_availability, set_durations[], technical_rider,
  media_kit_file_id, press_kit_file_id, booking_contact, manager_id,
  representation enum('NONE','NON_EXCLUSIVE','EXCLUSIVE'), status, status_changed_at,
  public_visible bool, created_at)
talent_status_history(talent_id, from_status, to_status, changed_by, reason, created_at)
```

- `legal_name_enc`, contacto y tarifas son **privados** (solo `TALENT` con grant); el perfil público muestra solo lo marcado visible.
- Estados (brief 74): `DISCOVERED, CONTESTANT, QUALIFIED, FINALIST, WINNER, ALUMNI, DEVELOPING_TALENT, FEATURED_TALENT, COMICOMANIA_TALENT, AVAILABLE_FOR_BOOKING, REPRESENTED, INACTIVE`.
- **Participar no equivale a representación.** La transición a `REPRESENTED` exige contrato firmado registrado y acción de un usuario con `TALENT · MANAGE`; queda auditada.
- **Búsqueda de talento** (`/admin/talento`): país, ciudad, idioma, estilo, categoría, concurso, temporada, puntaje, seguidores, disponibilidad, experiencia en eventos, formación, estado. Postgres FTS + filtros; exportable con permiso `EXPORT`.
- Métricas de talento (brief 121) se muestran como evidencia, nunca como veredicto: el sistema no etiqueta "mejor talento" automáticamente.

## 44. Booking Architecture (esquema en MVP, operación en Fase 2)

```
booking_requests(id, client_user_id?, client_company, contact_name, email, phone,
  talent_id, event_type, event_date, city_id, country_id, venue, audience_size,
  budget_amount, currency, message, source, status, owner_user_id, created_at)
talent_contracts(id, booking_id, talent_id, document_file_id, signed_at,
  fee_amount, commission_pct, currency, terms jsonb, status)
talent_financials(id, booking_id, booking_value, talent_fee, commission,
  travel_cost, production_cost, taxes, net_revenue, payout_amount,
  payout_status, paid_at)
talent_availability(talent_id, starts_at, ends_at, type enum('AVAILABLE','BLOCKED','HOLD'))
```

Pipeline: `NEW_INQUIRY → QUALIFIED → AVAILABILITY → PROPOSAL → NEGOTIATION → CONTRACT → DEPOSIT → CONFIRMED → PERFORMED → SETTLEMENT → COMPLETED`.
Se implementa sobre el pipeline genérico de CRM (mismo motor que sponsors y participantes), no como un módulo aparte. Payouts con Stripe Connect en Fase 2; en MVP se registran y se pagan fuera de la plataforma.

## 79. Alumni
Al cerrar un concurso, un job mueve a los participantes a `ALUMNI`, les otorga el nivel correspondiente, los mantiene en la comunidad y les abre: descuentos de Academia, acceso anticipado a eventos, invitación a la siguiente temporada y elegibilidad para Talent. El alumni es el inventario de talento de la marca; perderlo es perder el activo.

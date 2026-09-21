# 03 · User Journeys

> Entregables: 14–28 (todos los journeys) y 138 (principio "¿qué hago ahora?").

## 138. Motor de "siguiente paso"

Una sola función, consumida por web, email, push y CRM:

```ts
nextBestAction(user): { code, label, href, priority, context }
```

Se calcula por reglas ordenadas sobre el estado real del ID (perfil, participación, video, entradas, cursos, membresía). La misma decisión alimenta el banner de `/mi`, el asunto del email de reactivación y el segmento de CRM. Nunca se duplica la lógica en cada canal.

| Estado detectado | Acción sugerida |
|---|---|
| Email sin verificar | Verificar email |
| Perfil < 60% | Completar perfil |
| Humorista sin participación y concurso abierto en su ciudad | Inscribirte en COMICOMANIA {ciudad} |
| Inscrito sin video | Subir tu video |
| Video en `CHANGES_REQUESTED` | Corregir y reenviar |
| Video publicado | Compartir tu video |
| Votación abierta y no votó | Votar |
| Votó y no sigue a nadie | Seguir a {talento} |
| Sigue talento con evento próximo | Comprar entrada |
| Entrada comprada | Agregar experiencia / merch |
| Asistió a evento | Explorar Academia |
| Curso completado | Perfil de talento / siguiente curso |
| Sin actividad 30 días | Reactivación con contenido nuevo de su ciudad |

## 15. Community Journey (espectador nuevo, anónimo → miembro activo)
1. Llega por un clip (TikTok/Reels/YouTube) a `/videos/[slug]` o al perfil del humorista.
2. Ve el video sin registro. Se le muestra el concurso de su ciudad (geo-detección, corregible).
3. Intenta votar o seguir → **muro de identidad**: registro con magic link o social (≤2 pasos, sin contraseña).
4. Verificación de email → voto registrado (la intención se conserva durante el registro: no se pierde el voto).
5. Post-voto: seguir al talento, descubrir 3 participantes más, ver el evento de su ciudad.
6. Email día 1: qué es COMICOMANIA + su ciudad. Día 3: contenido nuevo de quien sigue. Día 7: oferta de entrada o curso.
7. Métrica de éxito: ≥1 acción de valor adicional en 7 días (Activation).

## 16/17. Contest & Participant Journey (humorista)
1. Landing del concurso `/concursos/us/miami/2027` → "QUIERO PARTICIPAR".
2. Registro (o login) → se le asigna tipo `HUMORISTA`.
3. **Chequeo de elegibilidad** (edad, residencia, participación previa) antes de pedir datos largos: fallar temprano y explicar por qué.
4. Perfil artístico: nombre artístico, bio, foto, redes, ciudad. Barra de progreso.
5. Inscripción al concurso → `participants` (estado `REGISTERED`).
6. Subida de video: requisitos visibles antes de arrastrar el archivo; validación técnica inmediata con mensajes accionables ("tu video dura 6:12 y el máximo es 5:00").
7. **Gate de derechos**: declaración de terceros + tres checkboxes + aceptación de la carta versionada. Sin esto no hay envío.
8. Estados visibles en `/mi/participacion`: En revisión → Cambios solicitados → Aprobado → Publicado.
9. Publicado: kit para compartir (link, textos, recorte vertical automático, contador de votos).
10. Resultado de ronda: avanza / no avanza, con devolutiva cuando el concurso lo permita.
11. Cierre: pase a `ALUMNI`, invitación a Academia y a la comunidad. **El journey no termina cuando termina el concurso.**

## 18. Spectator Journey (votante)
Ver → votar (login + email verificado) → confirmación → seguir → compartir → entradas → membresía. Reglas de voto siempre visibles ("1 voto por participante por ronda"). Nunca voto anónimo.

## 19. Student Journey
Descubre curso (desde perfil de talento, desde el concurso, desde email) → ficha con preview gratis → checkout → acceso inmediato (`entitlement`) → `/mi/academia` con progreso → recursos descargables → certificado (F2) → recomendación del siguiente curso → oportunidad en Talent.

## 20. Business Owner Journey
Login con MFA → Dashboard ejecutivo (North Star, revenue, concursos activos, alertas) → revisar ciudad → crear operador con el Access Builder → aprobar decisiones sensibles (ganador, refund grande, cambio legal) → revisar Audit Log semanal → decidir apertura de nueva ciudad con datos de GEO Analytics.

## 21. Business Operator Journey (ej. City Manager de Miami)
Login → ve **solo Miami**: su dashboard, sus participantes, su cola de revisión, sus eventos, su P&L de ciudad. Crea el concurso desde plantilla, asigna jurado local, revisa videos, publica, gestiona el evento final, hace check-in, cierra la ciudad. Nunca ve Orlando ni el consolidado global.

## 22. Judge Journey
Invitación por email → acepta → PWA `/jurado` → lista de videos asignados con deadline → reproduce → rúbrica con los criterios configurados del concurso → guarda borrador → envía → **la nota se bloquea** y no ve las de otros jueces hasta que la ronda cierra → progreso "12 de 40 evaluados".

## 23. Talent Journey
`DISCOVERED → CONTESTANT → QUALIFIED → FINALIST/WINNER → ALUMNI → DEVELOPING → FEATURED → COMICOMANIA TALENT → AVAILABLE FOR BOOKING → REPRESENTED`.
Cada transición es manual o asistida, **nunca automática por métricas**, y queda auditada. El perfil de talento acumula: historial de concursos, notas, eventos, formación, seguidores, media kit.

## 24. Sponsor Journey
Lead (formulario `/sponsors/contacto` o alta manual) → calificación → propuesta desde el **Inventario Comercial** (qué está disponible en qué ciudad y temporada) → negociación → contrato → activación de entregables → reporte con métricas reales → renovación.

## 25. Store Journey
Descubrimiento (home, evento, perfil de talento, post-voto) → ficha con variantes → carrito **compartido** con entradas y cursos → checkout único → confirmación → envío o retiro en evento → tracking → recompra.

## 26. Membership Journey
Prompt contextual ("ahorra en esta entrada con FAN") → comparación de planes → Stripe → beneficios activos inmediatamente (`entitlements` + `benefit_grants`) → recordatorio de renovación → recuperación de pago fallido (dunning) → upgrade/downgrade.

## 27. Event Journey
Anuncio → landing del evento → selección de entradas (con reserva temporal de inventario) → upsell de experiencia y merch → checkout → entrada digital con QR → recordatorio 24 h → check-in en puerta → post-evento: fotos, video, encuesta, siguiente evento.

## 28. Academy Journey
Catálogo → ficha → compra (o acceso por membresía/beneficio de participante) → módulos y lecciones → progreso guardado → masterclass en vivo → certificado → siguiente nivel.

## Journeys de servicio (no pedidos, necesarios)
- **Soporte / Trust & Safety**: reportar contenido → caso → revisión → acción → apelación → resolución.
- **Fusión de cuentas**: usuario duplicado → soporte verifica → merge con log.
- **Baja y privacidad**: exportar mis datos / eliminar mi cuenta → anonimización conservando integridad de concurso y contabilidad.

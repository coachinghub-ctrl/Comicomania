# 05 · Video workflow, YouTube y arquitectura de derechos

> Entregables: 38 (YouTube Integration), 39 (Video Workflow), 40 (Content Rights), 41 (Consent Versioning); brief 41–52.

## 39. Video Workflow — máquina de estados

```
DRAFT → UPLOADING → UPLOADED → VALIDATING
   ├─ VALIDATION_FAILED  (mensaje accionable, permite reintento)
   └─ PENDING_RIGHTS → SUBMITTED → IN_REVIEW
          ├─ CHANGES_REQUESTED → (vuelve a UPLOADING)
          ├─ REJECTED (terminal, con motivo)
          └─ APPROVED → DISTRIBUTING → PUBLISHED
                                   ├─ UNPUBLISHED (reversible)
                                   └─ BLOCKED (bloqueo legal, irreversible sin LEGAL)
```

Reglas duras:
- **No se puede salir de `PENDING_RIGHTS`** sin una fila en `release_acceptances` que apunte a una versión concreta de documento legal vigente para la jurisdicción del participante.
- **No se puede pasar a `PUBLISHED`** si `rights_status ∈ {PENDING, REVIEW_REQUIRED, RESTRICTED, BLOCKED}`. Constraint en base de datos, no solo validación de aplicación.
- Cada transición escribe en `video_reviews` (quién, cuándo, qué decidió, comentario) y en `audit_logs`.

## 41. Subida (dentro de la plataforma, sin links externos)
1. El navegador pide `POST /api/v1/uploads/init` → el servidor valida cupo, ronda abierta y participación, y devuelve URLs presignadas **multipart** de R2.
2. Subida directa navegador → R2, por partes de 8 MB, con barra de progreso real, pausa/reanudación y reintento por parte. Crítico en móvil con red inestable (es el punto donde más se pierde gente).
3. `POST /uploads/complete` → se crea `video_uploads` y se encola la validación.

## 42. Validación técnica (Media Worker)
`ffprobe` + reglas configurables por concurso (`video_requirements`): contenedor, códec, resolución mínima y recomendada, relación de aspecto, fps, audio (códec y bitrate), duración mínima/máxima, tamaño máximo, presencia de pista de audio, detección de video en negro o audio en silencio.
También: escaneo antivirus (ClamAV), verificación de MIME real (no por extensión), extracción de miniatura (3 candidatas) y de metadatos.

Los errores se devuelven en lenguaje humano: *"El audio está en mono a 64 kbps; el mínimo es 128 kbps. Reexporta con audio AAC 128 kbps o superior."*

## 38. YouTube Integration Architecture

```
R2 (master validado) ──► Job de distribución ──► YouTube Data API v3 (resumable upload)
        │                        │                         │
        │                        │              privacy: PRIVATE
        │                        │                         ▼
        └── copia master         └── youtube_assets ◄── polling processingStatus
            (respaldo y clips)                             │
                                             aprobación ──►│ privacy: UNLISTED/PUBLIC
                                                           ▼
                                            IFrame Player en la plataforma
```

`youtube_assets(video_id, youtube_video_id, channel_id, privacy_status, upload_status, processing_status, thumbnail_url, duration_s, published_at, last_sync_at, error_code, error_message, quota_cost)`

### Límites reales de YouTube (verificado en la documentación de Google, septiembre 2026)

| Límite | Valor | Nos afecta |
|---|---|---|
| Duración máxima de un video | 15 min sin verificar · **12 horas o 256 GB** (lo que ocurra primero) con canal verificado por teléfono | **No.** Los videos del concurso son de ~2 minutos. Estamos a tres órdenes de magnitud del techo |
| Subidas por API (`videos.insert`) | **100 llamadas por día** por proyecto, con costo de 1 unidad en un *bucket* propio de Video Uploads | No bloquea: 300 videos se distribuyen en 3 días |
| Pool general de la API | 10.000 unidades/día para el resto de endpoints (lecturas, metadatos, `search.list` aparte con 100/día) | Suficiente para sincronizar estado y métricas |
| Subidas por día a nivel de canal | **YouTube no lo publica**; varía por país e historial del canal | Sí: un canal nuevo que sube 100 videos el primer día puede toparse con límites o con detección de abuso |

> **Corrección respecto de la primera versión de este documento.** El modelo anterior cobraba 1.600 unidades por subida contra el pool de 10.000, lo que dejaba ~6 subidas diarias. Google lo cambió en junio de 2026: las subidas salen del pool compartido y pasan a un cupo propio de 100 por día. **La cuota deja de ser un riesgo bloqueante.**

### Decisión de reproducción: dónde se ve el video durante la competencia

Con la cuota resuelta, la elección ya no es de costo sino de producto. Y la respuesta es clara: **durante la ronda de competencia y votación, el video se reproduce dentro de la plataforma, servido desde R2 en HLS.** A YouTube va lo que construye el canal.

Razones, en orden de importancia:
1. **El votante no se va.** El reproductor de YouTube ofrece recomendaciones y "ver en YouTube" justo en el momento previo al voto. Ese es el punto más caro del embudo para perderlo.
2. **Sin publicidad de terceros sobre el video de un participante.** Un anuncio de una marca competidora del sponsor sobre el video del concurso es un problema comercial real.
3. **Retiro inmediato.** Ante un reclamo de derechos, el video sale en segundos y sin depender de un tercero.
4. **Ventanas por ronda.** Un video puede dejar de estar disponible al cerrar la ronda; con YouTube eso implica cambiar privacidad por API y esperar propagación.
5. **Watch time propio y medible**, atado al COMICOMANIA ID y no a la analítica de un canal.

**Costo de servir desde R2** (ejemplo con 300 videos de 2 minutos):
másters 1080p ≈ 40 MB c/u → ~12 GB; con renditions HLS 360/720/1080 ≈ 20–25 GB.
`25 GB × USD 0,015/GB-mes ≈ **USD 0,38 al mes**`, y **egress cero** — el argumento decisivo de R2 frente a S3. El transcodificado lo hace el Media Worker que ya está en el plan (ffmpeg), no hay proveedor adicional.
De referencia, Cloudflare Stream costaría ~USD 3/mes de almacenamiento más USD 1 por cada 1.000 minutos vistos (≈ USD 500 si el concurso genera 500.000 minutos de visualización). Queda como plan B gestionado si no se quiere mantener el pipeline HLS propio.

### Qué va a YouTube, y cuándo
| Contenido | Privacidad | Momento |
|---|---|---|
| Finalistas, ganadores, mejores momentos, compilados, entrevistas | Público | Durante toda la temporada — es el motor de alcance |
| **Cortes verticales de 9:16 como Shorts** | Público | Continuo. Un video de 2 minutos en vertical entra en el formato Shorts y multiplica la distribución sin producción adicional: el Media Worker ya genera el recorte |
| Todos los videos aprobados | Unlisted | Al cerrar la ronda de votación: respaldo, archivo y base para clips futuros |
| Videos en revisión | No se suben | Se revisan desde el máster en R2 con URL firmada |

Operativa del canal: verificarlo por teléfono desde el primer día, subir de forma sostenida en vez de en ráfaga (un canal nuevo con 100 subidas diarias llama la atención de los sistemas antiabuso), y **solicitar igual la ampliación de cuota** como seguro barato antes de abrir la segunda y tercera ciudad.

Otras decisiones técnicas: cuenta de servicio con refresh token rotado y cifrado; reintentos con backoff ante 403/`quotaExceeded`; sincronización nocturna de estado y métricas; `UNPUBLISH` en la plataforma también cambia la privacidad en YouTube.

## 44. Video Review Center
Cola con filtros (concurso, ronda, ciudad, estado, antigüedad, juez asignado). Reproductor con marcadores de tiempo para comentarios. Acciones: Reproducir · Aprobar · Solicitar cambios (con plantillas de motivo) · Rechazar · Publicar · Despublicar. Panel lateral con: datos del participante, declaración de terceros, estado de derechos, resultado de validación técnica e historial de revisiones. Atajos de teclado y modo lote para volumen alto.

## 40. Content Rights Architecture

```
legal_documents(id, slug, type, jurisdiction, name)
  └─ legal_document_versions(id, document_id, version, body_md, body_hash,
                             effective_from, effective_to, status, created_by)
       └─ release_acceptances(id, user_id, participant_id, video_id, contest_id,
                              version_id, accepted_checkboxes jsonb, ip, user_agent,
                              locale, accepted_at)   -- INMUTABLE
third_party_declarations(video_id, kind, description, owner, has_release,
                         evidence_file_id, status, reviewed_by, reviewed_at)
content_rights(video_id, status, restrictions jsonb, expires_at, notes)
```

- Documentos por tipo (`CONTEST_RULES`, `CONTENT_RELEASE`, `PRIVACY`, `TERMS`, `TALENT_RELEASE`, `SPONSOR_RELEASE`, `MINOR_CONSENT`) **y por jurisdicción** (`US`, `MX`, `CO`, `ES`…).
- **Nunca se sobrescribe una versión.** Una versión publicada es inmutable (`body_hash` verificable). Una corrección genera `v1.1`.
- Las aceptaciones son inmutables y apuntan a la versión exacta. Si el documento cambia y la acción lo requiere, se dispara un flujo de **re-consentimiento** antes de la siguiente acción relevante.
- `rights_status`: `PENDING → DECLARED → REVIEW_REQUIRED → CLEARED | RESTRICTED | EXPIRED | BLOCKED`. `RESTRICTED` puede limitar medios (ej. "no usar en publicidad pagada") y eso se respeta en el CMS al armar campañas.
- **Menores de edad**: si la elegibilidad admite <18, se exige consentimiento de tutor con documento aparte y verificación adicional. Si no se implementa, la elegibilidad debe exigir 18+ (decisión pendiente, ver 14-riesgos).

## 49. UX del consentimiento
Antes de enviar, en una sola pantalla: resumen legible (el texto del brief §49), enlace al documento completo, y tres checkboxes **independientes y sin marcar por defecto**:
- Tengo los derechos o autorizaciones necesarias sobre el material.
- He leído y acepto la Carta de Consentimiento.
- He leído y acepto las Reglas del Concurso y los Términos aplicables.

Botón: **ACEPTAR Y ENVIAR VIDEO**. Se guarda qué checkboxes se marcaron, en qué versión, a qué hora, desde qué IP y en qué idioma se mostró el texto.

## 48. Sponsors y derechos
La carta autoriza aparición en entornos de COMICOMANIA con patrocinadores, **sin** constituir endorsement. Si una marca quiere usar directamente al participante para promocionar un producto, se exige un `SPONSOR_RELEASE` adicional, específico por campaña, con su propia aceptación. El CMS **no permite** asignar contenido a una pieza marcada `requires_talent_release` sin ese documento firmado.

## 127. Distribución de contenido
Una producción, muchas salidas: master en R2 → YouTube largo → Shorts/Reels/TikTok (recortes 9:16 generados por el worker con ffmpeg) → página del participante → feed de comunidad → email → notificación. Cada salida se registra en `content_distributions` para medir qué canal trae audiencia real.

# 11 · Design System y Wireframe Map

> Entregables: 73 (Wireframe Map), 74 (Design System); brief 22–23, 136, 137.

## 74. Design System — "COMICOMANIA STAGE"

Paleta derivada del logo oficial (`brand/comicomania-logo.jpg`): **fondo negro de teatro, rojo de la cinta, crema del lettering.** El oro de las máscaras y el azul de las lágrimas quedan como acentos de marca, no como colores de interfaz.

### Tokens de color

Valores muestreados del logo oficial (`brand/comicomania-logo.webp`), no inventados.

```css
:root {
  /* Fondos — negro de teatro, cálido como el contorno del logo */
  --stage-1000: #000000;  /* telón: fondo de página, y el fondo del logo */
  --stage-900:  #080506;  /* superficie base */
  --stage-800:  #12090A;  /* tarjetas */
  --stage-700:  #1E1112;  /* tarjetas elevadas, filas alternas */
  --stage-600:  #2E1A1B;  /* bordes y separadores */

  /* Rojo — la cinta */
  --red-700:    #620700;  /* sombra del pliegue */
  --red-600:    #B00501;  /* RELLENO de botones y superficies rojas */
  --red-500:    #EB1701;  /* rojo vivo: acentos, bordes, iconos, títulos */
  --red-400:    #FF4B33;  /* hover y foco */
  --red-300:    #FF6E5A;  /* texto rojo sobre negro */

  /* Blancos — el crema del lettering */
  --paper:      #F3F1D4;  /* blanco de marca: titulares y texto sobre rojo */
  --paper-pure: #FFFFFF;  /* texto largo y datos densos en Admin */
  --muted:      #B9AFA6;  /* texto secundario */
  --muted-dim:  #8A8078;  /* metadatos, deshabilitado */

  /* Acentos del logo — máscaras y lágrimas */
  --gold-400:   #FFD502;  /* amarillo vivo de la máscara */
  --gold-500:   #FFAD03;  /* oro medio: premio, ganador, VIP */
  --gold-700:   #F08304;  /* sombra naranja */
  --tear-400:   #04C5E4;  /* azul lágrima */
  --tear-500:   #00ACD1;  /* informativo, estados de proceso */
  --tear-700:   #0E5C73;

  /* Semánticos */
  --success: #22C55E;  --warning: #FFD502;
  --danger:  #FF4B33;  --info:    #00ACD1;
}
```

### Contraste: la regla que hay que respetar

Medido sobre `--stage-900` (#080506):

| Color | Contraste | Uso permitido |
|---|---|---|
| Blanco puro | 20,3:1 | Todo |
| Crema `#F3F1D4` | 17,7:1 | Todo |
| Amarillo `#FFD502` | 14,3:1 | Todo |
| Oro `#FFAD03` | 10,9:1 | Todo |
| Azul `#04C5E4` | 9,8:1 | Todo |
| Gris `#B9AFA6` | 9,4:1 | Texto secundario |
| Rojo claro `#FF6E5A` | 7,4:1 | **Texto rojo sobre negro** |
| Rojo vivo `#EB1701` | 4,5:1 | Texto ≥18 px o bold, iconos, bordes |
| Rojo relleno `#B00501` | 2,8:1 | **Solo como fondo**, nunca como texto |

> ⚠️ **El crema sobre el rojo vivo da 3,94:1 y reprueba AA para texto normal.**
> Por eso el relleno de un botón rojo es `--red-600` (#B00501), donde el crema alcanza **6,40:1** y el blanco puro **7,32:1**.
> El rojo vivo `#EB1701` solo lleva texto si es blanco puro (4,51:1) o negro (4,50:1), y aun así pasa raspando: resérvalo para acentos, bordes, iconos y titulares grandes.
> El amarillo `#FFD502` con texto negro da 14,3:1 — es la combinación más legible de toda la paleta, y por eso es la del botón de "ganador" y de los estados de premio.

### Negro en todo, incluido el Admin

La plataforma es dark en toda su superficie: público, área de usuario, jurado, check-in y Admin. Para que el Admin aguante ocho horas de trabajo con tablas densas:

- El fondo de trabajo es `--stage-900`, no negro puro; el negro puro se reserva para el telón de las páginas públicas, el fondo detrás del video y **el fondo del logo**.
- Las filas alternas usan `--stage-700`, nunca opacidad sobre negro (produce banding).
- El texto largo y los números van en blanco puro; el crema se reserva para titulares y marca.
- El rojo no se usa para texto de tabla: es color de acción y de alerta. Una tabla llena de rojo deja de comunicar urgencia.

### El logo

Archivo maestro: `brand/comicomania-logo.webp` (1080 × 1080, RGBA con transparencia real). La versión anterior queda archivada como `comicomania-logo-v1.jpg`.

**Este archivo está hecho para fondo negro, y conviene saber por qué.** Trae transparencia real (35% del lienzo totalmente transparente) y además una **sombra negra difusa horneada** en el propio archivo: el 23% de los píxeles son negro puro con opacidad baja, formando un halo suave alrededor de la marca.

| Fondo | Resultado |
|---|---|
| Negro (`--stage-1000` a `--stage-800`) | Perfecto: la sombra desaparece porque es negra sobre negro |
| Rojo, foto o cualquier color medio | La sombra se nota como suciedad alrededor del contorno |
| Blanco o fondo claro | **Halo gris visible.** No usar este archivo; hace falta una versión sin sombra |

| Regla | Valor |
|---|---|
| Área de respeto | Altura de la letra «C» de la cinta, en los cuatro lados. **El archivo casi no trae margen propio** (12 px a la izquierda), así que el aire se agrega en el layout |
| Tamaño mínimo | 120 px de ancho en pantalla; 24 mm impreso |
| Prohibido | Deformar, rotar, cambiar los colores de las máscaras, agregarle sombra o borde (ya los trae), usarlo sobre foto sin capa negra al 60% |
| Favicon y app icon | Solo las dos máscaras, sin cinta, sobre negro |

**El paquete de activos ya está derivado del propio archivo** (`brand/export/`, regenerable con `brand/generar-activos.py`). No hicimos falta esperar al diseñador para arrancar:

| Archivo | Para qué | Fondo |
|---|---|---|
| `comicomania-logo-sombra-2160.png` · `-1080` | Logo tal cual, con su sombra | Solo negro |
| `comicomania-logo-sin-sombra-2160.png` · `-1080` · `-512` | **Sombra eliminada por código** | Cualquiera, incluido blanco |
| `comicomania-mascaras-1024…32.png` | Solo las dos máscaras, cuadrado | Cualquiera |
| `comicomania-mascara-mini-512…16.png` | Solo la máscara que ríe | Cualquiera |
| `favicon.ico` · `favicon-mini.ico` | 16→256 px | — |
| `comicomania-appicon-512.png` | Icono de app | Negro incluido |
| `comicomania-avatar-1080.png` | Avatar de redes | Negro incluido |
| `comicomania-og-1200x630.png` | Open Graph y Twitter card | Negro incluido |

La sombra se elimina de forma limpia porque está construida de manera distinta al dibujo: son **242.886 píxeles de negro puro con opacidad baja**, mientras que el antialias real del contorno son 27.841 píxeles **con color**. La regla `alpha < 200 y color casi negro → transparente` separa una cosa de la otra sin tocar el borde.

> **Regla de tamaño, verificada mirando los archivos ampliados:** bajo 48 px las dos máscaras se convierten en una mancha. **Por debajo de ese umbral se usa una sola máscara**, la que ríe, que sigue siendo reconocible incluso a 16 px. Por eso existe `favicon-mini.ico` y es el que hay que usar en el `<head>`.

### Lo que sigue sin poder derivarse, y qué hacemos mientras

| Falta | Por qué | Solución provisional |
|---|---|---|
| **SVG vectorial** | Es una ilustración con degradados; un autotrazado saldría pesado y sucio | El PNG de 2160 px cubre web y print hasta ~18 cm a 300 dpi. Solo hace falta el vector para valla, gran formato o bordado de merch — es una dependencia de la fase de Commerce, no un bloqueo para la Fase A |
| **Monocroma a una tinta** | El dibujo vive de los degradados; la silueta plana no se reconoce | En contextos de un solo color se usa el **wordmark tipográfico** «COMICOMANÍA» en la fuente display, nunca una versión degradada del logo |
| **Lockup horizontal** | No se pueden separar máscaras y cinta sin el archivo por capas | **Se compone en CSS**: `comicomania-mascaras` a la izquierda y «COMICOMANÍA» en Archivo Black a la derecha. Sale mejor que una imagen: es responsive y nítido a cualquier tamaño |

### Tipografía

- **Display**: condensada pesada en mayúsculas, alineada al lettering de la cinta. Candidatas: Archivo Black, Anton, Bebas Neue. El lettering del logo lleva contorno oscuro; en pantalla ese recurso se usa **solo** en titulares sobre imagen, nunca en texto corrido.
- **Texto**: Inter. Escala 12 / 14 / 16 / 18 / 24 / 32 / 44 / 64.
- Titulares cortos con contraste de peso; nada de mayúsculas en párrafos.

### Firma visual

El gradiente *spotlight* cambia de naranja a **rojo**: radial `--red-500` a transparente, sobre negro, una sola vez por pantalla. Complementos coherentes con la marca teatral: textura sutil de telón en las secciones hero, y el oro reservado para el momento del ganador — cuando aparece el oro, algo se ganó.

### Componentes (packages/ui)
Base: Button (primary/spotlight, secondary, ghost, danger), Input, Select, Combobox, Checkbox, Radio, Switch, Textarea, FileDrop, DatePicker con timezone, Tabs, Accordion, Modal, Drawer, Toast, Tooltip, Badge, Avatar, Progress, Skeleton, EmptyState, Pagination, Table (con densidad y selección múltiple).

De dominio: `VideoCard`, `ParticipantCard`, `VoteButton` (con estados: puede votar / ya votó / debe iniciar sesión / cerrado), `CountdownRing`, `RoundStepper`, `ScoreRubric`, `TicketCard` (con QR), `ProductCard`, `CourseCard`, `TalentCard`, `CityPill`, `SponsorStrip`, `NextActionBanner`, `ScopeBadge` (muestra el territorio del operador en el Admin, siempre visible), `StatTile`, `GeoMap`.

### Movimiento
Rápido y con intención: 150–250 ms, `ease-out`. Reservado para: aparición de resultados, confirmación de voto, avance de ronda y revelación de ganador. `prefers-reduced-motion` respetado siempre.

### Accesibilidad
Navegación completa por teclado, foco visible en naranja, `aria-live` para conteos de votos y estados de subida, subtítulos obligatorios en todo video institucional, targets táctiles ≥44 px.

## 73. Wireframe Map

Notación: bloques de arriba hacia abajo.

### Home `/`
`Nav transparente sobre hero` · `HERO: video de fondo + titular display + CTA doble (PARTICIPAR / VER VIDEOS)` · `Barra de ciudades activas (pills)` · `Concurso destacado con countdown y CTA VOTAR` · `Carrusel de videos destacados` · `Participantes en tendencia` · `Próximos eventos (con ciudad)` · `Academia: 3 cursos` · `Tienda: colección actual` · `Comunidad: números reales (miembros activos, votos, ciudades)` · `Franja de sponsors` · `Newsletter + CTA crear ID` · `Footer con países/idiomas`

### Landing de concurso `/concursos/[pais]/[ciudad]/[slug]`
`Hero con ciudad, fechas y estado (INSCRIPCIONES ABIERTAS / VOTACIÓN EN VIVO)` · `Countdown` · `CTA principal según estado` · `Cómo funciona (3 pasos)` · `Premio` · `Jurado` · `Requisitos y elegibilidad` · `Participantes (grilla con filtro por categoría)` · `Cómo se vota` · `FAQ` · `Bases legales` · `Sponsors` · `CTA final`

### Votación `/concursos/[…]/votar`
`Reproductor grande (16:9, sticky en móvil)` · `Info del participante + seguir` · `Botón VOTAR con estado y reglas visibles` · `Barra de progreso de la ronda` · `Siguiente participante (swipe en móvil)` · `Post-voto: modal con seguir / 3 recomendados / entradas`

### Perfil de humorista `/humoristas/[handle]`
`Portada + foto + nombre artístico + ciudad + badges de estado` · `Seguir · Compartir` · `Bio` · `Videos` · `Historial de concursos (timeline)` · `Próximos eventos` · `Formación en Academia` · `Merch del talento` · `Redes`

### MI COMICOMANIA `/mi`
`NextActionBanner (una sola acción, grande)` · `Resumen: mi participación · mis entradas · mis cursos · mi membresía` · `Actividad reciente` · `A quién sigo` · `Beneficios disponibles` · `Accesos rápidos`

### Subida de video `/mi/videos/subir`
`Requisitos visibles (checklist)` · `Zona de arrastre + botón` · `Progreso real con pausa/reintento` · `Preview + selección de miniatura` · `Título, descripción, categoría` · `Declaración de terceros (música/imágenes/otros artistas)` · `Panel de consentimiento con 3 checkboxes` · `ACEPTAR Y ENVIAR VIDEO` · `Estado posterior con línea de tiempo`

### Admin — Video Review `/admin/review`
`Barra de scope (ciudad/concurso, siempre visible)` · `Filtros + contador de cola` · `Lista izquierda (cards con miniatura, participante, antigüedad, semáforo de derechos)` · `Panel central: reproductor + comentarios con timecode` · `Panel derecho: datos, validación técnica, derechos, historial` · `Barra de acciones: Aprobar · Cambios · Rechazar · Publicar` · `Atajos de teclado`

### Admin — Access Builder `/admin/acceso/nuevo`
`Stepper de 6 pasos` · `Paso 2: árbol de territorios con checkboxes` · `Paso 3-4: matriz sección × acción con presets` · `Paso 6: resumen en lenguaje natural + Activar`

### Admin — Contest Builder `/admin/builder`
`Stepper de 14 pasos con guardado automático` · `Panel de validación permanente a la derecha (qué falta para publicar)` · `Botones: Guardar borrador · Vista previa · Guardar como plantilla · Publicar`

### Jurado `/jurado/[videoId]`
`Reproductor` · `Rúbrica con sliders por criterio y peso visible` · `Comentario` · `Guardar borrador · Enviar evaluación (irreversible, con confirmación)` · `Progreso 12/40 y deadline`

### Check-in `/checkin`
`Selector de evento y puerta` · `Cámara a pantalla completa` · `Resultado grande en verde/rojo con nombre y tipo de entrada` · `Contador de asistencia` · `Indicador de modo offline y cola de sincronización` · `Búsqueda manual por nombre o código`

### Checkout `/checkout`
`Resumen del carrito (mixto)` · `Login o invitado→ID` · `Datos de envío si aplica` · `Cupón` · `Pago (Payment Element)` · `Resumen de impuestos y total` · `Confirmación con entradas/accesos inmediatos`

### Dashboard ejecutivo `/admin`
`Fila de StatTiles: ACM-30 · Nuevos IDs · Revenue MTD · Concursos activos` · `Gráfico de ACM (12 semanas)` · `Mapa mundial con usuarios y revenue` · `Embudo del concurso activo` · `Top ciudades` · `Alertas (cola de revisión, votos sospechosos, pagos fallidos, cuota de YouTube)` · `Últimos eventos de auditoría`

## 137. Admin Control Center — navegación
Menú lateral agrupado por engine (no una lista plana de 40 ítems): **Panel · Comunidad · Concursos · Contenido · Comercio · Talento · Negocio · Sistema**. Cada grupo despliega sus secciones y **solo se muestran las que el grant permite**. Encima de todo, un `ScopeBadge` permanente que dice, por ejemplo, "Miami · Florida · USA" para que nadie olvide en qué territorio está operando.

# Marca COMICOMANIA — activos disponibles

Todo lo de `export/` fue **derivado del archivo maestro** `comicomania-logo.webp`, no rehecho.
Regenerable en cualquier momento con `python3 generar-activos.py` (requiere Pillow).

## Maestro

| Archivo | Qué es |
|---|---|
| `comicomania-logo.webp` | 1080×1080 RGBA. Trae transparencia real **y una sombra negra difusa horneada**. Ideal sobre negro, inservible sobre blanco. |
| `comicomania-logo-v1.jpg` | Versión anterior, sin transparencia. Archivada. |

## Exportables

| Archivo | Para qué | Fondo |
|---|---|---|
| `comicomania-logo-sombra-2160.png` · `-1080` | Logo completo tal cual, con su sombra | Solo negro |
| `comicomania-logo-sin-sombra-2160.png` · `-1080` · `-512` | Logo completo **con la sombra eliminada** | Cualquiera, incluido blanco |
| `comicomania-mascaras-1024…32.png` | Solo las dos máscaras, cuadrado, transparente | Cualquiera |
| `comicomania-mascara-mini-512…16.png` | Solo la máscara que ríe. **Única legible bajo 48 px** | Cualquiera |
| `favicon.ico` | 16→256 px, dos máscaras | — |
| `favicon-mini.ico` | 16→48 px, una máscara. **Usar este en el `<head>`** | — |
| `comicomania-appicon-512.png` | Icono de app, dos máscaras sobre negro | Negro incluido |
| `comicomania-avatar-1080.png` | Avatar de redes | Negro incluido |
| `comicomania-og-1200x630.png` | Open Graph / Twitter card | Negro incluido |

## Reglas rápidas

- Bajo 48 px se usa **una sola máscara**. Las dos juntas se vuelven una mancha.
- Sobre fondo claro se usa **solo** la versión sin sombra.
- Nunca agregarle borde ni sombra: ya los trae.
- El aire alrededor del logo se pone en el layout; el archivo casi no trae margen propio.

## Lo que no se puede derivar de este archivo

| Falta | Por qué | Qué hacemos mientras |
|---|---|---|
| **SVG vectorial** | Es una ilustración con degradados; un autotrazado saldría pesado y sucio | El PNG de 2160 px cubre web y print hasta ~18 cm a 300 dpi. Para valla o bordado hará falta el vector |
| **Monocroma a una tinta** | El dibujo vive de los degradados; la silueta plana no se reconoce | En contextos de un solo color se usa el **wordmark tipográfico** «COMICOMANÍA» en la fuente display, no el logo degradado |
| **Lockup horizontal** | No se pueden separar máscaras y cinta sin el archivo por capas | Se compone en CSS: `comicomania-mascaras` + «COMICOMANÍA» en Archivo Black. Sale mejor: responsive y nítido a cualquier tamaño |

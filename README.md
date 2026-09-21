# COMICOMANIA DIGITAL ENGINE™

La comunidad de la comedia. Monorepo del ecosistema: comunidad, concursos,
contenido, comercio, talento e inteligencia sobre una sola identidad.

## Estado

**Fase A — Design System** en curso. La arquitectura completa (83 entregables)
está aprobada y documentada en [`docs/`](docs/README.md).

## Estructura

```
apps/web/          Next.js 16 · público, /mi, /admin, /jurado, /checkin
packages/ui/       Design system: tokens de marca y componentes
brand/             Logo maestro y activos derivados (generar-activos.py)
docs/              Arquitectura: 14 capítulos, los 83 entregables
```

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3100
```

Rutas actuales: `/` (home) y `/design` (referencia del design system).

## Reglas que no se negocian

1. **Un ID, un historial.** Ningún módulo crea usuarios ni duplica perfiles.
2. **La autoridad se otorga, no se hereda.** Solo un grant da acceso, y el
   territorio se resuelve desde el objeto, nunca desde la URL.
3. **El concurso es configuración.** Abrir otra ciudad no toca el código.
4. **Nada se publica sin derechos demostrables**, atados a la versión exacta
   del documento aceptado.
5. **Una sola columna comercial.** Entradas, merch, cursos, membresías y
   experiencias comparten carrito, orden y entitlements.

Ver [`docs/14-decisiones-riesgos-preguntas.md`](docs/14-decisiones-riesgos-preguntas.md)
para las decisiones de arquitectura y las preguntas abiertas.

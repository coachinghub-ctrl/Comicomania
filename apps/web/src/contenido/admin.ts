/* Menú del Admin Control Center.
   Agrupado por engine y no como una lista plana de cuarenta entradas: con
   cuarenta ítems seguidos nadie encuentra nada. Cada entrada declara la
   sección que exige, y el menú se dibuja desde los permisos efectivos. */

export type Entrada = { texto: string; href: string; seccion: string };
export type Grupo = { titulo: string; entradas: Entrada[] };

/* Las secciones que todavía no existen NO se esconden del menú: quien tiene el
   permiso tiene que ver que la sección está prevista y cuándo llega. Un menú
   que oculta el futuro obliga a preguntar por Whatsapp qué falta.

   Fase y fecha salen de docs/13-mvp-backlog-roadmap.md, tabla de fases A–P.
   Si el roadmap se mueve, esto se mueve con él. */
export type Pendiente = {
  fase: string;
  nombreFase: string;
  cuando: string;
  que: string;
};

export const ROADMAP: Record<string, Pendiente> = {
  crm: {
    fase: "H",
    nombreFase: "CRM",
    cuando: "Ene–Feb 2027",
    que: "Contactos, eventos de dominio y automatizaciones: quién entró, qué hizo y qué le toca después.",
  },
  review: {
    fase: "F",
    nombreFase: "Video + YouTube",
    cuando: "Dic 2026–Ene 2027",
    que: "Cola de revisión: cada video se aprueba o se rechaza con motivo antes de salir al canal.",
  },
  jurado: {
    fase: "G",
    nombreFase: "Jurado + Votación",
    cuando: "Ene 2027",
    que: "Rúbricas, asignación de jurados y el scoring que ellos no pueden editar después de cerrado.",
  },
  votacion: {
    fase: "G",
    nombreFase: "Jurado + Votación",
    cuando: "Ene 2027",
    que: "Votación del público con antifraude, y la invalidación de votos que queda en auditoría.",
  },
  eventos: {
    fase: "J",
    nombreFase: "Events",
    cuando: "Feb–Mar 2027",
    que: "Funciones, aforo, entradas con QR y check-in en la puerta del teatro.",
  },
  tienda: {
    fase: "I",
    nombreFase: "Commerce",
    cuando: "Feb 2027",
    que: "Catálogo, inventario y precios por territorio.",
  },
  ordenes: {
    fase: "I",
    nombreFase: "Commerce",
    cuando: "Feb 2027",
    que: "Órdenes, pagos con Stripe, envíos y reembolsos.",
  },
  academia: {
    fase: "K",
    nombreFase: "Academy",
    cuando: "Mar–Abr 2027",
    que: "Catálogo de cursos, progreso de cada alumno y certificados.",
  },
  talento: {
    fase: "L",
    nombreFase: "Talent",
    cuando: "Abr–May 2027",
    que: "Fichas de talento, disponibilidad y búsqueda para contrataciones.",
  },
  sponsors: {
    fase: "M",
    nombreFase: "Sponsors",
    cuando: "May–Jun 2027",
    que: "Inventario comercial, contratos y reportes de entrega para las marcas.",
  },
  finanzas: {
    fase: "N",
    nombreFase: "Finance + Intelligence",
    cuando: "Jun–Jul 2027",
    que: "P&L por ciudad y por concurso. Exige segundo factor, siempre.",
  },
  analitica: {
    fase: "N",
    nombreFase: "Finance + Intelligence",
    cuando: "Jun–Jul 2027",
    que: "Tableros de audiencia, geografía y embudo de participación.",
  },
  legal: {
    fase: "O",
    nombreFase: "Testing + Security",
    cuando: "Jul 2027",
    que: "Bases legales por país, cesión de derechos y consentimiento de menores.",
  },
  trust: {
    fase: "O",
    nombreFase: "Testing + Security",
    cuando: "Jul 2027",
    que: "Reportes de contenido, sanciones y el registro de cada decisión de moderación.",
  },
  configuracion: {
    fase: "—",
    nombreFase: "Transversal",
    cuando: "sin fase propia",
    que: "Ajustes por territorio. Crece con cada engine, así que no tiene una fase propia en el roadmap.",
  },
};

export const MENU: Grupo[] = [
  {
    titulo: "Panel",
    entradas: [{ texto: "Resumen", href: "/admin", seccion: "ANALYTICS" }],
  },
  {
    titulo: "Comunidad",
    entradas: [
      { texto: "Usuarios", href: "/admin/usuarios", seccion: "USERS" },
      { texto: "Accesos", href: "/admin/acceso", seccion: "ACCESS_CONTROL" },
      { texto: "CRM", href: "/admin/crm", seccion: "CRM" },
    ],
  },
  {
    titulo: "Concursos",
    entradas: [
      { texto: "Concursos", href: "/admin/concursos", seccion: "CONTESTS" },
      { texto: "Participantes", href: "/admin/participantes", seccion: "PARTICIPANTS" },
      { texto: "Revisión de video", href: "/admin/review", seccion: "VIDEO_REVIEW" },
      { texto: "Jurado", href: "/admin/jurado", seccion: "JUDGES" },
      { texto: "Votación", href: "/admin/votacion", seccion: "VOTING" },
    ],
  },
  {
    titulo: "Comercio",
    entradas: [
      { texto: "Eventos", href: "/admin/eventos", seccion: "EVENTS" },
      { texto: "Tienda", href: "/admin/tienda", seccion: "STORE" },
      { texto: "Órdenes", href: "/admin/ordenes", seccion: "ORDERS" },
      { texto: "Academia", href: "/admin/academia", seccion: "ACADEMY" },
    ],
  },
  {
    titulo: "Negocio",
    entradas: [
      { texto: "Talento", href: "/admin/talento", seccion: "TALENT" },
      { texto: "Sponsors", href: "/admin/sponsors", seccion: "SPONSORS" },
      { texto: "Finanzas", href: "/admin/finanzas", seccion: "FINANCE" },
      { texto: "Analítica", href: "/admin/analitica", seccion: "ANALYTICS" },
    ],
  },
  {
    titulo: "Sistema",
    entradas: [
      { texto: "Legal", href: "/admin/legal", seccion: "LEGAL" },
      { texto: "Trust & Safety", href: "/admin/trust", seccion: "TRUST_SAFETY" },
      { texto: "Auditoría", href: "/admin/auditoria", seccion: "AUDIT" },
      { texto: "Configuración", href: "/admin/configuracion", seccion: "SETTINGS" },
    ],
  },
];

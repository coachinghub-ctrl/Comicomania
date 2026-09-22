/* Menú del Admin Control Center.
   Agrupado por engine y no como una lista plana de cuarenta entradas: con
   cuarenta ítems seguidos nadie encuentra nada. Cada entrada declara la
   sección que exige, y el menú se dibuja desde los permisos efectivos. */

export type Entrada = { texto: string; href: string; seccion: string };
export type Grupo = { titulo: string; entradas: Entrada[] };

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
    ],
  },
  /* La Academia va sola y no dentro de Comercio: no es un producto más del
     catálogo, es una experiencia que se vive dentro de la plataforma. Cuando
     el e-learning crezca —progreso, foros, certificados, tutorías— todo eso
     cuelga de acá, no de la tienda. */
  {
    titulo: "Academia",
    entradas: [
      { texto: "Cursos", href: "/admin/academia", seccion: "ACADEMY" },
      { texto: "Alumnos", href: "/admin/academia/alumnos", seccion: "ACADEMY" },
      { texto: "Certificados", href: "/admin/academia/certificados", seccion: "ACADEMY" },
    ],
  },
  /* Talento va solo, por el mismo motivo que la Academia: no es una línea de
     negocio más, es el repertorio de humoristas —con su video y su biografía—
     y lo que se enseña al público. Administrar un catálogo de artistas no se
     parece en nada a administrar patrocinios. */
  {
    titulo: "Talento",
    entradas: [
      { texto: "Repertorio", href: "/admin/talento", seccion: "TALENT" },
      { texto: "Contrataciones", href: "/admin/talento/contrataciones", seccion: "BOOKINGS" },
      { texto: "Presupuestos", href: "/admin/talento/presupuestos", seccion: "BOOKINGS" },
    ],
  },
  {
    titulo: "Negocio",
    entradas: [
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

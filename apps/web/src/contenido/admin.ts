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

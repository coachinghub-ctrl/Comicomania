/**
 * El motor de "¿qué hago ahora?".
 *
 * Una sola función, consumida por la web, el email, el push y el CRM. Si la
 * lógica se duplicara por canal, el banner diría una cosa y el correo otra.
 * Ver docs/03-journeys.md
 */

export type EstadoParticipacion =
  | "SIN_INSCRIBIR"
  | "INSCRITO"
  | "VIDEO_ENVIADO"
  | "EN_REVISION"
  | "CAMBIOS_SOLICITADOS"
  | "PUBLICADO"
  | "ELIMINADO";

export type EstadoUsuario = {
  emailVerificado: boolean;
  /** 0 a 100. */
  completitudPerfil: number;
  esHumorista: boolean;
  /** Concurso con inscripciones abiertas en su ciudad, si lo hay. */
  concursoAbierto?: { nombre: string; href: string } | null;
  participacion?: EstadoParticipacion | null;
  votacionAbierta: boolean;
  haVotado: boolean;
  talentosQueSigue: number;
  entradas: number;
  cursosActivos: number;
  diasSinActividad: number;
};

export type Accion = {
  codigo: string;
  titulo: string;
  descripcion: string;
  href: string;
  /** 1 es lo más urgente. Sirve para ordenar en el CRM. */
  prioridad: number;
};

/** Umbral por debajo del cual el perfil se considera incompleto. */
export const PERFIL_MINIMO = 60;
/** Días sin actividad a partir de los cuales entra reactivación. */
export const DIAS_INACTIVO = 30;

type Regla = {
  aplica: (e: EstadoUsuario) => boolean;
  accion: (e: EstadoUsuario) => Accion;
};

/* El orden ES la lógica: gana la primera que aplica. */
const REGLAS: Regla[] = [
  {
    aplica: (e) => !e.emailVerificado,
    accion: () => ({
      codigo: "VERIFICAR_EMAIL",
      titulo: "Verifica tu email",
      descripcion:
        "Te mandamos un enlace. Sin verificar no puedes votar ni participar.",
      href: "/entrar?reenviar=1",
      prioridad: 1,
    }),
  },
  {
    aplica: (e) => e.completitudPerfil < PERFIL_MINIMO,
    accion: (e) => ({
      codigo: "COMPLETAR_PERFIL",
      titulo: "Completa tu perfil",
      descripcion: `Vas por ${e.completitudPerfil}%. Te faltan un par de datos.`,
      href: "/mi/perfil",
      prioridad: 2,
    }),
  },
  {
    aplica: (e) =>
      e.esHumorista &&
      !!e.concursoAbierto &&
      (!e.participacion || e.participacion === "SIN_INSCRIBIR"),
    accion: (e) => ({
      codigo: "INSCRIBIRSE",
      titulo: `Inscríbete en ${e.concursoAbierto!.nombre}`,
      descripcion: "Las inscripciones están abiertas en tu ciudad.",
      href: e.concursoAbierto!.href,
      prioridad: 1,
    }),
  },
  /* Esta regla casi nunca dispara desde la web: inscribirse y mandar el video
     ocurren en la misma transacción, así que nadie se queda INSCRITO sin video.
     Sigue aquí porque sí pasa cuando alguien inscribe a mano desde el panel. */
  {
    aplica: (e) => e.participacion === "INSCRITO",
    accion: () => ({
      codigo: "SUBIR_VIDEO",
      titulo: "Sube tu video",
      descripcion: "Dos minutos de rutina. Desde el teléfono sirve.",
      href: "/participa",
      prioridad: 1,
    }),
  },
  {
    aplica: (e) => e.participacion === "CAMBIOS_SOLICITADOS",
    accion: () => ({
      codigo: "CORREGIR_VIDEO",
      titulo: "Tu video necesita un ajuste",
      descripcion: "Mira el comentario del equipo y vuelve a enviarlo.",
      href: "/mi/participacion",
      prioridad: 1,
    }),
  },
  {
    aplica: (e) => e.participacion === "PUBLICADO",
    accion: () => ({
      codigo: "COMPARTIR_VIDEO",
      titulo: "Comparte tu video",
      descripcion: "Ya está publicado. Los votos los traes tú.",
      href: "/mi/participacion",
      prioridad: 2,
    }),
  },
  {
    aplica: (e) => e.votacionAbierta && !e.haVotado,
    accion: () => ({
      codigo: "VOTAR",
      titulo: "Vota",
      descripcion: "La votación está abierta. Un voto por participante.",
      href: "/participa",
      prioridad: 2,
    }),
  },
  {
    aplica: (e) => e.haVotado && e.talentosQueSigue === 0,
    accion: () => ({
      codigo: "SEGUIR_TALENTO",
      titulo: "Sigue a quien te hizo reír",
      descripcion: "Te avisamos cuando suba algo nuevo.",
      href: "/humoristas",
      prioridad: 3,
    }),
  },
  {
    aplica: (e) => e.talentosQueSigue > 0 && e.entradas === 0,
    accion: () => ({
      codigo: "COMPRAR_ENTRADA",
      titulo: "Ve a un show en vivo",
      descripcion: "Los que sigues se presentan en tu ciudad.",
      href: "/",
      prioridad: 3,
    }),
  },
  {
    aplica: (e) => e.entradas > 0 && e.cursosActivos === 0,
    accion: () => ({
      codigo: "EXPLORAR_ACADEMIA",
      titulo: "Aprende a hacer reír",
      descripcion: "La Academia enseña lo que hay detrás de una buena rutina.",
      href: "/academia",
      prioridad: 4,
    }),
  },
  {
    aplica: (e) => e.diasSinActividad >= DIAS_INACTIVO,
    accion: () => ({
      codigo: "REACTIVAR",
      titulo: "Hay contenido nuevo en tu ciudad",
      descripcion: "Mira lo que te perdiste este mes.",
      href: "/humoristas",
      prioridad: 5,
    }),
  },
];

/** Acción por defecto cuando el usuario está al día con todo. */
const EXPLORAR: Accion = {
  codigo: "EXPLORAR",
  titulo: "Descubre talento nuevo",
  descripcion: "Mira lo último de la comunidad.",
  href: "/humoristas",
  prioridad: 6,
};

export function siguientePaso(estado: EstadoUsuario): Accion {
  const regla = REGLAS.find((r) => r.aplica(estado));
  return regla ? regla.accion(estado) : EXPLORAR;
}

/** Todas las acciones aplicables, ordenadas. El CRM las usa para segmentar. */
export function accionesPendientes(estado: EstadoUsuario): Accion[] {
  return REGLAS.filter((r) => r.aplica(estado))
    .map((r) => r.accion(estado))
    .sort((a, b) => a.prioridad - b.prioridad);
}

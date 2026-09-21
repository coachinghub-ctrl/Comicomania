import { contieneTerritorio } from "./territorio";
import type { Actor, Decision, Grant, Motivo, Solicitud } from "./tipos";

/** Acciones que exigen segundo factor reciente. Espejo del seed de permissions. */
export const PERMISOS_CON_MFA = new Set([
  "ACCESS_CONTROL.VIEW",
  "ACCESS_CONTROL.MANAGE",
  "FINANCE.VIEW",
  "FINANCE.EXPORT",
  "ORDERS.REFUND",
  "SCORING.EDIT",
  "VOTING.MANAGE",
  "LEGAL.CONFIGURE",
  "SETTINGS.CONFIGURE",
  "INFRA.MANAGE",
]);

/** Ventana de validez del segundo factor. */
export const MFA_VIGENCIA_MS = 12 * 60 * 60 * 1000;

function vigente(grant: Grant, ahora: Date): boolean {
  if (grant.estado !== "ACTIVE") return false;
  if (grant.desde > ahora) return false;
  if (grant.hasta && grant.hasta <= ahora) return false;
  return true;
}

function cubreTerritorio(grant: Grant, solicitud: Solicitud): boolean {
  if (grant.tipoAlcance === "GLOBAL") return true;

  // Grant sobre un objeto concreto (un concurso, un evento, un venue).
  if (grant.alcanceId) {
    if (grant.alcanceId === solicitud.alcanceId) return true;
    // Un grant de objeto no abarca territorio; si además trae path, sigue.
  }

  return contieneTerritorio(grant.alcancePath, solicitud.path);
}

/**
 * Resolución de autoridad. Una sola función, un solo lugar.
 * Espejo exacto de public.has_permission() en la base: si esto cambia,
 * la migración correspondiente cambia con ello.
 */
export function puede(
  actor: Actor,
  solicitud: Solicitud,
  ahora: Date = new Date(),
): Decision {
  const permiso = `${solicitud.seccion}.${solicitud.accion}`;

  // Deny gana sobre cualquier concesión, venga del grant que venga.
  const denegadoEnAlgunRol = actor.grants.some(
    (g) => vigente(g, ahora) && g.denegados.includes(permiso),
  );

  let motivo: Motivo = "SIN_GRANT_VIGENTE";

  for (const grant of actor.grants) {
    if (!vigente(grant, ahora)) continue;

    if (!cubreTerritorio(grant, solicitud)) {
      motivo = peor(motivo, "FUERA_DE_TERRITORIO");
      continue;
    }
    if (!grant.secciones.includes(solicitud.seccion)) {
      motivo = peor(motivo, "SECCION_NO_INCLUIDA");
      continue;
    }
    if (!grant.acciones.includes(solicitud.accion)) {
      motivo = peor(motivo, "ACCION_NO_INCLUIDA");
      continue;
    }
    if (grant.denegados.includes(permiso) || denegadoEnAlgunRol) {
      return { permitido: false, motivo: "DENEGADO_POR_ROL", grant };
    }
    if (PERMISOS_CON_MFA.has(permiso) && !mfaVigente(actor, ahora)) {
      return { permitido: false, motivo: "MFA_REQUERIDA", grant };
    }
    return { permitido: true, motivo: "PERMITIDO", grant };
  }

  return { permitido: false, motivo };
}

function mfaVigente(actor: Actor, ahora: Date): boolean {
  if (!actor.mfaEn) return false;
  return ahora.getTime() - actor.mfaEn.getTime() <= MFA_VIGENCIA_MS;
}

/** El motivo más específico gana, para que el mensaje de auditoría sirva. */
const ORDEN: Motivo[] = [
  "SIN_GRANT_VIGENTE",
  "FUERA_DE_TERRITORIO",
  "SECCION_NO_INCLUIDA",
  "ACCION_NO_INCLUIDA",
];
function peor(a: Motivo, b: Motivo): Motivo {
  return ORDEN.indexOf(b) > ORDEN.indexOf(a) ? b : a;
}

/**
 * Filtro de territorio para listados. Todo repositorio de admin lo usa:
 * sin él no se puede construir una consulta de administración.
 */
export function territoriosPermitidos(
  actor: Actor,
  seccion: string,
  accion: string,
  ahora: Date = new Date(),
): { global: boolean; paths: string[]; objetos: string[] } {
  const paths: string[] = [];
  const objetos: string[] = [];
  let global = false;

  for (const grant of actor.grants) {
    if (!vigente(grant, ahora)) continue;
    if (!grant.secciones.includes(seccion)) continue;
    if (!grant.acciones.includes(accion)) continue;
    if (grant.denegados.includes(`${seccion}.${accion}`)) continue;

    if (grant.tipoAlcance === "GLOBAL") global = true;
    else if (grant.alcancePath) paths.push(grant.alcancePath);
    else if (grant.alcanceId) objetos.push(grant.alcanceId);
  }

  return { global, paths, objetos };
}

import { cache } from "react";
import { puede, territoriosPermitidos } from "@comicomania/authz";
import type { Actor, Grant, Solicitud } from "@comicomania/authz";
import { crearClienteServidor } from "./supabase/server";

/* Puente entre la base y el núcleo de autorización.
   Carga los grants del actor una sola vez por request (cache de React) y los
   traduce al tipo que entiende @comicomania/authz. La decisión la toma esa
   librería, no esta capa: acá solo se leen datos. */

export type ActorConIdentidad = Actor & {
  email: string;
  nombre: string;
  esAnonimo: boolean;
};

const ANONIMO: ActorConIdentidad = {
  usuarioId: "",
  grants: [],
  mfaEn: null,
  email: "",
  nombre: "",
  esAnonimo: true,
};

export const cargarActor = cache(async (): Promise<ActorConIdentidad> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) return ANONIMO;

  const [{ data: id }, { data: filas }] = await Promise.all([
    supabase.from("users").select("display_name, email").eq("id", credencial.id).single(),
    supabase
      .from("access_grants")
      .select(
        "role_id, scope_type, scope_id, scope_path, sections, actions, finance_level, starts_at, ends_at, status, roles(slug, denied_permissions)",
      )
      .eq("user_id", credencial.id),
  ]);

  const grants: Grant[] = (filas ?? []).map((g) => {
    const rol = g.roles as { slug: string; denied_permissions: string[] } | null;
    return {
      rol: rol?.slug ?? "",
      tipoAlcance: g.scope_type,
      alcanceId: g.scope_id,
      alcancePath: g.scope_path,
      secciones: g.sections ?? [],
      acciones: g.actions ?? [],
      nivelFinanciero: g.finance_level,
      desde: new Date(g.starts_at),
      hasta: g.ends_at ? new Date(g.ends_at) : null,
      estado: g.status,
      denegados: rol?.denied_permissions ?? [],
    };
  });

  return {
    usuarioId: credencial.id,
    grants,
    // El momento del segundo factor lo publica Supabase en el AAL de la sesión.
    mfaEn:
      credencial.factors && credencial.factors.length > 0
        ? new Date(credencial.updated_at ?? Date.now())
        : null,
    email: id?.email ?? credencial.email ?? "",
    nombre: id?.display_name ?? credencial.email?.split("@")[0] ?? "",
    esAnonimo: false,
  };
});

/** ¿Puede el actor actual hacer esto? */
export async function puedeActor(solicitud: Solicitud): Promise<boolean> {
  const actor = await cargarActor();
  return puede(actor, solicitud).permitido;
}

/** Los territorios que el actor administra, para pintarlos y para filtrar. */
export async function alcanceDelActor(seccion: string, accion = "VIEW") {
  const actor = await cargarActor();
  return territoriosPermitidos(actor, seccion, accion);
}

/** ¿Tiene acceso al Admin en general? */
export async function tieneAlgunAcceso(): Promise<boolean> {
  const actor = await cargarActor();
  return actor.grants.some(
    (g) => g.estado === "ACTIVE" && (!g.hasta || g.hasta > new Date()),
  );
}

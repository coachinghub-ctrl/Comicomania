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

type NivelAAL = {
  currentLevel: string | null;
  currentAuthenticationMethods: ({ method: string; timestamp: number } | string)[];
} | null;

/* Supabase publica los métodos de autenticación en dos formas: objetos con
   marca de tiempo, o solo los nombres (RFC-8176). Con la segunda sabemos que
   hubo segundo factor pero no cuándo; ahí se asume "ahora", porque el AAL
   describe la sesión en curso y negarlo dejaría a la persona fuera de los
   permisos que acaba de ganar. */
function momentoDelSegundoFactor(aal: NivelAAL): Date | null {
  if (aal?.currentLevel !== "aal2") return null;

  for (const metodo of aal.currentAuthenticationMethods ?? []) {
    if (typeof metodo === "string") {
      if (metodo === "totp") return new Date();
      continue;
    }
    if (metodo.method === "totp") return new Date(metodo.timestamp * 1000);
  }
  return null;
}

export const cargarActor = cache(async (): Promise<ActorConIdentidad> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) return ANONIMO;

  /* Cuándo ocurrió el segundo factor EN ESTA SESIÓN.

     Antes se usaba `credencial.updated_at` si el usuario tenía algún factor
     enrolado, y eso no es lo mismo: `updated_at` es cuándo cambió la fila del
     usuario. Fallaba en las dos direcciones —daba por vigente un factor que
     nunca se usó en esta sesión, y caducaba uno recién verificado— justo en
     los diez permisos que más lo necesitan.

     El dato real está en el AAL de la sesión: si llegó a aal2, entre los
     métodos de autenticación aparece el TOTP con su marca de tiempo. */
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const mfaEn = momentoDelSegundoFactor(aal);

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
    mfaEn,
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

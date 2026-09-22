"use server";

import { revalidatePath } from "next/cache";
import { contieneTerritorio, puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

/* Otorgar y revocar accesos.

   Acá vive la seguridad, no en el asistente. El asistente es una comodidad:
   puede estar mal, puede ser manipulado desde el navegador, puede incluso no
   existir. Estas funciones asumen que lo que llega es hostil.

   Tres reglas, en este orden:

   1. ACCESS_CONTROL.MANAGE, que además exige segundo factor vigente.
   2. El territorio del nuevo acceso tiene que caer DENTRO del territorio del
      que otorga. Un manager de Miami no reparte accesos sobre Bogotá.
   3. Secciones y acciones tienen que ser un SUBCONJUNTO de las que el que
      otorga posee. El rol es una plantilla que se puede recortar, nunca
      ampliar: si no, cualquiera con el permiso se ascendería a sí mismo
      eligiendo un rol más alto. Esta es la regla que hace que la jerarquía
      signifique algo.

   RLS vuelve a comprobar el permiso al escribir. Que haya dos murallas es a
   propósito: si un día alguien llama esto desde otro sitio, la base aguanta. */

const MOTIVOS: Record<string, string> = {
  MFA_REQUERIDA:
    "Este permiso exige segundo factor. Verifícalo en Seguridad y vuelve.",
  SIN_GRANT: "No tienes ningún acceso vigente que permita esto.",
  FUERA_DE_TERRITORIO: "Ese territorio queda fuera de tu alcance.",
  SECCION_NO_INCLUIDA: "Tu acceso no incluye el control de accesos.",
  ACCION_NO_INCLUIDA: "Tu acceso no incluye otorgar.",
  DENEGADO_POR_ROL: "Tu rol tiene prohibido repartir accesos.",
};

function explicar(motivo: string) {
  return MOTIVOS[motivo] ?? `No permitido: ${motivo.toLowerCase().replaceAll("_", " ")}.`;
}

/** Lo que el actor posee hoy para una sección, mirando solo grants vigentes. */
function loQuePosee(
  grants: {
    secciones: string[];
    acciones: string[];
    estado: string;
    hasta?: Date | null;
  }[],
) {
  const ahora = new Date();
  const secciones = new Set<string>();
  const acciones = new Set<string>();
  for (const g of grants) {
    if (g.estado !== "ACTIVE") continue;
    if (g.hasta && g.hasta <= ahora) continue;
    for (const s of g.secciones) secciones.add(s);
    for (const a of g.acciones) acciones.add(a);
  }
  return { secciones, acciones };
}

export async function crearAcceso(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "ACCESS_CONTROL", accion: "MANAGE" });
  if (!decision.permitido) {
    return { estado: "error", mensaje: explicar(decision.motivo) };
  }

  const personaId = String(datos.get("persona") ?? "").trim();
  const rolId = String(datos.get("rol") ?? "").trim();
  const tipoAlcance = String(datos.get("tipoAlcance") ?? "").trim();
  const alcanceId = String(datos.get("alcanceId") ?? "").trim() || null;
  const alcancePath = String(datos.get("alcancePath") ?? "").trim() || null;
  const secciones = datos.getAll("secciones").map(String);
  const acciones = datos.getAll("acciones").map(String);
  const hasta = String(datos.get("hasta") ?? "").trim();
  const motivo = String(datos.get("motivo") ?? "").trim();

  if (!personaId || !rolId) {
    return { estado: "error", mensaje: "Falta la persona o el rol." };
  }
  if (secciones.length === 0 || acciones.length === 0) {
    return {
      estado: "error",
      mensaje: "Un acceso sin secciones o sin acciones no sirve de nada.",
    };
  }
  if (!motivo) {
    return {
      estado: "error",
      mensaje: "Escribe por qué otorgas este acceso: queda en la auditoría.",
    };
  }

  // Regla 2. GLOBAL solo lo reparte quien tiene GLOBAL.
  if (tipoAlcance === "GLOBAL") {
    const tieneGlobal = actor.grants.some(
      (g) => g.estado === "ACTIVE" && g.tipoAlcance === "GLOBAL",
    );
    if (!tieneGlobal) {
      return { estado: "error", mensaje: explicar("FUERA_DE_TERRITORIO") };
    }
  } else {
    if (!alcancePath || !alcanceId) {
      return { estado: "error", mensaje: "Falta el territorio." };
    }
    const alcanza = actor.grants.some(
      (g) =>
        g.estado === "ACTIVE" &&
        (g.tipoAlcance === "GLOBAL" ||
          contieneTerritorio(g.alcancePath, alcancePath)),
    );
    if (!alcanza) {
      return { estado: "error", mensaje: explicar("FUERA_DE_TERRITORIO") };
    }
  }

  // Regla 3. Nunca por encima de lo propio.
  const propio = loQuePosee(actor.grants);
  const seccionesDeMas = secciones.filter((s) => !propio.secciones.has(s));
  const accionesDeMas = acciones.filter((a) => !propio.acciones.has(a));
  if (seccionesDeMas.length > 0 || accionesDeMas.length > 0) {
    return {
      estado: "error",
      mensaje: `No puedes otorgar lo que tú no tienes: ${[...seccionesDeMas, ...accionesDeMas].join(", ")}.`,
    };
  }

  const supabase = await crearClienteServidor();

  // El rol acota la plantilla: lo elegido tampoco puede pasarse de ahí.
  const { data: rol } = await supabase
    .from("roles")
    .select("slug, default_sections, default_actions")
    .eq("id", rolId)
    .single();
  if (!rol) {
    return { estado: "error", mensaje: "Ese rol no existe o no lo alcanzas." };
  }
  const fueraDelRol = [
    ...secciones.filter((s) => !(rol.default_sections ?? []).includes(s)),
    ...acciones.filter((a) => !(rol.default_actions ?? []).includes(a)),
  ];
  if (fueraDelRol.length > 0) {
    return {
      estado: "error",
      mensaje: `El rol ${rol.slug} no contempla: ${fueraDelRol.join(", ")}.`,
    };
  }

  const { data: creado, error } = await supabase
    .from("access_grants")
    .insert({
      user_id: personaId,
      role_id: rolId,
      scope_type: tipoAlcance as "GLOBAL" | "COUNTRY" | "REGION" | "CITY",
      scope_id: tipoAlcance === "GLOBAL" ? null : alcanceId,
      scope_path: tipoAlcance === "GLOBAL" ? null : alcancePath,
      sections: secciones,
      actions: acciones,
      ends_at: hasta ? new Date(`${hasta}T23:59:59`).toISOString() : null,
      granted_by: actor.usuarioId,
      reason: motivo,
    })
    .select("id")
    .single();

  if (error) {
    return { estado: "error", mensaje: `La base rechazó el acceso: ${error.message}` };
  }

  /* Historial y auditoría. Si fallan, el acceso ya existe: no se revierte por
     eso, pero tampoco se calla. Un acceso sin rastro es peor que un error. */
  const rastro = await Promise.all([
    supabase.from("access_history").insert({
      user_id: personaId,
      grant_id: creado.id,
      change_type: "GRANTED",
      after: {
        rol: rol.slug,
        alcance: tipoAlcance,
        path: alcancePath,
        secciones,
        acciones,
        hasta: hasta || null,
      },
      actor_id: actor.usuarioId,
    }),
    supabase.from("audit_logs").insert({
      actor_user_id: actor.usuarioId,
      actor_role: decision.grant?.rol ?? null,
      scope_type: tipoAlcance as "GLOBAL" | "COUNTRY" | "REGION" | "CITY",
      section: "ACCESS_CONTROL",
      action: "CREATE",
      object_type: "access_grant",
      object_id: creado.id,
      new_value: { rol: rol.slug, path: alcancePath, motivo },
      result: "ALLOWED",
    }),
  ]);

  revalidatePath("/admin/acceso");

  const falloDeRastro = rastro.find((r) => r.error)?.error;
  if (falloDeRastro) {
    return {
      estado: "error",
      mensaje: `El acceso se creó, pero no quedó completo en auditoría: ${falloDeRastro.message}. Avisa a quien administre el sistema.`,
    };
  }

  return { estado: "ok", mensaje: "Acceso otorgado y registrado en auditoría." };
}

export async function revocarAcceso(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "ACCESS_CONTROL", accion: "MANAGE" });
  if (!decision.permitido) {
    return { estado: "error", mensaje: explicar(decision.motivo) };
  }

  const grantId = String(datos.get("grant") ?? "").trim();
  if (!grantId) return { estado: "error", mensaje: "Falta el acceso a revocar." };

  const supabase = await crearClienteServidor();

  /* Se lee antes de tocar: para dejar el "antes" en el historial y para no
     revocar a ciegas algo que quizá ni siquiera alcanzamos. */
  const { data: antes } = await supabase
    .from("access_grants")
    .select("id, user_id, scope_type, scope_path, sections, actions, status, roles(slug)")
    .eq("id", grantId)
    .single();

  if (!antes) {
    return { estado: "error", mensaje: "Ese acceso no existe o no lo alcanzas." };
  }

  if (antes.user_id === actor.usuarioId) {
    return {
      estado: "error",
      mensaje: "No puedes revocarte a ti mismo: dejarías el panel sin dueño.",
    };
  }

  const { error } = await supabase
    .from("access_grants")
    .update({ status: "REVOKED" })
    .eq("id", grantId);

  if (error) {
    return { estado: "error", mensaje: `No se pudo revocar: ${error.message}` };
  }

  const rol = antes.roles as { slug: string } | null;

  await Promise.all([
    supabase.from("access_history").insert({
      user_id: antes.user_id,
      grant_id: grantId,
      change_type: "REVOKED",
      before: {
        rol: rol?.slug ?? null,
        alcance: antes.scope_type,
        path: antes.scope_path,
        estado: antes.status,
      },
      actor_id: actor.usuarioId,
    }),
    supabase.from("audit_logs").insert({
      actor_user_id: actor.usuarioId,
      actor_role: decision.grant?.rol ?? null,
      scope_type: antes.scope_type,
      section: "ACCESS_CONTROL",
      action: "DELETE",
      object_type: "access_grant",
      object_id: grantId,
      previous_value: { rol: rol?.slug ?? null, path: antes.scope_path },
      result: "ALLOWED",
    }),
  ]);

  revalidatePath("/admin/acceso");
  return { estado: "ok", mensaje: "Acceso revocado." };
}

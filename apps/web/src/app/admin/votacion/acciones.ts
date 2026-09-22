"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

/* Invalidar votos.

   Ningún voto se borra: se marca. Un voto borrado no se puede auditar, y el
   día que alguien acuse de haber quitado votos no habría con qué responder.
   La base lo impide además con una regla que convierte el DELETE en nada.

   VOTING.MANAGE exige segundo factor. Es de los diez permisos que lo piden, y
   con razón: quien puede anular votos puede cambiar un ganador. */
export async function invalidarVotos(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "VOTING", accion: "MANAGE" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje:
        decision.motivo === "MFA_REQUERIDA"
          ? "Anular votos exige segundo factor. Verifícalo en Seguridad."
          : `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const ids = datos.getAll("voto").map(String).filter(Boolean);
  const motivo = String(datos.get("motivo") ?? "").trim();

  if (ids.length === 0) {
    return { estado: "error", mensaje: "No seleccionaste ningún voto." };
  }
  if (!motivo) {
    return {
      estado: "error",
      mensaje: "Escribe el motivo: anular sin explicación no se puede defender.",
    };
  }

  const supabase = await crearClienteServidor();

  const { data: antes } = await supabase
    .from("votes")
    .select("id, status, round_id, participant_id")
    .in("id", ids);

  const { error } = await supabase
    .from("votes")
    .update({
      status: "INVALIDATED",
      invalidated_reason: motivo,
      invalidated_by: actor.usuarioId,
    })
    .in("id", ids);

  if (error) {
    return { estado: "error", mensaje: `No se pudo anular: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "VOTING",
    action: "MANAGE",
    object_type: "vote",
    object_id: ids.join(","),
    previous_value: { votos: antes ?? [] },
    new_value: { status: "INVALIDATED", motivo, cantidad: ids.length },
    result: "ALLOWED",
  });

  revalidatePath("/admin/votacion");
  return {
    estado: "ok",
    mensaje: `${ids.length} ${ids.length === 1 ? "voto anulado" : "votos anulados"}, con el motivo registrado.`,
  };
}

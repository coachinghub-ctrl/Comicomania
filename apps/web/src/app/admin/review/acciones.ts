"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

/* Decidir sobre un video.

   Tres decisiones y una regla: cada una deja una fila en video_reviews y otra
   en audit_logs. El historial no se edita ni se borra —lo impiden dos reglas
   de Postgres— porque una decisión que puede reescribirse no sirve para
   defenderse el día que alguien reclame.

   El estado nuevo no se recibe del formulario. Se deriva de la decisión acá:
   si el cliente pudiera elegirlo, un rechazado podría llegar a PUBLISHED sin
   pasar por nadie. */

const SIGUIENTE = {
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  REJECTED: "REJECTED",
} as const;

type Decision = keyof typeof SIGUIENTE;

export async function decidirVideo(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const videoId = String(datos.get("video") ?? "").trim();
  const decision = String(datos.get("decision") ?? "").trim() as Decision;
  const comentario = String(datos.get("comentario") ?? "").trim();

  if (!videoId || !(decision in SIGUIENTE)) {
    return { estado: "error", mensaje: "Falta el video o la decisión." };
  }

  /* Rechazar es terminal y pedir cambios devuelve trabajo a alguien: las dos
     exigen decir por qué. Aprobar no, porque el silencio ahí no perjudica a
     nadie. */
  if (decision !== "APPROVED" && !comentario) {
    return {
      estado: "error",
      mensaje:
        decision === "REJECTED"
          ? "Un rechazo sin motivo no se puede apelar. Escribe por qué."
          : "Di qué hay que cambiar: quien lo subió no puede adivinarlo.",
    };
  }

  // El territorio sale del concurso del video, no de lo que mande el cliente.
  const { data: video } = await supabase
    .from("videos")
    .select("id, status, rights_status, title, contests(name, cities(path), countries(path))")
    .eq("id", videoId)
    .single();

  if (!video) {
    return { estado: "error", mensaje: "Ese video no existe o no lo alcanzas." };
  }

  const concurso = video.contests as {
    name: string;
    cities: { path: string } | null;
    countries: { path: string } | null;
  } | null;
  const path = concurso?.cities?.path ?? concurso?.countries?.path ?? null;

  const permiso = puede(actor, {
    seccion: "VIDEO_REVIEW",
    accion: decision === "REJECTED" ? "REJECT" : "APPROVE",
    path,
  });
  if (!permiso.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${permiso.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const nuevoEstado = SIGUIENTE[decision];

  const { error } = await supabase
    .from("videos")
    .update({ status: nuevoEstado })
    .eq("id", videoId);

  if (error) {
    return { estado: "error", mensaje: `No se pudo actualizar: ${error.message}` };
  }

  const [{ error: falloHistorial }] = await Promise.all([
    supabase.from("video_reviews").insert({
      video_id: videoId,
      reviewer_id: actor.usuarioId,
      decision,
      comment: comentario || null,
    }),
    supabase.from("audit_logs").insert({
      actor_user_id: actor.usuarioId,
      actor_role: permiso.grant?.rol ?? null,
      scope_path: path,
      section: "VIDEO_REVIEW",
      action: decision === "REJECTED" ? "REJECT" : "APPROVE",
      object_type: "video",
      object_id: videoId,
      previous_value: { status: video.status },
      new_value: { status: nuevoEstado, comentario: comentario || null },
      result: "ALLOWED",
    }),
  ]);

  revalidatePath("/admin/review");

  if (falloHistorial) {
    return {
      estado: "error",
      mensaje: `El video cambió de estado, pero la decisión no quedó en el historial: ${falloHistorial.message}`,
    };
  }

  const dicho = {
    APPROVED: "Aprobado.",
    CHANGES_REQUESTED: "Se pidieron cambios. Quien lo subió ya puede verlo.",
    REJECTED: "Rechazado, con el motivo registrado.",
  }[decision];

  return { estado: "ok", mensaje: dicho };
}

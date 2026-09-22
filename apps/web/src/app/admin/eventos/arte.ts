"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const MAX = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/* El arte de un evento y la frase que lo acompaña.

   Se guardan juntos a propósito: un cartel sin su frase en texto es una
   promesa que solo existe dentro de un JPG — no se puede buscar, ni poner en
   el asunto de un correo, ni leer en voz alta. */
export async function guardarArteDeEvento(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const eventoId = String(datos.get("evento") ?? "").trim();
  if (!eventoId) return { estado: "error", mensaje: "Falta el evento." };

  const { data: evento } = await supabase
    .from("events")
    .select("id, slug, cities(path), countries(path)")
    .eq("id", eventoId)
    .single();

  if (!evento) {
    return { estado: "error", mensaje: "Ese evento no existe o no lo alcanzas." };
  }

  const ciudad = evento.cities as { path: string } | null;
  const pais = evento.countries as { path: string } | null;
  const path = ciudad?.path ?? pais?.path ?? null;

  const decision = puede(actor, { seccion: "EVENTS", accion: "EDIT", path });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const tagline = String(datos.get("tagline") ?? "").trim();
  const subtitulo = String(datos.get("subtitulo") ?? "").trim();
  const alt = String(datos.get("alt") ?? "").trim();
  const cartel = datos.get("cartel") as File | null;

  let posterUrl: string | undefined;
  if (cartel && cartel.size > 0) {
    if (!TIPOS.includes(cartel.type)) {
      return { estado: "error", mensaje: "El cartel debe ser JPG, PNG o WebP." };
    }
    if (cartel.size > MAX) {
      return {
        estado: "error",
        mensaje: `Ese archivo pesa ${(cartel.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
      };
    }
    if (!alt) {
      return {
        estado: "error",
        mensaje:
          "Describe qué se ve en el cartel. Es lo que más se comparte: sin descripción, quien no lo ve se queda fuera.",
      };
    }

    const extension = cartel.type.split("/")[1]!.replace("jpeg", "jpg");
    const ruta = `carteles/${evento.slug}-${Date.now()}.${extension}`;

    const { error: fallo } = await supabase.storage
      .from("concursos")
      .upload(ruta, cartel, { upsert: false, contentType: cartel.type });

    if (fallo) {
      return { estado: "error", mensaje: `No se pudo subir el cartel: ${fallo.message}` };
    }
    posterUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;
  }

  const { error } = await supabase
    .from("events")
    .update({
      tagline: tagline || null,
      subtitle: subtitulo || null,
      ...(alt ? { poster_alt: alt } : {}),
      ...(posterUrl ? { poster_url: posterUrl } : {}),
    })
    .eq("id", eventoId);

  if (error) {
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    scope_path: path,
    section: "EVENTS",
    action: "EDIT",
    object_type: "event",
    object_id: eventoId,
    new_value: { cartel_nuevo: Boolean(posterUrl), tagline: Boolean(tagline) },
    result: "ALLOWED",
  });

  revalidatePath("/admin/eventos");
  revalidatePath(`/eventos/${evento.slug}`);
  return { estado: "ok", mensaje: "Arte guardado." };
}

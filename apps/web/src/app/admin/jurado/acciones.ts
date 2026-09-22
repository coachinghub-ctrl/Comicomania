"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

/* La ficha de juez y el acceso al panel son dos cosas distintas.

   Un juez histórico puede tener ficha sin cuenta; alguien con rol JUDGE pero
   sin ficha no aparece ante el público. Crear la ficha NO otorga permisos: eso
   se hace en Accesos, a propósito, para que nadie gane acceso al panel como
   efecto secundario de aparecer en una lista. */
export async function crearJuez(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "JUDGES", accion: "MANAGE" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const bio = String(datos.get("bio") ?? "").trim();

  if (!nombre) return { estado: "error", mensaje: "Falta el nombre público." };

  const supabase = await crearClienteServidor();

  /* Si se dio un email, se vincula con la cuenta existente. No se crea la
     cuenta: invitar a alguien es otro acto, con su propio correo y su propio
     consentimiento. */
  let userId: string | null = null;
  if (email) {
    const { data: persona } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!persona) {
      return {
        estado: "error",
        mensaje: `No hay ninguna cuenta con ${email}. Crea la ficha sin email y vincúlala cuando esa persona se registre.`,
      };
    }
    userId = persona.id;
  }

  const { data: juez, error } = await supabase
    .from("judges")
    .insert({ display_name: nombre, bio: bio || null, user_id: userId })
    .select("id")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo crear: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "JUDGES",
    action: "CREATE",
    object_type: "judge",
    object_id: juez.id,
    new_value: { nombre, vinculado: Boolean(userId) },
    result: "ALLOWED",
  });

  revalidatePath("/admin/jurado");
  return {
    estado: "ok",
    mensaje: userId
      ? `${nombre} agregado y vinculado a su cuenta. Falta otorgarle el acceso con rol JUDGE.`
      : `${nombre} agregado. Sin cuenta vinculada todavía.`,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; completada: boolean }
  | { estado: "error"; mensaje: string };

/* Marcar una clase como vista.

   El porcentaje del curso NO se toca desde aquí. Lo recalcula la base cada
   vez que cambia el progreso de una lección, y por eso no puede
   desincronizarse: si esta acción escribiera el porcentaje a mano, el primer
   curso al que se le añada una lección dejaría a todo el mundo con un número
   inventado.

   Desmarcar también se puede. Alguien que marcó por error y no puede
   arreglarlo acaba escribiendo a soporte por una casilla. */
export async function marcarClase(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) {
    return { estado: "error", mensaje: "Hay que entrar con tu cuenta." };
  }

  const inscripcion = String(datos.get("inscripcion") ?? "").trim();
  const leccion = String(datos.get("leccion") ?? "").trim();
  const slug = String(datos.get("slug") ?? "").trim();
  const completar = datos.get("completar") === "si";

  if (!inscripcion || !leccion) {
    return { estado: "error", mensaje: "Falta la clase." };
  }

  /* La inscripción se comprueba contra la persona que pide, no contra lo que
     llega en el formulario: un id de inscripción ajeno no sirve de nada. RLS
     lo volvería a rechazar, pero mejor decirlo con palabras. */
  const { data: mia } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("id", inscripcion)
    .eq("user_id", credencial.id)
    .maybeSingle();

  if (!mia) {
    return { estado: "error", mensaje: "Esa inscripción no es tuya." };
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      enrollment_id: inscripcion,
      lesson_id: leccion,
      completed_at: completar ? new Date().toISOString() : null,
    },
    { onConflict: "enrollment_id,lesson_id" },
  );

  if (error) {
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath(`/mi/academia/${slug}`);
  revalidatePath("/mi/academia");
  revalidatePath("/mi");

  return { estado: "ok", completada: completar };
}

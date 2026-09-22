"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Los motivos que devuelve la base, traducidos a algo que se pueda leer.

   Ninguno dice si el correo ya estaba anotado: eso permitiría averiguar quién
   va a ir probando correos, y la lista de asistentes de un evento es
   exactamente lo que no se regala. */
const MOTIVOS: Record<string, string> = {
  correo_invalido: "Ese correo no parece válido.",
  evento_desconocido: "Ese evento ya no está disponible.",
  evento_de_pago: "Este evento tiene entradas de pago, no reserva libre.",
  reservas_cerradas: "Las reservas no están abiertas todavía.",
  evento_pasado: "Ese evento ya pasó.",
  aforo_completo: "Se acabaron los lugares.",
};

export async function reservarLugar(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const slug = String(datos.get("evento") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const telefono = String(datos.get("telefono") ?? "").trim();

  if (!EMAIL.test(email)) {
    return { estado: "error", mensaje: MOTIVOS.correo_invalido! };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("reservar_lugar", {
    p_evento: slug,
    p_email: email,
    p_nombre: nombre || undefined,
    p_telefono: telefono || undefined,
  });

  if (error) {
    const clave = Object.keys(MOTIVOS).find((k) => error.message.includes(k));
    return {
      estado: "error",
      mensaje: clave
        ? MOTIVOS[clave]!
        : "No pudimos reservar. Inténtalo de nuevo en un momento.",
    };
  }

  revalidatePath(`/eventos/${slug}`);
  return {
    estado: "ok",
    mensaje: "Te escribimos al correo con los detalles antes del evento.",
  };
}

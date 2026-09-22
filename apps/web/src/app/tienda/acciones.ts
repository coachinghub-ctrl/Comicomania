"use server";

import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Avisar cuando la tienda abra.

   Todavía no se puede cobrar: falta conectar Stripe. Un botón de "comprar"
   que no cobra es peor que no tenerlo, así que lo que hay es lo único honesto
   que se puede hacer hoy: anotar a quien quiere ese producto.

   No escribe en el CRM directamente. La tienda se mira sin cuenta, así que
   quien pide aviso es anónimo, y un anónimo no puede —ni debe— escribir en la
   tabla de contactos. Llama a una función de la base que hace solo esto.

   Tampoco distingue si el correo ya estaba anotado: decirlo permitiría
   averiguar quién más está en la lista probando correos. */
export async function avisarme(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const producto = String(datos.get("producto") ?? "").trim();

  if (!EMAIL.test(email)) {
    return { estado: "error", mensaje: "Ese correo no parece válido." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("registrar_interes_tienda", {
    p_email: email,
    p_producto: producto,
  });

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("producto_desconocido")
        ? "Ese producto ya no está disponible."
        : "No pudimos anotarte. Inténtalo de nuevo en un momento.",
    };
  }

  return { estado: "ok", mensaje: "Anotado. Te escribimos en cuanto abra." };
}

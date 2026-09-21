"use server";

import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoEnvio =
  | { estado: "inicial" }
  | { estado: "enviado"; email: string }
  | { estado: "error"; mensaje: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function enviarEnlace(
  _previo: EstadoEnvio,
  datos: FormData,
): Promise<EstadoEnvio> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const volver = String(datos.get("volver") ?? "/mi");

  if (!EMAIL.test(email)) {
    return { estado: "error", mensaje: "Ese email no parece válido." };
  }

  const cabeceras = await headers();
  const origen =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${cabeceras.get("host") ?? "localhost:3100"}`;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // El trigger de la base crea el COMICOMANIA ID al nacer la credencial.
      shouldCreateUser: true,
      emailRedirectTo: `${origen}/auth/confirmar?volver=${encodeURIComponent(volver)}`,
    },
  });

  if (error) {
    // No se filtra si el email existe o no: eso permitiría enumerar usuarios.
    return {
      estado: "error",
      mensaje: "No pudimos enviar el enlace. Inténtalo de nuevo en un minuto.",
    };
  }

  return { estado: "enviado", email };
}

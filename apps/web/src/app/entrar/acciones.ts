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
  const host = cabeceras.get("host") ?? "localhost:3100";
  // En local el host no lleva TLS: con https el enlace caería fuera de la
  // lista blanca de Supabase y el correo llegaría roto.
  const esquema = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? `${esquema}://${host}`;

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

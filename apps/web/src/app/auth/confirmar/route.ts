import type { Route } from "next";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/volver";

/* Aterrizaje del enlace mágico. Verifica el token y deja la sesión puesta.
   Un enlace vencido o ya usado no rompe: manda a /entrar con el motivo.

   Llega de dos formas, y las dos tienen que funcionar:

   a) ?code=...        La plantilla de correo de fábrica usa {{ .ConfirmationURL }},
                       que pasa por /auth/v1/verify y nos devuelve aquí con un
                       código PKCE. Solo sirve en el navegador que pidió el
                       enlace, porque el verificador vive en una cookie.

   b) ?token_hash=...  Lo que manda una plantilla con {{ .TokenHash }}. Funciona
                       en cualquier dispositivo, así que si algún día se
                       personaliza la plantilla, esta rama es la buena.

   Se aceptan las dos para que el correo no dependa de qué plantilla esté
   puesta en el panel. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Nunca el valor crudo: ver lib/volver.ts. Esto es un redirect abierto si
  // se confía en lo que venga en la URL.
  const volver = rutaSegura(searchParams.get("volver"));

  // GoTrue puede rebotar aquí con el fallo ya resuelto.
  if (searchParams.get("error")) {
    redirect("/entrar?error=enlace_vencido" as Route);
  }

  const supabase = await crearClienteServidor();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect("/entrar?error=enlace_vencido" as Route);
    }
    redirect(volver as Route);
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    redirect("/entrar?error=enlace_invalido" as Route);
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    redirect("/entrar?error=enlace_vencido" as Route);
  }

  redirect(volver as Route);
}

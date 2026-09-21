import type { Route } from "next";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/* Aterrizaje del enlace mágico. Verifica el token y deja la sesión puesta.
   Un enlace vencido o ya usado no rompe: manda a /entrar con el motivo. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const volver = searchParams.get("volver") ?? "/mi";

  if (!token_hash || !type) {
    redirect("/entrar?error=enlace_invalido" as Route);
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect("/entrar?error=enlace_vencido" as Route);
  }

  redirect(volver as Route);
}

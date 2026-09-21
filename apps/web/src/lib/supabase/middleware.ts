import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./tipos";

/* Refresca la sesión en cada request y protege /mi.
   Sin esto los Server Components reciben tokens vencidos. */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (galletas) => {
          for (const { name, value } of galletas) {
            request.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of galletas) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims valida el token; getSession() no, y por eso no se usa acá.
  const { data } = await supabase.auth.getClaims();
  const sesion = data?.claims;

  const ruta = request.nextUrl.pathname;
  const privada = ruta.startsWith("/mi") || ruta.startsWith("/admin");
  if (!sesion && privada) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("volver", ruta);
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

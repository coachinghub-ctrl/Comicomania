import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

/* Sitio fuera del aire.

   Mientras esto sea true, toda petición —páginas, API, imágenes, estáticos—
   responde 404 sin contenido. El desarrollo queda intacto: para volver a
   publicar basta con cambiar esta línea a false. */
const SITIO_CERRADO = true;

// Estáticos e imágenes: no necesitan sesión.
const SIN_SESION =
  /^\/(_next\/static|_next\/image|favicon\.ico|brand|apple-touch-icon)/;

export async function middleware(request: NextRequest) {
  if (SITIO_CERRADO) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  }
  if (SIN_SESION.test(request.nextUrl.pathname)) return NextResponse.next();
  return actualizarSesion(request);
}

export const config = {
  // Todo, estáticos incluidos: con el sitio cerrado no se sirve nada.
  matcher: ["/:path*"],
};

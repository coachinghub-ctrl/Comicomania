import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipos";

/* Cliente de servidor, atado a la sesión del usuario. Las consultas pasan por
   RLS con su auth.uid(): un operador de una ciudad no puede leer otra ni
   cambiando el ID en la URL. Ver docs/02-identidad-y-acceso.md */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (galletas) => {
          try {
            for (const { name, value, options } of galletas) {
              almacen.set(name, value, options);
            }
          } catch {
            // Server Component: el refresco de sesión lo hace el middleware.
          }
        },
      },
    },
  );
}

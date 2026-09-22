import { PROVEEDORES, type Proveedor } from "./catalogo";

/* Qué proveedores están conectados de verdad.
 *
 * FALLO ENCONTRADO al probarlo: el botón de Google llevaba a una página de
 * error en JSON de Supabase —"provider is not enabled"— porque signInWithOAuth
 * no comprueba nada: construye la dirección y ya. El mensaje amable que había
 * escrito para ese caso no llegaba a dispararse nunca.
 *
 * Enseñar un botón que no funciona es peor que no enseñarlo. Así que se
 * pregunta: Supabase publica qué proveedores están activos, sin necesidad de
 * llave de servicio.
 *
 * El efecto secundario es el bueno: el día que se conecte Google en el panel
 * de Supabase, el botón aparece solo. No hace falta desplegar nada.
 */

type Ajustes = { external?: Record<string, boolean> };

export async function proveedoresActivos(): Promise<Proveedor[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llave) return [];

  try {
    const respuesta = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: llave },
      /* Un minuto de caché. Suficiente para no pedirlo en cada carga, y lo
         bastante corto para que quien acaba de conectar un proveedor lo vea
         aparecer sin preguntarse si hizo algo mal. */
      next: { revalidate: 60 },
    });

    if (!respuesta.ok) return [];

    const ajustes = (await respuesta.json()) as Ajustes;
    const externos = ajustes.external ?? {};

    return (Object.keys(PROVEEDORES) as Proveedor[]).filter(
      (p) => externos[p] === true,
    );
  } catch {
    /* Si no se puede preguntar, no se enseñan botones. El correo sigue
       funcionando, que es lo que importa: nadie se queda sin entrar. */
    return [];
  }
}

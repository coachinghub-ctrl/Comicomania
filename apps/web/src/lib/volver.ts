/* A dónde se vuelve después de entrar.
 *
 * FALLO ENCONTRADO: `volver` llega en la URL y se pasaba tal cual a redirect().
 * Con eso, /auth/confirmar?volver=https://sitio-falso.test manda a la persona
 * fuera justo después de iniciar sesión — con su sesión recién puesta y con
 * toda la confianza de venir de un enlace nuestro. Es un redirect abierto, y
 * es la pieza con la que se montan las páginas de robo de credenciales.
 *
 * Con OAuth el agujero se agranda: el destino viaja hasta el proveedor y
 * vuelve, así que hay más manos por las que pasa.
 *
 * La regla es corta: solo rutas de esta casa. Una barra, y no dos —"//otro.test"
 * es una URL relativa al protocolo, y el navegador la entiende como otro
 * dominio.
 */

const POR_DEFECTO = "/mi";

export function rutaSegura(volver: string | null | undefined): string {
  if (!volver) return POR_DEFECTO;

  const limpio = volver.trim();
  if (!limpio.startsWith("/")) return POR_DEFECTO;
  if (limpio.startsWith("//")) return POR_DEFECTO;

  /* Una barra invertida también vale como separador de autoridad en varios
     navegadores: "/\otro.test" acaba fuera. Y los saltos de línea sirven para
     colar cabeceras. */
  if (/[\\\r\n\t]/.test(limpio)) return POR_DEFECTO;

  return limpio;
}

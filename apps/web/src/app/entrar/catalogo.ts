/* Los proveedores que ofrecemos.

   Vive aparte de acciones.ts porque un archivo "use server" solo puede
   exportar funciones asíncronas: todo lo que exporta se convierte en un punto
   de entrada llamable desde el navegador, y una constante no puede serlo.

   La lista está en el servidor y no en el formulario para que el botón no
   pueda pedir un proveedor que el servidor no acepta: lo que llega se
   comprueba contra esto antes de hablar con nadie. */
export const PROVEEDORES = {
  google: "Google",
  apple: "Apple",
  azure: "Microsoft",
} as const;

export type Proveedor = keyof typeof PROVEEDORES;

"use client";

/* Guardar el certificado.

   Llama a la impresión del navegador, que en cualquier sistema ofrece
   "Guardar como PDF". No hay generación de PDF en el servidor y no hace falta
   todavía: montar una tubería de documentos para esto sería trabajo que no
   cambia lo que la persona consigue. */
export function Imprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-red-500"
    >
      Descargar o imprimir
    </button>
  );
}

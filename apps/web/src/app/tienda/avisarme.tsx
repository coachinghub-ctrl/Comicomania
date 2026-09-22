"use client";

import { useActionState, useState } from "react";
import { avisarme, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* El formulario solo aparece cuando alguien lo pide.

   Un campo de correo debajo de cada producto convierte la tienda en un muro
   de formularios y tapa lo único que importa mirar, que es el producto. */
export function Avisarme({ slug, nombre }: { slug: string; nombre: string }) {
  const [estado, enviar, enviando] = useActionState(avisarme, INICIAL);
  const [abierto, setAbierto] = useState(false);

  if (estado.estado === "ok") {
    return (
      <p role="status" className="mt-4 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
        {estado.mensaje}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-4 w-full rounded-md border border-red-500/50 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-700/20"
      >
        Avísame cuando abra
      </button>
    );
  }

  return (
    <form action={enviar} className="mt-4">
      <input type="hidden" name="producto" value={slug} />
      <label className="block text-xs text-muted">
        Tu correo, para avisarte de {nombre}
        <input
          name="email"
          type="email"
          required
          autoFocus
          placeholder="tu@email.com"
          className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-sm text-paper-pure"
        />
      </label>
      {estado.estado === "error" && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {estado.mensaje}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-red-500 disabled:opacity-40"
      >
        {enviando ? "Anotando…" : "Avísame"}
      </button>
    </form>
  );
}

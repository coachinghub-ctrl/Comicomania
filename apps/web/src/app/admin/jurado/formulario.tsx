"use client";

import { useActionState } from "react";
import { Button } from "@comicomania/ui";
import { crearJuez, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export function NuevoJuez() {
  const [estado, enviar, enviando] = useActionState(crearJuez, INICIAL);

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft">
          Nombre público
          <input
            name="nombre"
            required
            placeholder="Cómo aparecerá ante el público"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Email de su cuenta (opcional)
          <input
            name="email"
            type="email"
            placeholder="Para vincular su ficha con su acceso"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Bio
          <textarea
            name="bio"
            rows={2}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-ink-faint">
        Crear la ficha no le da acceso al panel. Para que pueda entrar y
        puntuar, otórgale además un acceso con rol JUDGE desde Accesos.
      </p>

      {estado.estado === "error" && (
        <p role="alert" className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}
      {estado.estado === "ok" && (
        <p role="status" className="mt-4 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
          {estado.mensaje}
        </p>
      )}

      <Button type="submit" className="mt-4" disabled={enviando}>
        {enviando ? "Agregando…" : "Agregar juez"}
      </Button>
    </form>
  );
}

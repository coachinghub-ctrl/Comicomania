"use client";

import { useActionState, useState } from "react";
import { pedirPresupuesto, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* El formulario de contratación.

   Va cerrado hasta que alguien lo pide: una ficha que se abre con un
   formulario de seis campos delante del video invierte el orden de lo que
   pasa de verdad — primero se mira, luego se pregunta el precio. */
export function Contratar({
  talentoId,
  handle,
  nombre,
}: {
  talentoId: string;
  handle: string;
  nombre: string;
}) {
  const [estado, enviar, enviando] = useActionState(pedirPresupuesto, INICIAL);
  const [abierto, setAbierto] = useState(false);

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success/40 bg-success/5 p-6">
        <p className="font-display text-xl text-paper uppercase">Enviado</p>
        <p className="mt-2 text-muted">{estado.mensaje}</p>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md bg-red-600 px-6 py-3 font-semibold text-paper transition-colors hover:bg-red-500"
      >
        Quiero contratar a {nombre}
      </button>
    );
  }

  const entrada =
    "mt-1 block w-full rounded-md border border-stage-600 bg-stage-800 px-3 py-2.5 text-paper placeholder:text-muted-dim";

  return (
    <form action={enviar} className="rounded-lg border border-stage-600 bg-stage-900 p-6">
      <input type="hidden" name="talento" value={talentoId} />
      <input type="hidden" name="handle" value={handle} />

      <h2 className="font-display text-xl text-paper uppercase">
        Contratar a {nombre}
      </h2>
      <p className="mt-2 text-sm text-muted-dim">
        No hace falta cuenta. Cuéntanos qué evento es y te escribimos con un
        presupuesto.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Tu nombre
          <input name="nombre" required className={entrada} />
        </label>

        <label className="block text-sm text-muted">
          Empresa (opcional)
          <input name="empresa" className={entrada} />
        </label>

        <label className="block text-sm text-muted">
          Correo
          <input name="email" type="email" required inputMode="email" className={entrada} />
        </label>

        <label className="block text-sm text-muted">
          Teléfono (opcional)
          <input name="telefono" inputMode="tel" className={entrada} />
        </label>

        <label className="block text-sm text-muted">
          Qué evento es
          <input
            name="tipo"
            placeholder="Cena de fin de año"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-muted">
          Fecha
          <input name="fecha" type="date" className={entrada} />
        </label>

        <label className="block text-sm text-muted sm:col-span-2">
          Presupuesto aproximado en USD (opcional)
          <input
            name="presupuesto"
            type="number"
            min={0}
            step="100"
            placeholder="3500"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-muted-dim">
            Decirlo acelera la respuesta. Si no lo sabes, déjalo vacío.
          </span>
        </label>

        <label className="block text-sm text-muted sm:col-span-2">
          Cuéntanos
          <textarea
            name="mensaje"
            rows={4}
            placeholder="Cuántas personas, qué público, cuánto tiempo de show."
            className={entrada}
          />
        </label>
      </div>

      {estado.estado === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200"
        >
          {estado.mensaje}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-red-600 px-6 py-3 font-semibold text-paper transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Pedir presupuesto"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-muted underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

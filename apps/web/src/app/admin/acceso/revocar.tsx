"use client";

import { useActionState } from "react";
import { revocarAcceso, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* Revocar es destructivo y no se deshace solo: pide confirmación con el nombre
   de la persona delante, para que nadie revoque la fila de al lado. */
export function Revocar({ grantId, quien }: { grantId: string; quien: string }) {
  const [estado, enviar, enviando] = useActionState(revocarAcceso, INICIAL);

  return (
    <form
      action={enviar}
      onSubmit={(e) => {
        if (!confirm(`¿Revocar el acceso de ${quien}? Dejará de entrar al instante.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="grant" value={grantId} />
      <button
        type="submit"
        disabled={enviando}
        className="text-xs text-red-600 underline transition-colors hover:text-red-700 disabled:opacity-40"
      >
        {enviando ? "Revocando…" : "Revocar"}
      </button>
      {estado.estado === "error" && (
        <span role="alert" className="mt-1 block text-xs text-red-700">
          {estado.mensaje}
        </span>
      )}
    </form>
  );
}

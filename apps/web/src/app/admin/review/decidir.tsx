"use client";

import { useActionState, useState } from "react";
import { decidirVideo, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* Las tres decisiones, con el comentario a la vista.

   Rechazar y pedir cambios abren el campo de motivo antes de poder enviarse:
   obligar a escribirlo después, en un diálogo, es lo que produce rechazos con
   "no cumple" como única explicación. */
export function Decidir({ videoId, titulo }: { videoId: string; titulo: string }) {
  const [estado, enviar, enviando] = useActionState(decidirVideo, INICIAL);
  const [decision, setDecision] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");

  if (estado.estado === "ok") {
    return <p className="text-xs text-success-ink">{estado.mensaje}</p>;
  }

  const exigeMotivo = decision === "REJECTED" || decision === "CHANGES_REQUESTED";

  return (
    <form action={enviar} className="min-w-0">
      <input type="hidden" name="video" value={videoId} />
      <input type="hidden" name="decision" value={decision ?? ""} />

      <div className="flex flex-wrap gap-2">
        {[
          { valor: "APPROVED", texto: "Aprobar", clase: "border-success-ink/50 text-success-ink hover:bg-success-ink/5" },
          { valor: "CHANGES_REQUESTED", texto: "Pedir cambios", clase: "border-line-strong text-ink-soft hover:bg-surface-2" },
          { valor: "REJECTED", texto: "Rechazar", clase: "border-red-600/50 text-red-700 hover:bg-red-700/5" },
        ].map((b) => (
          <button
            key={b.valor}
            type="button"
            onClick={() => setDecision(decision === b.valor ? null : b.valor)}
            className={`rounded-md border px-3 py-1 text-xs transition-colors ${b.clase} ${
              decision === b.valor ? "ring-1 ring-current" : ""
            }`}
          >
            {b.texto}
          </button>
        ))}
      </div>

      {decision && (
        <div className="mt-2">
          <label className="block text-xs text-ink-faint">
            {exigeMotivo ? "Motivo (obligatorio)" : "Comentario (opcional)"}
            <textarea
              name="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              placeholder={
                decision === "REJECTED"
                  ? "Por qué no puede seguir."
                  : decision === "CHANGES_REQUESTED"
                    ? "Qué tiene que cambiar para volver a presentarlo."
                    : ""
              }
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={enviando || (exigeMotivo && !comentario.trim())}
            className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-40"
          >
            {enviando ? "Guardando…" : `Confirmar sobre "${titulo}"`}
          </button>
        </div>
      )}

      {estado.estado === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}

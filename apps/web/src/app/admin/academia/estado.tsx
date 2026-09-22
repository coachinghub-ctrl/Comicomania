"use client";

import { useActionState } from "react";
import { cambiarEstadoCurso, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* Publicar, retirar o volver a borrador.

   Archivar no borra: un curso archivado sigue teniendo alumnos dentro, con su
   progreso y sus certificados. Lo que deja de pasar es que se venda. Por eso
   no hay botón de eliminar. */
export function CambiarEstado({
  cursoId,
  actual,
}: {
  cursoId: string;
  actual: string;
}) {
  const [estado, enviar, enviando] = useActionState(cambiarEstadoCurso, INICIAL);

  const siguiente =
    actual === "PUBLISHED"
      ? { valor: "ARCHIVED", texto: "Archivar" }
      : { valor: "PUBLISHED", texto: "Publicar" };

  return (
    <div>
      <form action={enviar} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="curso" value={cursoId} />
        <input type="hidden" name="estado" value={siguiente.valor} />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : siguiente.texto}
        </button>
      </form>

      {actual !== "DRAFT" && (
        <form action={enviar} className="mt-2">
          <input type="hidden" name="curso" value={cursoId} />
          <input type="hidden" name="estado" value="DRAFT" />
          <button type="submit" className="text-xs text-ink-soft underline">
            Volver a borrador
          </button>
        </form>
      )}

      {estado.estado === "error" && (
        <p role="alert" className="mt-2 max-w-xs text-xs text-red-700">
          {estado.mensaje}
        </p>
      )}
      {estado.estado === "ok" && (
        <p className="mt-2 max-w-xs text-xs text-success-ink">{estado.mensaje}</p>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { invalidarVotos, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type VotoSospechoso = {
  id: string;
  quien: string;
  participante: string;
  cuando: string;
  estado: string;
  senal: string | null;
};

/* Anular en lote, porque el fraude llega en ráfagas: obligar a anular de uno
   en uno garantiza que nadie revise un clúster de doscientos votos. */
export function Anular({ votos }: { votos: VotoSospechoso[] }) {
  const [estado, enviar, enviando] = useActionState(invalidarVotos, INICIAL);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [motivo, setMotivo] = useState("");

  function alternar(id: string) {
    setElegidos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (estado.estado === "ok") {
    return (
      <p role="status" className="rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
        {estado.mensaje}
      </p>
    );
  }

  return (
    <form action={enviar}>
      {elegidos.map((id) => (
        <input key={id} type="hidden" name="voto" value={id} />
      ))}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setElegidos(
                      elegidos.length === votos.length ? [] : votos.map((v) => v.id),
                    )
                  }
                  className="text-xs text-red-600 underline normal-case"
                >
                  {elegidos.length === votos.length ? "Ninguno" : "Todos"}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 font-medium">Quién votó</th>
              <th scope="col" className="px-4 py-3 font-medium">A quién</th>
              <th scope="col" className="px-4 py-3 font-medium">Señal</th>
              <th scope="col" className="px-4 py-3 font-medium">Cuándo</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {votos.map((v, i) => (
              <tr key={v.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={elegidos.includes(v.id)}
                    onChange={() => alternar(v.id)}
                    aria-label={`Anular el voto de ${v.quien}`}
                  />
                </td>
                <td className="px-4 py-3 text-ink">{v.quien}</td>
                <td className="px-4 py-3 text-ink-soft">{v.participante}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                  {v.senal ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">{v.cuando}</td>
                <td className="px-4 py-3">
                  <span className={v.estado === "VALID" ? "text-ink-soft" : "text-red-700"}>
                    {v.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {elegidos.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-600/40 bg-red-700/5 p-4">
          <p className="text-sm text-ink">
            Vas a anular <strong>{elegidos.length}</strong>{" "}
            {elegidos.length === 1 ? "voto" : "votos"}. No se borran: quedan
            marcados, con tu nombre y este motivo.
          </p>
          <label className="mt-3 block text-sm text-ink-soft">
            Motivo
            <textarea
              name="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ráfaga de 180 cuentas creadas en 4 minutos desde el mismo ASN."
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={enviando || !motivo.trim()}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
          >
            {enviando ? "Anulando…" : "Anular con este motivo"}
          </button>
        </div>
      )}

      {estado.estado === "error" && (
        <p role="alert" className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}

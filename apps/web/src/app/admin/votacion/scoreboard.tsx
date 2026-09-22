import {
  CONFIGURACION_POR_DEFECTO,
  ErrorDePuntaje,
  puntajeFinal,
  type NotaDeJuez,
} from "@comicomania/domain";

/* El marcador de una ronda.

   Los números salen de la MISMA función pura que resolverá la ronda de verdad
   —packages/domain/puntaje.ts, con sus 28 pruebas—. Si esta pantalla calculara
   por su cuenta, el marcador diría una cosa y el resultado oficial otra, y esa
   es la discusión que no se puede tener delante de un participante.

   El público se mide contra el más votado de su categoría, no contra un número
   absoluto: 40 votos no dicen nada sin saber cuántos sacó el primero. */

export type FilaMarcador = {
  participanteId: string;
  nombre: string;
  categoria: string;
  votos: number;
  notas: NotaDeJuez[];
};

export function Scoreboard({ filas }: { filas: FilaMarcador[] }) {
  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
        Todavía no hay participantes con votos ni notas en esta ronda.
      </p>
    );
  }

  const porCategoria = new Map<string, FilaMarcador[]>();
  for (const f of filas) {
    porCategoria.set(f.categoria, [...(porCategoria.get(f.categoria) ?? []), f]);
  }

  return (
    <div className="space-y-8">
      {[...porCategoria.entries()].map(([categoria, delGrupo]) => {
        const mayor = Math.max(...delGrupo.map((f) => f.votos), 0);

        const calculadas = delGrupo.map((f) => {
          try {
            const p = puntajeFinal(CONFIGURACION_POR_DEFECTO, f.notas, f.votos, mayor);
            return { fila: f, puntaje: p, error: null as string | null };
          } catch (e) {
            /* El cálculo se niega cuando falta puntuar. No se inventa un cero:
               un cero silencioso parece un participante que lo hizo mal. */
            return {
              fila: f,
              puntaje: null,
              error:
                e instanceof ErrorDePuntaje ? e.message : "No se pudo calcular.",
            };
          }
        });

        const ordenadas = [...calculadas].sort(
          (a, b) => (b.puntaje?.final ?? -1) - (a.puntaje?.final ?? -1),
        );

        return (
          <section key={categoria}>
            <h3 className="font-display text-sm text-ink uppercase">{categoria}</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">#</th>
                    <th scope="col" className="px-4 py-3 font-medium">Participante</th>
                    <th scope="col" className="px-4 py-3 font-medium">Público</th>
                    <th scope="col" className="px-4 py-3 font-medium">Jurado</th>
                    <th scope="col" className="px-4 py-3 font-medium">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenadas.map((r, i) => (
                    <tr
                      key={r.fila.participanteId}
                      className={i % 2 === 1 ? "bg-surface-2" : undefined}
                    >
                      <td className="px-4 py-3 text-ink-faint tabular-nums">
                        {r.puntaje ? i + 1 : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink">{r.fila.nombre}</td>
                      <td className="px-4 py-3">
                        <span className="text-ink tabular-nums">{r.fila.votos}</span>
                        <span className="ml-2 text-xs text-ink-faint tabular-nums">
                          {r.puntaje?.audiencia !== null && r.puntaje?.audiencia !== undefined
                            ? `${r.puntaje.audiencia} pts`
                            : ""}
                        </span>
                        <span className="mt-1 block h-1 max-w-[7rem] overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full bg-red-600"
                            style={{ width: `${mayor > 0 ? (r.fila.votos / mayor) * 100 : 0}%` }}
                          />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.puntaje?.jurado !== null && r.puntaje?.jurado !== undefined ? (
                          <>
                            <span className="text-ink tabular-nums">
                              {r.puntaje.jurado}
                            </span>
                            <span className="ml-2 text-xs text-ink-faint">
                              {r.fila.notas.length}{" "}
                              {r.fila.notas.length === 1 ? "juez" : "jueces"}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-ink-faint">
                            {r.fila.notas.length === 0 ? "sin puntuar" : "incompleto"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.puntaje ? (
                          <span className="font-display text-lg text-red-600 tabular-nums">
                            {r.puntaje.final}
                          </span>
                        ) : (
                          <span
                            className="text-xs text-ink-faint"
                            title={r.error ?? undefined}
                          >
                            no calculable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ordenadas.some((r) => !r.puntaje) && (
              <p className="mt-2 text-xs text-ink-faint">
                Quien aparece sin calcular es porque falta que algún juez
                termine de puntuar. El cálculo se niega en vez de contar cero:
                un cero se vería igual que alguien que lo hizo mal.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

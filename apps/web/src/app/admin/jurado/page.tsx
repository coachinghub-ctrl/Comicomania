import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { CONFIGURACION_POR_DEFECTO } from "@comicomania/domain";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NuevoJuez } from "./formulario";

export const metadata = { title: "Jurado" };

const ESTADO_ASIGNACION: Record<string, { texto: string; color: string }> = {
  PENDING: { texto: "Sin empezar", color: "text-ink-faint" },
  IN_PROGRESS: { texto: "Puntuando", color: "text-red-600" },
  SUBMITTED: { texto: "Enviada", color: "text-success-ink" },
  EXCUSED: { texto: "Excusado", color: "text-ink-faint" },
  CONFLICT: { texto: "Conflicto", color: "text-red-700" },
};

export default async function Jurado() {
  if (!(await puedeActor({ seccion: "JUDGES", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeGestionar = puede(actor, { seccion: "JUDGES", accion: "MANAGE" }).permitido;

  const [{ data: jueces }, { data: asignaciones }] = await Promise.all([
    supabase
      .from("judges")
      .select("id, display_name, bio, status, created_at, countries(name)")
      .order("display_name"),
    supabase
      .from("judge_assignments")
      .select("id, status, due_at, judges(display_name), rounds(name, contests(name))")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const progreso = (asignaciones ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Concursos</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Jurado</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        El perfil del jurado es público: quien compite tiene derecho a saber
        quién lo juzga. Tener ficha de juez no da acceso al panel — eso es un
        rol aparte, y se otorga en Accesos.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>Ciego hasta enviar.</strong> Un juez ve su nota, nunca la de
          otro: si pudiera verlas antes, el jurado dejaría de ser independiente.
          Enviada la nota, se cierra —lo impide un trigger de la base— y
          reabrirla exige <code className="font-mono text-xs">SCORING.EDIT</code>{" "}
          con segundo factor, motivo y rastro en auditoría.
        </p>
      </div>

      {puedeGestionar && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">Agregar un juez</h2>
          <div className="mt-4">
            <NuevoJuez />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Jueces</h2>
        {(jueces?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay jueces.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {jueces!.map((j) => {
              const pais = j.countries as { name: string } | null;
              return (
                <li key={j.id} className="rounded-lg border border-line bg-surface-2 p-4">
                  <p className="font-display text-sm text-ink uppercase">
                    {j.display_name}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {pais?.name ?? "sin país"} ·{" "}
                    {j.status === "ACTIVE" ? "activo" : "inactivo"}
                  </p>
                  {j.bio && <p className="mt-2 text-sm text-ink-soft">{j.bio}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Progreso de puntuación
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {(["PENDING", "IN_PROGRESS", "SUBMITTED"] as const).map((e) => (
            <div key={e} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
              <dt className="text-xs tracking-wider text-ink-faint uppercase">
                {ESTADO_ASIGNACION[e]?.texto ?? e}
              </dt>
              <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                {progreso[e] ?? 0}
              </dd>
            </div>
          ))}
        </dl>

        {(asignaciones?.length ?? 0) > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Juez</th>
                  <th scope="col" className="px-4 py-3 font-medium">Ronda</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vence</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones!.map((a, i) => {
                  const juez = a.judges as { display_name: string } | null;
                  const ronda = a.rounds as {
                    name: string;
                    contests: { name: string } | null;
                  } | null;
                  const est = ESTADO_ASIGNACION[a.status] ?? {
                    texto: a.status,
                    color: "text-ink-soft",
                  };
                  return (
                    <tr key={a.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3 text-ink">{juez?.display_name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {ronda?.contests?.name ?? "—"} · {ronda?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {a.due_at ? new Date(a.due_at).toLocaleDateString("es") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={est.color}>{est.texto}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Cómo se calcula el puntaje
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Es una función pura con pruebas de tabla: mismo resultado siempre, sin
          base de datos ni azar. Quien reclame un resultado tiene derecho a que
          se le reproduzca el cálculo delante.
        </p>
        <div className="mt-4 max-w-md rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {CONFIGURACION_POR_DEFECTO.criterios.map((c, i) => (
                <tr key={c.slug} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                  <td className="px-4 py-2 text-ink capitalize">{c.slug}</td>
                  <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                    {c.peso}%
                  </td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="px-4 py-2 text-ink-faint">
                  Escala {CONFIGURACION_POR_DEFECTO.escala.min}–
                  {CONFIGURACION_POR_DEFECTO.escala.max}
                </td>
                <td className="px-4 py-2 text-right text-ink-faint">
                  jurado {CONFIGURACION_POR_DEFECTO.mezcla.jurado}% · público{" "}
                  {CONFIGURACION_POR_DEFECTO.mezcla.audiencia}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-ink-faint">
          Si un juez se salta un criterio, el cálculo se detiene en vez de
          contarlo como cero: el participante no tiene por qué cargar con esa
          omisión.
        </p>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Alumnos" };

/* Quién está estudiando y por dónde va.

   Esta pantalla existe para una sola pregunta: ¿quién se está quedando
   atascado? Un alumno parado en el 20% durante tres semanas no es una cifra,
   es alguien a quien hay que escribirle antes de que pida el reembolso.

   Por eso el orden no es alfabético ni por fecha: primero los que llevan más
   tiempo sin avanzar. */

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function Alumnos() {
  if (!(await puedeActor({ seccion: "ACADEMY", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();

  const { data: inscripciones, error } = await supabase
    .from("course_enrollments")
    .select(
      "id, progress_pct, started_at, completed_at, updated_at, source, users(display_name, email, avatar_url), courses(title, slug)",
    )
    .order("updated_at", { ascending: true })
    .limit(200);

  const lista = (inscripciones ?? []).map((e) => {
    const alumno = e.users as {
      display_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
    const curso = e.courses as { title: string; slug: string } | null;
    const quieto = diasDesde(e.updated_at ?? e.started_at);
    return { e, alumno, curso, quieto };
  });

  const terminados = lista.filter((l) => l.e.completed_at).length;
  const atascados = lista.filter(
    (l) => !l.e.completed_at && l.quieto >= 14 && l.e.progress_pct > 0,
  );
  const sinEmpezar = lista.filter((l) => l.e.progress_pct === 0);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Academia</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Alumnos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Quién está estudiando y por dónde va. Ordenados por quien lleva más
        tiempo sin avanzar, no por fecha de inscripción: un alumno parado tres
        semanas es alguien a quien escribirle antes de que pida el reembolso.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            { etiqueta: "Inscripciones", valor: lista.length },
            { etiqueta: "Terminaron", valor: terminados },
            { etiqueta: "Atascados", valor: atascados.length },
            { etiqueta: "Sin empezar", valor: sinEmpezar.length },
          ].map((t) => (
            <div key={t.etiqueta} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
              <dt className="text-xs tracking-wider text-ink-faint uppercase">
                {t.etiqueta}
              </dt>
              <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                {t.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {atascados.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">
            Llevan dos semanas o más sin avanzar
          </h2>
          <ul className="mt-3 space-y-2">
            {atascados.map(({ e, alumno, curso, quieto }) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-600/40 bg-red-700/5 px-4 py-2.5 text-sm"
              >
                <span className="text-ink">
                  {alumno?.display_name ?? alumno?.email ?? "—"}
                </span>
                <span className="text-ink-soft">{curso?.title}</span>
                <span className="text-red-700 tabular-nums">
                  {e.progress_pct}% · {quieto} días quieto
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Todos</h2>

        {lista.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay inscripciones. Aparecerán aquí en cuanto alguien
            compre un curso.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lista.map(({ e, alumno, curso, quieto }) => (
              <li key={e.id} className="rounded-md border border-line px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3">
                    {alumno?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={alumno.avatar_url}
                        alt=""
                        width={28}
                        height={28}
                        className="size-7 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full border border-line text-xs text-ink-faint">
                        {(alumno?.display_name ?? alumno?.email ?? "?").slice(0, 1)}
                      </span>
                    )}
                    <span className="text-ink">
                      {alumno?.display_name ?? alumno?.email ?? "—"}
                    </span>
                  </span>
                  <span className="text-ink-soft">{curso?.title}</span>
                  <span className="text-ink tabular-nums">
                    {e.progress_pct}%
                    {e.completed_at ? (
                      <span className="ml-2 text-xs text-success-ink">terminado</span>
                    ) : (
                      <span className="ml-2 text-xs text-ink-faint">
                        {quieto === 0 ? "hoy" : `hace ${quieto} d`}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={e.completed_at ? "h-full bg-success-ink" : "h-full bg-red-600"}
                    style={{ width: `${e.progress_pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

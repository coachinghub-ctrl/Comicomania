import { notFound } from "next/navigation";
import { alcanceDelActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Analítica" };

export default async function Analitica() {
  if (!(await puedeActor({ seccion: "ANALYTICS", accion: "VIEW" }))) notFound();

  const alcance = await alcanceDelActor("ANALYTICS");
  const supabase = await crearClienteServidor();

  const [{ data: series, error }, { data: diccionario }, { data: eventos }] =
    await Promise.all([
      supabase
        .from("metrics_daily")
        .select("id, date, metric, value, scope_path")
        .order("date", { ascending: false })
        .limit(500),
      supabase
        .from("metric_definitions")
        .select("slug, name, definition, unit, owner_area")
        .order("owner_area"),
      supabase
        .from("domain_events")
        .select("name, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(200),
    ]);

  // Última lectura de cada métrica, que es lo que se mira primero.
  const ultimas = new Map<string, { value: number; date: string }>();
  for (const s of series ?? []) {
    if (!ultimas.has(s.metric)) {
      ultimas.set(s.metric, { value: Number(s.value), date: s.date });
    }
  }

  const porEvento = (eventos ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.name] = (acc[e.name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Negocio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Analítica</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        {alcance.global
          ? "Ves las métricas de todos los territorios."
          : `Ves las métricas de ${alcance.paths.join(", ") || "ningún territorio"}.`}
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          Una tabla de hechos —los eventos de dominio, en crudo— y una de
          agregados diarios. Postgres aguanta este volumen de sobra; se migra a
          otra cosa solo cuando los recálculos pasen de un minuto, no antes.
        </p>
        <p className="mt-2 text-ink-soft">
          <strong>Ninguna métrica existe sin su definición escrita.</strong> No
          es una convención: es una clave foránea contra el diccionario, así que
          un número sin definir no llega ni a guardarse.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer: {error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink uppercase">Última lectura</h2>
        {ultimas.size === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay agregados calculados. Se llenan con el trabajo
            nocturno que recorre los eventos de dominio.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {[...ultimas.entries()].map(([metrica, dato]) => {
              const def = (diccionario ?? []).find((d) => d.slug === metrica);
              return (
                <div key={metrica} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
                  <dt className="text-xs tracking-wider text-ink-faint uppercase">
                    {def?.name ?? metrica}
                  </dt>
                  <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                    {dato.value.toLocaleString("es")}
                  </dd>
                  <p className="mt-1 text-xs text-ink-faint tabular-nums">
                    {new Date(dato.date).toLocaleDateString("es")}
                  </p>
                </div>
              );
            })}
          </dl>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Eventos de dominio
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          De aquí sale todo lo demás. Son los hechos crudos: lo que pasó, cuándo
          y a quién.
        </p>
        {Object.keys(porEvento).length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay eventos registrados.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {Object.entries(porEvento)
              .sort((a, b) => b[1] - a[1])
              .map(([nombre, cuantos]) => (
                <li
                  key={nombre}
                  className="flex items-center justify-between rounded-md border border-line px-4 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-ink">{nombre}</span>
                  <span className="text-ink-soft tabular-nums">{cuantos}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Diccionario de métricas
        </h2>
        <dl className="mt-4 space-y-3">
          {(diccionario ?? []).map((m) => (
            <div key={m.slug} className="rounded-md border border-line px-4 py-3">
              <dt className="flex flex-wrap items-baseline gap-2 text-sm text-ink">
                {m.name}
                <span className="font-mono text-xs text-ink-faint">{m.slug}</span>
                {m.owner_area && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint">
                    {m.owner_area}
                  </span>
                )}
              </dt>
              <dd className="mt-1 text-sm text-ink-soft">{m.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

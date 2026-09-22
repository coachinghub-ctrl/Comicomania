import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Trust & Safety" };

const COLOR_ESTADO: Record<string, string> = {
  OPEN: "text-red-600",
  UNDER_REVIEW: "text-red-600",
  ACTION_REQUIRED: "text-red-700",
  RESOLVED: "text-success-ink",
  REJECTED: "text-ink-faint",
  APPEALED: "text-red-700",
};

const TIPO: Record<string, string> = {
  CONTENT: "Contenido reportado",
  USER: "Usuario reportado",
  DMCA: "Reclamo de copyright",
  APPEAL: "Apelación",
  CONTEST_DISPUTE: "Disputa de concurso",
  VOTE_DISPUTE: "Disputa de votación",
  HARASSMENT: "Acoso",
  TECHNICAL: "Problema técnico",
};

export default async function Trust() {
  if (!(await puedeActor({ seccion: "TRUST_SAFETY", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();

  const { data: casos, error } = await supabase
    .from("trust_cases")
    .select(
      "id, type, description, status, priority, sla_due_at, created_at, resolution, appeal_of, users!trust_cases_assignee_user_id_fkey(display_name)",
    )
    .order("priority")
    .order("created_at", { ascending: true })
    .limit(100);

  const abiertos = (casos ?? []).filter(
    (c) => !["RESOLVED", "REJECTED"].includes(c.status),
  );
  const vencidos = abiertos.filter(
    (c) => c.sla_due_at && new Date(c.sla_due_at) < new Date(),
  );

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Sistema</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        Trust &amp; Safety
      </h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>Una apelación no la revisa quien tomó la decisión.</strong> La
          base rechaza esa asignación. Sin eso, la garantía dependía de que nadie
          se asignara su propio caso un viernes por la tarde.
        </p>
        <p className="mt-2 text-ink-soft">
          Cada acción sobre un caso queda registrada y no se edita ni se borra.
          Resolver sin decir qué se resolvió tampoco se puede: no es resolver.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          La clasificación asistida por IA ordena la cola y propone prioridad,
          nunca decide. La decisión es de una persona, y queda firmada.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la cola: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Abiertos", valor: abiertos.length },
            { etiqueta: "Fuera de plazo", valor: vencidos.length },
            { etiqueta: "Total en tu alcance", valor: casos?.length ?? 0 },
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

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Cola</h2>
        {(casos?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-lg border border-line bg-surface-2 p-8">
            <p className="text-ink">No hay casos abiertos.</p>
            <p className="mt-2 text-sm text-ink-soft">
              Aparecerán aquí los reportes de contenido, las disputas y las
              apelaciones, ordenados por prioridad y por antigüedad.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {casos!.map((c) => {
              const asignado = c.users as { display_name: string | null } | null;
              const vencido = c.sla_due_at && new Date(c.sla_due_at) < new Date();
              return (
                <li
                  key={c.id}
                  className={`rounded-lg border p-4 ${
                    vencido ? "border-red-600/40 bg-red-700/5" : "border-line"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        {TIPO[c.type] ?? c.type}
                        {c.appeal_of && (
                          <span className="ml-2 rounded-full border border-red-700/30 px-2 py-0.5 text-xs text-red-700">
                            apelación
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs ${COLOR_ESTADO[c.status] ?? "text-ink-soft"}`}>
                        {c.status}
                      </span>
                      <span className="block text-xs text-ink-faint">
                        prioridad {c.priority}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-faint tabular-nums">
                    {asignado?.display_name ?? "sin asignar"} ·{" "}
                    {c.sla_due_at
                      ? `${vencido ? "venció" : "vence"} ${new Date(c.sla_due_at).toLocaleDateString("es")}`
                      : "sin plazo"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

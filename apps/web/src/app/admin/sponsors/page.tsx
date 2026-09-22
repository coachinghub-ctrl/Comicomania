import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Sponsors" };

const COLOR_INVENTARIO: Record<string, string> = {
  AVAILABLE: "text-success-ink",
  HELD: "text-red-600",
  SOLD: "text-ink-soft",
  DELIVERED: "text-ink-faint",
  RETIRED: "text-ink-faint",
};

export default async function Sponsors() {
  if (!(await puedeActor({ seccion: "SPONSORS", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();
  const veInventario = await puedeActor({
    seccion: "COMMERCIAL_INVENTORY",
    accion: "VIEW",
  });

  const [{ data: sponsors, error }, { data: inventario }, { data: entregables }] =
    await Promise.all([
      supabase
        .from("sponsors")
        .select("id, company, category, status, countries(name), sponsor_contracts(id, value, currency, status, starts_at, ends_at)")
        .order("company")
        .limit(100),
      veInventario
        ? supabase
            .from("commercial_inventory")
            .select("id, type, price, currency, exclusivity, status, scope_path, sponsors(company)")
            .order("status")
            .limit(100)
        : Promise.resolve({ data: null }),
      supabase
        .from("sponsor_deliverables")
        .select("id, description, due_at, status, delivered_at, evidence_url, sponsor_contracts(sponsors(company))")
        .neq("status", "DELIVERED")
        .order("due_at", { ascending: true })
        .limit(50),
    ]);

  const disponible = (inventario ?? []).filter((i) => i.status === "AVAILABLE");
  const valorDisponible = disponible.reduce((t, i) => t + Number(i.price), 0);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Negocio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Sponsors</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          El inventario comercial se modela como producto vendible con
          disponibilidad, igual que una entrada. Con eso se responde en segundos{" "}
          <em>"¿qué me queda por vender?"</em> — la pregunta que hoy no se
          contesta sin una hoja de cálculo.
        </p>
        <p className="mt-2 text-ink-soft">
          Una pieza exclusiva <strong>no se vende dos veces</strong> y no se
          marca vendida sin decir a quién. Y un entregable cumplido{" "}
          <strong>exige evidencia</strong>: «ya lo publicamos» no es un reporte,
          es una discusión con la marca dentro de seis meses.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Sponsors", valor: String(sponsors?.length ?? 0) },
            { etiqueta: "Piezas disponibles", valor: String(disponible.length) },
            {
              etiqueta: "Por vender",
              valor: veInventario
                ? valorDisponible.toLocaleString("es", { maximumFractionDigits: 0 })
                : "—",
            },
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

      {(entregables?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">
            Entregables pendientes
          </h2>
          <ul className="mt-3 space-y-2">
            {entregables!.map((d) => {
              const contrato = d.sponsor_contracts as {
                sponsors: { company: string } | null;
              } | null;
              const vencido = d.due_at && new Date(d.due_at) < new Date();
              return (
                <li
                  key={d.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm ${
                    vencido ? "border-red-600/40 bg-red-700/5" : "border-line"
                  }`}
                >
                  <span className="text-ink">{d.description}</span>
                  <span className="text-ink-soft">
                    {contrato?.sponsors?.company ?? "—"}
                  </span>
                  <span className={vencido ? "text-red-700 tabular-nums" : "text-ink-faint tabular-nums"}>
                    {d.due_at
                      ? `${vencido ? "venció" : "vence"} ${new Date(d.due_at).toLocaleDateString("es")}`
                      : "sin fecha"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {veInventario && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">
            Inventario comercial
          </h2>
          {(inventario?.length ?? 0) === 0 ? (
            <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
              Todavía no hay inventario cargado.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Pieza</th>
                    <th scope="col" className="px-4 py-3 font-medium">Alcance</th>
                    <th scope="col" className="px-4 py-3 font-medium">Precio</th>
                    <th scope="col" className="px-4 py-3 font-medium">Vendida a</th>
                    <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario!.map((it, i) => {
                    const marca = it.sponsors as { company: string } | null;
                    return (
                      <tr key={it.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                        <td className="px-4 py-3">
                          <span className="block text-ink">{it.type}</span>
                          {it.exclusivity && (
                            <span className="block text-xs text-red-600">exclusiva</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                          {it.scope_path ?? "global"}
                        </td>
                        <td className="px-4 py-3 text-ink tabular-nums">
                          {it.price} {it.currency}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {marca?.company ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={COLOR_INVENTARIO[it.status] ?? "text-ink-soft"}>
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Marcas</h2>
        {(sponsors?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay sponsors.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {sponsors!.map((s) => {
              const contratos = (s.sponsor_contracts ?? []) as {
                id: string;
                value: number;
                currency: string;
                status: string;
              }[];
              const pais = s.countries as { name: string } | null;
              return (
                <li key={s.id} className="rounded-lg border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm text-ink uppercase">
                      {s.company}
                    </p>
                    <span className="text-xs text-ink-faint">{s.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {s.category ?? "sin categoría"} · {pais?.name ?? "—"}
                  </p>
                  {contratos.length > 0 && (
                    <p className="mt-2 text-sm text-ink-soft tabular-nums">
                      {contratos.length} contrato{contratos.length === 1 ? "" : "s"} ·{" "}
                      {contratos
                        .reduce((t, c) => t + Number(c.value), 0)
                        .toLocaleString("es", { maximumFractionDigits: 0 })}{" "}
                      {contratos[0]?.currency}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

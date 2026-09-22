import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Órdenes" };

const COLOR_ESTADO: Record<string, string> = {
  PENDING: "text-ink-faint",
  PAID: "text-success-ink",
  FULFILLING: "text-red-600",
  COMPLETED: "text-success-ink",
  CANCELLED: "text-ink-faint",
  REFUNDED: "text-red-700",
};

export default async function Ordenes() {
  if (!(await puedeActor({ seccion: "ORDERS", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decisionReembolso = puede(actor, { seccion: "ORDERS", accion: "REFUND" });

  const { data: ordenes, error } = await supabase
    .from("orders")
    .select(
      "id, number, total, currency, status, placed_at, created_at, users(display_name, email), order_items(id, qty), countries(name), cities(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const porEstado = (ordenes ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Comercio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Órdenes</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>Una orden se marca pagada por webhook, nunca por el retorno
          del navegador.</strong> Quien vuelve de Stripe puede cerrar la pestaña
          antes, o cambiar la URL. La base rechaza el cambio de estado si no hay
          un pago conciliado.
        </p>
        <p className="mt-2 text-ink-soft">
          Los webhooks son idempotentes por clave única: Stripe reintenta, y sin
          eso un mismo pago se contaría dos veces.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Falta conectar Stripe. Hasta entonces no entran órdenes reales, pero
          todo lo que las protege ya está puesto y probado.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer las órdenes: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {["PENDING", "PAID", "COMPLETED", "REFUNDED"].map((e) => (
            <div key={e} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
              <dt className="text-xs tracking-wider text-ink-faint uppercase">{e}</dt>
              <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                {porEstado[e] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {!decisionReembolso.permitido && (
        <div className="mt-6 max-w-2xl rounded-lg border border-gold-700/40 bg-gold-400/5 p-4 text-sm">
          <p className="text-ink">Puedes ver las órdenes, pero no reembolsar.</p>
          <p className="mt-1 text-ink-soft">
            {decisionReembolso.motivo === "MFA_REQUERIDA" ? (
              <>
                Emitir reembolsos exige segundo factor.{" "}
                <a href="/admin/seguridad" className="text-red-600 underline">
                  Verifícalo en Seguridad
                </a>
                .
              </>
            ) : (
              "Tu acceso no incluye emitir reembolsos."
            )}
          </p>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Últimas órdenes</h2>
        {(ordenes?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay órdenes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Orden</th>
                  <th scope="col" className="px-4 py-3 font-medium">Quién</th>
                  <th scope="col" className="px-4 py-3 font-medium">Artículos</th>
                  <th scope="col" className="px-4 py-3 font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenes!.map((o, i) => {
                  const persona = o.users as { display_name: string | null; email: string | null } | null;
                  const items = (o.order_items ?? []) as { qty: number }[];
                  return (
                    <tr key={o.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block font-mono text-xs text-ink">{o.number}</span>
                        <span className="block text-xs text-ink-faint tabular-nums">
                          {new Date(o.placed_at ?? o.created_at).toLocaleDateString("es")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {persona?.display_name ?? persona?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {items.reduce((t, it) => t + it.qty, 0)}
                      </td>
                      <td className="px-4 py-3 text-ink tabular-nums">
                        {o.total} {o.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className={COLOR_ESTADO[o.status] ?? "text-ink-soft"}>
                          {o.status}
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
    </div>
  );
}

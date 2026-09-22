import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Contrataciones" };

/* Quién quiere contratar a quién.

   Vive aparte del repertorio porque no es lo mismo: el repertorio es un
   catálogo que se cuida, esto es un pipeline que se persigue. Mezclarlos
   hacía que la pantalla de talento tuviera dos jefes.

   El orden es por antigüedad de las que siguen abiertas: una solicitud NUEVA
   de hace cinco días es un cliente que ya está hablando con otro. */

const ETIQUETA: Record<string, string> = {
  NEW: "Nueva",
  QUALIFIED: "Calificada",
  QUOTED: "Cotizada",
  WON: "Ganada",
  LOST: "Perdida",
  CANCELLED: "Cancelada",
};

const CERRADAS = new Set(["WON", "LOST", "CANCELLED"]);

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
}

export default async function Contrataciones() {
  if (!(await puedeActor({ seccion: "BOOKINGS", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();

  const [{ data: solicitudes, error }, { data: contratos }] = await Promise.all([
    supabase
      .from("booking_requests")
      .select(
        "id, contact_name, client_company, email, phone, event_type, event_date, budget_amount, currency, message, status, lost_reason, created_at, talent_profiles(stage_name, handle)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("talent_contracts")
      .select(
        "id, fee_amount, commission_pct, currency, status, signed_at, talent_profiles(stage_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const lista = (solicitudes ?? []) as unknown as {
    id: string;
    contact_name: string;
    client_company: string | null;
    email: string;
    phone: string | null;
    event_type: string | null;
    event_date: string | null;
    budget_amount: number | null;
    currency: string | null;
    message: string | null;
    status: string;
    lost_reason: string | null;
    created_at: string;
    talent_profiles: { stage_name: string; handle: string | null } | null;
  }[];

  const abiertas = lista.filter((s) => !CERRADAS.has(s.status));
  const esperando = abiertas
    .filter((s) => diasDesde(s.created_at) >= 3)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const ganadas = lista.filter((s) => s.status === "WON");
  const enJuego = abiertas.reduce((t, s) => t + (s.budget_amount ?? 0), 0);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Talento</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        Contrataciones
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Quién quiere contratar a quién. Ordenadas por las que llevan más tiempo
        esperando: una solicitud nueva de hace cinco días es un cliente que ya
        está hablando con otro.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700"
        >
          No se pudo leer: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            { etiqueta: "Solicitudes", valor: String(lista.length) },
            { etiqueta: "Abiertas", valor: String(abiertas.length) },
            { etiqueta: "Ganadas", valor: String(ganadas.length) },
            {
              etiqueta: "En juego",
              valor: enJuego ? `$${enJuego.toLocaleString("es")}` : "—",
            },
          ].map((t) => (
            <div
              key={t.etiqueta}
              className="rounded-lg border border-line bg-surface-2 px-5 py-4"
            >
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

      {esperando.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">
            Llevan tres días o más sin cerrarse
          </h2>
          <ul className="mt-3 space-y-2">
            {esperando.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-600/40 bg-red-700/5 px-4 py-2.5 text-sm"
              >
                <span className="text-ink">
                  {s.client_company ?? s.contact_name}
                </span>
                <span className="text-ink-soft">
                  {s.talent_profiles?.stage_name ?? "—"}
                </span>
                <span className="text-red-700 tabular-nums">
                  {ETIQUETA[s.status] ?? s.status} · {diasDesde(s.created_at)} días
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Todas</h2>

        {lista.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay solicitudes.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border border-line">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="w-1/4 px-4 py-3 font-medium">
                    Cliente
                  </th>
                  <th scope="col" className="w-1/6 px-4 py-3 font-medium">
                    Humorista
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Evento
                  </th>
                  <th scope="col" className="w-1/6 px-4 py-3 font-medium">
                    Presupuesto
                  </th>
                  <th scope="col" className="w-1/6 px-4 py-3 font-medium">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                    <td className="px-4 py-3">
                      <span className="block truncate text-ink">
                        {s.client_company ?? s.contact_name}
                      </span>
                      <span className="block truncate text-xs text-ink-faint">
                        {s.contact_name} · {s.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.talent_profiles?.stage_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <span className="block truncate">{s.event_type ?? "—"}</span>
                      {s.event_date && (
                        <span className="block text-xs text-ink-faint tabular-nums">
                          {new Date(s.event_date).toLocaleDateString("es")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink tabular-nums">
                      {s.budget_amount
                        ? `${Number(s.budget_amount).toLocaleString("es")} ${s.currency ?? ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {ETIQUETA[s.status] ?? s.status}
                      {s.lost_reason && (
                        <span className="block truncate text-xs text-ink-faint">
                          {s.lost_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Contratos</h2>
        {(contratos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay contratos. Nacen de una solicitud ganada.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(contratos ?? []).map((c) => {
              const talento = c.talent_profiles as { stage_name: string } | null;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3 text-sm"
                >
                  <span className="text-ink">{talento?.stage_name ?? "—"}</span>
                  <span className="text-ink-soft tabular-nums">
                    {Number(c.fee_amount).toLocaleString("es")} {c.currency} ·{" "}
                    {c.commission_pct}% comisión
                  </span>
                  <span className="text-xs text-ink-faint">
                    {c.status}
                    {c.signed_at &&
                      ` · firmado el ${new Date(c.signed_at).toLocaleDateString("es")}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

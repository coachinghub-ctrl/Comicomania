import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { estaVigente } from "@comicomania/domain";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Cotizador, dinero, type Solicitud, type Tarifa } from "./cotizador";
import { MoverPresupuesto, NuevaLinea, NuevaTarifa, QuitarLinea } from "./editor";

export const metadata = { title: "Presupuestos" };

/* El cotizador de talento.

   Existía un agujero en medio del embudo: una solicitud podía estar en estado
   "cotizada" y no había nada que produjera una cotización. Se pasaba de
   "alguien preguntó" a "hay contrato" saltándose el paso donde se dice el
   precio, que es donde se gana o se pierde el encargo.

   Las cifras las calcula la base con un trigger, no esta pantalla. La vista
   previa del cotizador usa la función del paquete de dominio, y se ha
   comprobado que las dos dan el mismo número al centavo. */

const TIPO: Record<string, string> = {
  FEE: "Caché",
  TRAVEL: "Viaje",
  LODGING: "Hotel",
  PER_DIEM: "Viáticos",
  TECH: "Técnica",
  OTHER: "Otro",
};

const ESTADO: Record<string, { texto: string; clase: string }> = {
  DRAFT: { texto: "Borrador", clase: "text-ink-faint" },
  SENT: { texto: "Enviado", clase: "text-gold-700" },
  ACCEPTED: { texto: "Aceptado", clase: "text-success-ink" },
  REJECTED: { texto: "Rechazado", clase: "text-ink-soft" },
  EXPIRED: { texto: "Caducado", clase: "text-ink-faint" },
};

export default async function Presupuestos() {
  if (!(await puedeActor({ seccion: "BOOKINGS", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();
  const puedeEditar = puede(actor, { seccion: "BOOKINGS", accion: "EDIT" }).permitido;

  const [
    { data: presupuestos, error },
    { data: solicitudes },
    { data: tarifas },
    { data: repertorio },
  ] = await Promise.all([
    supabase
      .from("booking_quotes")
      .select(
        "id, version, currency, discount, commission_pct, tax_pct, subtotal, base, commission, tax, total, talent_net, valid_until, status, notes, sent_at, created_at, booking_requests(id, contact_name, client_company, email, event_type, event_date), talent_profiles(stage_name), quote_lines(id, concept, kind, quantity, unit_price, amount, order)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("booking_requests")
      .select(
        "id, contact_name, client_company, event_type, event_date, budget_amount, talent_id, talent_profiles(stage_name)",
      )
      .in("status", ["NEW", "QUALIFIED", "QUOTED"])
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("talent_rates")
      .select("talent_id, set_minutes, fee, currency, market, talent_profiles(stage_name)")
      .order("set_minutes"),
    supabase
      .from("talent_profiles")
      .select("user_id, stage_name")
      .order("stage_name")
      .limit(200),
  ]);

  const lista = (presupuestos ?? []) as unknown as {
    id: string;
    version: number;
    currency: string;
    discount: number;
    commission_pct: number;
    tax_pct: number;
    subtotal: number;
    base: number;
    commission: number;
    tax: number;
    total: number;
    talent_net: number;
    valid_until: string;
    status: string;
    notes: string | null;
    sent_at: string | null;
    booking_requests: {
      id: string;
      contact_name: string;
      client_company: string | null;
      email: string;
      event_type: string | null;
      event_date: string | null;
    } | null;
    talent_profiles: { stage_name: string } | null;
    quote_lines: {
      id: string;
      concept: string;
      kind: string;
      quantity: number;
      unit_price: number;
      amount: number;
      order: number;
    }[];
  }[];

  const paraCotizar: Solicitud[] = ((solicitudes ?? []) as unknown as {
    id: string;
    contact_name: string;
    client_company: string | null;
    event_type: string | null;
    event_date: string | null;
    budget_amount: number | null;
    talent_id: string;
    talent_profiles: { stage_name: string } | null;
  }[]).map((s) => ({
    id: s.id,
    cliente: s.client_company ?? s.contact_name,
    talentoId: s.talent_id,
    talento: s.talent_profiles?.stage_name ?? "—",
    evento: s.event_type,
    fecha: s.event_date,
    presupuestoCliente: s.budget_amount ? Number(s.budget_amount) : null,
  }));

  const tarifario = ((tarifas ?? []) as unknown as {
    talent_id: string;
    set_minutes: number;
    fee: number;
    currency: string;
    market: string | null;
    talent_profiles: { stage_name: string } | null;
  }[]);

  const paraElCotizador: Tarifa[] = tarifario.map((t) => ({
    talentoId: t.talent_id,
    minutos: t.set_minutes,
    tarifa: Number(t.fee),
    moneda: t.currency,
    mercado: t.market,
  }));

  const talentos = ((repertorio ?? []) as { user_id: string; stage_name: string }[]).map(
    (t) => ({ id: t.user_id, nombre: t.stage_name }),
  );

  const enviados = lista.filter((q) => q.status === "SENT");
  const aceptados = lista.filter((q) => q.status === "ACCEPTED");
  const enJuego = enviados.reduce((t, q) => t + Number(q.total), 0);
  const ganado = aceptados.reduce((t, q) => t + Number(q.total), 0);

  // Enviados que ya caducaron: es una llamada pendiente, no una estadística.
  const caducados = enviados.filter((q) => !estaVigente(q.valid_until));

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Talento</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Presupuestos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        El paso que faltaba entre &quot;alguien preguntó&quot; y &quot;hay
        contrato&quot;. La cuenta la hace la base, no esta pantalla: descuento
        primero, comisión sobre la base, impuesto al final. Ese orden no cambia
        nunca.
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
            { etiqueta: "Presupuestos", valor: String(lista.length) },
            { etiqueta: "Enviados", valor: String(enviados.length) },
            {
              etiqueta: "En juego",
              valor: enJuego ? dinero(enJuego) : "—",
            },
            { etiqueta: "Aceptado", valor: ganado ? dinero(ganado) : "—" },
          ].map((t) => (
            <div
              key={t.etiqueta}
              className="rounded-lg border border-line bg-surface-2 px-5 py-4"
            >
              <dt className="text-xs tracking-wider text-ink-faint uppercase">
                {t.etiqueta}
              </dt>
              <dd className="font-display mt-1 text-2xl text-red-600 tabular-nums">
                {t.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {caducados.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">
            Enviados y ya caducados
          </h2>
          <ul className="mt-3 space-y-2">
            {caducados.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-600/40 bg-red-700/5 px-4 py-2.5 text-sm"
              >
                <span className="text-ink">
                  {q.booking_requests?.client_company ??
                    q.booking_requests?.contact_name}
                </span>
                <span className="text-ink-soft">
                  {q.talent_profiles?.stage_name}
                </span>
                <span className="text-red-700 tabular-nums">
                  {dinero(Number(q.total), q.currency)} · venció el{" "}
                  {new Date(`${q.valid_until}T00:00:00`).toLocaleDateString("es")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {puedeEditar && (
        <section className="mt-10">
          <Cotizador solicitudes={paraCotizar} tarifas={paraElCotizador} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Todos</h2>

        {lista.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay presupuestos. Se crean desde una solicitud de
            contratación.
          </p>
        ) : (
          <ul className="mt-4 space-y-5">
            {lista.map((q) => {
              const cliente =
                q.booking_requests?.client_company ??
                q.booking_requests?.contact_name ??
                "—";
              const estado = ESTADO[q.status] ?? {
                texto: q.status,
                clase: "text-ink-soft",
              };
              const lineas = (q.quote_lines ?? [])
                .slice()
                .sort((a, b) => a.order - b.order);
              const vigente = estaVigente(q.valid_until);

              return (
                <li key={q.id} className="rounded-lg border border-line p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base text-ink uppercase">
                        {cliente} · {q.talent_profiles?.stage_name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        v{q.version}
                        {q.booking_requests?.event_type
                          ? ` · ${q.booking_requests.event_type}`
                          : ""}
                        {q.booking_requests?.event_date
                          ? ` · ${new Date(`${q.booking_requests.event_date}T00:00:00`).toLocaleDateString("es")}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${estado.clase}`}>{estado.texto}</p>
                      <p className="font-display text-2xl text-red-600 tabular-nums">
                        {dinero(Number(q.total), q.currency)}
                      </p>
                      <p
                        className={
                          vigente
                            ? "text-xs text-ink-faint tabular-nums"
                            : "text-xs text-red-700 tabular-nums"
                        }
                      >
                        {vigente ? "vale hasta el" : "venció el"}{" "}
                        {new Date(`${q.valid_until}T00:00:00`).toLocaleDateString("es")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_16rem]">
                    <div>
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs tracking-wider text-ink-faint uppercase">
                          <tr>
                            <th scope="col" className="py-1 font-medium">Concepto</th>
                            <th scope="col" className="py-1 font-medium">Tipo</th>
                            <th scope="col" className="py-1 text-right font-medium">
                              Cant.
                            </th>
                            <th scope="col" className="py-1 text-right font-medium">
                              Unitario
                            </th>
                            <th scope="col" className="py-1 text-right font-medium">
                              Importe
                            </th>
                            {puedeEditar && q.status === "DRAFT" && (
                              <th scope="col" className="py-1" />
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {lineas.map((l) => (
                            <tr key={l.id} className="border-t border-line">
                              <td className="py-2 text-ink">{l.concept}</td>
                              <td className="py-2 text-ink-faint">
                                {TIPO[l.kind] ?? l.kind}
                              </td>
                              <td className="py-2 text-right text-ink-soft tabular-nums">
                                {Number(l.quantity)}
                              </td>
                              <td className="py-2 text-right text-ink-soft tabular-nums">
                                {dinero(Number(l.unit_price), q.currency)}
                              </td>
                              <td className="py-2 text-right text-ink tabular-nums">
                                {dinero(Number(l.amount), q.currency)}
                              </td>
                              {puedeEditar && q.status === "DRAFT" && (
                                <td className="py-2 pl-3 text-right">
                                  <QuitarLinea lineaId={l.id} />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {puedeEditar && q.status === "DRAFT" && (
                        <div className="mt-3">
                          <NuevaLinea presupuestoId={q.id} />
                        </div>
                      )}

                      {q.notes && (
                        <p className="mt-4 rounded-md border border-line bg-surface-2 p-3 text-xs text-ink-faint">
                          Nota interna: {q.notes}
                        </p>
                      )}
                    </div>

                    <aside className="rounded-md border border-line bg-surface-2 p-4">
                      <dl className="space-y-1.5 text-sm">
                        {[
                          ["Subtotal", Number(q.subtotal)],
                          ["Descuento", -Number(q.discount)],
                          ["Base", Number(q.base)],
                          [`Comisión ${q.commission_pct}%`, Number(q.commission)],
                          [`Impuesto ${q.tax_pct}%`, Number(q.tax)],
                        ].map(([etiqueta, valor]) => (
                          <div
                            key={etiqueta as string}
                            className="flex justify-between gap-2"
                          >
                            <dt className="text-ink-soft">{etiqueta}</dt>
                            <dd className="text-ink tabular-nums">
                              {dinero(valor as number, q.currency)}
                            </dd>
                          </div>
                        ))}
                        <div className="flex justify-between gap-2 border-t border-line pt-2">
                          <dt className="font-display text-ink uppercase">Total</dt>
                          <dd className="font-display text-ink tabular-nums">
                            {dinero(Number(q.total), q.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 border-t border-line pt-2">
                          <dt className="text-ink-soft">Para el humorista</dt>
                          <dd className="text-success-ink tabular-nums">
                            {dinero(Number(q.talent_net), q.currency)}
                          </dd>
                        </div>
                      </dl>

                      {puedeEditar && (
                        <div className="mt-4">
                          <MoverPresupuesto
                            presupuestoId={q.id}
                            estado={q.status}
                            total={Number(q.total)}
                            moneda={q.currency}
                          />
                        </div>
                      )}

                      {q.status !== "DRAFT" && (
                        <p className="mt-3 text-xs text-ink-faint">
                          Enviado
                          {q.sent_at
                            ? ` el ${new Date(q.sent_at).toLocaleDateString("es")}`
                            : ""}
                          . Sus cifras están congeladas: para cambiarlas hay que
                          cotizar otra vez la misma solicitud, y sale una v
                          {q.version + 1}.
                        </p>
                      )}
                    </aside>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-lg text-ink uppercase">Tarifario</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Cuánto cuesta cada humorista por duración. De aquí sale el precio de
          partida de cada presupuesto, para que no dependa de lo que alguien
          recuerde un martes por la tarde.
        </p>

        {puedeEditar && (
          <div className="mt-4">
            <NuevaTarifa talentos={talentos} />
          </div>
        )}

        {tarifario.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay tarifas.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border border-line">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Humorista</th>
                  <th scope="col" className="px-4 py-3 font-medium">Duración</th>
                  <th scope="col" className="px-4 py-3 font-medium">Mercado</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Tarifa
                  </th>
                </tr>
              </thead>
              <tbody>
                {tarifario.map((t, i) => (
                  <tr
                    key={`${t.talent_id}-${t.set_minutes}-${t.market ?? ""}`}
                    className={i % 2 === 1 ? "bg-surface-2" : undefined}
                  >
                    <td className="truncate px-4 py-3 text-ink">
                      {t.talent_profiles?.stage_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {t.set_minutes} min
                    </td>
                    <td className="px-4 py-3 text-ink-faint">
                      {t.market ?? "general"}
                    </td>
                    <td className="px-4 py-3 text-right text-ink tabular-nums">
                      {dinero(Number(t.fee), t.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

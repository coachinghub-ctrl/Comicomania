import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Finanzas" };

export default async function Finanzas() {
  if (!(await puedeActor({ seccion: "FINANCE", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decision = puede(actor, { seccion: "FINANCE", accion: "VIEW" });

  /* Si el guard dice que no —normalmente por falta de segundo factor— ni
     siquiera se consulta. Traer las cifras para luego taparlas en pantalla
     sería dejarlas en el HTML. */
  if (!decision.permitido) {
    return (
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Negocio</p>
        <h1 className="font-display mt-1 text-3xl text-ink uppercase">Finanzas</h1>
        <div className="mt-8 max-w-2xl rounded-lg border border-gold-700/40 bg-gold-400/5 p-5">
          <p className="text-ink">
            {decision.motivo === "MFA_REQUERIDA"
              ? "Las finanzas exigen segundo factor."
              : "Tu acceso no incluye finanzas."}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {decision.motivo === "MFA_REQUERIDA" ? (
              <>
                No se consultó ninguna cifra:{" "}
                <a href="/admin/seguridad" className="text-red-600 underline">
                  verifica tu segundo factor
                </a>{" "}
                y vuelve. Traerlas para luego taparlas en pantalla sería dejarlas
                en el HTML.
              </>
            ) : (
              "El nivel financiero se otorga aparte del permiso de sección."
            )}
          </p>
        </div>
      </div>
    );
  }

  const [{ data: ingresos }, { data: gastos }, { data: diccionario }] =
    await Promise.all([
      supabase
        .from("revenue_entries")
        .select("id, source, amount_base, currency, scope_path, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(500),
      supabase
        .from("expenses")
        .select("id, amount_base, currency, scope_path, paid_at, vendor, financial_categories(name)")
        .order("paid_at", { ascending: false })
        .limit(500),
      supabase.from("metric_definitions").select("slug, name, definition, unit").order("name"),
    ]);

  const totalIngreso = (ingresos ?? []).reduce((t, r) => t + Number(r.amount_base ?? 0), 0);
  const totalGasto = (gastos ?? []).reduce((t, g) => t + Number(g.amount_base ?? 0), 0);
  const margen = totalIngreso - totalGasto;

  const porFuente = (ingresos ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] ?? 0) + Number(r.amount_base ?? 0);
    return acc;
  }, {});

  const dinero = (n: number) =>
    n.toLocaleString("es", { maximumFractionDigits: 0 });

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Negocio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Finanzas</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          No reemplaza la contabilidad formal: es gestión de negocio con datos
          reales de la plataforma.
        </p>
        <p className="mt-2 text-ink-soft">
          Lo que ves está acotado por tu <strong>nivel financiero</strong>, no
          solo por el permiso de sección: tener FINANCE.VIEW no basta si tu
          grant no alcanza ese territorio. La base lo aplica fila por fila.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          El importe en moneda base es una columna generada, con el tipo de
          cambio congelado a la fecha del hecho. Calculado a mano, dos informes
          de la misma semana no cuadrarían y nadie sabría cuál creer.
        </p>
      </div>

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Ingreso", valor: dinero(totalIngreso) },
            { etiqueta: "Gasto", valor: dinero(totalGasto) },
            { etiqueta: "Margen", valor: dinero(margen) },
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
        <p className="mt-2 text-xs text-ink-faint">
          Sobre las últimas 500 filas de tu alcance, en moneda base.
        </p>
      </section>

      {Object.keys(porFuente).length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">Por fuente</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(porFuente)
              .sort((a, b) => b[1] - a[1])
              .map(([fuente, valor]) => (
                <li key={fuente} className="rounded-md border border-line px-4 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{fuente}</span>
                    <span className="text-ink tabular-nums">{dinero(valor)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full bg-red-600"
                      style={{
                        width: `${totalIngreso > 0 ? (valor / totalIngreso) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {(ingresos?.length ?? 0) === 0 && (gastos?.length ?? 0) === 0 && (
        <p className="mt-8 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
          Todavía no hay movimientos. Los ingresos se derivan de las órdenes
          pagadas en el cierre diario: no se cargan a mano.
        </p>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Diccionario de métricas
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Cada número tiene su definición escrita, y una métrica sin definición
          no se puede ni guardar: es una clave foránea, no una convención. Sin
          esto, dos personas discuten con dos cifras distintas.
        </p>
        <dl className="mt-4 space-y-3">
          {(diccionario ?? []).map((m) => (
            <div key={m.slug} className="rounded-md border border-line px-4 py-3">
              <dt className="text-sm text-ink">
                {m.name}{" "}
                <span className="font-mono text-xs text-ink-faint">{m.slug}</span>
              </dt>
              <dd className="mt-1 text-sm text-ink-soft">{m.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

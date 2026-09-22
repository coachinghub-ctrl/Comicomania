import { notFound } from "next/navigation";
import { alcanceDelActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "CRM" };

export default async function Crm() {
  if (!(await puedeActor({ seccion: "CRM", accion: "VIEW" }))) notFound();

  const alcance = await alcanceDelActor("CRM");
  const supabase = await crearClienteServidor();

  const [{ data: contactos, error }, { data: pipelines }, { data: oportunidades }] =
    await Promise.all([
      supabase
        .from("crm_contacts")
        .select(
          "id, email, first_name, last_name, company, source, status, user_id, created_at, countries(name), cities(name)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("crm_pipelines")
        .select("id, name, entity_type, crm_stages(id, name, order, probability)")
        .order("name"),
      supabase
        .from("crm_opportunities")
        .select("id, title, amount, currency, status, stage_id, crm_contacts(email, company)")
        .eq("status", "OPEN")
        .limit(200),
    ]);

  const conCuenta = (contactos ?? []).filter((c) => c.user_id).length;
  const leads = (contactos?.length ?? 0) - conCuenta;

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Comunidad</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">CRM</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        {alcance.global
          ? "Ves los contactos de todos los territorios."
          : `Ves los contactos de ${alcance.paths.join(", ") || "ningún territorio"}.`}
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>El CRM no duplica personas.</strong> Un contacto con cuenta{" "}
          <em>es</em> esa cuenta. Los leads sin cuenta —sponsors, prensa,
          clientes de talento— viven aparte y se adoptan solos el día que se
          registran con el mismo email.
        </p>
        <p className="mt-2 text-ink-soft">
          El consentimiento de marketing se guarda <strong>por canal</strong>, y
          sin fila la respuesta es no: el silencio nunca es consentimiento. Lo
          comprueba una función de la base, no la plantilla de correo de turno.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer el CRM: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Contactos", valor: contactos?.length ?? 0 },
            { etiqueta: "Con cuenta", valor: conCuenta },
            { etiqueta: "Leads sin cuenta", valor: leads },
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

      {(pipelines ?? []).map((p) => {
        const stages = ((p.crm_stages ?? []) as {
          id: string;
          name: string;
          order: number;
          probability: number | null;
        }[]).sort((a, b) => a.order - b.order);

        return (
          <section key={p.id} className="mt-10">
            <h2 className="font-display text-lg text-ink uppercase">{p.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Un solo motor de pipelines sirve a participantes, sponsors,
              talento y soporte. Cambian las etapas, no el código.
            </p>
            {/* Parrilla que se acomoda sola, no una fila con scroll: con siete
                etapas, un tablero horizontal obliga a arrastrar para ver el
                final del embudo, que es justo la parte que importa. */}
            <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
              {stages.map((s) => {
                const enEtapa = (oportunidades ?? []).filter(
                  (o) => o.stage_id === s.id,
                );
                return (
                  <div
                    key={s.id}
                    className="min-w-0 rounded-lg border border-line bg-surface-2 p-3"
                  >
                    <p className="text-xs tracking-wider text-ink-faint uppercase break-words">
                      {s.name}
                    </p>
                    <p className="font-display mt-1 text-2xl text-ink tabular-nums">
                      {enEtapa.length}
                    </p>
                    {s.probability !== null && (
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {s.probability}% de cierre
                      </p>
                    )}
                    <ul className="mt-2 space-y-1">
                      {enEtapa.slice(0, 4).map((o) => (
                        <li key={o.id} className="truncate text-xs text-ink-soft">
                          {o.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Contactos</h2>
        {(contactos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay contactos. Cada cuenta nueva crea el suyo sola.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border border-line">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="w-2/5 px-4 py-3 font-medium">Contacto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Territorio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Origen</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vínculo</th>
                </tr>
              </thead>
              <tbody>
                {contactos!.map((c, i) => {
                  const pais = c.countries as { name: string } | null;
                  const ciudad = c.cities as { name: string } | null;
                  const nombre =
                    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
                    c.company ||
                    "—";
                  return (
                    <tr key={c.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">{nombre}</span>
                        <span className="block truncate text-xs text-ink-soft" title={c.email ?? undefined}>
                          {c.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {ciudad?.name ?? pais?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                        {c.source ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={c.user_id ? "text-success-ink" : "text-ink-faint"}>
                          {c.user_id ? "Tiene cuenta" : "Lead"}
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

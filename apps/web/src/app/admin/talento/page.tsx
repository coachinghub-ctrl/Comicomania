import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Talento" };

const COLOR_ESTADO: Record<string, string> = {
  DRAFT: "text-ink-faint",
  PENDING_REVIEW: "text-red-600",
  ACTIVE: "text-success-ink",
  PAUSED: "text-ink-soft",
  RETIRED: "text-ink-faint",
  BLOCKED: "text-red-700",
};

export default async function Talento() {
  if (!(await puedeActor({ seccion: "TALENT", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const veContacto = puede(actor, { seccion: "TALENT", accion: "EDIT" }).permitido;

  /* Las columnas se nombran una a una, nunca "*": el nombre legal y el
     contacto de contratación están restringidos por permisos de columna, y un
     asterisco haría que Postgres rechace la consulta entera. */
  const columnas =
    "user_id, stage_name, bio, comedy_styles, markets, status, public_visible, created_at" +
    (veContacto ? ", legal_name, booking_contact" : "");

  const [{ data: talentos, error }, { data: solicitudes }] = await Promise.all([
    supabase.from("talent_profiles").select(columnas).order("stage_name").limit(100),
    supabase
      .from("booking_requests")
      .select("id, contact_name, client_company, event_type, event_date, budget_amount, currency, status, talent_profiles(stage_name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const filas = (talentos ?? []) as unknown as {
    user_id: string;
    stage_name: string;
    bio: string | null;
    comedy_styles: string[] | null;
    markets: string[] | null;
    status: string;
    public_visible: boolean;
    legal_name?: string | null;
    booking_contact?: string | null;
  }[];

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Negocio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Talento</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          La ficha de talento es <strong>pública</strong> —esa es su función, que
          lo contraten— pero la misma fila guarda el nombre legal y el contacto
          de contratación.
        </p>
        <p className="mt-2 text-ink-soft">
          RLS no resuelve eso: decide filas enteras, no columnas. Aquí se usan{" "}
          <strong>permisos por columna</strong> de Postgres, así que esos dos
          datos no viajan con la ficha aunque la ficha sea visible. Sin ellos,
          publicar el directorio equivaldría a publicar el nombre legal y el
          teléfono de cada humorista.
        </p>
        {!veContacto && (
          <p className="mt-2 text-xs text-ink-faint">
            Tu acceso no incluye esos campos, así que esta pantalla ni siquiera
            los pide.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer el talento: {error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink uppercase">Fichas</h2>
        {filas.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay fichas de talento.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {filas.map((t) => (
              <li key={t.user_id} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-sm text-ink uppercase">
                    {t.stage_name}
                  </p>
                  <span className={`text-xs ${COLOR_ESTADO[t.status] ?? "text-ink-soft"}`}>
                    {t.status}
                  </span>
                </div>
                {t.bio && <p className="mt-2 text-sm text-ink-soft">{t.bio}</p>}
                {(t.comedy_styles?.length ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-ink-faint">
                    {t.comedy_styles!.join(" · ")}
                  </p>
                )}
                {veContacto && (t.legal_name || t.booking_contact) && (
                  <p className="mt-3 border-t border-line pt-2 text-xs text-ink-faint">
                    {t.legal_name} {t.booking_contact ? `· ${t.booking_contact}` : ""}
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-faint">
                  {t.public_visible ? "Visible en el directorio" : "No publicada"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Solicitudes de contratación
        </h2>
        {(solicitudes?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay solicitudes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Talento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Evento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Presupuesto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes!.map((s, i) => {
                  const talento = s.talent_profiles as { stage_name: string } | null;
                  return (
                    <tr key={s.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">{s.contact_name}</span>
                        <span className="block text-xs text-ink-faint">
                          {s.client_company}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {talento?.stage_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {s.event_type ?? "—"}
                        {s.event_date && (
                          <span className="block text-xs text-ink-faint tabular-nums">
                            {new Date(s.event_date).toLocaleDateString("es")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink tabular-nums">
                        {s.budget_amount ? `${s.budget_amount} ${s.currency}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{s.status}</td>
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

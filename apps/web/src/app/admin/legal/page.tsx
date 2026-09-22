import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Legal" };

export default async function Legal() {
  if (!(await puedeActor({ seccion: "LEGAL", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();

  const [{ data: documentos, error }, { data: aceptaciones }] = await Promise.all([
    supabase
      .from("legal_documents")
      .select("id, slug, jurisdiction, type, name, legal_document_versions(id, version, status, effective_from, body_hash)")
      .order("jurisdiction"),
    supabase
      .from("release_acceptances")
      .select("id, accepted_at, locale, legal_document_versions(version, legal_documents(name, jurisdiction))")
      .order("accepted_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Sistema</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Legal</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>Un texto vigente no se puede editar.</strong> Las aceptaciones
          apuntan a una versión concreta; si el texto cambiara por debajo, esa
          fila diría que alguien aceptó algo que nunca leyó. Para cambiarlo se
          publica una versión nueva.
        </p>
        <p className="mt-2 text-ink-soft">
          Cada versión lleva la <strong>huella de su texto</strong>. Si alguien
          lograra alterarlo, el hash no cuadraría.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Y solo se puede aceptar lo que está vigente: un borrador no se acepta.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer: {error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink uppercase">Documentos</h2>
        {(documentos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay documentos legales. Hacen falta antes de abrir
            inscripciones: sin bases y sin cesión de derechos no se puede
            publicar un solo video.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documentos!.map((d) => {
              const versiones = ((d.legal_document_versions ?? []) as {
                id: string;
                version: number;
                status: string;
                effective_from: string | null;
                body_hash: string;
              }[]).sort((a, b) => b.version - a.version);
              return (
                <li key={d.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-sm text-ink uppercase">{d.name}</p>
                    <span className="text-xs text-ink-faint">
                      {d.type} · {d.jurisdiction}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {versiones.map((v) => (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center gap-3 text-xs"
                      >
                        <span className="text-ink tabular-nums">v{v.version}</span>
                        <span
                          className={
                            v.status === "EFFECTIVE"
                              ? "text-success-ink"
                              : "text-ink-faint"
                          }
                        >
                          {v.status}
                        </span>
                        {v.effective_from && (
                          <span className="text-ink-faint tabular-nums">
                            desde {new Date(v.effective_from).toLocaleDateString("es")}
                          </span>
                        )}
                        <span className="font-mono text-ink-faint">
                          {v.body_hash.slice(0, 12)}…
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Aceptaciones recientes
        </h2>
        {(aceptaciones?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay aceptaciones registradas.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {aceptaciones!.map((a) => {
              const version = a.legal_document_versions as {
                version: number;
                legal_documents: { name: string; jurisdiction: string } | null;
              } | null;
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {version?.legal_documents?.name ?? "—"}
                  </span>
                  <span className="text-ink-soft tabular-nums">
                    v{version?.version} · {version?.legal_documents?.jurisdiction}
                  </span>
                  <span className="text-xs text-ink-faint tabular-nums">
                    {new Date(a.accepted_at).toLocaleString("es", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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

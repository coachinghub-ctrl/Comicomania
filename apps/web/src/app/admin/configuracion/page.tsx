import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Configuración" };

/* Solo lectura, a propósito.
   Los ajustes que hay hoy son de arranque —el correo del fundador, entre
   otros— y cambiarlos desde aquí sin un flujo pensado es una forma rápida de
   dejar la plataforma sin dueño. Se leen, se auditan, y se cambian con
   migración hasta que exista el flujo. */

export default async function Configuracion() {
  if (!(await puedeActor({ seccion: "SETTINGS", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeCambiar = puede(actor, {
    seccion: "SETTINGS",
    accion: "CONFIGURE",
  }).permitido;

  const { data: ajustes, error } = await supabase
    .from("settings")
    .select("key, scope_type, scope_id, value, updated_at")
    .order("key");

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Sistema</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        Configuración
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Ajustes por territorio. No tiene una fase propia en el roadmap porque
        crece con cada engine: cada motor nuevo trae los suyos.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          Esta pantalla es <strong>de solo lectura a propósito</strong>. Los
          ajustes que hay hoy son de arranque —entre ellos el correo del
          fundador, que decide quién recibe el acceso de dueño—, y cambiarlos sin
          un flujo pensado es la forma más rápida de dejar la plataforma sin
          nadie que pueda entrar.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Se cambian por migración, que queda versionada y revisable. Cuando haya
          ajustes de operación diaria, tendrán su formulario con auditoría.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la configuración: {error.message}
        </p>
      )}

      <section className="mt-8">
        {(ajustes?.length ?? 0) === 0 ? (
          <p className="rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            No hay ajustes visibles en tu alcance.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Clave</th>
                  <th scope="col" className="px-4 py-3 font-medium">Alcance</th>
                  <th scope="col" className="px-4 py-3 font-medium">Valor</th>
                  <th scope="col" className="px-4 py-3 font-medium">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {ajustes!.map((a, i) => (
                  <tr
                    key={`${a.key}-${a.scope_type}-${a.scope_id ?? "global"}`}
                    className={i % 2 === 1 ? "bg-surface-2" : undefined}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink">{a.key}</td>
                    <td className="px-4 py-3 text-ink-soft">{a.scope_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {JSON.stringify(a.value)}
                    </td>
                    <td className="px-4 py-3 text-ink-faint tabular-nums">
                      {a.updated_at
                        ? new Date(a.updated_at).toLocaleDateString("es")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {puedeCambiar && (
        <p className="mt-4 max-w-2xl text-xs text-ink-faint">
          Tienes permiso para configurar, así que cuando exista el formulario lo
          verás aquí sin que nadie te otorgue nada nuevo.
        </p>
      )}
    </div>
  );
}

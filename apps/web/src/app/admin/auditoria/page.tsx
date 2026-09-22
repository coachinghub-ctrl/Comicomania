import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Auditoría" };

/* La auditoría es append-only: dos reglas de Postgres bloquean UPDATE y DELETE
   sobre la tabla, y cada fila encadena el hash de la anterior. Por eso esta
   pantalla no tiene ni un botón: no hay nada que se pueda hacer aquí salvo
   mirar. Si alguien borrara una fila, la cadena se rompería y se vería. */

export default async function Auditoria() {
  if (!(await puedeActor({ seccion: "AUDIT", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();
  const { data: filas, error } = await supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_role, scope_type, section, action, object_type, object_id, result, new_value, previous_value, users!audit_logs_actor_user_id_fkey(display_name, email)",
    )
    .order("id", { ascending: false })
    .limit(100);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Sistema</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Auditoría</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Quién hizo qué, sobre qué, y si se le permitió. La tabla no admite
        modificaciones ni borrados —lo impiden dos reglas en la base— y cada
        entrada encadena el hash de la anterior: alterar una rompe la cadena
        entera.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la auditoría: {error.message}
        </p>
      )}

      {!error && (filas?.length ?? 0) === 0 && (
        <p className="mt-8 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
          Todavía no hay movimientos registrados en tu territorio.
        </p>
      )}

      {(filas?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Cuándo</th>
                <th scope="col" className="px-4 py-3 font-medium">Quién</th>
                <th scope="col" className="px-4 py-3 font-medium">Qué</th>
                <th scope="col" className="px-4 py-3 font-medium">Sobre</th>
                <th scope="col" className="px-4 py-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {filas!.map((f, i) => {
                const quien = f.users as { display_name: string | null; email: string | null } | null;
                const permitido = f.result === "ALLOWED";
                const detalle = f.new_value ?? f.previous_value;
                return (
                  <tr key={f.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                    <td className="px-4 py-3 text-ink-soft tabular-nums whitespace-nowrap">
                      {new Date(f.created_at).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">
                        {quien?.display_name ?? quien?.email ?? "—"}
                      </span>
                      <span className="block text-xs text-ink-faint">
                        {f.actor_role ?? "—"} · {f.scope_type ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink">
                        {f.section}.{f.action}
                      </span>
                      {detalle != null && (
                        <span className="mt-0.5 block max-w-md truncate text-xs text-ink-faint">
                          {JSON.stringify(detalle)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {f.object_type ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={permitido ? "text-success-ink" : "text-red-700"}>
                        {permitido ? "Permitido" : (f.result ?? "—")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

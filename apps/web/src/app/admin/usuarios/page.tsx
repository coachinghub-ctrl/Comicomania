import { notFound } from "next/navigation";
import { alcanceDelActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Usuarios" };

export default async function Usuarios() {
  // Guard en el caso de uso, no solo en el menú. 404 y no 403: si el objeto
  // está fuera de tu territorio, ni siquiera confirmamos que existe.
  if (!(await puedeActor({ seccion: "USERS", accion: "VIEW" }))) notFound();

  const alcance = await alcanceDelActor("USERS");
  const supabase = await crearClienteServidor();

  // La consulta no filtra por territorio a mano: lo hace RLS con
  // has_permission() sobre el path del usuario. Si esta consulta se escribiera
  // mal, la base seguiría sin devolver filas de otra ciudad.
  const { data: usuarios, error } = await supabase
    .from("users")
    .select(
      "id, display_name, handle, email, status, created_at, last_active_at, cities(name, path), countries(name, iso2)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-paper uppercase">Usuarios</h1>
          <p className="mt-2 text-sm text-muted">
            {alcance.global
              ? "Ves todos los territorios."
              : `Ves ${alcance.paths.join(", ") || "ningún territorio"}.`}
          </p>
        </div>
        <span className="text-sm text-muted-dim">
          {usuarios?.length ?? 0} {usuarios?.length === 1 ? "persona" : "personas"}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-500/40 bg-red-700/20 p-3 text-sm text-red-300">
          No se pudo leer el listado: {error.message}
        </p>
      )}

      {!error && (usuarios?.length ?? 0) === 0 && (
        <div className="mt-8 rounded-lg border border-stage-600 bg-stage-800 p-8 text-center">
          <p className="text-paper-pure">Todavía no hay nadie registrado.</p>
          <p className="mt-2 text-sm text-muted">
            Las cuentas aparecen aquí en cuanto alguien crea su COMICOMANIA ID.
          </p>
        </div>
      )}

      {(usuarios?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-stage-600">
          <table className="w-full text-left text-sm">
            <thead className="bg-stage-800 text-xs tracking-wider text-muted-dim uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Persona</th>
                <th scope="col" className="px-4 py-3 font-medium">Territorio</th>
                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                <th scope="col" className="px-4 py-3 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody>
              {usuarios!.map((u, i) => {
                const ciudad = u.cities as { name: string; path: string } | null;
                const pais = u.countries as { name: string; iso2: string } | null;
                return (
                  <tr
                    key={u.id}
                    className={i % 2 === 1 ? "bg-stage-700/40" : undefined}
                  >
                    <td className="px-4 py-3">
                      <span className="block text-paper-pure">
                        {u.display_name ?? "—"}
                      </span>
                      <span className="block text-xs text-muted">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {ciudad?.name ?? pais?.name ?? "—"}
                      {ciudad && (
                        <span className="ml-2 font-mono text-xs text-muted-dim">
                          {ciudad.path}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.status === "ACTIVE" ? "text-success" : "text-muted-dim"
                        }
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {new Date(u.created_at).toLocaleDateString("es")}
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

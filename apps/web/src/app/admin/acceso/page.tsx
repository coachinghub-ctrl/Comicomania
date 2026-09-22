import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Constructor, type Persona, type Rol, type Territorio } from "./constructor";
import { Revocar } from "./revocar";

export const metadata = { title: "Accesos" };

export default async function Accesos() {
  // 404 y no 403: quien no controla accesos no sabe que esta pantalla existe.
  if (!(await puedeActor({ seccion: "ACCESS_CONTROL", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decisionOtorgar = puede(actor, {
    seccion: "ACCESS_CONTROL",
    accion: "MANAGE",
  });

  /* Todo pasa por RLS. Las personas y los grants que se listan son los que la
     base decide devolver según el territorio del actor; esta página no filtra
     nada a mano, y por eso no puede equivocarse a favor. */
  const [{ data: personas }, { data: roles }, { data: grants }, territorios] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, display_name, email")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("roles")
        .select("id, slug, name, default_sections, default_actions, denied_permissions")
        .order("slug"),
      supabase
        .from("access_grants")
        .select(
          "id, user_id, scope_type, scope_path, sections, actions, status, starts_at, ends_at, reason, users!access_grants_user_id_fkey(display_name, email), roles(slug)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      cargarTerritorios(supabase),
    ]);

  const listaPersonas: Persona[] = (personas ?? []).map((p) => ({
    id: p.id,
    nombre: p.display_name ?? p.email ?? "—",
    email: p.email ?? "",
  }));

  const listaRoles: Rol[] = (roles ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    secciones: r.default_sections ?? [],
    acciones: r.default_actions ?? [],
    denegados: r.denied_permissions ?? [],
  }));

  // Lo que el actor posee hoy: el techo de lo que puede repartir.
  const ahora = new Date();
  const vigentes = actor.grants.filter(
    (g) => g.estado === "ACTIVE" && (!g.hasta || g.hasta > ahora),
  );
  const poseeSecciones = [...new Set(vigentes.flatMap((g) => g.secciones))];
  const poseeAcciones = [...new Set(vigentes.flatMap((g) => g.acciones))];
  const puedeGlobal = vigentes.some((g) => g.tipoAlcance === "GLOBAL");

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Comunidad</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Accesos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Un acceso es una persona, un rol, un territorio y una ventana de tiempo.
        Nada de esto se hereda ni se adivina: se otorga a propósito y queda
        firmado en la auditoría.
      </p>

      {!decisionOtorgar.permitido && (
        <div className="mt-6 max-w-2xl rounded-lg border border-gold-700/40 bg-gold-400/5 p-4">
          <p className="text-sm text-ink">
            Puedes ver los accesos, pero no otorgarlos.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {decisionOtorgar.motivo === "MFA_REQUERIDA" ? (
              <>
                Este permiso exige segundo factor.{" "}
                <a href="/admin/seguridad" className="text-red-600 underline">
                  Verifícalo en Seguridad
                </a>{" "}
                y vuelve: se abre por 12 horas.
              </>
            ) : (
              "Tu acceso no incluye otorgar accesos."
            )}
          </p>
        </div>
      )}

      {decisionOtorgar.permitido && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">Otorgar acceso</h2>
          <div className="mt-4">
            <Constructor
              personas={listaPersonas}
              roles={listaRoles}
              territorios={territorios}
              puedeGlobal={puedeGlobal}
              poseeSecciones={poseeSecciones}
              poseeAcciones={poseeAcciones}
            />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Accesos otorgados
        </h2>

        {(grants?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay accesos en tu territorio.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Persona</th>
                  <th scope="col" className="px-4 py-3 font-medium">Rol</th>
                  <th scope="col" className="px-4 py-3 font-medium">Territorio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vigencia</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  {decisionOtorgar.permitido && <th scope="col" className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {grants!.map((g, i) => {
                  const persona = g.users as { display_name: string | null; email: string | null } | null;
                  const rol = g.roles as { slug: string } | null;
                  const activo = g.status === "ACTIVE";
                  return (
                    <tr key={g.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">
                          {persona?.display_name ?? "—"}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {persona?.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-display text-xs text-ink uppercase">
                          {rol?.slug ?? "—"}
                        </span>
                        <span className="block text-xs text-ink-faint">
                          {(g.sections ?? []).length} secciones ·{" "}
                          {(g.actions ?? []).length} acciones
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {g.scope_type === "GLOBAL" ? (
                          "Global"
                        ) : (
                          <span className="font-mono text-xs">{g.scope_path}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {g.ends_at
                          ? `hasta ${new Date(g.ends_at).toLocaleDateString("es")}`
                          : "sin fin"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={activo ? "text-success-ink" : "text-ink-faint"}>
                          {g.status}
                        </span>
                      </td>
                      {decisionOtorgar.permitido && (
                        <td className="px-4 py-3 text-right">
                          {activo && g.user_id !== actor.usuarioId && (
                            <Revocar grantId={g.id} quien={persona?.display_name ?? persona?.email ?? ""} />
                          )}
                        </td>
                      )}
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

/* Países, regiones y ciudades en una sola lista con su tipo, que es lo que
   pide el grant. El catálogo es público; lo que acota es el guard del
   servidor al otorgar, no esta lista. */
async function cargarTerritorios(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
): Promise<Territorio[]> {
  const [{ data: paises }, { data: regiones }, { data: ciudades }] = await Promise.all([
    supabase.from("countries").select("id, name, path").eq("is_active", true).order("name"),
    supabase.from("regions").select("id, name, path").order("name"),
    supabase.from("cities").select("id, name, path").eq("is_active", true).order("name"),
  ]);

  return [
    ...(paises ?? []).map((p) => ({ ...p, nombre: p.name, tipo: "COUNTRY" })),
    ...(regiones ?? []).map((r) => ({ ...r, nombre: r.name, tipo: "REGION" })),
    ...(ciudades ?? []).map((c) => ({ ...c, nombre: c.name, tipo: "CITY" })),
  ].map(({ id, nombre, path, tipo }) => ({ id, nombre, path, tipo }));
}

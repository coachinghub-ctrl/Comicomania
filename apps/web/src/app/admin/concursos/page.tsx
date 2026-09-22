import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NuevaTemporada, NuevoConcurso, type Ciudad, type Opcion } from "./formularios";

export const metadata = { title: "Concursos" };

const COLOR_ESTADO: Record<string, string> = {
  DRAFT: "text-ink-faint",
  SCHEDULED: "text-red-600",
  OPEN: "text-success-ink",
  CLOSED: "text-ink-soft",
  JUDGING: "text-red-600",
  FINISHED: "text-ink-soft",
  CANCELLED: "text-ink-faint",
};

export default async function Concursos() {
  if (!(await puedeActor({ seccion: "CONTESTS", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeCrear = puede(actor, { seccion: "CONTESTS", accion: "CREATE" }).permitido;

  const [{ data: concursos }, { data: temporadas }, { data: paises }, { data: ciudades }] =
    await Promise.all([
      supabase
        .from("contests")
        .select(
          "id, slug, name, status, registration_opens_at, registration_closes_at, age_reference_date, countries(name, path), cities(name, path), seasons(name, year), categories(id), rounds(id), participants(id)",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("seasons")
        .select("id, name, year, series(name)")
        .order("year", { ascending: false }),
      supabase.from("countries").select("id, name").eq("is_active", true).order("name"),
      supabase
        .from("cities")
        .select("id, name, country_id")
        .eq("is_active", true)
        .order("name"),
    ]);

  const opcionesTemporada: Opcion[] = (temporadas ?? []).map((t) => ({
    id: t.id,
    nombre: t.name,
    extra: `${(t.series as { name: string } | null)?.name ?? ""} ${t.year}`.trim(),
  }));
  const opcionesPais: Opcion[] = (paises ?? []).map((p) => ({ id: p.id, nombre: p.name }));
  const opcionesCiudad: Ciudad[] = (ciudades ?? []).map((c) => ({
    id: c.id,
    nombre: c.name,
    paisId: c.country_id,
  }));

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Concursos</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Concursos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Un concurso vive dentro de una temporada y de un territorio. Nace en
        borrador con sus categorías y sus rondas: nunca a medias, porque un
        concurso sin categorías no admite inscripciones.
      </p>

      {puedeCrear && (
        <>
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-lg text-ink uppercase">
                Nuevo concurso
              </h2>
              <NuevaTemporada />
            </div>
            <div className="mt-4">
              <NuevoConcurso
                temporadas={opcionesTemporada}
                paises={opcionesPais}
                ciudades={opcionesCiudad}
              />
            </div>
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Concursos en tu territorio
        </h2>

        {(concursos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay ninguno.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Concurso</th>
                  <th scope="col" className="px-4 py-3 font-medium">Territorio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Inscripciones</th>
                  <th scope="col" className="px-4 py-3 font-medium">Edad congelada</th>
                  <th scope="col" className="px-4 py-3 font-medium">Armado</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {concursos!.map((c, i) => {
                  const pais = c.countries as { name: string; path: string } | null;
                  const ciudad = c.cities as { name: string; path: string } | null;
                  const temporada = c.seasons as { name: string; year: number } | null;
                  return (
                    <tr key={c.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">{c.name}</span>
                        <span className="block text-xs text-ink-faint">
                          {temporada?.name} {temporada?.year}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {ciudad?.name ?? pais?.name ?? "—"}
                        <span className="ml-2 font-mono text-xs text-ink-faint">
                          {ciudad?.path ?? pais?.path}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {c.registration_opens_at
                          ? new Date(c.registration_opens_at).toLocaleDateString("es")
                          : "—"}
                        {" → "}
                        {c.registration_closes_at
                          ? new Date(c.registration_closes_at).toLocaleDateString("es")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {new Date(c.age_reference_date).toLocaleDateString("es")}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {(c.categories as unknown[] | null)?.length ?? 0} cat ·{" "}
                        {(c.rounds as unknown[] | null)?.length ?? 0} rondas ·{" "}
                        {(c.participants as unknown[] | null)?.length ?? 0} inscritos
                      </td>
                      <td className="px-4 py-3">
                        <span className={COLOR_ESTADO[c.status] ?? "text-ink-soft"}>
                          {c.status}
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

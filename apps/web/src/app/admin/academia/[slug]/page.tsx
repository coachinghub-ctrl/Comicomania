import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NuevaLeccion, NuevoModulo, QuitarLeccion } from "./editor";
import { CambiarEstado } from "../estado";

export const metadata = { title: "Programa del curso" };

const TIPO: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Lectura",
  QUIZ: "Ejercicio",
  LIVE: "En vivo",
  ASSIGNMENT: "Práctica",
};

const MODALIDAD: Record<string, string> = {
  RECORDED: "Grabado · se ve cuando se quiera",
  LIVE: "En vivo · cohorte con clases en directo",
  BLENDED: "Mixto · grabado más encuentros en vivo",
};

/* El programa de un curso, por dentro.

   Aquí se monta lo que el alumno va a vivir: módulos, clases, cuáles son en
   vivo y cuáles se ven cuando se quiera. Es la parte que el catálogo público
   solo enseña en resumen.

   El enlace de la sala y el material NO se leen desde esta pantalla aunque se
   escriban desde ella: son columnas que ni anon ni authenticated pueden
   seleccionar. Lo que se enseña es si están puestos o no, que es lo único que
   hace falta para saber si la clase está lista. */

export default async function ProgramaDelCurso({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await puedeActor({ seccion: "ACADEMY", accion: "VIEW" }))) notFound();

  const { slug } = await params;
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeEditar = puede(actor, { seccion: "ACADEMY", accion: "EDIT" }).permitido;

  const { data: curso } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, promise, level, modality, status, price, currency, duration_min, starts_on, seats, instructor_name, cover_url, cover_alt, display_order, course_modules(id, title, order, lessons(id, title, type, duration_s, order, is_preview, starts_at, ends_at))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!curso) notFound();

  const modulos = ((curso.course_modules ?? []) as {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      type: string;
      duration_s: number | null;
      order: number;
      is_preview: boolean;
      starts_at: string | null;
      ends_at: string | null;
    }[];
  }[]).sort((a, b) => a.order - b.order);

  const lecciones = modulos.reduce((t, m) => t + (m.lessons?.length ?? 0), 0);
  const enVivo = modulos.reduce(
    (t, m) => t + (m.lessons ?? []).filter((l) => l.type === "LIVE").length,
    0,
  );
  const muestras = modulos.reduce(
    (t, m) => t + (m.lessons ?? []).filter((l) => l.is_preview).length,
    0,
  );

  const { count: alumnos } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", curso.id);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">
        <a href="/admin/academia" className="hover:text-ink">
          Academia
        </a>{" "}
        · Programa
      </p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        {curso.title}
      </h1>
      {curso.subtitle && (
        <p className="mt-1 text-ink-soft">{curso.subtitle}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
        <span>{MODALIDAD[curso.modality ?? "RECORDED"]}</span>
        <span className="tabular-nums">
          ${curso.price} {curso.currency}
        </span>
        {curso.starts_on && (
          <span className="tabular-nums">
            Empieza el {new Date(`${curso.starts_on}T00:00:00`).toLocaleDateString("es")}
          </span>
        )}
        {curso.seats && <span className="tabular-nums">{curso.seats} cupos</span>}
        <a
          href={`/academia/${curso.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-red-600 underline"
        >
          Ver la página pública
        </a>
      </div>

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            { etiqueta: "Módulos", valor: modulos.length },
            { etiqueta: "Clases", valor: lecciones },
            { etiqueta: "En vivo", valor: enVivo },
            { etiqueta: "Alumnos", valor: alumnos ?? 0 },
          ].map((t) => (
            <div
              key={t.etiqueta}
              className="rounded-lg border border-line bg-surface-2 px-5 py-4"
            >
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

      {puedeEditar && (
        <section className="mt-8 rounded-lg border border-line bg-surface-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink">
                Estado:{" "}
                <strong>
                  {curso.status === "PUBLISHED"
                    ? "publicado"
                    : curso.status === "ARCHIVED"
                      ? "archivado"
                      : "borrador"}
                </strong>
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {lecciones === 0
                  ? "Sin una sola clase no se puede publicar: sería vender un temario vacío."
                  : muestras === 0
                    ? "No hay ninguna clase de muestra. Un temario que no se puede probar vende menos."
                    : `${muestras} clase${muestras === 1 ? "" : "s"} de muestra, visibles sin pagar.`}
              </p>
            </div>
            <CambiarEstado cursoId={curso.id} actual={curso.status ?? "DRAFT"} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg text-ink uppercase">El programa</h2>
          {puedeEditar && <NuevoModulo cursoId={curso.id} slug={curso.slug} />}
        </div>

        {modulos.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Este curso no tiene módulos. Añade el primero.
          </p>
        ) : (
          <ol className="mt-5 space-y-5">
            {modulos.map((m) => {
              const clases = (m.lessons ?? []).sort((a, b) => a.order - b.order);
              return (
                <li key={m.id} className="rounded-lg border border-line p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="font-display text-base text-ink uppercase">
                      {m.order}. {m.title}
                    </h3>
                    <span className="text-xs text-ink-faint tabular-nums">
                      {clases.length} clase{clases.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {clases.length === 0 ? (
                    <p className="mt-3 text-sm text-ink-faint">
                      Módulo vacío.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-line">
                      {clases.map((l) => (
                        <li
                          key={l.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="text-ink">{l.title}</span>
                            {l.is_preview && (
                              <span className="ml-2 text-xs text-success-ink">
                                muestra
                              </span>
                            )}
                            {l.starts_at && (
                              <span className="block text-xs text-ink-faint tabular-nums">
                                {new Date(l.starts_at).toLocaleString("es", {
                                  dateStyle: "long",
                                  timeStyle: "short",
                                })}
                              </span>
                            )}
                          </span>
                          <span
                            className={
                              l.type === "LIVE"
                                ? "text-xs text-red-600"
                                : "text-xs text-ink-faint"
                            }
                          >
                            {TIPO[l.type] ?? l.type}
                          </span>
                          <span className="w-16 text-right text-xs text-ink-faint tabular-nums">
                            {l.duration_s ? `${Math.round(l.duration_s / 60)} min` : "—"}
                          </span>
                          {puedeEditar && (
                            <QuitarLeccion
                              leccionId={l.id}
                              slug={curso.slug}
                              titulo={l.title}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {puedeEditar && (
                    <div className="mt-3">
                      <NuevaLeccion
                        cursoId={curso.id}
                        moduloId={m.id}
                        slug={curso.slug}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

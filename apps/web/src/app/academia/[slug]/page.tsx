import { notFound } from "next/navigation";
import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

export const revalidate = 300;

/* La página de un curso.

   El temario se ve ENTERO, aunque no estés inscrito. Esconderlo es lo que
   hace que la gente no compre: nadie paga por una lista de títulos que no
   puede leer. Lo que se protege es el CONTENIDO de cada lección, y eso lo
   hace RLS, no esta pantalla.

   Una lección marcada como muestra sí se puede ver. Es lo que vende el
   curso. */

/* Cómo se vive el curso, con todas las letras. Quien paga un curso en vivo
   compra unos días y unas horas concretas; quien paga uno grabado compra no
   tener que estar en ningún sitio. Confundir los dos es la vía rápida al
   reembolso. */
const MODALIDAD: Record<string, { titulo: string; texto: string }> = {
  RECORDED: {
    titulo: "Grabado · a tu ritmo",
    texto: "Se ve cuando puedas, las veces que quieras. No hay horario.",
  },
  LIVE: {
    titulo: "En vivo · en grupo",
    texto:
      "Clases en directo con fecha y hora. Se avanza con el grupo, y por eso hay plazas.",
  },
  BLENDED: {
    titulo: "Mixto · grabado y en vivo",
    texto:
      "Material grabado para ver a tu ritmo, más encuentros en directo con fecha.",
  },
};

const NIVEL: Record<string, string> = {
  BEGINNER: "Desde cero",
  INTERMEDIATE: "Ya te subiste al escenario",
  ADVANCED: "Vives de esto o quieres vivir",
};

const TIPO_LECCION: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Lectura",
  QUIZ: "Ejercicio",
  LIVE: "En vivo",
  ASSIGNMENT: "Práctica",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("courses")
    .select("title, promise, description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { title: "Curso · COMICOMANÍA" };

  return {
    title: `${data.title} · COMICOMANÍA Academy`,
    description: data.promise ?? data.description ?? undefined,
    openGraph: data.cover_url ? { images: [data.cover_url] } : undefined,
  };
}

export default async function Curso({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidor();

  const { data: curso } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, promise, description, level, modality, starts_on, seats, instructor_name, price, currency, duration_min, cover_url, cover_alt, highlights, status, course_modules(id, title, order, lessons(id, title, type, duration_s, order, is_preview, starts_at))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!curso || curso.status !== "PUBLISHED") notFound();

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
    }[];
  }[]).sort((a, b) => a.order - b.order);

  const lecciones = modulos.reduce((t, m) => t + (m.lessons?.length ?? 0), 0);
  const puntos = (curso.highlights ?? []) as string[];

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/" className="text-muted transition-colors hover:text-paper-pure">
            Inicio
          </a>
          <a href="/academia" className="text-muted transition-colors hover:text-paper-pure">
            Academia
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        <div className="flex flex-col gap-10 lg:flex-row">
          {curso.cover_url && (
            <div className="shrink-0 lg:w-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={curso.cover_url}
                alt={curso.cover_alt ?? `Arte de ${curso.title}`}
                width={1080}
                height={1350}
                className="w-full rounded-lg border border-stage-600"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {NIVEL[curso.level] ?? curso.level}
            </p>

            <h1 className="font-display mt-3 text-4xl text-paper uppercase sm:text-5xl">
              {curso.title}
            </h1>

            {curso.subtitle && (
              <p className="mt-3 text-xl text-red-300">{curso.subtitle}</p>
            )}

            {curso.description && (
              <p className="mt-5 text-muted">{curso.description}</p>
            )}

            {puntos.length > 0 && (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {puntos.map((p) => (
                  <li
                    key={p}
                    className="rounded-md border border-stage-600 bg-stage-800 px-4 py-2.5 text-sm text-paper-pure"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-lg border border-gold-400/30 bg-gold-400/5 p-4">
              <p className="font-display text-base text-paper uppercase">
                {MODALIDAD[curso.modality ?? "RECORDED"]?.titulo}
              </p>
              <p className="mt-1 text-sm text-muted">
                {MODALIDAD[curso.modality ?? "RECORDED"]?.texto}
              </p>
              {(curso.starts_on || curso.seats) && (
                <p className="mt-2 text-sm text-gold-400 tabular-nums">
                  {curso.starts_on &&
                    `Empieza el ${new Date(`${curso.starts_on}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}`}
                  {curso.starts_on && curso.seats ? " · " : ""}
                  {curso.seats ? `${curso.seats} plazas` : ""}
                </p>
              )}
              {curso.instructor_name && (
                <p className="mt-2 text-sm text-muted-dim">
                  Lo da {curso.instructor_name}.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-lg border border-stage-600 bg-stage-800 p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-4xl text-paper-pure tabular-nums">
                  ${curso.price}
                </span>
                <span className="text-sm text-muted-dim">{curso.currency}</span>
              </div>
              <p className="mt-2 text-sm text-muted tabular-nums">
                {modulos.length} módulos · {lecciones} lecciones
                {curso.duration_min
                  ? ` · unas ${Math.round(curso.duration_min / 60)} horas`
                  : ""}
              </p>

              <p className="mt-4 rounded-md border border-gold-400/30 bg-gold-400/5 p-3 text-sm text-muted">
                La inscripción abre en cuanto conectemos la pasarela de pago.
                Preferimos decírtelo a ponerte un botón que no cobra.
              </p>
            </div>
          </div>
        </div>

        {/* El temario, completo. Esconderlo es lo que hace que nadie compre. */}
        <section className="mt-16">
          <h2 className="font-display text-3xl text-paper uppercase">Temario</h2>
          <p className="mt-2 max-w-xl text-muted">
            Lo que vas a aprender, módulo por módulo. Las lecciones marcadas
            como muestra se pueden ver sin pagar.
          </p>

          <ol className="mt-8 space-y-6">
            {modulos.map((m) => {
              const suyas = (m.lessons ?? []).slice().sort((a, b) => a.order - b.order);
              return (
                <li key={m.id}>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-lg text-red-500 tabular-nums">
                      {String(m.order).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-xl text-paper uppercase">
                      {m.title}
                    </h3>
                    <span className="text-xs text-muted-dim">
                      {suyas.length} {suyas.length === 1 ? "lección" : "lecciones"}
                    </span>
                  </div>

                  <ul className="mt-3 divide-y divide-stage-600 rounded-lg border border-stage-600 bg-stage-900">
                    {suyas.map((l) => (
                      <li
                        key={l.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                      >
                        <span className="min-w-0 text-paper-pure">
                          {l.title}
                          {l.is_preview && (
                            <span className="ml-3 rounded-full border border-success/40 px-2 py-0.5 text-xs text-success">
                              muestra gratis
                            </span>
                          )}
                          {/* La fecha de una clase en vivo es pública a
                              propósito: "martes 7 a las 19:00" es argumento de
                              venta. El enlace de la sala no sale de aquí. */}
                          {l.starts_at && (
                            <span className="block text-xs text-gold-400 tabular-nums">
                              {new Date(l.starts_at).toLocaleString("es", {
                                dateStyle: "long",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-dim tabular-nums">
                          {l.type === "LIVE" ? (
                            <span className="text-red-300">En vivo</span>
                          ) : (
                            (TIPO_LECCION[l.type] ?? l.type)
                          )}
                          {l.duration_s ? ` · ${Math.round(l.duration_s / 60)} min` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>

        <nav
          aria-label="Seguir explorando"
          className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stage-600 pt-8 text-sm"
        >
          <a href="/" className="text-red-300 transition-colors hover:text-red-400">
            ← Volver al inicio
          </a>
          <a href="/academia" className="text-muted transition-colors hover:text-paper-pure">
            Los otros cursos
          </a>
          <a href="/tienda" className="text-muted transition-colors hover:text-paper-pure">
            La tienda
          </a>
        </nav>
      </div>
    </main>
  );
}

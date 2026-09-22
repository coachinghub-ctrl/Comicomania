import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = {
  title: "Academia · COMICOMANÍA",
  description:
    "Cursos de stand up, escritura de comedia y marca personal. De la primera idea al escenario, y del escenario al mundo digital.",
};

export const revalidate = 300;

/* El catálogo de la Academia, público.

   Se mira sin cuenta, igual que la tienda: quien está decidiendo si aprende
   comedia no va a crear una cuenta para leer un temario. La cuenta llega al
   inscribirse.

   El orden no es casual: de entrada a avanzado. Quien llega sin saber por
   dónde empezar necesita que el primero sea el suyo. */

/* Cómo se vive el curso. Es lo primero que pregunta quien va a pagar: no es
   lo mismo conectarse un martes a las siete que verlo cuando se pueda, y
   esconderlo hasta el final produce reembolsos. */
const MODALIDAD: Record<string, string> = {
  RECORDED: "Grabado · a tu ritmo",
  LIVE: "En vivo · en grupo",
  BLENDED: "Mixto · grabado y en vivo",
};

const NIVEL: Record<string, string> = {
  BEGINNER: "Desde cero",
  INTERMEDIATE: "Ya te subiste al escenario",
  ADVANCED: "Vives de esto o quieres vivir",
};

export default async function Academia() {
  const supabase = await crearClienteServidor();

  const { data: cursos, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, promise, description, level, modality, starts_on, seats, price, currency, duration_min, cover_url, cover_alt, highlights, display_order, course_modules(id, lessons(id))",
    )
    .eq("status", "PUBLISHED")
    .order("display_order")
    .limit(30);

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/" className="text-muted transition-colors hover:text-paper-pure">
            Inicio
          </a>
          <a href="/tienda" className="text-muted transition-colors hover:text-paper-pure">
            Tienda
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-10">
        <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
          COMICOMANÍA Academy
        </p>
        <h1 className="font-display mt-3 text-5xl text-paper uppercase sm:text-6xl">
          El humor{" "}
          <span className="block text-red-500">también se aprende.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Nadie nace sabiendo dónde va el remate. Tres cursos, en orden: de la
          primera idea al escenario, y del escenario al mundo digital.
        </p>
      </section>

      {error && (
        <p role="alert" className="mx-auto max-w-6xl px-5 text-sm text-red-300">
          No se pudo cargar la academia: {error.message}
        </p>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <ul className="grid gap-8 lg:grid-cols-3">
          {(cursos ?? []).map((c) => {
            const modulos = (c.course_modules ?? []) as { lessons: unknown[] }[];
            const lecciones = modulos.reduce(
              (t, m) => t + (m.lessons?.length ?? 0),
              0,
            );
            const puntos = (c.highlights ?? []) as string[];

            return (
              <li
                key={c.id}
                className="flex flex-col overflow-hidden rounded-lg border border-stage-600 bg-stage-900"
              >
                <a href={`/academia/${c.slug}`} className="block">
                  {c.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_url}
                      alt={c.cover_alt ?? c.title}
                      width={1080}
                      height={1350}
                      className="aspect-4/5 w-full object-cover transition-transform hover:scale-[1.02]"
                      loading="lazy"
                    />
                  )}
                </a>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                    {NIVEL[c.level] ?? c.level}
                  </p>

                  <h2 className="font-display mt-2 text-2xl text-paper uppercase">
                    <a href={`/academia/${c.slug}`} className="hover:text-red-300">
                      {c.title}
                    </a>
                  </h2>

                  {c.subtitle && (
                    <p className="mt-1 text-red-300">{c.subtitle}</p>
                  )}

                  {c.promise && (
                    <p className="mt-3 flex-1 text-sm text-muted">{c.promise}</p>
                  )}

                  {puntos.length > 0 && (
                    <ul className="mt-4 space-y-1">
                      {puntos.map((p) => (
                        <li key={p} className="text-sm text-muted">
                          · {p}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-4 text-sm text-paper">
                    {MODALIDAD[c.modality ?? "RECORDED"] ?? c.modality}
                  </p>
                  {c.starts_on && (
                    <p className="text-xs text-gold-400 tabular-nums">
                      Empieza el{" "}
                      {new Date(`${c.starts_on}T00:00:00`).toLocaleDateString("es", {
                        day: "numeric",
                        month: "long",
                      })}
                      {c.seats ? ` · ${c.seats} plazas` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-dim tabular-nums">
                    {modulos.length} módulos · {lecciones} lecciones
                    {c.duration_min ? ` · ${Math.round(c.duration_min / 60)} h` : ""}
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-paper-pure tabular-nums">
                      ${c.price}
                    </span>
                    <span className="text-xs text-muted-dim">{c.currency}</span>
                  </div>

                  <a
                    href={`/academia/${c.slug}`}
                    className="mt-4 block rounded-md bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-paper transition-colors hover:bg-red-500"
                  >
                    Ver el curso
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        {(cursos?.length ?? 0) === 0 && !error && (
          <p className="rounded-lg border border-stage-600 bg-stage-800 p-8 text-center text-muted">
            La academia abre pronto.
          </p>
        )}
      </section>
    </main>
  );
}

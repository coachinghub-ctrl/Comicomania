import type { Route } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Mi academia" };

/* Mis cursos.

   El orden no es por fecha de compra: primero el que está a medias. Quien
   entra aquí casi siempre viene a seguir donde lo dejó, y poner arriba el que
   ya terminó es hacerle buscar. */

const MODALIDAD: Record<string, string> = {
  RECORDED: "Grabado · a tu ritmo",
  LIVE: "En vivo · en grupo",
  BLENDED: "Mixto · grabado y en vivo",
};

export default async function MiAcademia() {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect("/entrar?volver=/mi/academia" as Route);

  const { data: inscripciones, error } = await supabase
    .from("course_enrollments")
    .select(
      "id, progress_pct, started_at, completed_at, source, courses(slug, title, subtitle, level, modality, starts_on, cover_url, cover_alt, duration_min), certificates(id, serial)",
    )
    .eq("user_id", credencial.id);

  const lista = ((inscripciones ?? []) as unknown as {
    id: string;
    progress_pct: number;
    started_at: string;
    completed_at: string | null;
    source: string;
    courses: {
      slug: string;
      title: string;
      subtitle: string | null;
      level: string;
      modality: string | null;
      starts_on: string | null;
      cover_url: string | null;
      cover_alt: string | null;
      duration_min: number | null;
    } | null;
    certificates: { id: string; serial: string }[];
  }[]).sort((a, b) => {
    // A medias primero, luego sin empezar, y al final los terminados.
    const peso = (p: number, hecho: boolean) => (hecho ? 2 : p > 0 ? 0 : 1);
    return (
      peso(a.progress_pct, Boolean(a.completed_at)) -
      peso(b.progress_pct, Boolean(b.completed_at))
    );
  });

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={120} prioridad />
        </a>
        <a href="/mi" className="text-sm text-muted hover:text-paper-pure">
          Mi COMICOMANÍA
        </a>
      </header>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        <h1 className="font-display text-4xl text-paper uppercase">
          Mi academia
        </h1>

        {error && (
          <p role="alert" className="mt-6 text-sm text-red-300">
            No se pudo cargar: {error.message}
          </p>
        )}

        {lista.length === 0 ? (
          <section className="mt-8 rounded-lg border border-stage-600 bg-stage-900 p-6">
            <p className="text-muted">
              Todavía no estás en ningún curso.
            </p>
            <ButtonLink href={"/academia" as Route} tamano="lg" className="mt-5">
              Ver los cursos
            </ButtonLink>
          </section>
        ) : (
          <ul className="mt-8 space-y-4">
            {lista.map((e) => {
              const c = e.courses;
              if (!c) return null;
              const certificado = e.certificates?.[0];

              return (
                <li
                  key={e.id}
                  className="flex gap-5 rounded-lg border border-stage-600 bg-stage-900 p-5"
                >
                  {c.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_url}
                      alt={c.cover_alt ?? ""}
                      width={160}
                      height={200}
                      className="aspect-4/5 w-24 shrink-0 rounded-md border border-stage-600 object-cover sm:w-32"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl text-paper uppercase">
                      <a
                        href={`/mi/academia/${c.slug}`}
                        className="hover:text-red-300"
                      >
                        {c.title}
                      </a>
                    </h2>
                    {c.subtitle && (
                      <p className="mt-1 text-sm text-red-300">{c.subtitle}</p>
                    )}

                    <p className="mt-2 text-xs text-muted-dim">
                      {MODALIDAD[c.modality ?? "RECORDED"]}
                      {c.starts_on &&
                        ` · empieza el ${new Date(`${c.starts_on}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "long" })}`}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stage-600">
                        <div
                          className={
                            e.completed_at ? "h-full bg-success" : "h-full bg-red-600"
                          }
                          style={{ width: `${e.progress_pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-sm text-paper tabular-nums">
                        {e.progress_pct}%
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <a
                        href={`/mi/academia/${c.slug}`}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper hover:bg-red-500"
                      >
                        {e.progress_pct === 0
                          ? "Empezar"
                          : e.completed_at
                            ? "Repasar"
                            : "Seguir donde lo dejé"}
                      </a>
                      {certificado && (
                        <a
                          href={`/certificados/${certificado.serial}`}
                          className="rounded-md border border-success/50 px-4 py-2 text-sm text-success hover:bg-success/10"
                        >
                          Ver mi certificado
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

import type { Route } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

/* La página del concurso, pública.

   Si hubiera que registrarse para saber qué se pide, la gente se registra,
   lee, y se va. Los requisitos se leen antes de crear la cuenta.

   La razón de que esto exista no es estética: un concurso que no explica sus
   requisitos recibe cien videos que hay que rechazar uno por uno, y cada
   rechazo es una persona enfadada con razón — nadie le dijo que dos minutos
   eran dos minutos. */

const ESTADO: Record<string, { texto: string; clase: string } | null> = {
  DRAFT: null,
  SCHEDULED: { texto: "Próximamente", clase: "text-gold-400" },
  OPEN: { texto: "Inscripciones abiertas", clase: "text-success" },
  CLOSED: { texto: "Inscripciones cerradas", clase: "text-muted-dim" },
  JUDGING: { texto: "En evaluación", clase: "text-gold-400" },
  FINISHED: { texto: "Terminado", clase: "text-muted-dim" },
  CANCELLED: { texto: "Cancelado", clase: "text-red-300" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("contests")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();

  return {
    title: data ? `${data.name} · COMICOMANÍA` : "Concurso · COMICOMANÍA",
    description: data?.description ?? undefined,
  };
}

export default async function Concurso({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidor();

  /* RLS decide qué es público: un borrador no se ve aunque alguien adivine la
     dirección. Por eso no hace falta filtrar por estado acá. */
  const { data: concurso } = await supabase
    .from("contests")
    .select(
      "id, slug, name, status, description, how_to_enter, invitation_image_url, invitation_image_alt, registration_opens_at, registration_closes_at, submission_deadline, age_reference_date, prize, cities(name), countries(name), categories(name, min_age, max_age), rounds(name, order, type), contest_requirements(id, order, title, detail, fails_when, is_required)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!concurso) notFound();

  const ciudad = concurso.cities as { name: string } | null;
  const pais = concurso.countries as { name: string } | null;
  const estado = ESTADO[concurso.status];
  const abierto = concurso.status === "OPEN";

  const categorias = ((concurso.categories ?? []) as {
    name: string;
    min_age: number | null;
    max_age: number | null;
  }[]).sort((a, b) => (a.min_age ?? 0) - (b.min_age ?? 0));

  const rondas = ((concurso.rounds ?? []) as {
    name: string;
    order: number;
    type: string;
  }[]).sort((a, b) => a.order - b.order);

  const requisitos = ((concurso.contest_requirements ?? []) as {
    id: string;
    order: number;
    title: string;
    detail: string | null;
    fails_when: string | null;
    is_required: boolean;
  }[]).sort((a, b) => a.order - b.order);

  const premio = concurso.prize as Record<string, string> | null;
  const fecha = (f: string | null) =>
    f ? new Date(f).toLocaleDateString("es", { dateStyle: "long" }) : null;

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/tienda" className="text-muted transition-colors hover:text-paper-pure">
            Tienda
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* El arte de invitación. Es lo que se comparte, así que va primero
              y en grande. */}
          {concurso.invitation_image_url && (
            <div className="shrink-0 lg:w-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={concurso.invitation_image_url}
                alt={concurso.invitation_image_alt ?? `Invitación de ${concurso.name}`}
                width={640}
                height={800}
                className="w-full rounded-lg border border-stage-600"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {estado && (
              <p className={`text-xs tracking-[0.3em] uppercase ${estado.clase}`}>
                {estado.texto}
              </p>
            )}
            <h1 className="font-display mt-3 text-4xl text-paper uppercase sm:text-5xl">
              {concurso.name}
            </h1>
            <p className="mt-2 text-muted">
              {ciudad?.name ?? pais?.name ?? ""}
              {ciudad && pais ? ` · ${pais.name}` : ""}
            </p>

            {concurso.description && (
              <p className="mt-5 text-lg text-paper-pure">{concurso.description}</p>
            )}

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { t: "Abren inscripciones", v: fecha(concurso.registration_opens_at) },
                { t: "Cierran inscripciones", v: fecha(concurso.registration_closes_at) },
                { t: "Límite para el video", v: fecha(concurso.submission_deadline) },
                {
                  t: "Tu edad se congela el",
                  v: fecha(concurso.age_reference_date),
                },
              ]
                .filter((d) => d.v)
                .map((d) => (
                  <div key={d.t} className="rounded-lg border border-stage-600 bg-stage-800 px-4 py-3">
                    <dt className="text-xs tracking-wider text-muted-dim uppercase">
                      {d.t}
                    </dt>
                    <dd className="mt-1 text-paper-pure">{d.v}</dd>
                  </div>
                ))}
            </dl>

            {premio && Object.keys(premio).length > 0 && (
              <div className="mt-6 rounded-lg border border-gold-400/40 bg-gold-400/5 p-5">
                <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                  Premio
                </p>
                <ul className="mt-2 space-y-1">
                  {Object.entries(premio).map(([k, v]) => (
                    <li key={k} className="text-paper-pure">
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {abierto && (
              <ButtonLink href={"/entrar?volver=/mi" as Route} tamano="lg" className="mt-8">
                Quiero participar
              </ButtonLink>
            )}
          </div>
        </div>

        {/* Requisitos: lo que de verdad hace falta leer antes de grabar. */}
        {requisitos.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl text-paper uppercase">
              Qué se pide
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              Léelo antes de grabar. Cada punto es algo que se revisa, y lo que
              no cumple no entra a la cola.
            </p>

            <ul className="mt-6 space-y-3">
              {requisitos.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-stage-600 bg-stage-800 p-5"
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-lg text-red-500 tabular-nums">
                      {String(r.order).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-lg text-paper uppercase">
                      {r.title}
                    </h3>
                    {!r.is_required && (
                      <span className="rounded-full border border-stage-600 px-2.5 py-0.5 text-xs text-muted-dim">
                        recomendado
                      </span>
                    )}
                  </div>
                  {r.detail && <p className="mt-2 text-muted">{r.detail}</p>}
                  {r.fails_when && (
                    <p className="mt-2 text-sm text-red-300">
                      No pasa si: {r.fails_when}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {concurso.how_to_enter && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-paper uppercase">
              Cómo se participa
            </h2>
            <p className="mt-3 max-w-2xl text-muted">{concurso.how_to_enter}</p>
          </section>
        )}

        {categorias.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-paper uppercase">
              Categorías
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              No la eliges: se asigna sola por tu edad, congelada en la fecha de
              cierre. Por eso nadie compite contra quien no debe.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {categorias.map((c) => (
                <li
                  key={c.name}
                  className="rounded-lg border border-stage-600 bg-stage-800 px-5 py-3"
                >
                  <p className="font-display text-paper uppercase">{c.name}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {c.min_age ?? "?"}
                    {c.max_age ? `–${c.max_age}` : "+"} años
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rondas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-paper uppercase">
              Cómo avanza
            </h2>
            <ol className="mt-5 flex flex-wrap items-center gap-2">
              {rondas.map((r, i) => (
                <li key={r.name} className="flex items-center gap-2">
                  <span className="rounded-lg border border-stage-600 bg-stage-800 px-4 py-2">
                    <span className="font-display text-paper uppercase">
                      {r.name}
                    </span>
                  </span>
                  {i < rondas.length - 1 && (
                    <span className="text-red-500" aria-hidden="true">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {abierto && (
          <section className="mt-16 rounded-lg border border-red-500/40 bg-red-700/10 p-8 text-center">
            <p className="font-display text-2xl text-paper uppercase">
              ¿Tienes dos minutos que funcionen?
            </p>
            <ButtonLink href={"/entrar?volver=/mi" as Route} tamano="lg" className="mt-5">
              Quiero participar
            </ButtonLink>
          </section>
        )}
      </div>
    </main>
  );
}

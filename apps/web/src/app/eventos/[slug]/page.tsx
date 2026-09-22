import type { Route } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

/* La página de un evento.

   El cartel manda: es lo que la gente reenvía por WhatsApp, así que ocupa el
   lugar que le toca. Pero todo lo que dice el cartel está ADEMÁS en texto —la
   frase, la fecha, la sede— porque una promesa que solo existe dentro de un
   JPG no se puede buscar, ni citar, ni leer en voz alta. */

const ESTADO: Record<string, { texto: string; clase: string } | null> = {
  DRAFT: null,
  ANNOUNCED: { texto: "Anunciado", clase: "text-gold-400" },
  ON_SALE: { texto: "Entradas a la venta", clase: "text-success" },
  SOLD_OUT: { texto: "Agotado", clase: "text-red-300" },
  LIVE: { texto: "En vivo", clase: "text-red-400" },
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
    .from("events")
    .select("name, tagline, description, poster_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { title: "Evento · COMICOMANÍA" };

  return {
    title: `${data.name} · COMICOMANÍA`,
    description: data.tagline ?? data.description ?? undefined,
    // El cartel es la tarjeta cuando alguien comparte el enlace.
    openGraph: data.poster_url ? { images: [data.poster_url] } : undefined,
  };
}

export default async function Evento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidor();

  const { data: evento } = await supabase
    .from("events")
    .select(
      "id, slug, name, type, description, tagline, subtitle, starts_at, ends_at, timezone, capacity, status, poster_url, poster_alt, online_url, venues(name, address), cities(name), countries(name), ticket_types(id, name, kind, price, currency, quantity, benefits, status), contests(name, slug)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) notFound();

  const sede = evento.venues as { name: string; address: string | null } | null;
  const ciudad = evento.cities as { name: string } | null;
  const pais = evento.countries as { name: string } | null;
  const concurso = evento.contests as { name: string; slug: string } | null;
  const estado = ESTADO[evento.status];
  const aLaVenta = evento.status === "ON_SALE";

  const entradas = ((evento.ticket_types ?? []) as {
    id: string;
    name: string;
    kind: string;
    price: number;
    currency: string;
    quantity: number;
    benefits: { incluye?: string[] } | null;
    status: string;
  }[])
    .filter((t) => t.status === "ACTIVE")
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cuando = new Date(evento.starts_at);

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
          <a href="/tienda" className="text-muted transition-colors hover:text-paper-pure">
            Tienda
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        <div className="flex flex-col gap-10 lg:flex-row">
          {evento.poster_url && (
            <div className="shrink-0 lg:w-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={evento.poster_url}
                alt={evento.poster_alt ?? `Cartel de ${evento.name}`}
                width={1080}
                height={1350}
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

            {evento.subtitle && (
              <p className="mt-3 text-sm tracking-[0.3em] text-muted uppercase">
                {evento.subtitle}
              </p>
            )}

            <h1 className="font-display mt-2 text-4xl text-paper uppercase sm:text-5xl">
              {evento.name}
            </h1>

            {evento.tagline && (
              <p className="mt-4 text-xl text-red-300">{evento.tagline}</p>
            )}

            {evento.description && (
              <p className="mt-5 text-muted">{evento.description}</p>
            )}

            <dl className="mt-8 space-y-4">
              <div className="flex gap-4">
                <dt className="w-24 shrink-0 text-xs tracking-wider text-muted-dim uppercase">
                  Cuándo
                </dt>
                <dd className="text-paper-pure">
                  {cuando.toLocaleDateString("es", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  <span className="block text-sm text-muted">
                    {cuando.toLocaleTimeString("es", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · hora de {ciudad?.name ?? "la ciudad"}
                  </span>
                </dd>
              </div>

              <div className="flex gap-4">
                <dt className="w-24 shrink-0 text-xs tracking-wider text-muted-dim uppercase">
                  Dónde
                </dt>
                <dd className="text-paper-pure">
                  {sede?.name ?? "Online"}
                  <span className="block text-sm text-muted">
                    {sede?.address ?? evento.online_url ?? ""}
                    {ciudad ? ` · ${ciudad.name}, ${pais?.name ?? ""}` : ""}
                  </span>
                </dd>
              </div>

              {concurso && (
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-xs tracking-wider text-muted-dim uppercase">
                    Concurso
                  </dt>
                  <dd>
                    <a
                      href={`/concursos/${concurso.slug}`}
                      className="text-red-300 underline transition-colors hover:text-red-400"
                    >
                      {concurso.name}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {aLaVenta && entradas.length > 0 && (
              <ButtonLink href={"#entradas" as Route} tamano="lg" className="mt-8">
                Ver entradas
              </ButtonLink>
            )}
          </div>
        </div>

        {entradas.length > 0 && (
          <section id="entradas" className="mt-16 scroll-mt-8">
            <h2 className="font-display text-3xl text-paper uppercase">Entradas</h2>
            <p className="mt-2 max-w-xl text-muted">
              Tu entrada llega con un código propio y se revisa en la puerta. Si
              la transfieres, el código anterior deja de servir.
            </p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {entradas.map((t) => {
                const incluye = t.benefits?.incluye ?? [];
                return (
                  <li
                    key={t.id}
                    className="flex flex-col rounded-lg border border-stage-600 bg-stage-800 p-5"
                  >
                    <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                      {t.kind}
                    </p>
                    <h3 className="font-display mt-1 text-lg text-paper uppercase">
                      {t.name}
                    </h3>

                    <p className="font-display mt-3 text-3xl text-paper-pure tabular-nums">
                      ${t.price}
                      <span className="ml-1 text-xs text-muted-dim">{t.currency}</span>
                    </p>

                    {incluye.length > 0 && (
                      <ul className="mt-3 flex-1 space-y-1">
                        {incluye.map((b) => (
                          <li key={b} className="text-sm text-muted">
                            · {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-4 rounded-md border border-stage-600 px-3 py-2 text-center text-xs text-muted-dim">
                      A la venta cuando abra la pasarela
                    </p>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 max-w-2xl rounded-lg border border-gold-400/30 bg-gold-400/5 p-4 text-sm text-muted">
              Todavía no podemos cobrar: falta conectar la pasarela de pago.
              Preferimos decírtelo a ponerte un botón que no cobra. En cuanto
              abra, la entrada aparece en tu cuenta con su código.
            </p>
          </section>
        )}

        {/* La salida, al final de la página. Quien llega hasta abajo no
            debería tener que volver arriba para seguir mirando. */}
        <nav
          aria-label="Seguir explorando"
          className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stage-600 pt-8 text-sm"
        >
          <a href="/" className="text-red-300 transition-colors hover:text-red-400">
            ← Volver al inicio
          </a>
          {concurso && (
            <a
              href={`/concursos/${concurso.slug}`}
              className="text-muted transition-colors hover:text-paper-pure"
            >
              El concurso
            </a>
          )}
          <a href="/tienda" className="text-muted transition-colors hover:text-paper-pure">
            La tienda
          </a>
        </nav>
      </div>
    </main>
  );
}

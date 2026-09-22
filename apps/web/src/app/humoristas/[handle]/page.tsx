import { notFound } from "next/navigation";
import { Logo } from "@comicomania/ui";
import { Reel } from "@/componentes/reel";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Contratar } from "./contratar";

export const revalidate = 300;

/* La ficha de un humorista.

   Dos cosas mandan y en este orden: el video primero, la biografía después.
   Quien llega aquí está decidiendo si esta persona le hace gracia, y eso no
   se decide leyendo.

   Las columnas se nombran una a una, nunca "*": el nombre legal y el contacto
   de contratación están restringidos por permisos de columna. Un asterisco no
   los filtraría, haría que Postgres rechazara la consulta entera — lo cual
   también es una forma de enterarse, pero peor. */

const COLUMNAS =
  "user_id, handle, stage_name, tagline, bio, photo_url, photo_alt, " +
  "reel_url, reel_title, comedy_styles, languages, markets, set_durations, " +
  "travel_availability, media_kit_url";

const IDIOMA: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  pt: "Portugués",
  fr: "Francés",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("talent_profiles")
    .select("stage_name, tagline, bio, photo_url")
    .eq("handle", handle)
    .eq("public_visible", true)
    .maybeSingle();

  if (!data) return { title: "Humorista · COMICOMANÍA" };

  return {
    title: `${data.stage_name} · COMICOMANÍA`,
    description: data.tagline ?? data.bio?.slice(0, 160) ?? undefined,
    openGraph: data.photo_url ? { images: [data.photo_url] } : undefined,
  };
}

export default async function Humorista({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await crearClienteServidor();

  const { data: h } = await supabase
    .from("talent_profiles")
    .select(COLUMNAS)
    .eq("handle", handle)
    .eq("public_visible", true)
    .maybeSingle();

  if (!h) notFound();

  const ficha = h as unknown as {
    user_id: string;
    handle: string;
    stage_name: string;
    tagline: string | null;
    bio: string | null;
    photo_url: string | null;
    photo_alt: string | null;
    reel_url: string | null;
    reel_title: string | null;
    comedy_styles: string[] | null;
    languages: string[] | null;
    markets: string[] | null;
    set_durations: number[] | null;
    travel_availability: string | null;
    media_kit_url: string | null;
  };

  const estilos = ficha.comedy_styles ?? [];
  const idiomas = ficha.languages ?? [];
  const mercados = ficha.markets ?? [];
  const duraciones = ficha.set_durations ?? [];

  // La biografía se escribe en párrafos y se enseña en párrafos. Un muro de
  // texto de ocho líneas no lo lee nadie.
  const parrafos = (ficha.bio ?? "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a
            href="/humoristas"
            className="text-muted transition-colors hover:text-paper-pure"
          >
            Repertorio
          </a>
          <a href="/" className="text-muted transition-colors hover:text-paper-pure">
            Inicio
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <article className="mx-auto max-w-5xl px-5 pb-16">
        <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
          COMICOMANÍA Talent
        </p>
        <h1 className="font-display mt-3 text-5xl text-paper uppercase sm:text-6xl">
          {ficha.stage_name}
        </h1>
        {ficha.tagline && (
          <p className="mt-3 text-xl text-red-300">{ficha.tagline}</p>
        )}

        {/* El video primero. Es lo que contrata. */}
        {ficha.reel_url && (
          <section className="mt-8">
            <Reel
              url={ficha.reel_url}
              titulo={ficha.reel_title ?? `Video de ${ficha.stage_name}`}
              poster={ficha.photo_url}
            />
            {ficha.reel_title && (
              <p className="mt-2 text-sm text-muted-dim">{ficha.reel_title}</p>
            )}
          </section>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
          <section>
            <h2 className="font-display text-lg text-paper uppercase">
              Quién es
            </h2>
            {parrafos.length > 0 ? (
              <div className="mt-3 space-y-4">
                {parrafos.map((p, i) => (
                  <p key={i} className="text-muted">
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-muted-dim">Biografía en camino.</p>
            )}
          </section>

          <aside>
            {ficha.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ficha.photo_url}
                alt={ficha.photo_alt ?? ficha.stage_name}
                width={1080}
                height={1350}
                className="aspect-4/5 w-full rounded-lg border border-stage-600 object-cover"
              />
            )}

            <dl className="mt-5 space-y-4 text-sm">
              {estilos.length > 0 && (
                <div>
                  <dt className="text-xs tracking-wider text-gold-400 uppercase">
                    Estilo
                  </dt>
                  <dd className="mt-1 text-muted">{estilos.join(" · ")}</dd>
                </div>
              )}
              {duraciones.length > 0 && (
                <div>
                  <dt className="text-xs tracking-wider text-gold-400 uppercase">
                    Duración de set
                  </dt>
                  <dd className="mt-1 text-muted tabular-nums">
                    {duraciones.join(", ")} min
                  </dd>
                </div>
              )}
              {idiomas.length > 0 && (
                <div>
                  <dt className="text-xs tracking-wider text-gold-400 uppercase">
                    Idiomas
                  </dt>
                  <dd className="mt-1 text-muted">
                    {idiomas.map((i) => IDIOMA[i] ?? i).join(" · ")}
                  </dd>
                </div>
              )}
              {mercados.length > 0 && (
                <div>
                  <dt className="text-xs tracking-wider text-gold-400 uppercase">
                    Dónde trabaja
                  </dt>
                  <dd className="mt-1 text-muted">{mercados.join(" · ")}</dd>
                </div>
              )}
              {ficha.travel_availability && (
                <div>
                  <dt className="text-xs tracking-wider text-gold-400 uppercase">
                    Viaja
                  </dt>
                  <dd className="mt-1 text-muted">{ficha.travel_availability}</dd>
                </div>
              )}
            </dl>

            {ficha.media_kit_url && (
              <a
                href={ficha.media_kit_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 block rounded-md border border-stage-600 px-4 py-2.5 text-center text-sm text-paper transition-colors hover:border-red-500"
              >
                Media kit
              </a>
            )}
          </aside>
        </div>

        {/* El formulario va DESPUÉS del video y la bio, no antes: primero se
            mira, luego se pregunta el precio. */}
        <section className="mt-12 border-t border-stage-600 pt-10">
          <Contratar
            talentoId={ficha.user_id}
            handle={ficha.handle}
            nombre={ficha.stage_name}
          />
        </section>

        <p className="mt-12 text-sm text-muted-dim">
          <a href="/humoristas" className="text-red-300 underline">
            Volver al repertorio
          </a>
        </p>
      </article>
    </main>
  );
}

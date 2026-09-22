import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = {
  title: "Humoristas · COMICOMANÍA",
  description:
    "El repertorio de COMICOMANÍA: quiénes son, qué hacen y cómo suenan. Cada ficha con su video y su biografía.",
};

export const revalidate = 300;

/* El repertorio, público.

   Se mira sin cuenta, igual que la tienda y la academia. Quien está buscando
   a alguien para su evento no va a registrarse para ver una lista de nombres:
   se registra —o escribe— cuando ya vio a alguien que le sirve.

   Las columnas se nombran una a una y nunca "*": el nombre legal y el
   contacto de contratación están restringidos por permisos de columna, y un
   asterisco haría que Postgres rechace la consulta entera. Eso es lo que
   impide que publicar el repertorio equivalga a publicar el teléfono de cada
   humorista. */

export default async function Humoristas() {
  const supabase = await crearClienteServidor();

  const { data: humoristas, error } = await supabase
    .from("talent_profiles")
    .select(
      "user_id, handle, stage_name, tagline, bio, photo_url, photo_alt, reel_title, comedy_styles, languages, markets, set_durations, display_order",
    )
    .eq("public_visible", true)
    .order("display_order")
    .order("stage_name")
    .limit(60);

  const lista = humoristas ?? [];

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
          <a href="/academia" className="text-muted transition-colors hover:text-paper-pure">
            Academia
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
          COMICOMANÍA Talent
        </p>
        <h1 className="font-display mt-3 text-5xl text-paper uppercase sm:text-6xl">
          El repertorio{" "}
          <span className="block text-red-500">de la casa.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          A un humorista no lo contratas por su currículum. Lo contratas
          porque lo viste dos minutos y te reíste. Aquí están esos dos minutos.
        </p>
      </section>

      {error && (
        <p role="alert" className="mx-auto max-w-6xl px-5 text-sm text-red-300">
          No se pudo cargar el repertorio: {error.message}
        </p>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-16">
        {lista.length === 0 && !error ? (
          <p className="rounded-lg border border-stage-600 bg-stage-800 p-8 text-center text-muted">
            El repertorio abre pronto.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {lista.map((h) => {
              const estilos = (h.comedy_styles ?? []) as string[];
              const duraciones = (h.set_durations ?? []) as number[];

              return (
                <li
                  key={h.user_id}
                  className="flex flex-col overflow-hidden rounded-lg border border-stage-600 bg-stage-900"
                >
                  <a href={`/humoristas/${h.handle}`} className="block">
                    {h.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={h.photo_url}
                        alt={h.photo_alt ?? h.stage_name}
                        width={1080}
                        height={1350}
                        className="aspect-4/5 w-full object-cover transition-transform hover:scale-[1.02]"
                        loading="lazy"
                      />
                    )}
                  </a>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-2xl text-paper uppercase">
                      <a
                        href={`/humoristas/${h.handle}`}
                        className="hover:text-red-300"
                      >
                        {h.stage_name}
                      </a>
                    </h2>

                    {h.tagline && (
                      <p className="mt-1 text-sm text-red-300">{h.tagline}</p>
                    )}

                    {estilos.length > 0 && (
                      <p className="mt-3 text-xs text-muted-dim">
                        {estilos.join(" · ")}
                      </p>
                    )}

                    {duraciones.length > 0 && (
                      <p className="mt-1 text-xs text-muted-dim tabular-nums">
                        Sets de {duraciones.join(", ")} min
                      </p>
                    )}

                    <a
                      href={`/humoristas/${h.handle}`}
                      className="mt-auto block rounded-md bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-paper transition-colors hover:bg-red-500"
                    >
                      {h.reel_title ? "Ver el video" : "Ver la ficha"}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

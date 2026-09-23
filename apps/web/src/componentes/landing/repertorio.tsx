import type { Route } from "next";
import { ButtonLink } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Antetitulo, Seccion, Titulo } from "./piezas";

/* El repertorio, en el home.

   Todo lo que hay antes en esta página es una promesa: que aquí se descubre
   talento, que hay una agencia, que el humor va a tener industria. Esta
   sección es la única que enseña personas con nombre y cara. Es la prueba, y
   va justo después de la promesa para que no haya que buscarla.

   Sale de la base, no de una lista escrita a mano: el día que se publique una
   ficha nueva, aparece aquí sola. Y si algún día no hay ninguna publicada,
   esta sección no se dibuja — una franja que dice "pronto habrá humoristas"
   ocupa el mismo sitio que cuatro caras y resta en vez de sumar.

   Las columnas se nombran una a una y nunca "*": el nombre legal y el
   contacto de contratación están restringidos por permisos de columna, y un
   asterisco haría que Postgres rechazara la consulta entera. */

export async function Repertorio() {
  const supabase = await crearClienteServidor();

  const { data: humoristas } = await supabase
    .from("talent_profiles")
    .select(
      "user_id, handle, stage_name, tagline, photo_url, photo_alt, comedy_styles",
    )
    .eq("public_visible", true)
    .order("display_order")
    .order("stage_name")
    .limit(8);

  const lista = humoristas ?? [];
  if (lista.length === 0) return null;

  return (
    <Seccion id="repertorio">
      <div className="aparece flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <Antetitulo>El repertorio</Antetitulo>
          <Titulo>
            No te lo contamos.{" "}
            <span className="block text-red-500">Te lo presentamos.</span>
          </Titulo>
          <p className="mt-6 text-lg text-pretty text-muted">
            A un humorista no lo contratas por su currículum. Lo contratas
            porque lo viste dos minutos y te reíste. Estos son algunos de los
            nuestros, cada uno con su video y su historia.
          </p>
        </div>

        <ButtonLink href={"/humoristas" as Route} variante="secundaria">
          Ver el repertorio completo
        </ButtonLink>
      </div>

      <ul className="aparece mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((h) => {
          const estilos = (h.comedy_styles ?? []) as string[];
          return (
            <li key={h.user_id}>
              <a
                href={`/humoristas/${h.handle}`}
                className="group block overflow-hidden rounded-lg border border-stage-600 bg-stage-900 transition-colors hover:border-red-500/50"
              >
                {h.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.photo_url}
                    alt={h.photo_alt ?? h.stage_name}
                    width={1080}
                    height={1350}
                    className="aspect-4/5 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                )}
                <div className="p-5">
                  <p className="font-display text-xl text-paper uppercase">
                    {h.stage_name}
                  </p>
                  {h.tagline && (
                    <p className="mt-1 text-sm text-red-300">{h.tagline}</p>
                  )}
                  {estilos.length > 0 && (
                    <p className="mt-3 text-xs text-muted-dim">
                      {estilos.join(" · ")}
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Quien llega aquí buscando contratar y quien llega queriendo entrar al
          repertorio son dos personas distintas, y las dos tienen que encontrar
          su puerta sin volver arriba. */}
      <div className="aparece mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-stage-600 pt-8">
        <p className="text-muted">
          ¿Buscas a alguien para tu evento?{" "}
          <a href="/humoristas" className="text-red-300 underline">
            Pide un presupuesto sin crear cuenta
          </a>
          .
        </p>
        <p className="text-muted">
          ¿Quieres estar aquí?{" "}
          <a href="/participa" className="text-red-300 underline">
            Sube tu video
          </a>
          .
        </p>
      </div>
    </Seccion>
  );
}

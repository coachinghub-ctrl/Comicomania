import type { Route } from "next";
import { ButtonLink } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";

/* El próximo evento, en el home.

   Sale de la base y no de una lista escrita a mano: el día que se anuncie
   otro, aparece solo. Y cuando pase la fecha, desaparece solo — que es la
   mitad del problema de un "próximos eventos" mantenido a mano: el cartel de
   la función del mes pasado sigue ahí tres meses después.

   Si no hay ninguno anunciado, esta sección no se dibuja. Una franja que dice
   "no hay eventos" ocupa el mismo espacio que uno bueno y no aporta nada. */

export async function ProximoEvento() {
  const supabase = await crearClienteServidor();

  const { data: evento } = await supabase
    .from("events")
    .select(
      "slug, name, subtitle, tagline, starts_at, poster_url, poster_alt, status, venues(name), cities(name)",
    )
    .in("status", ["ANNOUNCED", "ON_SALE", "SOLD_OUT"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!evento) return null;

  const sede = evento.venues as { name: string } | null;
  const ciudad = evento.cities as { name: string } | null;
  const cuando = new Date(evento.starts_at);
  const agotado = evento.status === "SOLD_OUT";

  // Cuánto falta, en la unidad que se entiende de un vistazo.
  const dias = Math.ceil(
    (cuando.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const cuenta =
    dias <= 0 ? "Hoy" : dias === 1 ? "Mañana" : `Faltan ${dias} días`;

  return (
    <section
      id="proximo-evento"
      aria-labelledby="proximo-evento-titulo"
      className="border-y border-stage-600 bg-stage-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:flex-row sm:items-center">
        {evento.poster_url && (
          <a
            href={`/eventos/${evento.slug}`}
            className="shrink-0 transition-transform hover:scale-[1.02]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={evento.poster_url}
              alt={evento.poster_alt ?? `Cartel de ${evento.name}`}
              width={1080}
              height={1350}
              className="w-44 rounded-lg border border-stage-600 sm:w-56"
              loading="lazy"
            />
          </a>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
            {agotado ? "Agotado" : "Próximo evento"} · {cuenta}
          </p>

          {evento.subtitle && (
            <p className="mt-3 text-sm tracking-[0.25em] text-muted uppercase">
              {evento.subtitle}
            </p>
          )}

          <h2
            id="proximo-evento-titulo"
            className="font-display mt-1 text-3xl text-paper uppercase sm:text-4xl"
          >
            {evento.name}
          </h2>

          {evento.tagline && (
            <p className="mt-3 text-lg text-red-300">{evento.tagline}</p>
          )}

          <p className="mt-4 text-muted">
            {cuando.toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {sede ? ` · ${sede.name}` : ""}
            {ciudad ? ` · ${ciudad.name}` : ""}
          </p>

          <ButtonLink
            href={`/eventos/${evento.slug}` as Route}
            tamano="lg"
            className="mt-6"
          >
            {agotado ? "Ver el evento" : "Ver entradas"}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

import { ButtonLink, CityPill, Logo } from "@comicomania/ui";
import { ciudadesDemo, pasos } from "./datos-demo";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Logo ancho={132} prioridad />
        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 text-sm text-muted md:flex"
        >
          {["Concursos", "Humoristas", "Videos", "Eventos", "Academia", "Tienda"].map(
            (item) => (
              <a
                key={item}
                href="#"
                className="transition-colors duration-150 ease-stage hover:text-paper-pure"
              >
                {item}
              </a>
            ),
          )}
        </nav>
        <ButtonLink href="#" variante="secundaria" tamano="sm">
          Crear mi ID
        </ButtonLink>
      </header>

      {/* Firma visual: el spotlight aparece una sola vez por pantalla. */}
      <section className="spotlight relative overflow-hidden border-b border-stage-600">
        <div className="mx-auto max-w-4xl px-5 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
          <p className="mb-5 text-sm tracking-[0.25em] text-gold-400 uppercase">
            La comunidad de la comedia
          </p>
          <h1 className="font-display text-5xl leading-[0.92] text-balance text-paper uppercase sm:text-7xl">
            La comedia
            <br />
            <span className="text-red-500">conecta</span> personas
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg text-pretty text-muted">
            El concurso descubre el talento. La comunidad es lo que queda
            después. Sube tu rutina, haz reír y quédate.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="#" tamano="lg" className="w-full sm:w-auto">
              Quiero participar
            </ButtonLink>
            <ButtonLink
              href="#"
              variante="secundaria"
              tamano="lg"
              className="w-full sm:w-auto"
            >
              Ver videos
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="mb-6 text-sm tracking-[0.2em] text-muted-dim uppercase">
          Ciudades
        </h2>
        <ul className="flex flex-wrap gap-3">
          {ciudadesDemo.map((ciudad) => (
            <li key={ciudad.nombre}>
              <CityPill ciudad={ciudad.nombre} estado={ciudad.estado} href="#" />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-stage-600 bg-stage-900">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display mb-10 text-3xl text-paper uppercase sm:text-4xl">
            Cómo funciona
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {pasos.map((paso) => (
              <li
                key={paso.numero}
                className="rounded-lg border border-stage-600 bg-stage-800 p-6"
              >
                <span className="font-display text-3xl text-red-500">
                  {paso.numero}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-paper-pure">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {paso.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-stage-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-sm text-muted-dim sm:flex-row sm:justify-between">
          <Logo variante="mascaras" ancho={40} />
          <p>COMICOMANÍA · La comunidad de la comedia</p>
          <a href="/design" className="hover:text-paper-pure">
            Design system
          </a>
        </div>
      </footer>
    </main>
  );
}

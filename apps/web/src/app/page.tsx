import Image from "next/image";
import { ButtonLink, CityPill, Logo } from "@comicomania/ui";
import { ciudadesDemo, pasos, principios } from "./datos-demo";

export default function Home() {
  return (
    <main className="min-h-dvh">
      {/* HERO: la foto vive detrás; el texto se apoya en la franja del
          público, que es la zona oscura de la imagen. Así el escenario
          iluminado se conserva y el titular mantiene su contraste. */}
      <section className="relative isolate flex min-h-[92svh] flex-col">
        <Image
          src="/hero/escenario.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-top"
        />
        {/* Velo medido, no estimado. El texto pequeno sobre foto necesita
            4,5:1; con el p95 de luminancia de cada franja eso exige 61% de
            velo en el menu y en la linea dorada. Se deja 68-72% con margen,
            y el 0-6% mas claro para que las luces del escenario respiren. */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(8,5,6,0.70) 6%, rgba(8,5,6,0.68) 20%, rgba(8,5,6,0.74) 34%, rgba(8,5,6,0.88) 62%, rgba(8,5,6,0.96) 84%, #000000 100%)",
            ].join(","),
          }}
          aria-hidden
        />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Logo ancho={132} prioridad />
          <nav
            aria-label="Principal"
            className="hidden items-center gap-6 text-sm text-paper md:flex"
          >
            {["Movimiento", "Concursos", "Humoristas", "Videos", "Eventos", "Academia"].map(
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
          <ButtonLink href="/entrar" variante="secundaria" tamano="sm">
            Crear mi ID
          </ButtonLink>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end px-5 pb-16 text-center sm:pb-24">
          <p className="mb-5 text-xs tracking-[0.3em] text-gold-400 uppercase sm:text-sm">
            El movimiento global del humor
          </p>
          <h1 className="font-display text-5xl leading-[0.9] text-balance text-paper uppercase sm:text-7xl lg:text-8xl">
            El humor
            <br />
            nos <span className="text-red-500">mueve</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg text-pretty text-paper">
            Humoristas, público, estudiantes, marcas y ciudades en un mismo
            lugar. El concurso es la puerta de entrada. La comunidad es lo que
            queda después.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/entrar" tamano="lg" className="w-full sm:w-auto">
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

      {/* HUMOR CON PROPÓSITO */}
      <section className="border-y border-stage-600 bg-stage-900">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
          <p className="mb-4 text-xs tracking-[0.3em] text-gold-400 uppercase">
            Lo que defendemos
          </p>
          <h2 className="font-display text-4xl leading-[0.95] text-balance text-paper uppercase sm:text-5xl">
            Humor con propósito
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted">
            Queremos rescatar el humor que hace reír sin destruir, sin humillar
            y sin depender de la ofensa. Creemos en un humor creativo,
            inteligente y auténtico, capaz de conectar generaciones.
          </p>

          <ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-stage-600 bg-stage-600 sm:grid-cols-2 [&>li:last-child]:sm:col-span-2">
            {principios.map((principio) => (
              <li
                key={principio}
                className="flex items-center gap-4 bg-stage-800 px-5 py-6"
              >
                <span className="size-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span className="text-lg text-paper-pure">{principio}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xl text-balance text-paper sm:text-2xl">
            No buscamos censurar la creatividad.{" "}
            <strong className="font-display text-gold-400 uppercase">
              Buscamos elevarla.
            </strong>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="mb-6 text-sm tracking-[0.2em] text-muted-dim uppercase">
          Dónde estamos
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
            Cómo entras
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
          <p>COMICOMANÍA · El movimiento global del humor</p>
          <a href="/design" className="hover:text-paper-pure">
            Design system
          </a>
        </div>
      </footer>
    </main>
  );
}

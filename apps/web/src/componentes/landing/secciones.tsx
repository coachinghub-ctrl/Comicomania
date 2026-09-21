import type { Route } from "next";
import Image from "next/image";
import { ButtonLink, Logo } from "@comicomania/ui";
import {
  CIERRE,
  EXPANSION,
  HERO,
  JOURNEY,
  MANIFIESTO,
  MARCAS,
  MOVIMIENTO,
  NAVEGACION,
  PERFILES,
  PROPOSITO,
  VERTICALES,
} from "@/contenido/landing";
import { ICONOS } from "./iconos";
import { Antetitulo, Marquesina, Seccion, Titulo } from "./piezas";

/* ------------------------------------------------------------------ HERO */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[94svh] flex-col">
      <Image
        src="/hero/escenario.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-top"
      />
      {/* Velo medido sobre la foto: el texto pequeño necesita 61% para
          llegar a 4,5:1 en esta imagen. Se deja 68-74% en las franjas de
          texto y solo 30% arriba, para que las luces del escenario
          sigan leyéndose. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(8,5,6,0.70) 6%, rgba(8,5,6,0.68) 20%, rgba(8,5,6,0.74) 34%, rgba(8,5,6,0.88) 62%, rgba(8,5,6,0.96) 84%, #000000 100%)",
        }}
        aria-hidden
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA, inicio">
          <Logo ancho={132} prioridad />
        </a>
        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 text-sm text-paper lg:flex"
        >
          {NAVEGACION.map((item) => (
            <a
              key={item.texto}
              href={item.href}
              className="transition-colors duration-150 ease-stage hover:text-gold-400"
            >
              {item.texto}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/entrar"
            className="hidden text-sm text-paper transition-colors hover:text-gold-400 sm:block"
          >
            Ingresar
          </a>
          <ButtonLink href="/entrar" variante="secundaria" tamano="sm">
            Crear cuenta
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end px-5 pb-10 text-center sm:pb-14">
        <Antetitulo>{HERO.eyebrow}</Antetitulo>
        <h1 className="font-display text-5xl leading-[0.88] text-balance text-paper uppercase sm:text-7xl lg:text-8xl">
          {HERO.titulo[0]}
          <br />
          nos <span className="text-red-500">mueve</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-paper sm:text-xl">
          {HERO.subtitulo}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted">
          {HERO.texto}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink
            href={HERO.ctaPrincipal.href as Route}
            tamano="lg"
            className="w-full sm:w-auto"
          >
            {HERO.ctaPrincipal.texto}
          </ButtonLink>
          <ButtonLink
            href={HERO.ctaSecundario.href as Route}
            variante="secundaria"
            tamano="lg"
            className="w-full sm:w-auto"
          >
            {HERO.ctaSecundario.texto}
          </ButtonLink>
        </div>
      </div>

      <div className="border-t border-stage-600/60 bg-stage-1000/80">
        <Marquesina verbos={HERO.verbos} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ MOVIMIENTO */
export function Movimiento() {
  return (
    <section
      id="movimiento"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-900"
    >
      {/* En móvil la foto es una banda y el texto va debajo: encima de las
          caras no hay contraste posible. En desktop pasa a fondo y el texto
          ocupa la columna izquierda, que es la zona oscura de la imagen.
          Medido: con 60% de velo el crema da 9,6:1 y el gris 5,1:1. */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/publico.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#080506_3%,rgba(8,5,6,0.30)_70%)] lg:bg-[linear-gradient(to_right,rgba(8,5,6,0.93)_0%,rgba(8,5,6,0.84)_36%,rgba(8,5,6,0.40)_60%,rgba(8,5,6,0.12)_100%)]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-32">
        <div className="aparece lg:max-w-[48%]">
          <Titulo>
            {MOVIMIENTO.titulo[0]}
            <br />
            <span className="text-red-500">{MOVIMIENTO.titulo[1]}</span>
          </Titulo>
          <div className="mt-8 space-y-5">
            {MOVIMIENTO.parrafos.map((p) => (
              <p key={p} className="text-lg text-pretty text-muted">
                {p}
              </p>
            ))}
          </div>
          <p className="font-display mt-8 text-2xl text-balance text-gold-400 uppercase sm:text-3xl">
            {MOVIMIENTO.remate}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {MOVIMIENTO.verbos.map((verbo) => (
              <li
                key={verbo}
                className="rounded-full border border-stage-600 bg-stage-800/90 px-4 py-2 text-sm text-paper-pure backdrop-blur-sm"
              >
                {verbo}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- JOURNEY */
export function Journey() {
  return (
    <Seccion>
      <Titulo className="aparece">{JOURNEY.titulo}</Titulo>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-stage-600 bg-stage-600 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNEY.pasos.map((paso, i) => {
          const Icono = ICONOS[paso.verbo];
          return (
            <li
              key={paso.verbo}
              className="aparece group bg-stage-900 p-6 transition-colors duration-200 ease-stage hover:bg-stage-800"
            >
              <div className="flex items-center justify-between">
                {Icono && (
                  <Icono className="size-8 text-red-500 transition-colors duration-200 ease-stage group-hover:text-gold-400" />
                )}
                <span className="font-display text-sm text-muted-dim tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display mt-5 text-xl text-paper uppercase">
                {paso.verbo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {paso.texto}
              </p>
            </li>
          );
        })}
      </ol>
    </Seccion>
  );
}

/* ------------------------------------------------------------- PROPÓSITO */
export function Proposito() {
  return (
    <Seccion id="proposito" fondo="elevado">
      <div className="aparece max-w-3xl">
        <Antetitulo>{PROPOSITO.eyebrow}</Antetitulo>
        <Titulo>{PROPOSITO.titulo}</Titulo>
        <p className="mt-6 text-lg text-pretty text-muted">{PROPOSITO.entrada}</p>
        <p className="mt-6 text-paper">{PROPOSITO.demostracion}</p>
      </div>

      <ul className="aparece mt-8 grid gap-px overflow-hidden rounded-lg border border-stage-600 bg-stage-600 sm:grid-cols-2 [&>li:last-child]:sm:col-span-2">
        {PROPOSITO.principios.map((principio) => (
          <li
            key={principio}
            className="flex items-center gap-4 bg-stage-800 px-5 py-6"
          >
            <span className="size-2 shrink-0 rounded-full bg-red-500" aria-hidden />
            <span className="text-lg text-paper-pure">{principio}</span>
          </li>
        ))}
      </ul>

      <p className="aparece mt-10 text-xl text-balance text-paper sm:text-2xl">
        {PROPOSITO.giro.antes}{" "}
        <strong className="font-display text-gold-400 uppercase">
          {PROPOSITO.giro.despues}
        </strong>
      </p>

      <div className="aparece mt-16 border-t border-stage-600 pt-12">
        <p className="font-display text-2xl text-balance text-paper uppercase sm:text-3xl">
          {PROPOSITO.puentes.entrada}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {PROPOSITO.puentes.verbos.map((v) => (
            <li key={v} className="text-lg text-muted">
              {v}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xl text-gold-400">{PROPOSITO.puentes.cierre}</p>
      </div>
    </Seccion>
  );
}

/* -------------------------------------------------------------- PERFILES */
export function Perfiles() {
  return (
    <Seccion id="ecosistema">
      <Titulo className="aparece">Un ecosistema para todos</Titulo>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PERFILES.map((perfil) => (
          <article
            key={perfil.id}
            className={`aparece flex flex-col rounded-lg border p-6 ${
              perfil.destacado
                ? "border-red-500/50 bg-stage-800"
                : "border-stage-600 bg-stage-900"
            }`}
          >
            <h3 className="font-display text-xl text-paper uppercase">
              {perfil.titulo}
            </h3>
            <p className="mt-2 text-sm text-gold-400">{perfil.promesa}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
              {perfil.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-500" aria-hidden>
                    →
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {perfil.remate && (
              <p className="mt-4 text-sm text-paper">{perfil.remate}</p>
            )}
            <ButtonLink
              href={perfil.cta.href as Route}
              variante={perfil.destacado ? "primaria" : "secundaria"}
              className="mt-6"
            >
              {perfil.cta.texto}
            </ButtonLink>
          </article>
        ))}
      </div>
    </Seccion>
  );
}

/* ------------------------------------------------------------ VERTICALES */
export function Verticales() {
  return (
    <>
      {VERTICALES.map((v, i) => (
        <Seccion key={v.id} id={v.id} fondo={i % 2 === 0 ? "elevado" : "base"}>
          <div className="aparece grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <Antetitulo>{v.marca}</Antetitulo>
              <Titulo>{v.titulo}</Titulo>
              <p className="mt-6 text-lg text-pretty text-muted">{v.texto}</p>
              {v.remate && (
                <p className="mt-6 text-lg text-balance text-paper">{v.remate}</p>
              )}
              <ButtonLink href={v.cta.href as Route} tamano="lg" className="mt-8">
                {v.cta.texto}
              </ButtonLink>
            </div>

            {v.id === "talent" ? (
              <ol className="flex flex-col gap-2">
                {v.pasos.map((paso, n) => (
                  <li
                    key={paso}
                    className="flex items-center gap-4 rounded-md border border-stage-600 bg-stage-800 px-5 py-4"
                  >
                    <span className="font-display text-red-500">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    <span className="text-paper-pure">{paso}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="flex flex-wrap gap-2 self-center">
                {v.pasos.map((paso) => (
                  <li
                    key={paso}
                    className="rounded-full border border-stage-600 bg-stage-800 px-4 py-2 text-sm text-paper-pure"
                  >
                    {paso}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Seccion>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- MARCAS */
export function Marcas() {
  return (
    <Seccion id="marcas" fondo="elevado">
      <div className="aparece max-w-3xl">
        <Antetitulo>{MARCAS.eyebrow}</Antetitulo>
        <Titulo>{MARCAS.titulo}</Titulo>
        <p className="mt-6 text-lg text-pretty text-muted">{MARCAS.texto}</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MARCAS.categorias.map((cat) => (
          <article
            key={cat.nombre}
            className="aparece rounded-lg border border-stage-600 bg-stage-800 p-6"
          >
            <h3 className="font-display text-lg text-gold-400 uppercase">
              {cat.nombre}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{cat.texto}</p>
          </article>
        ))}
      </div>
      <ButtonLink href={MARCAS.cta.href as Route} tamano="lg" className="mt-10">
        {MARCAS.cta.texto}
      </ButtonLink>
    </Seccion>
  );
}

/* ------------------------------------------------------------- EXPANSIÓN */
export function Expansion() {
  return (
    <Seccion id="expansion">
      <div className="aparece">
        <Titulo className="max-w-3xl">
          {EXPANSION.titulo.map((linea, i) => (
            <span key={linea}>
              {i === 2 ? <span className="text-red-500">{linea}</span> : linea}
              {i < 2 && <br />}
            </span>
          ))}
        </Titulo>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted">
          {EXPANSION.texto}
        </p>

        <ol className="mt-10 flex flex-wrap items-center gap-3">
          {EXPANSION.escalera.map((nivel, i) => (
            <li key={nivel} className="flex items-center gap-3">
              <span className="font-display rounded-md border border-gold-400/40 bg-stage-800 px-5 py-3 text-lg text-gold-400 uppercase">
                {nivel}
              </span>
              {i < EXPANSION.escalera.length - 1 && (
                <span className="text-red-500" aria-hidden>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        <ul className="mt-8 flex flex-wrap gap-2">
          {EXPANSION.desarrolla.map((item) => (
            <li
              key={item}
              className="rounded-full border border-stage-600 px-4 py-2 text-sm text-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Seccion>
  );
}

/* ------------------------------------------------------------ MANIFIESTO */
export function Manifiesto() {
  return (
    <Seccion id="manifiesto" fondo="elevado">
      <div className="aparece mx-auto max-w-3xl text-center">
        <Titulo className="text-5xl sm:text-6xl">{MANIFIESTO.titulo}</Titulo>
        <div className="mt-10 space-y-5 text-lg leading-relaxed text-pretty text-muted">
          {MANIFIESTO.creencias.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
        <p className="mt-10 text-lg text-pretty text-paper">{MANIFIESTO.cierre}</p>
        <ul className="font-display mt-12 space-y-2 text-2xl text-gold-400 uppercase sm:text-3xl">
          {MANIFIESTO.lemas.map((lema) => (
            <li key={lema}>{lema}</li>
          ))}
        </ul>
        <p className="font-display mt-10 text-3xl text-paper uppercase sm:text-4xl">
          {MANIFIESTO.firma[0]}
          <br />
          <span className="text-red-500">{MANIFIESTO.firma[1]}</span>
        </p>
      </div>
    </Seccion>
  );
}

/* ---------------------------------------------------------------- CIERRE */
export function Cierre() {
  return (
    <section className="spotlight border-t border-stage-600">
      <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
        <h2 className="font-display text-4xl leading-[0.95] text-balance text-paper uppercase sm:text-6xl">
          {CIERRE.titulo}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted">
          {CIERRE.texto}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink
            href={CIERRE.ctaPrincipal.href as Route}
            tamano="lg"
            className="w-full sm:w-auto"
          >
            {CIERRE.ctaPrincipal.texto}
          </ButtonLink>
          <ButtonLink
            href={CIERRE.ctaSecundario.href as Route}
            variante="secundaria"
            tamano="lg"
            className="w-full sm:w-auto"
          >
            {CIERRE.ctaSecundario.texto}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

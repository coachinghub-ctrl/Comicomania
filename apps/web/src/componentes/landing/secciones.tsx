import type { Route } from "next";
import Image from "next/image";
import { ButtonLink, Logo } from "@comicomania/ui";
import {
  ACADEMY,
  CIERRE,
  EXPANSION,
  HERO,
  JOURNEY,
  LIVE,
  MANIFIESTO,
  MARCAS,
  MOVIMIENTO,
  NAVEGACION,
  PERFILES,
  PROPOSITO,
  SHOP,
  TALENT,
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
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#080506,rgba(8,5,6,0))] lg:block"
          />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-32">
        <div className="aparece lg:max-w-[48%]">
          <Titulo>
            {MOVIMIENTO.titulo[0]}{" "}
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
    <section
      id="proposito"
      className="scroll-mt-20 border-t border-stage-600 bg-stage-900"
    >
      {/* La mitad izquierda de esta foto es negro casi puro (p95 0,007):
          el texto llega a 16:1 sin velo. Por eso el degradado es suave —
          80% a la izquierda y transparente a la derecha — y el foco sobre
          el banco y el micrófono se conserva entero. */}
      <div className="relative isolate overflow-hidden">
        <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
          <Image
            src="/hero/proposito.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,#080506_3%,rgba(8,5,6,0.25)_72%)] lg:bg-[linear-gradient(to_right,rgba(8,5,6,0.80)_0%,rgba(8,5,6,0.55)_40%,rgba(8,5,6,0.10)_70%,rgba(8,5,6,0)_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#080506,rgba(8,5,6,0))] lg:block"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-32">
          <div className="aparece lg:max-w-[50%]">
            <Antetitulo>{PROPOSITO.eyebrow}</Antetitulo>
            <Titulo>{PROPOSITO.titulo}</Titulo>
            <p className="mt-6 text-lg text-pretty text-muted">
              {PROPOSITO.entrada}
            </p>
            <p className="mt-6 text-paper">{PROPOSITO.demostracion}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <ul className="aparece grid gap-px overflow-hidden rounded-lg border border-stage-600 bg-stage-600 sm:grid-cols-2 [&>li:last-child]:sm:col-span-2">
          {PROPOSITO.principios.map((principio) => (
            <li
              key={principio}
              className="flex items-center gap-4 bg-stage-800 px-5 py-6"
            >
              <span
                className="size-2 shrink-0 rounded-full bg-red-500"
                aria-hidden
              />
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

      </div>

      {/* "Puede unir. Puede sanar..." sobre la foto de las generaciones
          conectadas por una misma línea: la imagen dice lo mismo que el
          texto. El 40% izquierdo es negro puro (p95 0,0013), así que aquí
          no hace falta velo — crema 18:1, oro 14:1 tal cual. */}
      <div className="relative isolate overflow-hidden border-t border-stage-600">
        <div className="relative aspect-[16/9] w-full sm:aspect-[5/2] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
          <Image
            src="/hero/generaciones.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,#080506_2%,rgba(8,5,6,0.20)_70%)] lg:bg-[linear-gradient(to_right,rgba(8,5,6,0.75)_0%,rgba(8,5,6,0.45)_38%,rgba(8,5,6,0)_66%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#080506,rgba(8,5,6,0))] lg:block"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-14 sm:py-20 lg:py-28">
          <div className="aparece lg:max-w-[46%]">
            <p className="font-display text-2xl text-balance text-paper uppercase sm:text-3xl">
              {PROPOSITO.puentes.entrada}
            </p>
            <ul className="mt-6 space-y-1.5">
              {PROPOSITO.puentes.verbos.map((v) => (
                <li key={v} className="flex items-center gap-3 text-lg text-muted">
                  <span className="h-px w-5 shrink-0 bg-gold-400/60" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-7 text-xl text-gold-400">{PROPOSITO.puentes.cierre}</p>
          </div>
        </div>
      </div>
    </section>
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

/* ---------------------------------------------------------------- TALENT */
export function Talent() {
  return (
    <section
      id="talent"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      {/* El 45% izquierdo de esta foto da 11,7:1 al crema sin velo alguno;
          el 45% que se le pone lo lleva a 14:1 y deja el escenario entero. */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/talent.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.30)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.70)_38%,rgba(0,0,0,0.25)_66%,rgba(0,0,0,0.10)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="aparece lg:max-w-[52%]">
          <div className="mb-5 flex items-center gap-4">
            <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {TALENT.marca}
            </span>
            <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
          </div>

          <h2 className="font-display text-4xl leading-[0.92] text-balance text-paper uppercase sm:text-5xl lg:text-6xl">
            {TALENT.titulo[0]}{" "}
            <br />
            <span className="text-red-500">{TALENT.titulo[1]}</span>{" "}
            {TALENT.titulo[2]}
          </h2>

          <p className="mt-7 text-lg text-pretty text-paper">{TALENT.entrada}</p>
          <p className="mt-4 max-w-xl text-pretty text-muted">{TALENT.texto}</p>
          <p className="font-display mt-7 text-xl text-gold-400 uppercase sm:text-2xl">
            {TALENT.remate}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href={TALENT.ctaPrincipal.href as Route}
              tamano="lg"
              className="group w-full sm:w-auto"
            >
              {TALENT.ctaPrincipal.texto}
              <span
                className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </ButtonLink>
            <ButtonLink
              href={TALENT.ctaSecundario.href as Route}
              variante="secundaria"
              tamano="lg"
              className="w-full sm:w-auto"
            >
              {TALENT.ctaSecundario.texto}
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Tira del recorrido. En móvil se desliza en horizontal: seis pasos
          apilados serían media pantalla de scroll muerto. */}
      <div className="relative z-10 border-t border-stage-600 bg-stage-1000/95 backdrop-blur-sm">
        <ol className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-0 sin-barra overflow-x-auto px-5 py-6 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {TALENT.pasos.map((paso, i) => {
            const Icono = ICONOS[paso.icono];
            return (
              <li
                key={paso.verbo}
                className="flex min-w-[15rem] shrink-0 snap-start items-start gap-3 pr-6 lg:min-w-0 lg:pr-3"
              >
                <span className="font-display text-lg text-red-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {Icono && <Icono className="size-5 shrink-0 text-paper" />}
                    <h3 className="font-display text-sm text-paper uppercase">
                      {paso.verbo}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {paso.texto}
                  </p>
                </div>
                {i < TALENT.pasos.length - 1 && (
                  <span
                    className="hidden self-center text-stage-600 lg:block"
                    aria-hidden
                  >
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- ACADEMY */
export function Academy() {
  return (
    <section
      id="academy"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      {/* Columna izquierda de la foto: p95 0,031. El crema llega a 11,4:1
          sin velo; con el 45% que lleva queda en 13,7:1 y el aula se ve. */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/academy.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.32)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.90)_0%,rgba(0,0,0,0.72)_36%,rgba(0,0,0,0.22)_62%,rgba(0,0,0,0.08)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="aparece lg:max-w-[52%]">
          <div className="mb-5 flex items-center gap-4">
            <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {ACADEMY.marca}
            </span>
            <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
          </div>

          <h2 className="font-display text-3xl leading-[0.95] text-balance text-paper uppercase sm:text-4xl lg:text-5xl">
            {ACADEMY.titulo[0]}{" "}
            <br />
            <span className="text-red-500">{ACADEMY.titulo[1]}</span>
          </h2>

          <p className="mt-7 text-lg text-pretty text-paper">{ACADEMY.entrada}</p>
          <p className="mt-4 max-w-xl text-pretty text-muted">{ACADEMY.texto}</p>

          <ButtonLink
            href={ACADEMY.cta.href as Route}
            tamano="lg"
            className="group mt-9"
          >
            {ACADEMY.cta.texto}
            <span
              className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </ButtonLink>
        </div>
      </div>

      {/* Los cuatro pilares y el recorrido, sobre fondo sólido: catorce
          líneas de texto sobre una foto no se leen. */}
      <div className="relative z-10 border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {ACADEMY.pilares.map((pilar, i) => {
              const Icono = ICONOS[pilar.icono];
              return (
                <li
                  key={pilar.verbo}
                  className="aparece lg:border-l lg:border-stage-600 lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-3xl text-red-500 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {Icono && <Icono className="size-9 text-paper sm:size-10" />}
                    <h3 className="font-display text-lg text-paper uppercase">
                      {pilar.verbo}
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {pilar.temas.map((tema) => (
                      <li
                        key={tema}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500"
                          aria-hidden
                        />
                        {tema}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>

          <ol className="mt-12 flex flex-col items-center gap-3 border-t border-stage-600 pt-8 sm:flex-row sm:justify-center sm:gap-6">
            {ACADEMY.recorrido.map((etapa, i) => (
              <li key={etapa} className="flex items-center gap-3 sm:gap-6">
                <span
                  className={`font-display text-sm tracking-wide uppercase sm:text-base ${
                    i === 1 ? "text-red-500" : "text-paper"
                  }`}
                >
                  {etapa}
                </span>
                {i < ACADEMY.recorrido.length - 1 && (
                  <span className="text-stage-600" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ SHOP */
export function Shop() {
  return (
    <section
      id="shop"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      {/* Esta foto es la más brillante de todas por la izquierda (p95 0,128,
          con el espejo de bombillas en 0,256) y además lleva lettering en
          las camisetas. El 82% de velo lo apaga y deja el crema en 12:1;
          el neón y la pareja de la derecha se conservan. */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/shop.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.42)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.82)_34%,rgba(0,0,0,0.30)_62%,rgba(0,0,0,0.05)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="aparece lg:max-w-[50%]">
          <div className="mb-5 flex items-center gap-4">
            <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {SHOP.marca}
            </span>
            <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
          </div>

          <h2 className="font-display text-4xl leading-[0.92] text-balance text-paper uppercase sm:text-5xl">
            {SHOP.titulo[0]}{" "}
            <br />
            <span className="text-red-500">{SHOP.titulo[1]}</span>
          </h2>

          <p className="mt-7 text-lg text-pretty text-paper">{SHOP.entrada}</p>
          <p className="mt-4 max-w-xl text-pretty text-muted">
            {SHOP.texto}{" "}
            <strong className="font-semibold text-paper-pure">{SHOP.remate}</strong>
          </p>

          <ButtonLink href={SHOP.cta.href as Route} tamano="lg" className="group mt-9">
            {SHOP.cta.texto}
            <span
              className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </ButtonLink>

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {SHOP.garantias.map((g) => {
              const Icono = ICONOS[g.icono];
              return (
                <li key={g.texto} className="flex items-center gap-2.5 text-sm text-muted">
                  {Icono && <Icono className="size-5 shrink-0 text-paper" />}
                  {g.texto}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="relative z-10 border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
            {SHOP.familias.map((familia, i) => {
              const Icono = ICONOS[familia.icono];
              return (
                <li
                  key={familia.nombre}
                  className="aparece sm:border-l sm:border-stage-600 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-3xl text-red-500 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {Icono && <Icono className="size-9 text-paper sm:size-10" />}
                    <h3 className="font-display text-base text-paper uppercase">
                      {familia.nombre}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-paper-pure">{familia.texto}</p>
                  <p className="mt-2 text-sm text-muted">
                    {familia.items.join(" · ")}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="aparece border-t border-stage-600 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <p className="font-display text-xl text-paper uppercase sm:text-2xl">
              {SHOP.firma.lemas.map((lema) => (
                <span key={lema} className="block">
                  {lema}
                </span>
              ))}
            </p>
            <p className="font-display mt-3 inline-block border-b-2 border-red-500 pb-1 text-xl text-red-500 uppercase sm:text-2xl">
              {SHOP.firma.cierre}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ LIVE */
export function Live() {
  return (
    <section
      id="live"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/live.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.40)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.80)_36%,rgba(0,0,0,0.28)_62%,rgba(0,0,0,0.05)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="aparece lg:max-w-[52%]">
            <div className="mb-5 flex items-center gap-4">
              <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
                {LIVE.marca}
              </span>
              <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
            </div>

            <h2 className="font-display text-4xl leading-[0.92] text-balance text-paper uppercase sm:text-5xl">
              {LIVE.titulo[0]}{" "}
              <br />
              <span className="text-red-500">{LIVE.titulo[1]}</span>
            </h2>

            <p className="mt-7 text-lg text-pretty text-paper">{LIVE.entrada}</p>
            <p className="mt-4 max-w-xl text-pretty text-muted">{LIVE.texto}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={LIVE.ctaPrincipal.href as Route}
                tamano="lg"
                className="group w-full sm:w-auto"
              >
                {LIVE.ctaPrincipal.texto}
                <span
                  className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </ButtonLink>
              <ButtonLink
                href={LIVE.ctaSecundario.href as Route}
                variante="secundaria"
                tamano="lg"
                className="w-full border-red-500/50 sm:w-auto"
              >
                {LIVE.ctaSecundario.texto}
              </ButtonLink>
            </div>
          </div>

          {/* Aviso del próximo evento. Sin fecha inventada y sin venta:
              todavía no hay entradas, así que invita a avisar. */}
          <aside className="aparece w-full max-w-xs rounded-lg border border-red-500/50 bg-stage-1000/85 p-5 backdrop-blur-sm">
            <p className="text-[0.7rem] tracking-[0.2em] text-muted uppercase">
              {LIVE.aviso.etiqueta}
            </p>
            <p className="font-display mt-2 text-2xl text-paper uppercase">
              {LIVE.aviso.ciudad}
              <span className="ml-2 text-red-500">· {LIVE.aviso.estado}</span>
            </p>
            <ButtonLink
              href={LIVE.aviso.cta.href as Route}
              tamano="sm"
              className="mt-4 w-full"
            >
              {LIVE.aviso.cta.texto}
            </ButtonLink>
          </aside>
        </div>
      </div>

      <div className="relative z-10 border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {LIVE.familias.map((familia, i) => {
              const Icono = ICONOS[familia.icono];
              return (
                <li
                  key={familia.nombre}
                  className="aparece lg:border-l lg:border-stage-600 lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-3xl text-red-500 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {Icono && <Icono className="size-9 text-paper sm:size-10" />}
                  </div>
                  <h3 className="font-display mt-3 text-base text-paper uppercase">
                    {familia.nombre}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {familia.texto}
                  </p>
                </li>
              );
            })}
          </ol>

          <p className="font-display mt-12 border-t border-stage-600 pt-8 text-center text-sm tracking-[0.2em] uppercase sm:text-base">
            <span className="text-paper">{LIVE.firma.antes}</span>{" "}
            <span className="text-red-500">{LIVE.firma.despues}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- MARCAS */
export function Marcas() {
  return (
    <section
      id="marcas"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      {/* p95 0,100 en la columna izquierda: hace falta 82% de velo para que
          el gris de los párrafos pase de 7:1. Es una foto muy iluminada. */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/marcas.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.42)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.82)_36%,rgba(0,0,0,0.30)_62%,rgba(0,0,0,0.06)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="aparece lg:max-w-[52%]">
          <div className="mb-5 flex items-center gap-4">
            <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {MARCAS.eyebrow}
            </span>
            <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
          </div>

          <h2 className="font-display text-4xl leading-[0.92] text-balance text-paper uppercase sm:text-5xl">
            {MARCAS.titulo[0]}{" "}
            <br />
            <span className="text-red-500">{MARCAS.titulo[1]}</span>
          </h2>

          <p className="mt-7 max-w-xl text-lg text-pretty text-muted">
            {MARCAS.texto}
          </p>

          {/* La fórmula: tres piezas que solo funcionan juntas. */}
          <ul className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            {MARCAS.formula.map((pieza, i) => (
              <li key={pieza} className="flex items-center gap-3">
                <span className="font-display text-sm tracking-wide text-paper uppercase">
                  {pieza}
                </span>
                {i < MARCAS.formula.length - 1 && (
                  <span className="text-red-500" aria-hidden>
                    +
                  </span>
                )}
              </li>
            ))}
          </ul>

          <ButtonLink href={MARCAS.cta.href as Route} tamano="lg" className="group mt-9">
            {MARCAS.cta.texto}
            <span
              className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </ButtonLink>
        </div>
      </div>

      <div className="relative z-10 border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {MARCAS.bloques.map((bloque, i) => {
              const Icono = ICONOS[bloque.icono];
              return (
                <li
                  key={bloque.nombre}
                  className="aparece lg:border-l lg:border-stage-600 lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-3xl text-red-500 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {Icono && <Icono className="size-9 text-paper sm:size-10" />}
                  </div>
                  <h3 className="font-display mt-3 text-base text-paper uppercase">
                    {bloque.nombre}
                  </h3>
                  <p className="mt-3 border-l-2 border-red-500 pl-3 text-sm text-paper-pure">
                    {bloque.items.join(" · ")}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {bloque.texto}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* La cadena: una idea que entra por seis puertas distintas.
              Una sola fila, siempre. En pantallas chicas se desliza en
              horizontal antes que partirse en tres renglones. */}
          <div className="mt-12 border-t border-stage-600 pt-10">
            <ol className="-mx-5 flex items-start gap-3 sin-barra overflow-x-auto px-5 pb-2 sm:mx-0 sm:justify-center sm:gap-5 sm:px-0 lg:gap-8">
              {MARCAS.cadena.puntos.map((punto, i) => {
                const Icono = ICONOS[punto.icono];
                return (
                  <li
                    key={punto.nombre}
                    className="flex shrink-0 items-center gap-3 sm:gap-5 lg:gap-8"
                  >
                    <span className="flex w-20 flex-col items-center gap-2.5 sm:w-24">
                      {Icono && <Icono className="size-9 text-paper sm:size-10" />}
                      <span className="text-center text-[0.65rem] tracking-[0.18em] text-muted uppercase sm:text-xs">
                        {punto.nombre}
                      </span>
                    </span>
                    {i < MARCAS.cadena.puntos.length - 1 && (
                      <span className="mt-4 text-stage-600" aria-hidden>
                        →
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <p className="font-display text-base tracking-wide text-balance text-paper uppercase sm:text-lg">
                {MARCAS.cadena.titulo}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:shrink-0">
                <p className="max-w-sm text-sm text-pretty">
                  <span className="font-display text-paper uppercase">
                    {MARCAS.cadena.remate.antes}
                  </span>{" "}
                  <span className="font-display text-red-500 uppercase">
                    {MARCAS.cadena.remate.despues}
                  </span>
                </p>
                <ButtonLink
                  href={MARCAS.cadena.cta.href as Route}
                  className="group shrink-0"
                >
                  {MARCAS.cadena.cta.texto}
                  <span
                    className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
                    aria-hidden
                  >
                    →
                  </span>
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- EXPANSIÓN */
export function Expansion() {
  return (
    <section
      id="expansion"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-1000"
    >
      {/* El mapa trae tarjetas de ciudades con su propio texto. El 88% de
          velo a la izquierda las apaga y deja el crema en 14,5:1; el mapa
          encendido y las tarjetas se conservan de la mitad a la derecha. */}
      <div className="relative aspect-[16/11] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/hero/global.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,#000000_3%,rgba(0,0,0,0.45)_72%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.88)_36%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.05)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-40 bg-[linear-gradient(to_top,#000000,rgba(0,0,0,0))] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-28">
        <div className="aparece lg:max-w-[54%]">
          <div className="mb-5 flex items-center gap-4">
            <span className="text-xs tracking-[0.3em] text-gold-400 uppercase">
              {EXPANSION.eyebrow}
            </span>
            <span className="h-px flex-1 bg-gold-400/40 sm:max-w-24" aria-hidden />
          </div>

          <h2 className="font-display text-4xl leading-[0.92] text-balance text-paper uppercase sm:text-5xl">
            {EXPANSION.titulo[0]}{" "}
            <br />
            {EXPANSION.titulo[1]}{" "}
            <br />
            <span className="text-red-500">{EXPANSION.titulo[2]}</span>
          </h2>

          <p className="mt-7 text-lg text-pretty text-paper">{EXPANSION.entrada}</p>
          <p className="mt-3 max-w-xl text-pretty text-muted">{EXPANSION.texto}</p>

          {/* La escalera territorial. Cada peldaño dice qué pasa en él. */}
          <ol className="-mx-5 mt-10 flex items-start gap-3 sin-barra overflow-x-auto px-5 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
            {EXPANSION.escalera.map((peldano, i) => {
              const Icono = ICONOS[peldano.icono];
              return (
                <li key={peldano.nivel} className="flex shrink-0 items-start gap-3 sm:gap-5">
                  <span className="flex w-28 flex-col items-center gap-3 text-center">
                    <span className="flex size-16 items-center justify-center rounded-full border border-gold-400/40">
                      {Icono && <Icono className="size-8 text-gold-400" />}
                    </span>
                    <span className="font-display text-sm tracking-wide text-gold-400 uppercase">
                      {peldano.nivel}
                    </span>
                    <span className="text-xs leading-relaxed text-muted">
                      {peldano.texto}
                    </span>
                  </span>
                  {i < EXPANSION.escalera.length - 1 && (
                    <span className="mt-7 text-red-500" aria-hidden>
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <ul className="mt-10 flex flex-wrap gap-2">
            {EXPANSION.desarrolla.map((item) => (
              <li
                key={item}
                className="rounded-full border border-stage-600 bg-stage-800/80 px-4 py-2 text-sm text-muted backdrop-blur-sm"
              >
                {item}
              </li>
            ))}
          </ul>

          <ButtonLink href={EXPANSION.cta.href as Route} tamano="lg" className="group mt-9">
            {EXPANSION.cta.texto}
            <span
              className="transition-transform duration-200 ease-stage group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </ButtonLink>
        </div>
      </div>

      <div className="relative z-10 border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p className="font-display text-lg text-balance uppercase sm:text-xl">
            <span className="text-paper">{EXPANSION.firma.antes}</span>{" "}
            <span className="text-red-500">{EXPANSION.firma.despues}</span>
          </p>
          <p className="font-display text-sm tracking-wide text-muted uppercase lg:shrink-0">
            {EXPANSION.coda.join(" ")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ MANIFIESTO */
export function Manifiesto() {
  return (
    <section
      id="manifiesto"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-stage-600 bg-stage-900"
    >
      {/* Aquí el texto va centrado, así que el velo tiene que ser parejo y no
          lateral. El centro de la foto ya es oscuro (p95 0,033) pero las luces
          de la esquina superior llegan a 0,371: un velo uniforme del 78% más
          un oscurecimiento radial del 45% en el medio. En el centro, donde
          está el texto, eso deja el crema en 16:1; en la zona más brillante,
          en 6,8:1. Un velo más fuerte hacía desaparecer la foto. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero/manifiesto.webp"
          alt=""
          fill
          sizes="100vw"
          /* La foto es vertical y esta sección es muy alta: con recorte
             centrado solo se veía la franja oscura del público. Anclada a
             la izquierda se conserva al humorista y las luces del teatro. */
          className="object-cover object-left"
        />
        <div aria-hidden className="absolute inset-0 bg-black/78" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_50%,rgba(0,0,0,0.45),rgba(0,0,0,0)_78%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(to_bottom,#080506,rgba(8,5,6,0))]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,#080506,rgba(8,5,6,0))]"
        />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <div className="aparece mx-auto max-w-3xl text-center">
          <Titulo className="text-5xl sm:text-6xl">{MANIFIESTO.titulo}</Titulo>
          {/* Crema y no gris: sobre esta foto el gris cae a 3,7:1 en la zona
              de las luces. En crema no baja de 7:1 en ningún punto, y un
              manifiesto se lee mejor en primer plano. */}
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-pretty text-paper">
            {MANIFIESTO.creencias.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
          <p className="mt-10 text-lg text-pretty text-paper-pure">
            {MANIFIESTO.cierre}
          </p>
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
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- CIERRE */
export function Cierre() {
  return (
    <section className="relative isolate overflow-hidden border-t border-stage-600">
      {/* Texto centrado otra vez, así que velo parejo y no lateral. El centro
          de la foto es oscuro (p95 0,038) pero las luces de la izquierda
          llegan a 0,482: 72% uniforme más 35% radial en el medio deja el
          crema en 15:1 donde está el texto. El gradiente spotlight se quita:
          con la foto detrás sobraba. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero/cierre.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-black/72" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_65%_60%_at_50%_50%,rgba(0,0,0,0.35),rgba(0,0,0,0)_78%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,#000000,rgba(0,0,0,0))]"
        />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
        <h2 className="font-display text-4xl leading-[0.95] text-balance text-paper uppercase sm:text-6xl">
          {CIERRE.titulo}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-paper">
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

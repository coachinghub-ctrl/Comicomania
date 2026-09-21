import { Logo } from "@comicomania/ui";
import {
  Academy,
  Cierre,
  Expansion,
  Hero,
  Journey,
  Live,
  Manifiesto,
  Marcas,
  Movimiento,
  Perfiles,
  Proposito,
  Shop,
  Talent,
} from "@/componentes/landing/secciones";
import { Numeros } from "@/componentes/landing/numeros";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Movimiento />
        <Journey />
        <Proposito />
        <Perfiles />
        <Talent />
        <Academy />
        <Live />
        <Shop />
        <Marcas />
        <Expansion />
        <Numeros />
        <Manifiesto />
        <Cierre />
      </main>

      <footer className="border-t border-stage-600 bg-stage-1000">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <Logo ancho={120} />
            <p className="font-display text-sm tracking-wide text-paper uppercase">
              El humor nos mueve
            </p>
            <a href="/design" className="text-sm text-muted-dim hover:text-paper-pure">
              Design system
            </a>
          </div>
          <p className="mt-8 border-t border-stage-600 pt-6 text-center text-xs text-muted-dim">
            COMICOMANÍA™ · Powered by COMICOMANIA DIGITAL ENGINE™
          </p>
        </div>
      </footer>
    </>
  );
}

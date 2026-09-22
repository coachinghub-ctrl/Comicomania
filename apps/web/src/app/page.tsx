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
import { ProximoEvento } from "@/componentes/landing/proximo-evento";

/* El home lee el próximo evento de la base, así que no puede ser una página
   completamente estática. Se revalida cada cinco minutos: lo bastante fresco
   para que un evento nuevo aparezca casi al instante, y lo bastante cacheado
   para que la portada no consulte la base en cada visita. */
export const revalidate = 300;

export default async function Home() {
  return (
    <>
      <main>
        <Hero />
        {/* Justo después del Hero: es lo más concreto y lo que caduca. */}
        <ProximoEvento />
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
          {/* Dos líneas y no una: el motor es la marca técnica del producto
              y Coaching Hub es quién lo construye. Meterlas en el mismo
              renglón con dos "powered by" se lee mal. */}
          <div className="mt-8 space-y-1.5 border-t border-stage-600 pt-6 text-center text-xs text-muted-dim">
            <p>COMICOMANÍA™ · COMICOMANIA DIGITAL ENGINE™</p>
            <p>Powered by Coaching Hub Business Solutions</p>
          </div>
        </div>
      </footer>
    </>
  );
}

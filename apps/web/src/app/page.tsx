import { Logo } from "@comicomania/ui";
import {
  Academy,
  Cierre,
  Ecosistema,
  Expansion,
  Fundador,
  Hero,
  Journey,
  Limpio,
  Live,
  Manifiesto,
  Marcas,
  Movimiento,
  Perfiles,
  Premio,
  Proposito,
  Shop,
  Talent,
  Tesis,
} from "@/componentes/landing/secciones";
import { Numeros } from "@/componentes/landing/numeros";
import { ProximoEvento } from "@/componentes/landing/proximo-evento";
import { Repertorio } from "@/componentes/landing/repertorio";

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

        {/* El argumento antes que el ambiente. Quien llega no sabe todavía
            por qué debería importarle otro sitio de humor, y la respuesta —
            que este arte no tiene premio ni industria— es lo único que hace
            que el resto de la página signifique algo. */}
        <Tesis />

        {/* Y justo después, quién lo dice. Una web que solo afirma valores
            pide que le crean; una que cuenta lo que su fundador ya hizo dos
            veces, no. */}
        <Fundador />

        <Movimiento />
        <Journey />
        <Proposito />

        {/* La decisión editorial, con sus razones comerciales. Va aquí y no
            escondida en el manifiesto: es lo que más entusiasma cuando se
            cuenta el proyecto en persona. */}
        <Limpio />

        <Perfiles />
        <Ecosistema />
        <Talent />

        {/* La prueba, justo después de la promesa. Todo lo anterior afirma que
            aquí se descubre talento; esto enseña personas con nombre y cara.
            Sale de la base, así que crece solo. */}
        <Repertorio />

        <Academy />
        <Premio />
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

import { Button, Logo } from "@comicomania/ui";

export const metadata = { title: "Design system" };

/* Referencia interna del design system. Los contrastes están medidos, no
   estimados: ver docs/11-design-system-wireframes.md */
const colores = [
  { token: "stage-1000", hex: "#000000", nota: "Telón: fondo de página" },
  { token: "stage-900", hex: "#080506", nota: "Superficie base" },
  { token: "stage-800", hex: "#12090A", nota: "Tarjetas" },
  { token: "stage-700", hex: "#1E1112", nota: "Tarjetas elevadas, filas alternas" },
  { token: "stage-600", hex: "#2E1A1B", nota: "Bordes" },
  { token: "red-700", hex: "#620700", nota: "Sombra del pliegue" },
  { token: "red-600", hex: "#B00501", nota: "RELLENO de botones — crema 6,40:1" },
  { token: "red-500", hex: "#EB1701", nota: "Acentos, bordes, iconos — 4,5:1" },
  { token: "red-400", hex: "#FF4B33", nota: "Hover y foco — 6,1:1" },
  { token: "red-300", hex: "#FF6E5A", nota: "Texto rojo sobre negro — 7,4:1" },
  { token: "paper", hex: "#F3F1D4", nota: "Blanco de marca — 17,7:1" },
  { token: "paper-pure", hex: "#FFFFFF", nota: "Texto largo y datos — 20,3:1" },
  { token: "muted", hex: "#B9AFA6", nota: "Texto secundario — 9,4:1" },
  { token: "muted-dim", hex: "#8A8078", nota: "Metadatos — 5,3:1" },
  { token: "gold-400", hex: "#FFD502", nota: "Premio y ganador — negro 14,3:1" },
  { token: "gold-500", hex: "#FFAD03", nota: "Oro medio — 10,9:1" },
  { token: "tear-400", hex: "#04C5E4", nota: "Azul lágrima — 9,8:1" },
  { token: "tear-500", hex: "#00ACD1", nota: "Informativo — 7,6:1" },
];

export default function DesignSystem() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <header className="mb-12 flex items-center gap-5">
        <Logo ancho={120} prioridad />
        <div>
          <h1 className="font-display text-3xl text-paper uppercase">
            Design system
          </h1>
          <p className="text-sm text-muted">
            COMICOMANIA STAGE · tokens muestreados del logo
          </p>
        </div>
      </header>

      <section className="mb-14">
        <h2 className="mb-5 text-sm tracking-[0.2em] text-muted-dim uppercase">
          Color
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {colores.map((color) => (
            <li
              key={color.token}
              className="flex items-center gap-4 rounded-lg border border-stage-600 bg-stage-900 p-3"
            >
              <span
                className="size-12 shrink-0 rounded-md border border-stage-600"
                style={{ background: color.hex }}
                aria-hidden
              />
              <span className="min-w-0">
                <code className="text-sm text-paper-pure">{color.token}</code>
                <span className="ml-2 text-xs text-muted-dim">{color.hex}</span>
                <span className="block truncate text-xs text-muted">
                  {color.nota}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="mb-5 text-sm tracking-[0.2em] text-muted-dim uppercase">
          Botones
        </h2>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stage-600 bg-stage-900 p-6">
          <Button variante="primaria">Quiero participar</Button>
          <Button variante="secundaria">Ver videos</Button>
          <Button variante="fantasma">Cancelar</Button>
          <Button variante="premio">Ganador de la ronda</Button>
          <Button variante="primaria" disabled>
            Votación cerrada
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">
          El relleno rojo usa <code className="text-paper-pure">red-600</code> y
          no <code className="text-paper-pure">red-500</code>: sobre el rojo vivo
          el crema da 3,94:1 y reprueba AA. El botón de premio usa oro con texto
          negro, que a 14,3:1 es la combinación más legible de la paleta.
        </p>
      </section>

      <section>
        <h2 className="mb-5 text-sm tracking-[0.2em] text-muted-dim uppercase">
          Logo
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Completo", nodo: <Logo ancho={200} /> },
            {
              etiqueta: "Máscaras (iconos ≥48 px)",
              nodo: <Logo variante="mascaras" ancho={96} />,
            },
            { etiqueta: "Una máscara (<48 px)", nodo: <Logo mini ancho={48} /> },
          ].map((caso) => (
            <div
              key={caso.etiqueta}
              className="flex flex-col items-center gap-4 rounded-lg border border-stage-600 bg-stage-1000 p-6"
            >
              {caso.nodo}
              <span className="text-center text-xs text-muted">
                {caso.etiqueta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import { entrarConProveedor } from "./acciones";
import { PROVEEDORES, type Proveedor } from "./catalogo";

/* Entrar con Google, Apple o Microsoft.

   Son formularios y no botones con JavaScript a propósito: funcionan aunque
   el script no haya cargado todavía, que es justo el momento en que alguien
   con mala conexión pulsa.

   Las marcas van dibujadas a mano y en un solo color. Cada proveedor tiene
   sus normas de uso de logo —Google exige su "G" a cuatro colores con
   proporciones concretas, Apple exige la manzana oficial— y cumplirlas de
   memoria es como se acaba infringiendo una marca sin querer. Esto se ve
   limpio y no finge ser el logo de nadie; antes de abrir al público hay que
   sustituirlo por los botones oficiales de cada uno. */

const MARCAS: Record<Proveedor, { letra: string; clase: string }> = {
  google: { letra: "G", clase: "text-paper-pure" },
  apple: { letra: "", clase: "text-paper-pure" },
  azure: { letra: "", clase: "text-paper-pure" },
};

function Marca({ proveedor }: { proveedor: Proveedor }) {
  if (proveedor === "apple") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current">
        <path d="M11.2 8.5c0-1.4 1.1-2.1 1.2-2.1-.6-1-1.7-1.1-2-1.1-.8-.1-1.7.5-2.1.5s-1.1-.5-1.8-.4c-.9 0-1.8.5-2.3 1.4-1 1.7-.3 4.3.7 5.7.5.7 1 1.5 1.8 1.4.7 0 1-.5 1.9-.5s1.1.5 1.9.4c.8 0 1.3-.7 1.7-1.4.6-.8.8-1.6.8-1.6s-1.6-.6-1.8-2.3zM9.9 4.1c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.7.9-.4.5-.7 1.2-.6 1.9.7 0 1.4-.4 1.7-.9z" />
      </svg>
    );
  }
  if (proveedor === "azure") {
    // Los cuatro cuadros de Microsoft, en un solo color.
    return (
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current">
        <rect x="1" y="1" width="6" height="6" />
        <rect x="9" y="1" width="6" height="6" />
        <rect x="1" y="9" width="6" height="6" />
        <rect x="9" y="9" width="6" height="6" />
      </svg>
    );
  }
  return (
    <span aria-hidden className="font-display text-base leading-none">
      {MARCAS.google.letra}
    </span>
  );
}

export function Proveedores({
  volver,
  activos,
}: {
  volver: string;
  activos: Proveedor[];
}) {
  /* Ninguno conectado todavía: no se enseña la separación ni los botones. Una
     sección "o entra con" vacía solo hace preguntarse qué falta. */
  if (activos.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-stage-600" />
        <span className="text-xs tracking-wider text-muted-dim uppercase">
          o entra con
        </span>
        <span className="h-px flex-1 bg-stage-600" />
      </div>

      <div className="mt-4 space-y-2">
        {activos.map((p) => (
          <form key={p} action={entrarConProveedor}>
            <input type="hidden" name="proveedor" value={p} />
            <input type="hidden" name="volver" value={volver} />
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-stage-600 bg-stage-900 text-sm font-medium text-paper-pure transition-colors hover:border-stage-600 hover:bg-stage-800"
            >
              <Marca proveedor={p} />
              Continuar con {PROVEEDORES[p]}
            </button>
          </form>
        ))}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-dim">
        Solo pedimos tu nombre y tu correo. Nada de contactos, calendario ni
        archivos.
      </p>
    </div>
  );
}

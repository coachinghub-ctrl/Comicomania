import { notFound } from "next/navigation";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { puede } from "@comicomania/authz";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NuevoProducto, PublicarProducto } from "./formulario";

export const metadata = { title: "Tienda" };

export default async function Tienda() {
  if (!(await puedeActor({ seccion: "STORE", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();
  const puedeCrear = puede(actor, { seccion: "PRODUCTS", accion: "CREATE" }).permitido;
  const puedePublicar = puede(actor, { seccion: "PRODUCTS", accion: "PUBLISH" }).permitido;

  const [{ data: productos, error }, { data: inventario }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, type, status, requires_shipping, product_variants(id, sku, price, currency, status)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("inventory")
      .select("id, on_hand, reserved, available, low_stock_threshold, product_variants(sku), inventory_locations(name)")
      .order("available"),
  ]);

  /* `available` es una columna generada, así que los tipos la dan como
     nullable aunque nunca lo sea. Se resuelve acá y no con un "!" para que, si
     algún día deja de serlo, no se cuele un NaN en un umbral de stock. */
  const bajoMinimo = (inventario ?? []).filter(
    (i) => (i.available ?? 0) <= i.low_stock_threshold,
  );

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Comercio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Tienda</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Catálogo, variantes e inventario por ubicación.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          El <strong>disponible</strong> no se calcula en ningún sitio: es una
          columna generada por la base, existencias menos reservado. Si se
          calculara a mano, en el minuto pico de un lanzamiento se vendería de
          más.
        </p>
        <p className="mt-2 text-ink-soft">
          Las reservas <strong>vencen a los 15 minutos</strong>. Sin eso, un
          carrito abandonado retiene entradas para siempre y el aforo se agota
          sin haber vendido nada.
        </p>
      </div>

      {puedeCrear && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">
            Cargar un producto
          </h2>
          <div className="mt-4">
            <NuevoProducto />
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer el catálogo: {error.message}
        </p>
      )}

      {bajoMinimo.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">
            Por debajo del mínimo
          </h2>
          <ul className="mt-3 space-y-2">
            {bajoMinimo.map((i) => {
              const variante = i.product_variants as { sku: string } | null;
              const lugar = i.inventory_locations as { name: string } | null;
              return (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-600/40 bg-red-700/5 px-4 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-ink">{variante?.sku}</span>
                  <span className="text-ink-soft">{lugar?.name}</span>
                  <span className="text-red-700 tabular-nums">
                    {i.available} disponibles · mínimo {i.low_stock_threshold}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Productos</h2>
        {(productos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay productos en el catálogo.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Producto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-3 font-medium">Variantes</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  {puedePublicar && <th scope="col" className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {productos!.map((p, i) => {
                  const variantes = (p.product_variants ?? []) as {
                    id: string;
                    sku: string;
                    price: number;
                    currency: string;
                  }[];
                  return (
                    <tr key={p.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">{p.name}</span>
                        <span className="block font-mono text-xs text-ink-faint">
                          {p.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {p.type}
                        {p.requires_shipping && (
                          <span className="block text-xs text-ink-faint">con envío</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {variantes.length === 0
                          ? "—"
                          : variantes
                              .map((v) => `${v.sku} ${v.price} ${v.currency}`)
                              .join(" · ")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={p.status === "ACTIVE" ? "text-success-ink" : "text-ink-faint"}>
                          {p.status}
                        </span>
                      </td>
                      {puedePublicar && (
                        <td className="px-4 py-3 text-right">
                          <PublicarProducto id={p.id} estadoActual={p.status} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

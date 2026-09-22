import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Avisarme } from "./avisarme";

export const metadata = {
  title: "Tienda · COMICOMANÍA",
  description:
    "Productos oficiales del movimiento. Camisetas, gorras, pulseras y tazas de COMICOMANÍA.",
};

/* La tienda es PÚBLICA. No hay que registrarse para mirarla: la cuenta llega
   al comprar, no al entrar.

   Lo que se ve sale de la base, no de una lista escrita a mano: los mismos
   productos que administra el panel. Si mañana alguien archiva la camiseta
   desde el admin, desaparece de aquí sin tocar código.

   Las existencias NO se muestran. Cuántas unidades quedan es dato de negocio
   —decirlo invita a calcular ventas—, así que la base solo devuelve si se
   puede comprar y si queda poco. */

const DISPONIBILIDAD: Record<string, { texto: string; clase: string } | null> = {
  DISPONIBLE: null,
  ULTIMAS: { texto: "Últimas unidades", clase: "text-gold-400" },
  AGOTADO: { texto: "Agotado", clase: "text-muted-dim" },
};

export default async function Tienda() {
  const supabase = await crearClienteServidor();

  const { data: productos, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, image_url, image_alt, display_order, product_variants(id, sku, option_values, price, currency, status)",
    )
    .eq("status", "ACTIVE")
    .order("display_order")
    .limit(50);

  // Una llamada por variante, pero son pocas y la función es estable: la
  // alternativa era exponer el inventario, que es justo lo que no queremos.
  const disponibilidad = new Map<string, string>();
  await Promise.all(
    (productos ?? []).flatMap((p) =>
      ((p.product_variants ?? []) as { id: string }[]).map(async (v) => {
        const { data } = await supabase.rpc("disponibilidad_publica", {
          p_variant_id: v.id,
        });
        disponibilidad.set(v.id, data ?? "DISPONIBLE");
      }),
    ),
  );

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/" className="text-muted transition-colors hover:text-paper-pure">
            Inicio
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-4">
        <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
          COMICOMANÍA Shop
        </p>
        <h1 className="font-display mt-3 text-5xl text-paper uppercase sm:text-6xl">
          No es merch.{" "}
          <span className="block text-red-500">Es parte del movimiento.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          El humor también se lleva puesto. Productos oficiales para quienes no
          solo siguen el movimiento: forman parte de él.
        </p>
      </section>

      {error && (
        <p role="alert" className="mx-auto max-w-6xl px-5 py-6 text-sm text-red-300">
          No se pudo cargar la tienda: {error.message}
        </p>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(productos ?? []).map((p) => {
            const variantes = ((p.product_variants ?? []) as {
              id: string;
              sku: string;
              option_values: Record<string, string> | null;
              price: number;
              currency: string;
              status: string;
            }[]).filter((v) => v.status === "ACTIVE");

            const precios = variantes.map((v) => Number(v.price));
            const desde = precios.length ? Math.min(...precios) : null;
            const variado = precios.length > 1 && Math.max(...precios) !== desde;

            const estados = variantes.map((v) => disponibilidad.get(v.id));
            const agotadoTodo =
              estados.length > 0 && estados.every((e) => e === "AGOTADO");
            const quedaPoco = !agotadoTodo && estados.some((e) => e === "ULTIMAS");
            const aviso = agotadoTodo
              ? DISPONIBILIDAD.AGOTADO
              : quedaPoco
                ? DISPONIBILIDAD.ULTIMAS
                : null;

            // Las opciones, en el orden en que llegaron: S, M, L, XL.
            const opciones = variantes
              .map((v) => Object.values(v.option_values ?? {})[0])
              .filter(Boolean) as string[];

            return (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-lg border border-stage-600 bg-stage-900"
              >
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.image_alt ?? p.name}
                    width={800}
                    height={1000}
                    className="aspect-4/5 w-full object-cover"
                    loading="lazy"
                  />
                )}

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-lg text-paper uppercase">
                    {p.name}
                  </h2>

                  {p.description && (
                    <p className="mt-2 flex-1 text-sm text-muted">{p.description}</p>
                  )}

                  {opciones.length > 1 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {opciones.map((o) => (
                        <li
                          key={o}
                          className="rounded border border-stage-600 px-2 py-0.5 text-xs text-muted"
                        >
                          {o}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-2xl text-paper-pure tabular-nums">
                      {variado ? "desde " : ""}
                      {desde !== null ? `$${desde}` : "—"}
                    </span>
                    <span className="text-xs text-muted-dim">
                      {variantes[0]?.currency ?? "USD"}
                    </span>
                  </div>

                  {aviso && (
                    <p className={`mt-1 text-xs ${aviso.clase}`}>{aviso.texto}</p>
                  )}

                  {agotadoTodo ? (
                    <p className="mt-4 rounded-md border border-stage-600 px-4 py-2.5 text-center text-sm text-muted-dim">
                      Agotado por ahora
                    </p>
                  ) : (
                    <Avisarme slug={p.slug} nombre={p.name} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {(productos?.length ?? 0) === 0 && !error && (
          <p className="rounded-lg border border-stage-600 bg-stage-800 p-8 text-center text-muted">
            La tienda abre pronto.
          </p>
        )}
      </section>

      {/* Por qué todavía no se puede pagar. Decirlo es mejor que un botón que
          lleva a un carrito que no cobra. */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="rounded-lg border border-gold-400/30 bg-gold-400/5 p-6">
          <p className="text-sm text-paper-pure">
            La tienda abre en cuanto cerremos la pasarela de pago.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Preferimos decírtelo a ponerte un botón de comprar que no cobra.
            Déjanos tu correo en el producto que quieras y te escribimos el día
            que abra — no antes, y no para otra cosa.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <ul className="grid gap-4 border-t border-stage-600 pt-8 sm:grid-cols-3">
          {[
            { titulo: "Envíos", texto: "A todo el mundo, desde Miami." },
            { titulo: "Oficiales", texto: "Producidos por COMICOMANÍA, no por terceros." },
            { titulo: "Pago seguro", texto: "Con la pasarela, nunca guardamos tu tarjeta." },
          ].map((g) => (
            <li key={g.titulo}>
              <p className="font-display text-sm text-paper uppercase">{g.titulo}</p>
              <p className="mt-1 text-sm text-muted">{g.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

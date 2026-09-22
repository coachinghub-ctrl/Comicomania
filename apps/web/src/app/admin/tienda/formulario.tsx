"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { cambiarEstadoProducto, crearProducto, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* Los formatos de la tienda. Cada uno decide las variantes, si lleva envío y
   el peso de partida, para que quien carga un producto no tenga que pensar en
   SKUs ni en gramos. */
const FORMATOS = [
  { clave: "TALLAS", etiqueta: "Ropa", detalle: "S · M · L · XL", variantes: 4 },
  { clave: "UNICA", etiqueta: "Talla única", detalle: "gorra, taza, poster", variantes: 1 },
  { clave: "JUEGO", etiqueta: "Juego o pack", detalle: "pulseras, kit", variantes: 1 },
  { clave: "DIGITAL", etiqueta: "Digital", detalle: "sin envío", variantes: 1 },
] as const;

export function NuevoProducto() {
  const [estado, enviar, enviando] = useActionState(crearProducto, INICIAL);
  const [abierto, setAbierto] = useState(false);
  const [formato, setFormato] = useState<string>("UNICA");
  const [vista, setVista] = useState<string | null>(null);
  const [existencias, setExistencias] = useState("50");

  const elegido = FORMATOS.find((f) => f.clave === formato)!;

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Listo</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <p className="mt-3 text-sm text-ink-soft">
          Está en <strong>borrador</strong>: no sale en la tienda pública hasta
          que lo publiques desde la lista de abajo.
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-4 text-sm text-red-600 underline"
        >
          Cargar otro
        </button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        Cargar un producto
      </Button>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="shrink-0">
          <div className="h-48 w-40 overflow-hidden rounded-md border border-line bg-surface-2">
            {vista ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vista} alt="La foto del producto" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center px-3 text-center text-xs text-ink-faint">
                La foto es obligatoria
              </span>
            )}
          </div>
          <input
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(e) => {
              const a = e.target.files?.[0];
              if (a) setVista(URL.createObjectURL(a));
            }}
            className="mt-2 block w-40 text-xs text-ink-soft file:mr-2 file:rounded file:border-0 file:bg-red-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-paper"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <label className="block text-sm text-ink-soft">
            Nombre
            <input
              name="nombre"
              required
              placeholder="Camiseta EL HUMOR NOS UNE"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>

          <label className="block text-sm text-ink-soft">
            De qué es
            <textarea
              name="descripcion"
              rows={2}
              required
              placeholder="Negra, algodón pesado. La corona al frente y el manifiesto en la espalda."
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>

          <label className="block text-sm text-ink-soft">
            Qué se ve en la foto
            <input
              name="altFoto"
              required
              placeholder="Camiseta negra con la corona roja al frente"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Sin esto, quien usa lector de pantalla no puede comprar. En
              comercio eso no es un detalle: es gente que se queda fuera.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-sm text-ink uppercase">Formato</h3>
        <input type="hidden" name="formato" value={formato} />

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {FORMATOS.map((f) => (
            <button
              type="button"
              key={f.clave}
              onClick={() => setFormato(f.clave)}
              className={`rounded-md border p-3 text-left transition-colors ${
                formato === f.clave
                  ? "border-red-600 bg-red-700/5"
                  : "border-line hover:bg-surface-2"
              }`}
            >
              <span className="block text-sm text-ink">{f.etiqueta}</span>
              <span className="block text-xs text-ink-faint">{f.detalle}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <label className="block text-sm text-ink-soft">
            Precio
            <div className="mt-1 flex items-center gap-1">
              <span className="text-ink-faint">$</span>
              <input
                type="number"
                name="precio"
                min={0}
                step="1"
                required
                defaultValue={28}
                className="block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </div>
          </label>

          <label className="block text-sm text-ink-soft">
            Moneda
            <select
              name="moneda"
              defaultValue="USD"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            >
              <option>USD</option>
              <option>MXN</option>
              <option>COP</option>
              <option>EUR</option>
            </select>
          </label>

          <label className="block text-sm text-ink-soft">
            Unidades por variante
            <input
              type="number"
              name="existencias"
              min={0}
              required
              value={existencias}
              onChange={(e) => setExistencias(e.target.value)}
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>

          <label className="block text-sm text-ink-soft">
            Avisar por debajo de
            <input
              type="number"
              name="minimo"
              min={0}
              defaultValue={5}
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>
        </div>

        <p className="mt-3 rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft">
          Se crean <strong>{elegido.variantes}</strong>{" "}
          {elegido.variantes === 1 ? "variante" : "variantes"} ({elegido.detalle}) con{" "}
          <strong>{existencias || 0}</strong> unidades cada una. El producto
          nace con foto, variantes y existencias, o no nace: uno sin variante no
          se puede comprar, y uno sin existencias se vende hasta que alguien
          descubre que no hay.
        </p>
      </div>

      {estado.estado === "error" && (
        <p role="alert" className="mt-5 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Cargando…" : "Crear en borrador"}
        </Button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-ink-faint hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* Publicar es un acto aparte de editar: exige PRODUCTS.PUBLISH. Cargar un
   producto y ponerlo a la venta no deberían ser el mismo permiso. */
export function PublicarProducto({
  id,
  estadoActual,
}: {
  id: string;
  estadoActual: string;
}) {
  const [estado, enviar, enviando] = useActionState(cambiarEstadoProducto, INICIAL);
  const publicado = estadoActual === "ACTIVE";

  return (
    <form action={enviar} className="inline">
      <input type="hidden" name="producto" value={id} />
      <input type="hidden" name="estado" value={publicado ? "DRAFT" : "ACTIVE"} />
      <button
        type="submit"
        disabled={enviando}
        className={`text-xs underline disabled:opacity-40 ${
          publicado ? "text-ink-faint hover:text-ink" : "text-red-600 hover:text-red-700"
        }`}
      >
        {enviando ? "…" : publicado ? "Quitar de la tienda" : "Publicar"}
      </button>
      {estado.estado === "error" && (
        <span role="alert" className="ml-2 text-xs text-red-700">
          {estado.mensaje}
        </span>
      )}
    </form>
  );
}

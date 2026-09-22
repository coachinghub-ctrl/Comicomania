"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import {
  anadirLinea,
  guardarTarifa,
  moverPresupuesto,
  quitarLinea,
  type Resultado,
} from "./acciones";
import { dinero } from "./cotizador";

const INICIAL: Resultado = { estado: "inicial" };

const entrada =
  "mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink";

function Aviso({ estado }: { estado: Resultado }) {
  if (estado.estado === "error") {
    return (
      <p role="alert" className="mt-3 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
        {estado.mensaje}
      </p>
    );
  }
  if (estado.estado === "ok") {
    return (
      <p className="mt-3 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
        {estado.mensaje}
      </p>
    );
  }
  return null;
}

/* Añadir una línea: viaje, hotel, viáticos, técnica.

   Los tipos no son decorativos. Un presupuesto que dice "4.470" no se discute
   igual que uno que dice "3.500 de caché, 420 de vuelo, 180 de hotel": el
   primero se regatea entero, el segundo por partes. */
export function NuevaLinea({ presupuestoId }: { presupuestoId: string }) {
  const [estado, enviar, enviando] = useActionState(anadirLinea, INICIAL);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-red-600 underline"
      >
        Añadir línea
      </button>
    );
  }

  return (
    <form action={enviar} className="mt-3 rounded-md border border-line bg-surface-2 p-4">
      <input type="hidden" name="presupuesto" value={presupuestoId} />
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Concepto
          <input
            name="concepto"
            required
            placeholder="Vuelo ida y vuelta"
            className={entrada}
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Tipo
          <select name="tipo" defaultValue="TRAVEL" className={entrada}>
            <option value="FEE">Caché</option>
            <option value="TRAVEL">Viaje</option>
            <option value="LODGING">Hotel</option>
            <option value="PER_DIEM">Viáticos</option>
            <option value="TECH">Técnica</option>
            <option value="OTHER">Otro</option>
          </select>
        </label>
        <label className="block text-sm text-ink-soft">
          Cantidad
          <input
            type="number"
            name="cantidad"
            min={0.5}
            step="0.5"
            defaultValue={1}
            className={entrada}
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Precio unitario
          <input
            type="number"
            name="precio"
            min={0}
            step="10"
            required
            className={entrada}
          />
        </label>
      </div>
      <Aviso estado={estado} />
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Añadiendo…" : "Añadir"}
        </Button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-ink-soft underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function QuitarLinea({ lineaId }: { lineaId: string }) {
  const [estado, enviar, enviando] = useActionState(quitarLinea, INICIAL);
  return (
    <form action={enviar}>
      <input type="hidden" name="linea" value={lineaId} />
      <button
        type="submit"
        disabled={enviando}
        title={estado.estado === "error" ? estado.mensaje : undefined}
        className="text-xs text-ink-faint underline hover:text-red-600"
      >
        quitar
      </button>
    </form>
  );
}

/* Enviar es el punto de no retorno, y se dice antes de pulsar.

   No hay botón de "editar enviado" porque no existe esa operación: la base lo
   rechaza. Lo que hay es emitir otra versión, y eso se hace desde el
   cotizador sobre la misma solicitud. */
export function MoverPresupuesto({
  presupuestoId,
  estado: actual,
  total,
  moneda,
}: {
  presupuestoId: string;
  estado: string;
  total: number;
  moneda: string;
}) {
  const [estado, enviar, enviando] = useActionState(moverPresupuesto, INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  if (actual === "DRAFT") {
    if (!confirmando) {
      return (
        <div>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper hover:bg-red-500"
          >
            Enviar al cliente
          </button>
          <Aviso estado={estado} />
        </div>
      );
    }
    return (
      <form action={enviar}>
        <input type="hidden" name="presupuesto" value={presupuestoId} />
        <input type="hidden" name="nuevo" value="SENT" />
        <p className="max-w-sm text-sm text-ink-soft">
          Se envía por <strong>{dinero(total, moneda)}</strong>. A partir de ahí
          las cifras quedan congeladas: para cambiarlas habrá que emitir otra
          versión.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper hover:bg-red-500 disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Sí, enviar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="text-sm text-ink-soft underline"
          >
            No
          </button>
        </div>
        <Aviso estado={estado} />
      </form>
    );
  }

  if (actual === "SENT") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {[
          { valor: "ACCEPTED", texto: "Lo aceptaron", clase: "bg-success-ink" },
          { valor: "REJECTED", texto: "Lo rechazaron", clase: "bg-ink-soft" },
        ].map((b) => (
          <form key={b.valor} action={enviar}>
            <input type="hidden" name="presupuesto" value={presupuestoId} />
            <input type="hidden" name="nuevo" value={b.valor} />
            <button
              type="submit"
              disabled={enviando}
              className={`rounded-md ${b.clase} px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60`}
            >
              {b.texto}
            </button>
          </form>
        ))}
        <Aviso estado={estado} />
      </div>
    );
  }

  return null;
}

/* El tarifario.

   Vive en esta pantalla y no en la ficha del humorista porque es donde se
   usa: quien va a cotizar y descubre que falta una tarifa la pone aquí sin
   perder el hilo. */
export function NuevaTarifa({
  talentos,
}: {
  talentos: { id: string; nombre: string }[];
}) {
  const [estado, enviar, enviando] = useActionState(guardarTarifa, INICIAL);

  return (
    <form action={enviar} className="rounded-lg border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-5">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Humorista
          <select name="talento" required defaultValue="" className={entrada}>
            <option value="" disabled>
              Elige
            </option>
            {talentos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-ink-soft">
          Minutos
          <input
            type="number"
            name="minutos"
            min={1}
            max={240}
            required
            placeholder="45"
            className={entrada}
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Tarifa
          <input
            type="number"
            name="tarifa"
            min={0}
            step="50"
            required
            className={entrada}
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Mercado
          <input
            name="mercado"
            placeholder="US.FL"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Vacío = general.
          </span>
        </label>
      </div>
      <Aviso estado={estado} />
      <Button type="submit" disabled={enviando} className="mt-3">
        {enviando ? "Guardando…" : "Guardar tarifa"}
      </Button>
    </form>
  );
}

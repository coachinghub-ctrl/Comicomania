"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@comicomania/ui";
import { calcularPresupuesto, ErrorDePresupuesto } from "@comicomania/domain";
import { crearPresupuesto, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Solicitud = {
  id: string;
  cliente: string;
  talentoId: string;
  talento: string;
  evento: string | null;
  fecha: string | null;
  presupuestoCliente: number | null;
};

export type Tarifa = {
  talentoId: string;
  minutos: number;
  tarifa: number;
  moneda: string;
  mercado: string | null;
};

export function dinero(n: number, moneda = "USD") {
  return `${n.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda}`;
}

/* El cotizador.

   El número se ve MIENTRAS se escribe, no después de guardar. Un cotizador
   que obliga a guardar para saber cuánto sale no es un cotizador, es un
   formulario: nadie prueba tres escenarios si cada uno cuesta un viaje de ida
   y vuelta al servidor.

   La cuenta la hace calcularPresupuesto(), la misma función con 26 pruebas
   que fija el orden de las operaciones. Aquí es solo una vista previa: el
   número que vale es el que calcula la base al guardar, y se ha comprobado
   que dan lo mismo. */
export function Cotizador({
  solicitudes,
  tarifas,
}: {
  solicitudes: Solicitud[];
  tarifas: Tarifa[];
}) {
  const [estado, enviar, enviando] = useActionState(crearPresupuesto, INICIAL);
  const [abierto, setAbierto] = useState(false);

  const [solicitudId, setSolicitudId] = useState("");
  const [minutos, setMinutos] = useState("");
  const [comision, setComision] = useState("15");
  const [impuesto, setImpuesto] = useState("0");
  const [descuento, setDescuento] = useState("0");

  const solicitud = solicitudes.find((s) => s.id === solicitudId);

  const suyas = useMemo(
    () =>
      tarifas
        .filter((t) => t.talentoId === solicitud?.talentoId)
        .sort((a, b) => a.minutos - b.minutos),
    [tarifas, solicitud?.talentoId],
  );

  const elegida = suyas.find((t) => String(t.minutos) === minutos);

  /* La vista previa. Si la función lanza —un porcentaje imposible, un
     descuento mayor que el subtotal— se enseña el motivo en vez de un número
     tranquilizador que no significa nada. */
  const vista = useMemo(() => {
    if (!elegida) return null;
    try {
      return {
        totales: calcularPresupuesto({
          lineas: [
            {
              concepto: `Show de ${elegida.minutos} minutos`,
              tipo: "FEE",
              cantidad: 1,
              precioUnitario: elegida.tarifa,
            },
          ],
          descuento: Number(descuento) || 0,
          comisionPct: Number(comision) || 0,
          impuestoPct: Number(impuesto) || 0,
        }),
        error: null as string | null,
      };
    } catch (e) {
      return {
        totales: null,
        error:
          e instanceof ErrorDePresupuesto ? e.message : "Revisa los números.",
      };
    }
  }, [elegida, descuento, comision, impuesto]);

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Creado</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-4 text-sm text-red-600 underline"
        >
          Ver el presupuesto
        </button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        Cotizar una solicitud
      </Button>
    );
  }

  const entrada =
    "mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink";

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-ink-soft sm:col-span-2">
            Qué solicitud
            <select
              name="solicitud"
              required
              value={solicitudId}
              onChange={(e) => {
                setSolicitudId(e.target.value);
                setMinutos("");
              }}
              className={entrada}
            >
              <option value="">Elige la solicitud</option>
              {solicitudes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cliente} · {s.talento}
                  {s.evento ? ` · ${s.evento}` : ""}
                </option>
              ))}
            </select>
            {solicitud?.presupuestoCliente ? (
              <span className="mt-1 block text-xs text-ink-faint tabular-nums">
                El cliente dijo que manejaba{" "}
                {dinero(solicitud.presupuestoCliente)}.
              </span>
            ) : (
              solicitud && (
                <span className="mt-1 block text-xs text-ink-faint">
                  El cliente no dijo presupuesto.
                </span>
              )
            )}
          </label>

          <label className="block text-sm text-ink-soft sm:col-span-2">
            Duración del show
            <select
              name="minutos"
              required
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              disabled={!solicitud}
              className={entrada}
            >
              <option value="">
                {solicitud ? "Elige la duración" : "Elige primero la solicitud"}
              </option>
              {suyas.map((t) => (
                <option key={`${t.minutos}-${t.mercado ?? ""}`} value={t.minutos}>
                  {t.minutos} min · {dinero(t.tarifa, t.moneda)}
                  {t.mercado ? ` (${t.mercado})` : ""}
                </option>
              ))}
            </select>
            {solicitud && suyas.length === 0 && (
              <span className="mt-1 block text-xs text-red-700">
                Este humorista no tiene tarifario. Ponlo abajo antes de cotizar:
                improvisar el precio de partida es como se pierde dinero sin
                enterarse.
              </span>
            )}
          </label>

          <label className="block text-sm text-ink-soft">
            Comisión de la casa (%)
            <input
              type="number"
              name="comision"
              min={0}
              max={100}
              step="0.5"
              value={comision}
              onChange={(e) => setComision(e.target.value)}
              className={entrada}
            />
          </label>

          <label className="block text-sm text-ink-soft">
            Impuesto (%)
            <input
              type="number"
              name="impuesto"
              min={0}
              max={100}
              step="0.5"
              value={impuesto}
              onChange={(e) => setImpuesto(e.target.value)}
              className={entrada}
            />
          </label>

          <label className="block text-sm text-ink-soft">
            Descuento
            <input
              type="number"
              name="descuento"
              min={0}
              step="10"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              className={entrada}
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Se resta antes de la comisión.
            </span>
          </label>

          <label className="block text-sm text-ink-soft">
            Vale durante (días)
            <input
              type="number"
              name="vigencia"
              min={1}
              max={365}
              defaultValue={30}
              className={entrada}
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Un precio sin caducidad es uno al que te atas para siempre.
            </span>
          </label>

          <label className="block text-sm text-ink-soft sm:col-span-2">
            Notas internas
            <input
              name="notas"
              placeholder="Lo hablado por teléfono, lo que no va en el PDF."
              className={entrada}
            />
          </label>
        </div>

        {/* El número, mientras se escribe. */}
        <aside className="rounded-lg border border-line bg-surface-2 p-5">
          <p className="text-xs tracking-wider text-ink-faint uppercase">
            Cómo va quedando
          </p>

          {!elegida ? (
            <p className="mt-3 text-sm text-ink-faint">
              Elige solicitud y duración y aparece la cuenta.
            </p>
          ) : vista?.error ? (
            <p className="mt-3 text-sm text-red-700">{vista.error}</p>
          ) : (
            vista?.totales && (
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Caché", vista.totales.subtotal],
                  ["Descuento", -vista.totales.descuento],
                  ["Base", vista.totales.base],
                  [`Comisión ${comision}%`, vista.totales.comision],
                  [`Impuesto ${impuesto}%`, vista.totales.impuesto],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta as string} className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{etiqueta}</dt>
                    <dd className="text-ink tabular-nums">
                      {dinero(valor as number, elegida.moneda)}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <dt className="font-display text-ink uppercase">Total</dt>
                  <dd className="font-display text-xl text-red-600 tabular-nums">
                    {dinero(vista.totales.total, elegida.moneda)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <dt className="text-ink-soft">Para el humorista</dt>
                  <dd className="text-success-ink tabular-nums">
                    {dinero(vista.totales.paraElTalento, elegida.moneda)}
                  </dd>
                </div>
              </dl>
            )
          )}

          <p className="mt-4 text-xs text-ink-faint">
            Esto es solo el caché. El viaje, el hotel, los viáticos y la técnica
            se añaden como líneas en cuanto se cree.
          </p>
        </aside>
      </div>

      {estado.estado === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700"
        >
          {estado.mensaje}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={enviando || !elegida}>
          {enviando ? "Creando…" : "Crear el presupuesto"}
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

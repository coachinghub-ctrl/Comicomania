"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { crearEvento, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Opcion = { id: string; nombre: string };
export type Ciudad = Opcion & { paisId: string };
export type Sede = Opcion & { ciudadId: string | null; aforo: number | null };

/* Los tres niveles de la plantilla. El reparto del aforo va escrito para que
   quien crea el evento sepa cuántas entradas va a poder vender de cada uno
   ANTES de guardar, y no lo descubra después contando a mano. */
const NIVELES = [
  { nombre: "General", porcentaje: 60, precio: 35 },
  { nombre: "Preferencial", porcentaje: 30, precio: 75 },
  { nombre: "VIP · meet & greet", porcentaje: 10, precio: 150 },
];

export function NuevoEvento({
  paises,
  ciudades,
  sedes,
  concursos,
}: {
  paises: Opcion[];
  ciudades: Ciudad[];
  sedes: Sede[];
  concursos: Opcion[];
}) {
  const [estado, enviar, enviando] = useActionState(crearEvento, INICIAL);
  const [abierto, setAbierto] = useState(false);
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [sede, setSede] = useState("");
  const [aforo, setAforo] = useState("");
  const [vistaArte, setVistaArte] = useState<string | null>(null);
  const [gratis, setGratis] = useState(false);

  const ciudadesDelPais = ciudades.filter((c) => c.paisId === pais);
  const sedesDeLaCiudad = sedes.filter(
    (s) => !ciudad || s.ciudadId === ciudad || s.ciudadId === null,
  );
  const sedeElegida = sedes.find((s) => s.id === sede);
  const aforoEfectivo = Number(aforo) || sedeElegida?.aforo || 0;

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Listo</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <p className="mt-3 text-sm text-ink-soft">
          Está en <strong>borrador</strong>: no sale en la cartelera pública
          hasta que lo pases a anunciado.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/eventos/${estado.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-red-600 underline"
          >
            Ver cómo quedó
          </a>
          <button
            type="button"
            onClick={() => location.reload()}
            className="text-sm text-ink-soft underline"
          >
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        Crear un evento
      </Button>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Nombre del evento
          <input
            name="nombre"
            required
            placeholder="COMICOMANÍA Bogotá 2027 · Gran Final"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Tipo
          <select
            name="tipo"
            defaultValue="SHOW"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            <option value="SHOW">Función</option>
            <option value="FINAL">Final</option>
            <option value="WORKSHOP">Taller</option>
            <option value="ONLINE">Online</option>
            <option value="TOUR_STOP">Parada de gira</option>
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Concurso al que pertenece (opcional)
          <select
            name="concurso"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            <option value="">Ninguno</option>
            {concursos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          País
          <select
            name="pais"
            required
            value={pais}
            onChange={(e) => {
              setPais(e.target.value);
              setCiudad("");
              setSede("");
            }}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            <option value="">Elige…</option>
            {paises.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Ciudad
          <select
            name="ciudad"
            value={ciudad}
            onChange={(e) => {
              setCiudad(e.target.value);
              setSede("");
            }}
            disabled={!pais}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink disabled:opacity-50"
          >
            <option value="">Todo el país</option>
            {ciudadesDelPais.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Fecha
          <input
            type="date"
            name="fecha"
            required
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Hora
          <input
            type="time"
            name="hora"
            defaultValue="20:00"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Sede
          <select
            name="sede"
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            <option value="">— Una sede nueva —</option>
            {sedesDeLaCiudad.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.aforo ? ` · ${s.aforo} lugares` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Aforo
          <input
            type="number"
            name="aforo"
            min={1}
            value={aforo}
            onChange={(e) => setAforo(e.target.value)}
            placeholder={sedeElegida?.aforo ? String(sedeElegida.aforo) : "300"}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
          <span className="mt-1 block text-xs text-ink-faint">
            {sedeElegida?.aforo
              ? `La sede tiene ${sedeElegida.aforo}. Déjalo vacío para usar ese.`
              : "No se emiten más entradas que el aforo: lo impide la base."}
          </span>
        </label>

        {!sede && (
          <>
            <label className="block text-sm text-ink-soft">
              Nombre de la sede nueva
              <input
                name="sedeNueva"
                placeholder="Teatro Colón"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
            <label className="block text-sm text-ink-soft">
              Dirección
              <input
                name="direccion"
                placeholder="Calle 10 #5-32, Bogotá"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
          </>
        )}
      </div>

      {/* Identidad visual */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-sm text-ink uppercase">
          Cómo se ve y cómo se cuenta
        </h3>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row">
          <div className="shrink-0">
            <div className="h-40 w-32 overflow-hidden rounded-md border border-line bg-surface-2">
              {vistaArte ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vistaArte} alt="Cartel" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center px-2 text-center text-xs text-ink-faint">
                  Sin cartel
                </span>
              )}
            </div>
            <input
              type="file"
              name="arte"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const a = e.target.files?.[0];
                if (a) setVistaArte(URL.createObjectURL(a));
              }}
              className="mt-2 block w-32 text-xs text-ink-soft file:mr-2 file:rounded file:border-0 file:bg-red-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-paper"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <label className="block text-sm text-ink-soft">
              Antetítulo
              <input
                name="subtitulo"
                placeholder="Gran Final"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>

            <label className="block text-sm text-ink-soft">
              La frase del cartel, en texto
              <input
                name="tagline"
                placeholder="El escenario donde el talento se convierte en oportunidad"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>

            <label className="block text-sm text-ink-soft">
              Qué se ve en el cartel
              <input
                name="altArte"
                placeholder="Un micrófono en un escenario rojo con el público de pie"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Obligatorio si subes cartel.
              </span>
            </label>

            <label className="block text-sm text-ink-soft">
              De qué va
              <textarea
                name="descripcion"
                rows={2}
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Entradas de la plantilla */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-sm text-ink uppercase">
          Entradas · plantilla
        </h3>

        <label className="mt-3 flex items-start gap-3 rounded-md border border-line bg-surface-2 p-3 text-sm">
          <input
            type="checkbox"
            name="gratis"
            checked={gratis}
            onChange={(e) => setGratis(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="text-ink">Evento gratuito</span>
            <span className="mt-1 block text-xs text-ink-faint">
              Un solo nivel, a cero. Lo que importa es la lista: quien reserve
              entra al CRM con este evento como fuente, y desde ahí alimenta
              campañas. Reservar un lugar gratis no necesita pasarela, así que
              esto funciona hoy.
            </span>
          </span>
        </label>

        {gratis ? (
          <p className="mt-3 rounded-md border border-line px-4 py-3 text-sm text-ink-soft">
            Se crea <strong>Entrada libre</strong> con{" "}
            {aforoEfectivo > 0 ? `${aforoEfectivo} lugares` : "el aforo que pongas"}.
            El aforo se respeta igual: prometer un lugar que no existe se
            descubre en la puerta.
          </p>
        ) : (
        <>
        <p className="mt-3 text-xs text-ink-faint">
          El evento nace con estos tres niveles, o no nace: uno sin tipos de
          entrada no puede vender nada. Se editan después.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {NIVELES.map((n, i) => (
            <label key={n.nombre} className="block text-sm text-ink-soft">
              {n.nombre}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-ink-faint">$</span>
                <input
                  type="number"
                  name={`precio${i}`}
                  min={0}
                  step="1"
                  defaultValue={n.precio}
                  className="block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
                />
              </div>
              <span className="mt-1 block text-xs text-ink-faint tabular-nums">
                {n.porcentaje}% del aforo
                {aforoEfectivo > 0 &&
                  ` · ${Math.max(1, Math.floor((aforoEfectivo * n.porcentaje) / 100))} entradas`}
              </span>
            </label>
          ))}
        </div>
        </>
        )}
      </div>

      {estado.estado === "error" && (
        <p role="alert" className="mt-5 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear en borrador"}
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

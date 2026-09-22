"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { crearConcurso, crearTemporada, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Opcion = { id: string; nombre: string; extra?: string };
export type Ciudad = Opcion & { paisId: string };

function Aviso({ estado }: { estado: Resultado }) {
  if (estado.estado === "error") {
    return (
      <p role="alert" className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
        {estado.mensaje}
      </p>
    );
  }
  if (estado.estado === "ok") {
    return (
      <p role="status" className="mt-4 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
        {estado.mensaje}
      </p>
    );
  }
  return null;
}

export function NuevoConcurso({
  temporadas,
  paises,
  ciudades,
}: {
  temporadas: Opcion[];
  paises: Opcion[];
  ciudades: Ciudad[];
}) {
  const [estado, enviar, enviando] = useActionState(crearConcurso, INICIAL);
  const [pais, setPais] = useState("");

  // Solo ciudades del país elegido: ofrecer Bogotá bajo Estados Unidos es un
  // error que la base rechazaría, pero conviene no llegar hasta ahí.
  const ciudadesDelPais = ciudades.filter((c) => c.paisId === pais);

  if (temporadas.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface-2 p-5 text-sm text-ink-soft">
        Crea primero una temporada: un concurso siempre cuelga de una, para que
        comparar ediciones no exija arqueología.
      </p>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Nombre del concurso
          <input
            name="nombre"
            required
            placeholder="COMICOMANÍA Miami 2027"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Temporada
          <select
            name="temporada"
            required
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
                {t.extra ? ` · ${t.extra}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          País
          <select
            name="pais"
            required
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          >
            <option value="">Elige…</option>
            {paises.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Ciudad (opcional — vacío = todo el país)
          <select
            name="ciudad"
            disabled={!pais}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink disabled:opacity-50"
          >
            <option value="">Todo el país</option>
            {ciudadesDelPais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Abren inscripciones
          <input
            type="date"
            name="abre"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Cierran inscripciones
          <input
            type="date"
            name="cierra"
            required
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Fecha límite de entrega de video
          <input
            type="date"
            name="entrega"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>

      <div className="mt-5 rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-xs tracking-wider text-ink-faint uppercase">
          Qué se crea con el concurso
        </p>
        <p className="mt-2 text-ink-soft">
          Tres categorías por edad —<strong>18–25</strong>, <strong>26–39</strong> y{" "}
          <strong>40+</strong>— y tres rondas: clasificatoria, semifinal y final.
          Todo editable después.
        </p>
        <p className="mt-2 text-ink-soft">
          La edad de cada participante se congela contra el{" "}
          <strong>cierre de inscripciones</strong>. Nadie cambia de categoría por
          cumplir años a mitad del concurso.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Los menores de 18 quedan fuera: admitirlos exige consentimiento de
          tutor, datos minimizados y moderación previa. Es una decisión legal por
          país, no una casilla.
        </p>
      </div>

      <Aviso estado={estado} />

      <Button type="submit" className="mt-5" disabled={enviando}>
        {enviando ? "Creando…" : "Crear en borrador"}
      </Button>
    </form>
  );
}

export function NuevaTemporada() {
  const [estado, enviar, enviando] = useActionState(crearTemporada, INICIAL);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-red-600 underline hover:text-red-700"
      >
        Crear una temporada
      </button>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm text-ink-soft">
          Serie
          <input
            name="serie"
            required
            placeholder="COMICOMANÍA"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Temporada
          <input
            name="nombreTemporada"
            required
            placeholder="Temporada 1"
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-soft">
          Año
          <input
            type="number"
            name="anio"
            required
            defaultValue={new Date().getFullYear() + 1}
            min={2026}
            max={2040}
            className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Si la serie ya existe, se reutiliza. No se duplica.
      </p>
      <Aviso estado={estado} />
      <Button type="submit" className="mt-4" disabled={enviando}>
        {enviando ? "Creando…" : "Crear temporada"}
      </Button>
    </form>
  );
}

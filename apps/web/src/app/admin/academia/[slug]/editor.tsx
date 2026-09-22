"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import {
  anadirLeccion,
  anadirModulo,
  quitarLeccion,
  type Resultado,
} from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

const entrada =
  "mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink";

function Aviso({ estado }: { estado: Resultado }) {
  if (estado.estado === "error") {
    return (
      <p
        role="alert"
        className="mt-3 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700"
      >
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

export function NuevoModulo({
  cursoId,
  slug,
}: {
  cursoId: string;
  slug: string;
}) {
  const [estado, enviar, enviando] = useActionState(anadirModulo, INICIAL);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        Añadir módulo
      </Button>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line p-4">
      <input type="hidden" name="curso" value={cursoId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="block text-sm text-ink-soft">
        Nombre del módulo
        <input
          name="titulo"
          required
          placeholder="Escribir el remate"
          className={entrada}
        />
      </label>
      <Aviso estado={estado} />
      <div className="mt-4 flex items-center gap-3">
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

/* Añadir una clase.

   El tipo manda sobre el formulario: una clase EN VIVO pide día, hora y sala,
   y una grabada pide el material. Pedir las dos cosas siempre es la forma más
   rápida de acabar con salas vacías apuntadas en clases que no son en vivo. */
export function NuevaLeccion({
  cursoId,
  moduloId,
  slug,
}: {
  cursoId: string;
  moduloId: string;
  slug: string;
}) {
  const [estado, enviar, enviando] = useActionState(anadirLeccion, INICIAL);
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState("VIDEO");

  const enVivo = tipo === "LIVE";

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-red-600 underline"
      >
        Añadir clase a este módulo
      </button>
    );
  }

  return (
    <form action={enviar} className="mt-3 rounded-lg border border-line bg-surface-2 p-4">
      <input type="hidden" name="curso" value={cursoId} />
      <input type="hidden" name="modulo" value={moduloId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Título
          <input
            name="titulo"
            required
            placeholder="Qué hace gracioso a un remate"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Tipo
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={entrada}
          >
            <option value="VIDEO">Video grabado</option>
            <option value="LIVE">Clase en vivo</option>
            <option value="TEXT">Lectura</option>
            <option value="ASSIGNMENT">Práctica</option>
            <option value="QUIZ">Ejercicio</option>
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Duración (minutos)
          <input
            type="number"
            name="minutos"
            min={1}
            placeholder="45"
            className={entrada}
          />
        </label>

        {enVivo ? (
          <>
            <label className="block text-sm text-ink-soft">
              Día
              <input type="date" name="fecha" required className={entrada} />
            </label>
            <label className="block text-sm text-ink-soft">
              Hora
              <input
                type="time"
                name="hora"
                defaultValue="19:00"
                className={entrada}
              />
            </label>
            <label className="block text-sm text-ink-soft sm:col-span-2">
              Enlace de la sala
              <input
                name="sala"
                inputMode="url"
                placeholder="https://meet.google.com/…"
                className={entrada}
              />
              <span className="mt-1 block text-xs text-ink-faint">
                No es público. Solo lo ve quien está inscrito: un enlace de
                reunión filtrado es una clase con gente que no pagó dentro.
              </span>
            </label>
          </>
        ) : (
          <label className="block text-sm text-ink-soft sm:col-span-2">
            Material
            <input
              name="material"
              inputMode="url"
              placeholder="https://… video, PDF o enunciado"
              className={entrada}
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Tampoco es público: el temario se lee siempre, el contenido solo
              quien está dentro.
            </span>
          </label>
        )}

        <label className="flex items-start gap-3 text-sm text-ink sm:col-span-2">
          <input type="checkbox" name="muestra" className="mt-0.5 size-4" />
          <span>
            Es una clase de muestra
            <span className="mt-1 block text-xs text-ink-faint">
              Se ve sin pagar. Es lo que vende el curso.
            </span>
          </span>
        </label>
      </div>

      <Aviso estado={estado} />

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Añadiendo…" : "Añadir clase"}
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

export function QuitarLeccion({
  leccionId,
  slug,
  titulo,
}: {
  leccionId: string;
  slug: string;
  titulo: string;
}) {
  const [estado, enviar, enviando] = useActionState(quitarLeccion, INICIAL);
  const [seguro, setSeguro] = useState(false);

  if (!seguro) {
    return (
      <button
        type="button"
        onClick={() => setSeguro(true)}
        className="text-xs text-ink-faint underline hover:text-red-600"
      >
        Quitar
      </button>
    );
  }

  return (
    <form action={enviar} className="flex items-center gap-2">
      <input type="hidden" name="leccion" value={leccionId} />
      <input type="hidden" name="slug" value={slug} />
      <span className="text-xs text-ink-faint">¿Quitar &quot;{titulo}&quot;?</span>
      <button
        type="submit"
        disabled={enviando}
        className="text-xs text-red-700 underline"
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => setSeguro(false)}
        className="text-xs text-ink-soft underline"
      >
        No
      </button>
      {estado.estado === "error" && (
        <span className="text-xs text-red-700">{estado.mensaje}</span>
      )}
    </form>
  );
}

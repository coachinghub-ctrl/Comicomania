"use client";

import { useActionState, useState } from "react";
import { inscribirme, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Categoria = {
  id: string;
  nombre: string;
  minima: number | null;
  maxima: number | null;
};

/* El formulario de inscripción.

   Las cuatro casillas no son un trámite: son las cuatro cosas distintas que
   alguien tiene que decir que sí antes de que su cara acabe en una pantalla.
   Van separadas, sin marcar y sin un "acepto todo", porque una casilla única
   no es consentimiento de nada en particular.

   Lo que se acepta queda guardado apuntando a la VERSIÓN del texto que estaba
   vigente ese día. Si mañana cambian las bases, lo que esta persona aceptó
   sigue siendo lo que leyó. */
export function Inscripcion({
  concursoId,
  concursoNombre,
  categorias,
  bases,
  tuEdad,
}: {
  concursoId: string;
  concursoNombre: string;
  categorias: Categoria[];
  bases: string | null;
  tuEdad: number | null;
}) {
  const [estado, enviar, enviando] = useActionState(inscribirme, INICIAL);

  // Si sabemos la edad, se preselecciona la categoría que le toca y no se le
  // hace elegir mal para que la base se lo rechace después.
  const suya = categorias.find(
    (c) =>
      tuEdad !== null &&
      (c.minima === null || tuEdad >= c.minima) &&
      (c.maxima === null || tuEdad <= c.maxima),
  );

  const [categoria, setCategoria] = useState(suya?.id ?? "");

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success/40 bg-success/5 p-8">
        <p className="font-display text-2xl text-paper uppercase">
          Estás dentro.
        </p>
        <p className="mt-3 text-muted">{estado.mensaje}</p>
        <p className="mt-3 text-sm text-muted-dim">
          Categoría <strong className="text-paper">{estado.categoria}</strong>,
          con {estado.edad} años a la fecha de referencia del concurso. Esa edad
          queda congelada: cumplir años durante el concurso no te cambia de
          categoría.
        </p>
        <a
          href="/mi"
          className="mt-5 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-red-500"
        >
          Ver mi inscripción
        </a>
      </div>
    );
  }

  const entrada =
    "mt-1 block w-full rounded-md border border-stage-600 bg-stage-800 px-3 py-2.5 text-paper placeholder:text-muted-dim";

  return (
    <form action={enviar} className="rounded-lg border border-stage-600 bg-stage-900 p-6">
      <input type="hidden" name="concurso" value={concursoId} />

      <h3 className="font-display text-xl text-paper uppercase">
        Inscríbete a {concursoNombre}
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted sm:col-span-2">
          Categoría
          <select
            name="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={entrada}
          >
            <option value="">Elige tu categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.minima !== null || c.maxima !== null
                  ? ` · ${c.minima ?? ""}${c.maxima ? `–${c.maxima}` : "+"} años`
                  : ""}
              </option>
            ))}
          </select>
          {tuEdad !== null && (
            <span className="mt-1 block text-xs text-muted-dim">
              Tienes {tuEdad} años a la fecha de referencia del concurso.
              {suya ? ` Te toca ${suya.nombre}.` : ""}
            </span>
          )}
        </label>

        <label className="block text-sm text-muted sm:col-span-2">
          Título de tu video
          <input
            name="titulo"
            required
            placeholder="Mi familia no entiende mi trabajo"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-muted sm:col-span-2">
          Enlace al video
          <input
            name="video"
            required
            inputMode="url"
            placeholder="https://youtu.be/… · https://vimeo.com/… · enlace de Drive"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-muted-dim">
            Súbelo donde quieras y pega el enlace. Que se pueda abrir sin pedir
            permiso: si el revisor tiene que solicitarte acceso, tu video se
            queda esperando.
          </span>
        </label>

        <label className="block text-sm text-muted">
          Cuánto dura
          <input
            name="duracion"
            required
            placeholder="1:45"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-muted-dim">
            Minutos:segundos. Se mide desde el primer fotograma.
          </span>
        </label>

        <label className="block text-sm text-muted">
          De qué va (opcional)
          <input
            name="descripcion"
            placeholder="Observacional, sobre trabajar de noche"
            className={entrada}
          />
        </label>
      </div>

      <fieldset className="mt-6 rounded-md border border-stage-600 bg-stage-800 p-5">
        <legend className="px-2 text-xs tracking-[0.2em] text-gold-400 uppercase">
          Antes de enviar
        </legend>
        <p className="text-sm text-muted-dim">
          Cuatro cosas distintas, cuatro casillas. No hay un &quot;acepto
          todo&quot;: una casilla única no es consentimiento de nada en
          concreto, y esto queda guardado con tu nombre y con la versión exacta
          del texto que estás leyendo hoy.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-start gap-3 text-sm text-muted">
            <input type="checkbox" name="bases" required className="mt-1 size-4 shrink-0" />
            <span>
              He leído y acepto las bases del concurso.
              {bases && (
                <a
                  href={bases}
                  className="ml-1 text-red-300 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Leerlas
                </a>
              )}
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              name="materialPropio"
              required
              className="mt-1 size-4 shrink-0"
            />
            <span>
              La rutina es mía. No es de otro humorista, y si versiono a
              alguien lo digo.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              name="derechos"
              required
              className="mt-1 size-4 shrink-0"
            />
            <span>
              En el video no suena música comercial ni se ve material de
              terceros.{" "}
              <span className="text-muted-dim">
                Esto es lo que más videos deja fuera: una canción de fondo
                convierte tu clip en algo que no se puede publicar.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              name="usoDeImagen"
              required
              className="mt-1 size-4 shrink-0"
            />
            <span>
              Autorizo a COMICOMANÍA a mostrar mi video y mi imagen dentro del
              concurso y en su difusión.{" "}
              <span className="text-muted-dim">
                Sin esto tu video no se puede enseñar, ni siquiera al jurado.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {estado.estado === "error" && (
        <p
          role="alert"
          className="mt-5 rounded-md border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200"
        >
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-6 w-full rounded-md bg-red-600 px-5 py-3 font-semibold text-paper transition-colors hover:bg-red-500 disabled:opacity-60 sm:w-auto"
      >
        {enviando ? "Enviando…" : "Enviar mi video"}
      </button>
    </form>
  );
}

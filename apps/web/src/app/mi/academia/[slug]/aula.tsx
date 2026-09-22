"use client";

import { useActionState, useState } from "react";
import { Reel } from "@/componentes/reel";
import { marcarClase, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Clase = {
  id: string;
  titulo: string;
  tipo: string;
  duracionS: number | null;
  esMuestra: boolean;
  empiezaEn: string | null;
  terminaEn: string | null;
  vista: boolean;
  /** Lo que devuelve contenido_de_leccion: solo llega si puedes verlo. */
  material: string | null;
  sala: string | null;
};

export type Modulo = {
  id: string;
  titulo: string;
  orden: number;
  clases: Clase[];
};

const TIPO: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Lectura",
  QUIZ: "Ejercicio",
  LIVE: "En vivo",
  ASSIGNMENT: "Práctica",
};

function minutos(s: number | null) {
  return s ? `${Math.round(s / 60)} min` : null;
}

function Marcar({
  inscripcion,
  leccion,
  slug,
  vista,
}: {
  inscripcion: string;
  leccion: string;
  slug: string;
  vista: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(marcarClase, INICIAL);

  // Lo que diga el servidor manda sobre lo que se pintó al cargar.
  const marcada = estado.estado === "ok" ? estado.completada : vista;

  return (
    <form action={enviar}>
      <input type="hidden" name="inscripcion" value={inscripcion} />
      <input type="hidden" name="leccion" value={leccion} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="completar" value={marcada ? "no" : "si"} />
      <button
        type="submit"
        disabled={enviando}
        className={
          marcada
            ? "rounded-md border border-success/50 px-4 py-2 text-sm text-success disabled:opacity-60"
            : "rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-paper hover:bg-red-500 disabled:opacity-60"
        }
      >
        {enviando
          ? "Guardando…"
          : marcada
            ? "Vista · desmarcar"
            : "Marcar como vista"}
      </button>
      {estado.estado === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}

/* El aula.

   Una sola clase abierta a la vez, y el temario al lado. Es la forma en que
   alguien estudia de verdad: no abre nueve pestañas, sigue una lista.

   El material y el enlace de la sala llegan ya resueltos desde el servidor:
   esta pieza nunca los pide, porque nunca podría pedirlos — son columnas que
   el navegador no puede leer. */
export function Aula({
  slug,
  inscripcion,
  modulos,
  empezarEn,
}: {
  slug: string;
  inscripcion: string | null;
  modulos: Modulo[];
  empezarEn: string | null;
}) {
  const todas = modulos.flatMap((m) => m.clases);
  const [abierta, setAbierta] = useState(empezarEn ?? todas[0]?.id ?? null);

  const clase = todas.find((c) => c.id === abierta) ?? todas[0] ?? null;
  const indice = clase ? todas.findIndex((c) => c.id === clase.id) : -1;
  const siguiente = indice >= 0 ? todas[indice + 1] : undefined;

  if (!clase) {
    return (
      <p className="rounded-lg border border-stage-600 bg-stage-900 p-6 text-muted">
        Este curso todavía no tiene clases.
      </p>
    );
  }

  const enVivo = clase.tipo === "LIVE";
  const cuando = clase.empiezaEn ? new Date(clase.empiezaEn) : null;
  const yaPaso = cuando ? cuando.getTime() < Date.now() : false;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section className="min-w-0">
        <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
          {TIPO[clase.tipo] ?? clase.tipo}
          {minutos(clase.duracionS) ? ` · ${minutos(clase.duracionS)}` : ""}
        </p>
        <h2 className="font-display mt-2 text-3xl text-paper uppercase">
          {clase.titulo}
        </h2>

        {enVivo && cuando && (
          <div
            className={
              yaPaso
                ? "mt-5 rounded-lg border border-stage-600 bg-stage-800 p-5"
                : "mt-5 rounded-lg border border-gold-400/40 bg-gold-400/5 p-5"
            }
          >
            <p className="font-display text-lg text-paper uppercase">
              {yaPaso ? "Esta clase ya pasó" : "Clase en directo"}
            </p>
            <p className="mt-1 text-muted tabular-nums">
              {cuando.toLocaleString("es", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            {clase.sala ? (
              <a
                href={clase.sala}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-red-500"
              >
                {yaPaso ? "Abrir la sala" : "Entrar a la clase"}
              </a>
            ) : (
              <p className="mt-3 text-sm text-muted-dim">
                El enlace de la sala se publica antes de la clase.
              </p>
            )}
          </div>
        )}

        {clase.material ? (
          <div className="mt-6">
            {/^https?:\/\//i.test(clase.material) ? (
              <Reel url={clase.material} titulo={clase.titulo} />
            ) : (
              <p className="rounded-lg border border-stage-600 bg-stage-900 p-5 text-muted">
                {clase.material}
              </p>
            )}
          </div>
        ) : (
          !enVivo && (
            <p className="mt-6 rounded-lg border border-stage-600 bg-stage-900 p-5 text-muted-dim">
              Esta clase todavía no tiene material publicado.
            </p>
          )
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {inscripcion && (
            <Marcar
              inscripcion={inscripcion}
              leccion={clase.id}
              slug={slug}
              vista={clase.vista}
            />
          )}
          {siguiente && (
            <button
              type="button"
              onClick={() => setAbierta(siguiente.id)}
              className="text-sm text-red-300 underline"
            >
              Siguiente: {siguiente.titulo}
            </button>
          )}
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-xs tracking-wider text-muted-dim uppercase">
          El programa
        </p>
        <ol className="mt-3 space-y-4">
          {modulos.map((m) => (
            <li key={m.id}>
              <p className="font-display text-sm text-paper uppercase">
                {m.orden}. {m.titulo}
              </p>
              <ul className="mt-2 space-y-1">
                {m.clases.map((c) => {
                  const activa = c.id === clase.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setAbierta(c.id)}
                        aria-current={activa ? "true" : undefined}
                        className={
                          activa
                            ? "flex w-full items-center gap-2 rounded-md border border-red-500/50 bg-stage-800 px-3 py-2 text-left text-sm text-paper"
                            : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-stage-800"
                        }
                      >
                        <span
                          aria-hidden
                          className={
                            c.vista
                              ? "size-2 shrink-0 rounded-full bg-success"
                              : "size-2 shrink-0 rounded-full border border-stage-600"
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">{c.titulo}</span>
                        {c.tipo === "LIVE" && (
                          <span className="shrink-0 text-xs text-red-300">
                            en vivo
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

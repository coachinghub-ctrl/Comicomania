"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { agregarRequisito, guardarBases, type Resultado } from "./bases";

const INICIAL: Resultado = { estado: "inicial" };

export type Requisito = {
  id: string;
  order: number;
  title: string;
  detail: string | null;
  fails_when: string | null;
  is_required: boolean;
};

export type ConcursoEditable = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  how_to_enter: string | null;
  invitation_image_url: string | null;
  invitation_image_alt: string | null;
  requisitos: Requisito[];
};

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
      <p role="status" className="mt-3 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
        {estado.mensaje}
      </p>
    );
  }
  return null;
}

export function EditorDeBases({ concurso }: { concurso: ConcursoEditable }) {
  const [estadoBases, guardar, guardando] = useActionState(guardarBases, INICIAL);
  const [estadoReq, agregar, agregando] = useActionState(agregarRequisito, INICIAL);
  const [vistaArte, setVistaArte] = useState<string | null>(
    concurso.invitation_image_url,
  );
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-red-600 underline hover:text-red-700"
      >
        Editar bases y arte · {concurso.requisitos.length} requisitos
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm text-ink uppercase">
          Bases de {concurso.name}
        </h3>
        <a
          href={`/concursos/${concurso.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-red-600 underline"
        >
          Ver la página pública
        </a>
      </div>

      <form action={guardar} className="mt-4">
        <input type="hidden" name="concurso" value={concurso.id} />

        <div className="flex flex-col gap-5 sm:flex-row">
          {/* El arte de invitación: lo que se comparte por WhatsApp. */}
          <div className="shrink-0">
            <div className="h-48 w-36 overflow-hidden rounded-md border border-line bg-surface-2">
              {vistaArte ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vistaArte}
                  alt="Arte de invitación"
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center px-3 text-center text-xs text-ink-faint">
                  Sin arte todavía
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
              className="mt-2 block w-36 text-xs text-ink-soft file:mr-2 file:rounded file:border-0 file:bg-red-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-paper"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <label className="block text-sm text-ink-soft">
              Qué se ve en el arte
              <input
                name="altArte"
                defaultValue={concurso.invitation_image_alt ?? ""}
                placeholder="Cartel negro con la corona roja y la fecha del concurso"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Obligatorio si subes arte. Sin esto, quien usa lector de
                pantalla se queda sin la invitación.
              </span>
            </label>

            <label className="block text-sm text-ink-soft">
              De qué va este concurso
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={concurso.description ?? ""}
                placeholder="Para quién es, qué buscamos, qué se gana."
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>

            <label className="block text-sm text-ink-soft">
              Cómo se participa
              <textarea
                name="comoEntrar"
                rows={2}
                defaultValue={concurso.how_to_enter ?? ""}
                placeholder="Los pasos, en orden."
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
          </div>
        </div>

        <Aviso estado={estadoBases} />

        <Button type="submit" className="mt-4" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar bases"}
        </Button>
      </form>

      <div className="mt-8 border-t border-line pt-5">
        <h4 className="font-display text-sm text-ink uppercase">
          Requisitos ({concurso.requisitos.length})
        </h4>
        <p className="mt-1 text-xs text-ink-faint">
          Uno por línea, no todos en un párrafo: así se pueden marcar como
          lista de chequeo y nadie se salta el de los dos minutos.
        </p>

        {concurso.requisitos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {concurso.requisitos.map((r) => (
              <li key={r.id} className="rounded-md border border-line px-3 py-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-ink-faint tabular-nums">{r.order}.</span>
                  <span className="text-ink">{r.title}</span>
                  {!r.is_required && (
                    <span className="rounded-full border border-line px-2 text-xs text-ink-faint">
                      recomendado
                    </span>
                  )}
                </div>
                {r.detail && <p className="mt-1 text-xs text-ink-soft">{r.detail}</p>}
                {r.fails_when && (
                  <p className="mt-1 text-xs text-red-700">Falla si: {r.fails_when}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <form action={agregar} className="mt-4 rounded-md border border-line bg-surface-2 p-4">
          <input type="hidden" name="concurso" value={concurso.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-ink-soft sm:col-span-2">
              Requisito
              <input
                name="titulo"
                required
                placeholder="Máximo 2 minutos"
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
            <label className="block text-sm text-ink-soft">
              Detalle
              <input
                name="detalle"
                placeholder="Se mide desde el primer fotograma."
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>
            <label className="block text-sm text-ink-soft">
              Falla si…
              <input
                name="falla"
                placeholder="El video dura más de 2:00."
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Esto convierte un rechazo en algo que se puede corregir.
              </span>
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="obligatorio" defaultChecked />
            Es obligatorio
          </label>

          <Aviso estado={estadoReq} />

          <Button type="submit" variante="secundaria" className="mt-3" disabled={agregando}>
            {agregando ? "Agregando…" : "Agregar requisito"}
          </Button>
        </form>
      </div>
    </div>
  );
}

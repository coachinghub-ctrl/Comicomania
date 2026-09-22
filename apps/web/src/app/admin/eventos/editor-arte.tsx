"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { guardarArteDeEvento, type Resultado } from "./arte";

const INICIAL: Resultado = { estado: "inicial" };

export type EventoEditable = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  subtitle: string | null;
  poster_url: string | null;
  poster_alt: string | null;
};

export function EditorDeArte({ evento }: { evento: EventoEditable }) {
  const [estado, guardar, guardando] = useActionState(guardarArteDeEvento, INICIAL);
  const [vista, setVista] = useState<string | null>(evento.poster_url);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs text-red-600 underline hover:text-red-700"
      >
        {evento.poster_url ? "Cambiar el arte" : "Subir el arte"}
      </button>
    );
  }

  return (
    <form action={guardar} className="mt-4 rounded-md border border-line bg-surface-2 p-4">
      <input type="hidden" name="evento" value={evento.id} />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="shrink-0">
          <div className="h-40 w-32 overflow-hidden rounded-md border border-line bg-surface">
            {vista ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vista} alt="Cartel" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center px-2 text-center text-xs text-ink-faint">
                Sin cartel
              </span>
            )}
          </div>
          <input
            type="file"
            name="cartel"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const a = e.target.files?.[0];
              if (a) setVista(URL.createObjectURL(a));
            }}
            className="mt-2 block w-32 text-xs text-ink-soft file:mr-2 file:rounded file:border-0 file:bg-red-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-paper"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-sm text-ink-soft">
            Antetítulo
            <input
              name="subtitulo"
              defaultValue={evento.subtitle ?? ""}
              placeholder="Gran Final"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
          </label>

          <label className="block text-sm text-ink-soft">
            La frase del cartel, en texto
            <input
              name="tagline"
              defaultValue={evento.tagline ?? ""}
              placeholder="El escenario donde el talento se convierte en oportunidad"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Una promesa que solo vive dentro de un JPG no se puede buscar, ni
              citar, ni leer en voz alta.
            </span>
          </label>

          <label className="block text-sm text-ink-soft">
            Qué se ve en el cartel
            <input
              name="alt"
              defaultValue={evento.poster_alt ?? ""}
              placeholder="Un micrófono en un escenario rojo con el público de pie"
              className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Obligatorio si subes cartel. Es lo que más se comparte.
            </span>
          </label>
        </div>
      </div>

      {estado.estado === "error" && (
        <p role="alert" className="mt-3 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}
      {estado.estado === "ok" && (
        <p role="status" className="mt-3 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
          {estado.mensaje}{" "}
          <a href={`/eventos/${evento.slug}`} target="_blank" rel="noreferrer" className="underline">
            Ver la página
          </a>
        </p>
      )}

      <Button type="submit" className="mt-4" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar arte"}
      </Button>
    </form>
  );
}

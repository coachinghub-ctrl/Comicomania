"use client";

import { useRef, useState } from "react";

/* Reproductor para revisar sin salir de la cola.

   Revisar es comparar: abrir cada video en otra pestaña rompe el hilo y hace
   que el revisor pierda dónde iba. Acá se ve en la misma fila.

   Dos cosas pensadas para quien revisa cien al día:
   - El tiempo se muestra y se puede COPIAR, porque un rechazo útil dice "en el
     1:12 se oye una canción con derechos", no "tiene música".
   - Se carga en metadata, no completo: con veinte videos en pantalla, precargar
     todo se come la red del que revisa. */

function reloj(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Reproductor({
  url,
  titulo,
  duracion,
}: {
  url: string;
  titulo: string;
  duracion: number | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [tiempo, setTiempo] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function copiarMarca() {
    try {
      await navigator.clipboard.writeText(reloj(tiempo));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sin permiso de portapapeles no pasa nada: el tiempo está a la vista.
    }
  }

  if (fallo) {
    return (
      <div className="rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          No se pudo reproducir aquí. Puede ser el formato o que el enlace no
          permita incrustarlo.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-red-600 underline"
        >
          Abrir el máster en otra pestaña
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={video}
        src={url}
        controls
        preload="metadata"
        playsInline
        onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
        onError={() => setFallo(true)}
        aria-label={`Video de ${titulo}`}
        className="aspect-video w-full rounded-md border border-line bg-stage-1000"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-ink tabular-nums">
          {reloj(tiempo)}
          {duracion ? ` / ${reloj(duracion)}` : ""}
        </span>
        <button
          type="button"
          onClick={copiarMarca}
          className="text-red-600 underline hover:text-red-700"
        >
          {copiado ? "copiado" : "copiar el minuto"}
        </button>
        {[-10, -5, 5, 10].map((salto) => (
          <button
            key={salto}
            type="button"
            onClick={() => {
              if (video.current) video.current.currentTime += salto;
            }}
            className="rounded border border-line px-1.5 py-0.5 text-ink-faint hover:bg-surface-2"
          >
            {salto > 0 ? `+${salto}s` : `${salto}s`}
          </button>
        ))}
      </div>
    </div>
  );
}

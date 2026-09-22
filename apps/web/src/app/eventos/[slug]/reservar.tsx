"use client";

import { useActionState } from "react";
import { Button } from "@comicomania/ui";
import { reservarLugar, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* Reservar un lugar en un evento gratuito.

   Sin cuenta. Pedir registro para algo gratis pierde a la mitad de la gente
   en el formulario, y lo que se quiere aquí es la lista: quién va a ir, para
   poder escribirle antes y después. El COMICOMANIA ID llega luego, si quiere.

   Solo el correo es obligatorio. El nombre y el teléfono ayudan en la puerta
   y en la campaña, pero no valen perder a alguien por pedirlos. */
export function Reservar({
  slug,
  nombre,
  quedan,
}: {
  slug: string;
  nombre: string;
  quedan: number | null;
}) {
  const [estado, enviar, enviando] = useActionState(reservarLugar, INICIAL);

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6">
        <p className="font-display text-xl text-success uppercase">
          Tu lugar está reservado
        </p>
        <p className="mt-2 text-muted">{estado.mensaje}</p>
      </div>
    );
  }

  if (quedan !== null && quedan <= 0) {
    return (
      <div className="rounded-lg border border-stage-600 bg-stage-800 p-6">
        <p className="font-display text-xl text-paper uppercase">
          Se acabaron los lugares
        </p>
        <p className="mt-2 text-muted">
          El aforo está completo. Si se libera alguno, lo avisamos por nuestras
          redes.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-red-500/40 bg-red-700/10 p-6">
      <input type="hidden" name="evento" value={slug} />

      <p className="font-display text-xl text-paper uppercase">
        Entrada libre · reserva tu lugar
      </p>
      <p className="mt-2 text-muted">
        {quedan !== null
          ? `Quedan ${quedan} ${quedan === 1 ? "lugar" : "lugares"} para ${nombre}.`
          : `Anótate para ${nombre}.`}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-muted sm:col-span-2">
          Tu correo
          <input
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
        </label>
        <label className="block text-sm text-muted">
          Tu nombre (opcional)
          <input
            name="nombre"
            placeholder="Para la lista de la puerta"
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
        </label>
      </div>

      {estado.estado === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {estado.mensaje}
        </p>
      )}

      <Button type="submit" tamano="lg" className="mt-5" disabled={enviando}>
        {enviando ? "Reservando…" : "Reservar mi lugar"}
      </Button>

      <p className="mt-3 text-xs text-muted-dim">
        Te escribimos solo por este evento. No hace falta crear cuenta.
      </p>
    </form>
  );
}

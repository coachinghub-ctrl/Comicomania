"use client";

import { useActionState } from "react";
import { Button } from "@comicomania/ui";
import { enviarEnlace, type EstadoEnvio } from "./acciones";

const INICIAL: EstadoEnvio = { estado: "inicial" };

export function Formulario({ volver }: { volver: string }) {
  const [estado, accion, pendiente] = useActionState(enviarEnlace, INICIAL);

  if (estado.estado === "enviado") {
    return (
      <div
        className="rounded-lg border border-gold-400/40 bg-stage-800 p-6 text-center"
        role="status"
      >
        <p className="font-display text-xl text-gold-400 uppercase">
          Revisa tu correo
        </p>
        <p className="mt-3 text-sm text-muted">
          Te enviamos un enlace a <strong className="text-paper-pure">{estado.email}</strong>.
          Ábrelo desde este mismo dispositivo y quedas dentro.
        </p>
        <p className="mt-4 text-xs text-muted-dim">
          Si no llega en un par de minutos, mira en spam.
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="volver" value={volver} />
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-paper-pure"
        >
          Tu email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          aria-describedby={estado.estado === "error" ? "error-email" : undefined}
          className="h-12 w-full rounded-md border border-stage-600 bg-stage-900 px-4 text-paper-pure placeholder:text-muted-dim focus:border-red-400 focus:outline-none"
        />
      </div>

      {estado.estado === "error" && (
        <p id="error-email" role="alert" className="text-sm text-red-300">
          {estado.mensaje}
        </p>
      )}

      <Button type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Entrar"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-dim">
        Sin contraseña. Te mandamos un enlace y listo.
        <br />
        Si es tu primera vez, tu COMICOMANIA ID se crea solo.
      </p>
    </form>
  );
}

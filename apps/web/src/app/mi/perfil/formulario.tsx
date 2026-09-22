"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { guardarPerfil, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Opcion = { id: string; nombre: string };
export type Ciudad = Opcion & { paisId: string };

export type PerfilActual = {
  nombre: string;
  apellido: string;
  paisId: string;
  ciudadId: string;
  nacimiento: string;
  whatsapp: string;
  handle: string;
  avatarUrl: string | null;
  email: string;
};

const etiquetaError = "mt-1 block text-xs text-red-300";

export function FormularioPerfil({
  actual,
  paises,
  ciudades,
}: {
  actual: PerfilActual;
  paises: Opcion[];
  ciudades: Ciudad[];
}) {
  const [estado, enviar, enviando] = useActionState(guardarPerfil, INICIAL);
  const [pais, setPais] = useState(actual.paisId);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(actual.avatarUrl);

  const ciudadesDelPais = ciudades.filter((c) => c.paisId === pais);
  const error = (campo: string) =>
    estado.estado === "error" && estado.campo === campo ? estado.mensaje : null;

  function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    // Solo para que se vea de inmediato; la validación real es del servidor.
    setPrevisualizacion(URL.createObjectURL(archivo));
  }

  return (
    <form action={enviar} className="space-y-6">
      {/* Foto */}
      <div className="flex flex-wrap items-center gap-5 rounded-lg border border-stage-600 bg-stage-800 p-5">
        <div className="size-20 shrink-0 overflow-hidden rounded-full border border-stage-600 bg-stage-700">
          {previsualizacion ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previsualizacion}
              alt="Tu foto de perfil"
              width={80}
              height={80}
              className="size-full object-cover"
            />
          ) : (
            <span className="font-display flex size-full items-center justify-center text-2xl text-muted-dim">
              {actual.nombre.slice(0, 1).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="block text-sm text-paper-pure">
            Tu foto
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
              onChange={elegirFoto}
              className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-paper"
            />
          </label>
          <p className="mt-1 text-xs text-muted-dim">
            JPG, PNG o WebP, hasta 2 MB. Es la cara que verá el resto de la
            comunidad.
          </p>
          {error("foto") && <span className={etiquetaError}>{error("foto")}</span>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Nombre
          <input
            name="nombre"
            defaultValue={actual.nombre}
            required
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
          {error("nombre") && <span className={etiquetaError}>{error("nombre")}</span>}
        </label>

        <label className="block text-sm text-muted">
          Apellido
          <input
            name="apellido"
            defaultValue={actual.apellido}
            required
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
          {error("apellido") && <span className={etiquetaError}>{error("apellido")}</span>}
        </label>

        <label className="block text-sm text-muted">
          País
          <select
            name="pais"
            required
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          >
            <option value="">Elige…</option>
            {paises.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {error("pais") && <span className={etiquetaError}>{error("pais")}</span>}
        </label>

        <label className="block text-sm text-muted">
          Ciudad
          <select
            name="ciudad"
            required
            defaultValue={actual.ciudadId}
            disabled={!pais}
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure disabled:opacity-50"
          >
            <option value="">Elige…</option>
            {ciudadesDelPais.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {error("ciudad") && <span className={etiquetaError}>{error("ciudad")}</span>}
        </label>

        <label className="block text-sm text-muted">
          Fecha de nacimiento
          <input
            type="date"
            name="nacimiento"
            defaultValue={actual.nacimiento}
            required
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
          <span className="mt-1 block text-xs text-muted-dim">
            De aquí sale tu categoría si concursas. Se congela al cerrar las
            inscripciones y no cambia aunque cumplas años.
          </span>
          {error("nacimiento") && <span className={etiquetaError}>{error("nacimiento")}</span>}
        </label>

        <label className="block text-sm text-muted">
          WhatsApp
          <input
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={actual.whatsapp}
            placeholder="+13055550101"
            required
            className="mt-1 block w-full rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
          />
          <span className="mt-1 block text-xs text-muted-dim">
            Con el código del país. Es por donde te avisamos si pasas de ronda.
          </span>
          {error("whatsapp") && <span className={etiquetaError}>{error("whatsapp")}</span>}
        </label>

        <label className="block text-sm text-muted sm:col-span-2">
          Tu usuario (opcional)
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-dim">comicomania.com/</span>
            <input
              name="handle"
              defaultValue={actual.handle}
              placeholder="tunombre"
              className="block w-full max-w-xs rounded-md border border-stage-600 bg-stage-900 px-3 py-2 text-paper-pure"
            />
          </div>
          <span className="mt-1 block text-xs text-muted-dim">
            Es la dirección de tu perfil público. Se puede dejar para después.
          </span>
          {error("handle") && <span className={etiquetaError}>{error("handle")}</span>}
        </label>
      </div>

      {estado.estado === "error" && !estado.campo && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-700/20 p-3 text-sm text-red-300">
          {estado.mensaje}
        </p>
      )}
      {estado.estado === "ok" && (
        <p role="status" className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          {estado.mensaje}
        </p>
      )}

      <Button type="submit" tamano="lg" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar mi perfil"}
      </Button>
    </form>
  );
}

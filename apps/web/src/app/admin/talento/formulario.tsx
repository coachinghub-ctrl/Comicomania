"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { guardarFicha, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

export type Cuenta = { id: string; nombre: string };

export type Ficha = {
  user_id: string;
  stage_name: string;
  handle: string | null;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  photo_alt: string | null;
  reel_url: string | null;
  reel_title: string | null;
  comedy_styles: string[] | null;
  languages: string[] | null;
  markets: string[] | null;
  set_durations: number[] | null;
  travel_availability: string | null;
  display_order: number | null;
  status: string | null;
  public_visible: boolean;
  legal_name?: string | null;
  booking_contact?: string | null;
};

const BIO_MINIMA = 40;

/* La plantilla de una ficha de repertorio.

   El orden de los campos es el orden en que se decide: primero de quién es,
   luego lo que se ve (nombre, frase, foto, video), luego lo que se busca
   (estilo, idiomas, duración) y al final lo que no es público.

   La casilla de publicar va la última y sabe lo que falta: enseñar el botón
   habilitado para que la base lo rechace después es hacerle perder el tiempo
   a quien rellena. */
export function EditorDeFicha({
  cuentas,
  ficha,
  veContacto,
}: {
  cuentas: Cuenta[];
  ficha?: Ficha;
  veContacto: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(guardarFicha, INICIAL);
  const [abierto, setAbierto] = useState(false);

  const [bio, setBio] = useState(ficha?.bio ?? "");
  const [reel, setReel] = useState(ficha?.reel_url ?? "");
  const [vistaFoto, setVistaFoto] = useState<string | null>(
    ficha?.photo_url ?? null,
  );
  const [hayFotoNueva, setHayFotoNueva] = useState(false);

  const tieneFoto = Boolean(ficha?.photo_url) || hayFotoNueva;
  const faltan = [
    tieneFoto ? null : "una foto",
    reel.trim() ? null : "un video",
    bio.trim().length >= BIO_MINIMA ? null : "una biografía",
  ].filter(Boolean) as string[];

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Listo</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {estado.handle && (
            <a
              href={`/humoristas/${estado.handle}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-red-600 underline"
            >
              Ver cómo quedó
            </a>
          )}
          <button
            type="button"
            onClick={() => location.reload()}
            className="text-sm text-ink-soft underline"
          >
            Seguir editando
          </button>
        </div>
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        {ficha ? `Editar ${ficha.stage_name}` : "Añadir un humorista"}
      </Button>
    );
  }

  const entrada =
    "mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink";

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          ¿De quién es la ficha?
          {ficha ? (
            <>
              <input type="hidden" name="usuario" value={ficha.user_id} />
              <p className="mt-1 rounded-md border border-line bg-surface-2 px-3 py-2 text-ink">
                {ficha.stage_name}
              </p>
            </>
          ) : (
            <select name="usuario" required defaultValue="" className={entrada}>
              <option value="" disabled>
                Elige la cuenta
              </option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
          <span className="mt-1 block text-xs text-ink-faint">
            Una ficha pertenece a una cuenta, no a un nombre suelto: así el
            humorista puede entrar y editarla.
          </span>
        </label>

        <label className="block text-sm text-ink-soft">
          Nombre artístico
          <input
            name="nombre"
            required
            defaultValue={ficha?.stage_name ?? ""}
            placeholder="La Ferrer"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Dirección de la ficha
          <input
            name="handle"
            defaultValue={ficha?.handle ?? ""}
            placeholder="la-ferrer"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Queda en /humoristas/… Si lo dejas vacío sale del nombre.
          </span>
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Una frase que lo resuma
          <input
            name="tagline"
            defaultValue={ficha?.tagline ?? ""}
            placeholder="Observacional, cero filtro, mucho barrio."
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Biografía
          <textarea
            name="bio"
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="De dónde sale, cuánto lleva, de qué habla. Separa los párrafos con una línea en blanco."
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint tabular-nums">
            {bio.trim().length < BIO_MINIMA
              ? `${bio.trim().length} de ${BIO_MINIMA} caracteres mínimos para publicar`
              : "Suficiente para publicar"}
          </span>
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Video de presentación
          <input
            name="reel"
            value={reel}
            onChange={(e) => setReel(e.target.value)}
            placeholder="https://youtu.be/… · https://vimeo.com/… · o un .mp4"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Es una dirección, no un archivo: un reel son decenas de megas y
            necesita transcodificación, y eso todavía no lo hacemos aquí.
            YouTube, Vimeo o un mp4 alojado fuera.
          </span>
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Qué se ve en el video
          <input
            name="reelTitulo"
            defaultValue={ficha?.reel_title ?? ""}
            placeholder="Cinco minutos en el Teatro Martí"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Foto
          <input
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              setHayFotoNueva(Boolean(archivo));
              setVistaFoto(archivo ? URL.createObjectURL(archivo) : ficha?.photo_url ?? null);
            }}
            className="mt-1 block w-full text-sm text-ink-soft"
          />
          <span className="mt-1 block text-xs text-ink-faint">
            JPG, PNG o WebP. Máximo 5 MB. Vertical queda mejor en el repertorio.
          </span>
        </label>

        <label className="block text-sm text-ink-soft">
          Qué se ve en la foto
          <input
            name="altFoto"
            defaultValue={ficha?.photo_alt ?? ""}
            placeholder="La Ferrer en el escenario, micrófono en mano"
            className={entrada}
          />
        </label>

        {vistaFoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vistaFoto}
            alt=""
            className="aspect-4/5 w-40 rounded-md border border-line object-cover sm:col-span-2"
          />
        )}

        <label className="block text-sm text-ink-soft">
          Estilo
          <input
            name="estilos"
            defaultValue={(ficha?.comedy_styles ?? []).join(", ")}
            placeholder="stand-up, observacional"
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Separados por comas.
          </span>
        </label>

        <label className="block text-sm text-ink-soft">
          Idiomas
          <input
            name="idiomas"
            defaultValue={(ficha?.languages ?? []).join(", ")}
            placeholder="es, en"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Dónde trabaja
          <input
            name="mercados"
            defaultValue={(ficha?.markets ?? []).join(", ")}
            placeholder="US.FL, MX"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Duración de sets (minutos)
          <input
            name="duraciones"
            defaultValue={(ficha?.set_durations ?? []).join(", ")}
            placeholder="15, 30, 45"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Disponibilidad de viaje
          <input
            name="viaja"
            defaultValue={ficha?.travel_availability ?? ""}
            placeholder="Viaja dentro de EE. UU. con 15 días de aviso"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Orden en el repertorio
          <input
            type="number"
            name="orden"
            min={1}
            max={999}
            defaultValue={ficha?.display_order ?? 100}
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Menor sale antes.
          </span>
        </label>

        {veContacto && (
          <fieldset className="rounded-md border border-line bg-surface-2 p-4 sm:col-span-2">
            <legend className="px-1 text-xs tracking-wider text-ink-faint uppercase">
              No sale en la ficha pública
            </legend>
            <p className="text-xs text-ink-faint">
              Estos dos campos están restringidos por permisos de columna en
              Postgres: no viajan con la ficha aunque la ficha sea pública.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-ink-soft">
                Nombre legal
                <input
                  name="nombreLegal"
                  defaultValue={ficha?.legal_name ?? ""}
                  className={entrada}
                />
              </label>
              <label className="block text-sm text-ink-soft">
                Contacto de contratación
                <input
                  name="contacto"
                  defaultValue={ficha?.booking_contact ?? ""}
                  className={entrada}
                />
              </label>
            </div>
          </fieldset>
        )}

        <div className="rounded-md border border-line p-4 sm:col-span-2">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="publicar"
              defaultChecked={ficha?.public_visible ?? false}
              disabled={faltan.length > 0}
              className="mt-0.5 size-4"
            />
            <span>
              Publicar en el repertorio
              <span className="mt-1 block text-xs text-ink-faint">
                {faltan.length > 0
                  ? `Todavía falta ${faltan.join(", ")}. Una ficha sin eso es una entrada de listín telefónico.`
                  : "Saldrá en /humoristas y en su página propia."}
              </span>
            </span>
          </label>
        </div>
      </div>

      {estado.estado === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700"
        >
          {estado.mensaje}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar ficha"}
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

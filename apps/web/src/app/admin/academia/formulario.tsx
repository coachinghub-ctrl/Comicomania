"use client";

import { useActionState, useState } from "react";
import { Button } from "@comicomania/ui";
import { crearCurso, type Resultado } from "./acciones";

const INICIAL: Resultado = { estado: "inicial" };

/* La plantilla de un curso.

   Los campos están en el orden en que se decide un curso: primero qué
   promete, luego a quién y en qué formato, luego cuánto cuesta y cuándo, y al
   final la portada.

   La modalidad manda sobre el resto del formulario: un curso grabado no tiene
   fecha de arranque ni cupos, y uno en vivo no se puede publicar sin ellos.
   Se enseña y se esconde aquí para no pedir datos que no aplican. */
export function NuevoCurso() {
  const [estado, enviar, enviando] = useActionState(crearCurso, INICIAL);
  const [abierto, setAbierto] = useState(false);
  const [modalidad, setModalidad] = useState("RECORDED");
  const [vista, setVista] = useState<string | null>(null);

  const enVivo = modalidad === "LIVE" || modalidad === "BLENDED";

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Listo</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {estado.slug && (
            <a
              href={`/admin/academia/${estado.slug}`}
              className="text-sm text-red-600 underline"
            >
              Montar el programa
            </a>
          )}
          <button
            type="button"
            onClick={() => location.reload()}
            className="text-sm text-ink-soft underline"
          >
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)}>
        Crear un curso
      </Button>
    );
  }

  const entrada =
    "mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink";

  return (
    <form action={enviar} className="rounded-lg border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">
          Título
          <input
            name="titulo"
            required
            placeholder="Stand up desde cero"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Subtítulo
          <input
            name="subtitulo"
            placeholder="De la idea al micrófono en ocho semanas"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          La promesa
          <input
            name="promesa"
            required
            placeholder="Al terminar tendrás cinco minutos montados y probados ante público."
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Qué sabrá hacer alguien al terminar. Es lo primero que se lee y lo
            que decide si compra.
          </span>
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Descripción
          <textarea
            name="descripcion"
            rows={4}
            placeholder="Para quién es, de qué va y qué no es."
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft sm:col-span-2">
          Qué incluye
          <textarea
            name="puntos"
            rows={4}
            placeholder={"Una línea por punto:\n8 semanas de acompañamiento\nGrabación de tu set final\nAcceso al micrófono abierto"}
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Nivel
          <select name="nivel" defaultValue="BEGINNER" className={entrada}>
            <option value="BEGINNER">Desde cero</option>
            <option value="INTERMEDIATE">Ya te subiste al escenario</option>
            <option value="ADVANCED">Vives de esto o quieres vivir</option>
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Modalidad
          <select
            name="modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className={entrada}
          >
            <option value="RECORDED">Grabado · se ve cuando se quiera</option>
            <option value="LIVE">En vivo · cohorte con clases en directo</option>
            <option value="BLENDED">Mixto · grabado más encuentros en vivo</option>
          </select>
        </label>

        <label className="block text-sm text-ink-soft">
          Quién lo da
          <input
            name="instructor"
            placeholder="Equipo COMICOMANÍA"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Duración total (horas)
          <input
            type="number"
            name="horas"
            min={0}
            step="0.5"
            placeholder="12"
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Precio
          <input
            type="number"
            name="precio"
            min={0}
            step="1"
            required
            defaultValue={79}
            className={entrada}
          />
        </label>

        <label className="block text-sm text-ink-soft">
          Moneda
          <select name="moneda" defaultValue="USD" className={entrada}>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
            <option value="COP">COP</option>
            <option value="EUR">EUR</option>
          </select>
        </label>

        {enVivo && (
          <>
            <label className="block text-sm text-ink-soft">
              Empieza el
              <input type="date" name="arranca" required className={entrada} />
              <span className="mt-1 block text-xs text-ink-faint">
                Sin fecha no se puede publicar: vender una cohorte sin decir
                cuándo empieza es vender una fecha que no existe.
              </span>
            </label>

            <label className="block text-sm text-ink-soft">
              Cupos
              <input
                type="number"
                name="cupos"
                min={1}
                placeholder="20"
                className={entrada}
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Vacío si no hay límite.
              </span>
            </label>
          </>
        )}

        <label className="block text-sm text-ink-soft">
          Portada
          <input
            type="file"
            name="portada"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              setVista(archivo ? URL.createObjectURL(archivo) : null);
            }}
            className="mt-1 block w-full text-sm text-ink-soft"
          />
          <span className="mt-1 block text-xs text-ink-faint">
            JPG, PNG o WebP, máximo 5 MB. Vertical 4:5 encaja con el catálogo.
          </span>
        </label>

        <label className="block text-sm text-ink-soft">
          Qué se ve en la portada
          <input
            name="altPortada"
            placeholder="Micrófono sobre un escenario vacío con luz cálida"
            className={entrada}
          />
        </label>

        {vista && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vista}
            alt=""
            className="aspect-4/5 w-40 rounded-md border border-line object-cover sm:col-span-2"
          />
        )}

        <label className="block text-sm text-ink-soft">
          Orden en el catálogo
          <input
            type="number"
            name="orden"
            min={1}
            max={999}
            defaultValue={100}
            className={entrada}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            Menor sale antes. De entrada a avanzado.
          </span>
        </label>
      </div>

      <div className="mt-5 rounded-md border border-line bg-surface-2 p-4 text-sm text-ink-soft">
        El curso nace <strong>en borrador</strong> y con tres módulos para
        rellenar. Un curso sin módulos es una ficha de venta, no un programa:
        quien lo compra entra y no hay nada.
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
          {enviando ? "Creando…" : "Crear el curso"}
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

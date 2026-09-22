"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@comicomania/ui";
import { crearAcceso, type Resultado } from "./acciones";

/* El Access Builder.

   Seis pasos y no un formulario de treinta campos, porque un acceso mal dado
   no se nota hasta que alguien hace algo que no debía. Cada paso obliga a
   mirar una decisión a la vez, y el último resume todo antes de escribir.

   Este componente NO es la seguridad: solo ofrece opciones. Quien decide es
   crearAcceso() en el servidor, que vuelve a comprobarlo todo asumiendo que
   lo que llega puede venir manipulado. */

export type Persona = { id: string; nombre: string; email: string };
export type Rol = {
  id: string;
  slug: string;
  name: string;
  secciones: string[];
  acciones: string[];
  denegados: string[];
};
export type Territorio = { id: string; nombre: string; path: string; tipo: string };

const PASOS = [
  "Persona",
  "Rol",
  "Territorio",
  "Secciones",
  "Acciones",
  "Vigencia",
];

const INICIAL: Resultado = { estado: "inicial" };

export function Constructor({
  personas,
  roles,
  territorios,
  puedeGlobal,
  poseeSecciones,
  poseeAcciones,
}: {
  personas: Persona[];
  roles: Rol[];
  territorios: Territorio[];
  puedeGlobal: boolean;
  poseeSecciones: string[];
  poseeAcciones: string[];
}) {
  const [estado, enviar, enviando] = useActionState(crearAcceso, INICIAL);

  const [paso, setPaso] = useState(0);
  const [persona, setPersona] = useState("");
  const [rolId, setRolId] = useState("");
  const [alcance, setAlcance] = useState(puedeGlobal ? "GLOBAL" : "");
  const [secciones, setSecciones] = useState<string[]>([]);
  const [acciones, setAcciones] = useState<string[]>([]);
  const [hasta, setHasta] = useState("");
  const [motivo, setMotivo] = useState("");

  const rol = roles.find((r) => r.id === rolId);
  const territorio = territorios.find((t) => t.id === alcance);

  /* Lo que se puede ofrecer: la plantilla del rol recortada por lo que el que
     otorga posee. Nunca al revés. */
  const ofrecibles = useMemo(() => {
    if (!rol) return { secciones: [], acciones: [] };
    return {
      secciones: rol.secciones.filter((s) => poseeSecciones.includes(s)),
      acciones: rol.acciones.filter((a) => poseeAcciones.includes(a)),
    };
  }, [rol, poseeSecciones, poseeAcciones]);

  function elegirRol(id: string) {
    setRolId(id);
    const r = roles.find((x) => x.id === id);
    if (!r) return;
    // Se precarga la plantilla completa: quitar es más fácil que adivinar.
    setSecciones(r.secciones.filter((s) => poseeSecciones.includes(s)));
    setAcciones(r.acciones.filter((a) => poseeAcciones.includes(a)));
  }

  function alternar(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]);
  }

  const puedeSeguir = [
    Boolean(persona),
    Boolean(rolId),
    Boolean(alcance),
    secciones.length > 0,
    acciones.length > 0,
    motivo.trim().length > 0,
  ][paso];

  if (estado.estado === "ok") {
    return (
      <div className="rounded-lg border border-success-ink/40 bg-success-ink/5 p-6">
        <p className="font-display text-lg text-success-ink uppercase">Listo</p>
        <p className="mt-2 text-sm text-ink-soft">{estado.mensaje}</p>
        <Button className="mt-4" variante="secundaria" onClick={() => location.reload()}>
          Otorgar otro
        </Button>
      </div>
    );
  }

  return (
    <form action={enviar} className="rounded-lg border border-line">
      {/* Los seis pasos, siempre visibles: nadie se pierde en un asistente si
          ve dónde está y cuánto falta. */}
      <ol className="flex flex-wrap gap-x-1 gap-y-2 border-b border-line bg-surface-2 px-4 py-3 text-xs">
        {PASOS.map((nombre, i) => (
          <li key={nombre} className="flex items-center gap-1">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${
                i === paso
                  ? "bg-red-600 text-paper"
                  : i < paso
                    ? "bg-success-ink/15 text-success-ink"
                    : "bg-line text-ink-faint"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === paso ? "text-ink" : "text-ink-faint"}>{nombre}</span>
            {i < PASOS.length - 1 && <span className="mx-1 text-line-strong">›</span>}
          </li>
        ))}
      </ol>

      <div className="p-5">
        {paso === 0 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿A quién?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Solo aparecen personas de tu territorio.
            </p>
            {personas.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">
                No hay nadie registrado en tu alcance todavía.
              </p>
            ) : (
              <select
                name="persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="mt-4 block w-full max-w-md rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              >
                <option value="">Elige una persona…</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {p.email}
                  </option>
                ))}
              </select>
            )}
          </fieldset>
        )}

        {paso === 1 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿Con qué rol?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              El rol es una plantilla. En los pasos siguientes puedes recortarla,
              nunca ampliarla.
            </p>
            <input type="hidden" name="rol" value={rolId} />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => elegirRol(r.id)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    rolId === r.id
                      ? "border-red-600 bg-red-700/5"
                      : "border-line hover:bg-surface-2"
                  }`}
                >
                  <span className="font-display block text-sm text-ink uppercase">
                    {r.slug}
                  </span>
                  <span className="block text-xs text-ink-soft">{r.name}</span>
                  <span className="mt-1 block text-xs text-ink-faint">
                    {r.secciones.length} secciones · {r.acciones.length} acciones
                  </span>
                  {r.denegados.length > 0 && (
                    <span className="mt-1 block text-xs text-red-700">
                      Prohibido siempre: {r.denegados.join(", ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {paso === 2 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿Sobre qué territorio?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Fuera de este territorio, la base no le devolverá ni una fila.
            </p>
            <input
              type="hidden"
              name="tipoAlcance"
              value={alcance === "GLOBAL" ? "GLOBAL" : (territorio?.tipo ?? "")}
            />
            <input
              type="hidden"
              name="alcanceId"
              value={alcance === "GLOBAL" ? "" : (territorio?.id ?? "")}
            />
            <input
              type="hidden"
              name="alcancePath"
              value={alcance === "GLOBAL" ? "" : (territorio?.path ?? "")}
            />
            <select
              value={alcance}
              onChange={(e) => setAlcance(e.target.value)}
              className="mt-4 block w-full max-w-md rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
            >
              <option value="">Elige un territorio…</option>
              {puedeGlobal && <option value="GLOBAL">Global — todo</option>}
              {territorios.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {t.path}
                </option>
              ))}
            </select>
          </fieldset>
        )}

        {paso === 3 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿Qué secciones?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Vienen marcadas las del rol {rol?.slug}. Quita lo que no necesite.
            </p>
            {secciones.map((s) => (
              <input key={s} type="hidden" name="secciones" value={s} />
            ))}
            <div className="mt-4 flex flex-wrap gap-2">
              {ofrecibles.secciones.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => alternar(secciones, setSecciones, s)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    secciones.includes(s)
                      ? "border-red-600 bg-red-700/5 text-red-700"
                      : "border-line text-ink-faint hover:bg-surface-2"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              {secciones.length} de {ofrecibles.secciones.length} marcadas
            </p>
          </fieldset>
        )}

        {paso === 4 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿Qué puede hacer?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Ver es lo mínimo. Todo lo demás se otorga a propósito.
            </p>
            {acciones.map((a) => (
              <input key={a} type="hidden" name="acciones" value={a} />
            ))}
            <div className="mt-4 flex flex-wrap gap-2">
              {ofrecibles.acciones.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => alternar(acciones, setAcciones, a)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    acciones.includes(a)
                      ? "border-red-600 bg-red-700/5 text-red-700"
                      : "border-line text-ink-faint hover:bg-surface-2"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {paso === 5 && (
          <fieldset>
            <legend className="font-display text-lg text-ink uppercase">
              ¿Hasta cuándo, y por qué?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Un acceso temporal caduca solo. Uno sin fecha hay que acordarse de
              quitarlo.
            </p>

            <label className="mt-4 block text-sm text-ink-soft">
              Vence el (opcional)
              <input
                type="date"
                name="hasta"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="mt-1 block rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>

            <label className="mt-4 block text-sm text-ink-soft">
              Motivo — queda en la auditoría, junto a tu nombre
              <textarea
                name="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Coordina el casting de Miami hasta la final."
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink"
              />
            </label>

            <div className="mt-5 rounded-md border border-line bg-surface-2 p-4 text-sm">
              <p className="text-xs tracking-wider text-ink-faint uppercase">
                Vas a otorgar
              </p>
              <p className="mt-2 text-ink">
                <strong>{personas.find((p) => p.id === persona)?.nombre}</strong> como{" "}
                <strong>{rol?.slug}</strong> sobre{" "}
                <strong>{alcance === "GLOBAL" ? "todo (Global)" : territorio?.path}</strong>
              </p>
              <p className="mt-1 text-ink-soft">
                {secciones.length} secciones · {acciones.length} acciones ·{" "}
                {hasta ? `vence el ${hasta}` : "sin fecha de fin"}
              </p>
            </div>
          </fieldset>
        )}

        {estado.estado === "error" && (
          <p role="alert" className="mt-5 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
            {estado.mensaje}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
          disabled={paso === 0}
          className="text-sm text-ink-faint hover:text-ink disabled:opacity-40"
        >
          Atrás
        </button>

        {paso < PASOS.length - 1 ? (
          <Button
            type="button"
            onClick={() => setPaso((p) => p + 1)}
            disabled={!puedeSeguir}
          >
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled={!puedeSeguir || enviando}>
            {enviando ? "Otorgando…" : "Otorgar acceso"}
          </Button>
        )}
      </div>
    </form>
  );
}

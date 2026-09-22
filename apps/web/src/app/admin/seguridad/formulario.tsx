"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@comicomania/ui";
import { crearClienteNavegador } from "@/lib/supabase/client";

/* Enrolar y verificar el segundo factor.

   Va en el cliente porque el código TOTP se teclea y se comprueba contra
   Supabase en el momento: mandarlo al servidor solo añadiría un salto donde el
   código puede caducar. Lo que decide es Supabase, no este componente.

   Dos caminos que la gente confunde y aquí están separados:
   - ENROLAR: registrar el teléfono la primera vez. Se hace una sola vez.
   - VERIFICAR: demostrar en ESTA sesión que tienes el teléfono. Se hace en
     cada sesión, y es lo que sube el nivel a aal2 y abre los diez permisos
     sensibles durante doce horas. */

type Factor = { id: string; friendly_name?: string | null; status: string };

export function SegundoFactor({ nivelInicial }: { nivelInicial: string | null }) {
  const router = useRouter();
  const [supabase] = useState(() => crearClienteNavegador());

  const [factores, setFactores] = useState<Factor[]>([]);
  const [nivel, setNivel] = useState(nivelInicial);
  const [qr, setQr] = useState<{ id: string; svg: string; secreto: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function refrescar() {
    const [{ data: lista }, { data: aal }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setFactores((lista?.totp ?? []) as Factor[]);
    setNivel(aal?.currentLevel ?? null);
  }

  useEffect(() => {
    void refrescar();
    // Solo al montar: después se refresca a mano tras cada acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enrolar() {
    setCargando(true);
    setError(null);
    setAviso(null);
    const { data, error: fallo } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Autenticador ${new Date().toLocaleDateString("es")}`,
    });
    setCargando(false);
    if (fallo) {
      setError(fallo.message);
      return;
    }
    setQr({ id: data.id, svg: data.totp.qr_code, secreto: data.totp.secret });
  }

  async function verificar(factorId: string) {
    setCargando(true);
    setError(null);
    setAviso(null);

    const { data: reto, error: falloReto } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (falloReto) {
      setCargando(false);
      setError(falloReto.message);
      return;
    }

    const { error: falloVerificar } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: reto.id,
      code: codigo.trim(),
    });
    setCargando(false);

    if (falloVerificar) {
      setError(
        falloVerificar.message.includes("Invalid")
          ? "Ese código no es válido. Fíjate que no haya caducado: cambian cada 30 segundos."
          : falloVerificar.message,
      );
      return;
    }

    setCodigo("");
    setQr(null);
    setAviso("Segundo factor verificado. Los permisos sensibles quedan abiertos 12 horas.");
    await refrescar();
    // El servidor tiene que volver a leer el AAL para recalcular los permisos.
    router.refresh();
  }

  const verificado = nivel === "aal2";
  const enrolado = factores.some((f) => f.status === "verified");

  return (
    <div className="max-w-2xl">
      <div
        className={`rounded-lg border p-5 ${
          verificado
            ? "border-success-ink/40 bg-success-ink/5"
            : "border-line bg-surface-2"
        }`}
      >
        <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">
          Estado de esta sesión
        </p>
        <p className="mt-2 text-lg text-ink">
          {verificado
            ? "Segundo factor verificado"
            : enrolado
              ? "Tienes un autenticador, pero no lo has usado en esta sesión"
              : "Sin segundo factor"}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {verificado
            ? "Puedes crear accesos, ver finanzas y emitir reembolsos durante las próximas 12 horas."
            : "Diez permisos están cerrados hasta que verifiques: crear accesos, ver y exportar finanzas, emitir reembolsos, invalidar votos y editar puntajes, entre otros."}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-4 rounded-md border border-success-ink/40 bg-success-ink/5 p-3 text-sm text-success-ink">
          {aviso}
        </p>
      )}

      {/* Enrolar: solo si todavía no hay autenticador. */}
      {!enrolado && !qr && (
        <div className="mt-6 rounded-lg border border-line p-5">
          <h2 className="font-display text-lg text-ink uppercase">
            Registra tu autenticador
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Necesitas una app de códigos en el teléfono: Google Authenticator,
            1Password, Authy o la que ya uses.
          </p>
          <Button className="mt-4" onClick={enrolar} disabled={cargando}>
            {cargando ? "Generando…" : "Generar código QR"}
          </Button>
        </div>
      )}

      {/* El QR solo aparece en el momento del enrolamiento y no se guarda. */}
      {qr && (
        <div className="mt-6 rounded-lg border border-line p-5">
          <h2 className="font-display text-lg text-ink uppercase">
            Escanea esto con tu app
          </h2>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.svg}
              alt="Código QR para el segundo factor"
              width={180}
              height={180}
              className="shrink-0 rounded-md border border-line bg-white p-2"
            />
            <div className="min-w-0">
              <p className="text-sm text-ink-soft">
                Si no puedes escanear, escribe esta clave a mano:
              </p>
              <code className="mt-2 block break-all rounded-md bg-surface-2 p-3 font-mono text-sm text-ink">
                {qr.secreto}
              </code>
              <p className="mt-3 text-xs text-ink-faint">
                Esta clave se muestra una sola vez. Si la pierdes, hay que
                registrar el autenticador de nuevo.
              </p>
            </div>
          </div>

          <label className="mt-5 block text-sm text-ink-soft">
            Código de 6 dígitos que muestra la app
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="mt-2 block w-40 rounded-md border border-line-strong bg-surface px-3 py-2 font-mono text-lg tracking-[0.3em] text-ink"
            />
          </label>
          <Button
            className="mt-4"
            onClick={() => verificar(qr.id)}
            disabled={cargando || codigo.trim().length !== 6}
          >
            {cargando ? "Comprobando…" : "Confirmar"}
          </Button>
        </div>
      )}

      {/* Verificar: ya hay autenticador, falta usarlo en esta sesión. */}
      {enrolado && !verificado && (
        <div className="mt-6 rounded-lg border border-line p-5">
          <h2 className="font-display text-lg text-ink uppercase">
            Verifica esta sesión
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Abre tu app y escribe el código actual.
          </p>
          <label className="mt-4 block text-sm text-ink-soft">
            Código de 6 dígitos
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="mt-2 block w-40 rounded-md border border-line-strong bg-surface px-3 py-2 font-mono text-lg tracking-[0.3em] text-ink"
            />
          </label>
          <Button
            className="mt-4"
            onClick={() => verificar(factores.find((f) => f.status === "verified")!.id)}
            disabled={cargando || codigo.trim().length !== 6}
          >
            {cargando ? "Comprobando…" : "Verificar"}
          </Button>
        </div>
      )}
    </div>
  );
}

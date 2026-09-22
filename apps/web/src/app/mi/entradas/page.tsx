import type { Route } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Logo } from "@comicomania/ui";
import { firmarEntrada } from "@comicomania/domain";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Mis entradas" };

/* Las entradas de una persona, con su QR.

   El QR se dibuja EN EL SERVIDOR. El secreto de la entrada nunca sale de aquí:
   al navegador solo llega la imagen. Si se firmara en el cliente, cualquiera
   podría leer el secreto y fabricarse entradas.

   La firma incluye la versión, así que el QR que guardó quien revendió su
   entrada deja de servir en cuanto se transfiere. */

const COLOR_ESTADO: Record<string, { texto: string; clase: string }> = {
  VALID: { texto: "Válida", clase: "text-success" },
  USED: { texto: "Ya ingresaste", clase: "text-muted-dim" },
  VOID: { texto: "Anulada", clase: "text-red-300" },
  TRANSFERRED: { texto: "Transferida", clase: "text-muted-dim" },
};

export default async function MisEntradas() {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect("/entrar?volver=/mi/entradas" as Route);

  /* RLS solo devuelve las entradas propias. El qr_secret viaja en esa fila y
     por eso la política es estricta: una más laxa equivaldría a repartir
     entradas falsificables. */
  const { data: entradas, error } = await supabase
    .from("tickets")
    .select(
      "id, code, status, qr_secret, qr_version, holder_name, issued_at, ticket_types(name, kind, benefits), events(name, starts_at, timezone, online_url, venues(name, address), cities(name))",
    )
    .eq("user_id", credencial.id)
    .order("issued_at", { ascending: false });

  const conQr = await Promise.all(
    (entradas ?? []).map(async (t) => {
      // Una entrada usada o anulada no lleva QR: mostrarlo invita a intentarlo
      // en la puerta y a discutir con quien escanea.
      if (t.status !== "VALID") return { entrada: t, svg: null };

      const texto = await firmarEntrada(t.id, t.qr_version, t.qr_secret);
      const svg = await QRCode.toString(texto, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      return { entrada: t, svg };
    }),
  );

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <a href="/">
          <Logo ancho={120} prioridad />
        </a>
        <a href="/mi" className="text-sm text-muted transition-colors hover:text-paper-pure">
          Volver
        </a>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-20">
        <h1 className="font-display text-4xl text-paper uppercase">Mis entradas</h1>
        <p className="mt-3 max-w-xl text-muted">
          Muestra este código en la puerta. Funciona sin señal: guárdalo o haz
          una captura antes de salir.
        </p>

        {error && (
          <p role="alert" className="mt-6 rounded-md border border-red-500/40 bg-red-700/20 p-3 text-sm text-red-300">
            No se pudieron leer tus entradas: {error.message}
          </p>
        )}

        {!error && conQr.length === 0 && (
          <div className="mt-10 rounded-lg border border-stage-600 bg-stage-800 p-8 text-center">
            <p className="text-paper-pure">Todavía no tienes entradas.</p>
            <p className="mt-2 text-sm text-muted">
              Cuando compres una, aparece aquí al instante con su código.
            </p>
          </div>
        )}

        <ul className="mt-10 space-y-6">
          {conQr.map(({ entrada, svg }) => {
            const tipo = entrada.ticket_types as {
              name: string;
              kind: string;
              benefits: Record<string, unknown> | null;
            } | null;
            const evento = entrada.events as {
              name: string;
              starts_at: string;
              online_url: string | null;
              venues: { name: string; address: string | null } | null;
              cities: { name: string } | null;
            } | null;
            const estado = COLOR_ESTADO[entrada.status] ?? {
              texto: entrada.status,
              clase: "text-muted",
            };
            const beneficios = (tipo?.benefits as { incluye?: string[] } | null)?.incluye;

            return (
              <li
                key={entrada.id}
                className="overflow-hidden rounded-lg border border-stage-600 bg-stage-800"
              >
                <div className="flex flex-col gap-6 p-6 sm:flex-row">
                  {/* El QR, en blanco sobre blanco: los lectores de puerta
                      leen mucho peor un código invertido. */}
                  <div className="shrink-0">
                    {svg ? (
                      <div
                        className="size-44 rounded-md bg-white p-2 [&>svg]:size-full"
                        // El SVG lo genera la librería de QR a partir de datos
                        // que firmamos acá; no hay entrada de usuario.
                        dangerouslySetInnerHTML={{ __html: svg }}
                        role="img"
                        aria-label={`Código de la entrada ${entrada.code}`}
                      />
                    ) : (
                      <div className="flex size-44 items-center justify-center rounded-md border border-stage-600 bg-stage-900 p-4 text-center">
                        <p className="text-sm text-muted-dim">
                          {entrada.status === "USED"
                            ? "Esta entrada ya se usó"
                            : "Esta entrada no es válida"}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-center font-mono text-xs text-muted-dim">
                      {entrada.code}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                      {tipo?.name ?? "Entrada"}
                    </p>
                    <h2 className="font-display mt-1 text-2xl text-paper uppercase">
                      {evento?.name ?? "Evento"}
                    </h2>
                    <p className="mt-2 text-sm text-paper-pure">
                      {evento?.starts_at
                        ? new Date(evento.starts_at).toLocaleString("es", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })
                        : "Fecha por confirmar"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {evento?.venues?.name ?? evento?.online_url ?? "Sede por confirmar"}
                      {evento?.venues?.address ? ` · ${evento.venues.address}` : ""}
                      {evento?.cities?.name ? ` · ${evento.cities.name}` : ""}
                    </p>

                    {entrada.holder_name && (
                      <p className="mt-3 text-sm text-muted">
                        A nombre de{" "}
                        <span className="text-paper-pure">{entrada.holder_name}</span>
                      </p>
                    )}

                    {beneficios && beneficios.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {beneficios.map((b) => (
                          <li
                            key={b}
                            className="rounded-full border border-gold-400/40 px-2.5 py-0.5 text-xs text-gold-400"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className={`mt-4 text-sm ${estado.clase}`}>{estado.texto}</p>
                  </div>
                </div>

                <p className="border-t border-stage-600 bg-stage-900 px-6 py-3 text-xs text-muted-dim">
                  Este código es solo tuyo y se revisa contra nuestros registros
                  en la puerta. Si transfieres la entrada, el código cambia y el
                  anterior deja de servir.
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

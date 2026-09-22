import { Logo } from "@comicomania/ui";
import { rutaSegura } from "@/lib/volver";
import { Formulario } from "./formulario";
import { proveedoresActivos } from "./activos";
import { Proveedores } from "./proveedores";

export const metadata = { title: "Entrar" };

const ERRORES: Record<string, string> = {
  enlace_invalido: "Ese enlace no es válido. Pide uno nuevo.",
  enlace_vencido: "El enlace venció o ya se usó. Pide uno nuevo.",
  proveedor_desconocido: "Ese proveedor no existe.",
  /* Se dice qué pasa y no "algo salió mal": quien entra necesita saber que no
     es culpa suya, y quien administra necesita saber dónde mirar. */
  proveedor_no_disponible:
    "Ese proveedor todavía no está conectado. Entra con tu correo mientras tanto.",
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; error?: string; p?: string }>;
}) {
  const { volver: pedido, error } = await searchParams;
  const volver = rutaSegura(pedido);
  const activos = await proveedoresActivos();

  return (
    <main className="spotlight flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <a href="/" className="mb-8">
        <Logo ancho={180} prioridad />
      </a>

      <div className="w-full max-w-sm">
        <h1 className="font-display mb-2 text-center text-3xl text-paper uppercase">
          Tu COMICOMANIA ID
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          Una sola identidad para concursar, votar, comprar entradas y estudiar.
        </p>

        {error && ERRORES[error] && (
          <p
            role="alert"
            className="mb-5 rounded-md border border-red-500/40 bg-red-700/20 p-3 text-center text-sm text-red-300"
          >
            {ERRORES[error]}
          </p>
        )}

        <Formulario volver={volver} />
        <Proveedores volver={volver} activos={activos} />
      </div>
    </main>
  );
}

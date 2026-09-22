import { notFound } from "next/navigation";
import { MENU, ROADMAP } from "@/contenido/admin";
import { puedeActor } from "@/lib/autorizacion";

/* Las secciones que el roadmap todavía no entregó. Una sola ruta dinámica en
   vez de diecisiete archivos casi idénticos; las carpetas con nombre propio
   —usuarios, acceso, auditoria— ganan sobre esta y siguen siendo reales.

   El permiso se comprueba igual que en una sección construida: quien no puede
   ver Finanzas tampoco puede ver que Finanzas está prevista. */

function buscarEntrada(modulo: string) {
  for (const grupo of MENU) {
    const entrada = grupo.entradas.find((e) => e.href === `/admin/${modulo}`);
    if (entrada) return { entrada, grupo: grupo.titulo };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  return { title: buscarEntrada(modulo)?.entrada.texto ?? "Sección" };
}

export default async function SeccionPendiente({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;

  const encontrada = buscarEntrada(modulo);
  const pendiente = ROADMAP[modulo];
  if (!encontrada || !pendiente) notFound();

  // 404 y no 403: si no alcanzas la sección, no confirmamos que exista.
  if (!(await puedeActor({ seccion: encontrada.entrada.seccion, accion: "VIEW" }))) {
    notFound();
  }

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">
        {encontrada.grupo}
      </p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        {encontrada.entrada.texto}
      </h1>

      <div className="mt-8 max-w-2xl rounded-lg border border-line bg-surface-2 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display rounded-md bg-stage-1000 px-2.5 py-1 text-sm text-paper">
            Fase {pendiente.fase}
          </span>
          <span className="font-display text-sm text-ink uppercase">
            {pendiente.nombreFase}
          </span>
          <span className="rounded-full border border-red-700/30 px-2.5 py-0.5 text-xs text-red-600">
            {pendiente.cuando}
          </span>
        </div>

        <p className="mt-4 text-ink-soft">{pendiente.que}</p>

        <p className="mt-6 border-t border-line pt-4 text-xs text-ink-faint">
          Todavía no está construida. Aparece en el menú porque tu acceso la
          alcanza: cuando exista, entrarás sin que nadie te dé permisos nuevos.
        </p>
      </div>
    </div>
  );
}

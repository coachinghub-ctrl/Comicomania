import { notFound } from "next/navigation";
import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Imprimir } from "./imprimir";

/* El certificado, a la vista de cualquiera.

   Un certificado que solo puede ver quien lo tiene no sirve para lo único que
   sirve un certificado: que otra persona lo compruebe. Por eso esta página es
   pública y la dirección es la serie.

   Lo que se enseña sale de una función que devuelve exactamente eso —nombre,
   curso, fecha, horas— y nada más. Ni correo, ni ciudad, ni teléfono:
   verificar un certificado no puede convertirse en un buscador de personas.

   No hay generación de PDF. Se imprime, y el navegador guarda en PDF. Es
   menos vistoso que un botón que diga "Descargar PDF" y hace exactamente lo
   mismo sin montar una tubería de documentos que todavía no hace falta. */

const NIVEL: Record<string, string> = {
  BEGINNER: "Nivel de entrada",
  INTERMEDIATE: "Nivel intermedio",
  ADVANCED: "Nivel avanzado",
};

type Certificado = {
  serie: string;
  emitido: string;
  nombre: string | null;
  curso: string;
  nivel: string | null;
  horas: number | null;
  terminado: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serie: string }>;
}) {
  const { serie } = await params;
  return {
    title: `Certificado ${serie.toUpperCase()} · COMICOMANÍA`,
    description: "Verificación de un certificado de COMICOMANÍA Academy.",
  };
}

function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CertificadoPublico({
  params,
}: {
  params: Promise<{ serie: string }>;
}) {
  const { serie } = await params;
  const supabase = await crearClienteServidor();

  const { data } = await supabase.rpc("certificado_por_serie", {
    p_serie: serie,
  });

  const c = data as unknown as Certificado | null;
  if (!c) notFound();

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 print:hidden">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={120} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/academia" className="text-muted hover:text-paper-pure">
            Academia
          </a>
          <Imprimir />
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        {/* La lámina. Se imprime tal cual, sin cabecera ni pie. */}
        <article className="rounded-lg border-2 border-gold-400/50 bg-stage-900 p-8 text-center sm:p-14 print:border-black print:bg-white">
          <p className="text-xs tracking-[0.3em] text-gold-400 uppercase print:text-black">
            COMICOMANÍA Academy
          </p>

          <p className="mt-10 text-sm text-muted print:text-black">
            Se certifica que
          </p>

          <h1 className="font-display mt-2 text-4xl text-paper uppercase sm:text-5xl print:text-black">
            {c.nombre ?? "—"}
          </h1>

          <p className="mt-8 text-sm text-muted print:text-black">
            completó el programa
          </p>

          <p className="font-display mt-2 text-2xl text-red-500 uppercase sm:text-3xl print:text-black">
            {c.curso}
          </p>

          <p className="mt-6 text-muted print:text-black">
            {[
              c.nivel ? (NIVEL[c.nivel] ?? c.nivel) : null,
              c.horas ? `${c.horas} horas` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <p className="mt-10 text-sm text-muted print:text-black">
            {c.terminado
              ? `Terminado el ${fechaLarga(c.terminado)}.`
              : null}{" "}
            Emitido el {fechaLarga(c.emitido)}.
          </p>

          <div className="mt-10 border-t border-stage-600 pt-6 print:border-black">
            <p className="font-mono text-sm tracking-wider text-gold-400 print:text-black">
              {c.serie}
            </p>
            <p className="mt-1 text-xs text-muted-dim print:text-black">
              Compruébalo en comicomania.vercel.app/certificados/{c.serie}
            </p>
          </div>
        </article>

        <section className="mt-8 rounded-lg border border-stage-600 bg-stage-800 p-5 text-sm text-muted print:hidden">
          <p>
            <strong className="text-paper">Este certificado es real.</strong> La
            serie no se puede inventar y no se emite a mano: solo existe cuando
            un curso llega al 100%, y eso lo impide la base de datos, no una
            pantalla.
          </p>
          <p className="mt-2 text-muted-dim">
            Tampoco se borran. Un certificado que desaparece deja a alguien con
            un documento que ya no se puede comprobar, y esa es toda su
            utilidad.
          </p>
        </section>

        <p className="mt-8 text-sm text-muted-dim print:hidden">
          <a href="/mi/academia" className="text-red-300 underline">
            Mis cursos
          </a>
        </p>
      </div>
    </main>
  );
}

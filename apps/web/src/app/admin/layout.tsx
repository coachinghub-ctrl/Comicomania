import type { Route } from "next";
import { redirect } from "next/navigation";
import { puede } from "@comicomania/authz";
import { Logo } from "@comicomania/ui";
import { MENU } from "@/contenido/admin";
import { cargarActor } from "@/lib/autorizacion";

export const metadata = { title: { default: "Admin", template: "%s · Admin" } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await cargarActor();
  if (actor.esAnonimo) redirect("/entrar?volver=/admin" as Route);

  // El menú se dibuja desde los permisos efectivos: lo que no puedes hacer no
  // aparece. No es seguridad —esa está en el servidor y en RLS— pero evita
  // que alguien pierda el tiempo con puertas cerradas.
  const grupos = MENU.map((grupo) => ({
    ...grupo,
    entradas: grupo.entradas.filter(
      (e) => puede(actor, { seccion: e.seccion, accion: "VIEW" }).permitido,
    ),
  })).filter((grupo) => grupo.entradas.length > 0);

  if (grupos.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 text-center">
        <div>
          <Logo ancho={140} prioridad />
          <h1 className="font-display mt-8 text-2xl text-paper uppercase">
            No tienes acceso al panel
          </h1>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Tu cuenta existe, pero nadie te ha otorgado permisos todavía. Pídele
            un acceso a quien administre tu territorio.
          </p>
          <a href="/mi" className="mt-6 inline-block text-sm text-red-300 hover:text-red-400">
            Ir a Mi COMICOMANÍA
          </a>
        </div>
      </main>
    );
  }

  // Los territorios que administra, tal como se los dibujamos en la cabecera.
  const territorios = [
    ...new Set(
      actor.grants
        .filter((g) => g.estado === "ACTIVE")
        .map((g) => (g.tipoAlcance === "GLOBAL" ? "Global" : (g.alcancePath ?? "—"))),
    ),
  ];

  /* Negro a la izquierda, blanco a la derecha. El negro es el fondo del
     armazón: así la columna del menú llega hasta abajo sola, sin calcular
     alturas contra la cabecera. */
  return (
    <div className="flex min-h-dvh flex-col bg-stage-1000">
      <header className="sticky top-0 z-20 shrink-0 border-b border-stage-600 bg-stage-1000/95 backdrop-blur-sm">
        {/* Sin centrar: el logo tiene que caer sobre la columna del menú, y un
            max-w centrado lo dejaba flotando a media distancia. */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:pr-8">
          <div className="flex items-center gap-4">
            {/* El logo completo, no solo las máscaras: el panel también es
                COMICOMANÍA. 88 px es lo que pide la columna del menú sin que la
                cabecera se coma la pantalla; por debajo de 48 las dos máscaras
                se vuelven una mancha y habría que ir a la variante mini. */}
            <a href="/admin" aria-label="Panel">
              <Logo ancho={88} prioridad />
            </a>
            {/* ScopeBadge: siempre visible, para que nadie olvide en qué
                territorio está operando. */}
            <span
              className="rounded-full border border-gold-400/40 px-3 py-1 text-xs tracking-wide text-gold-400 uppercase"
              title="Territorio que administras"
            >
              {territorios.join(" · ")}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:block">{actor.email}</span>
            <form action="/auth/salir" method="post">
              <button className="text-muted transition-colors hover:text-paper-pure">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label="Secciones" className="hidden w-56 shrink-0 px-4 py-7 lg:block">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="mb-7">
              <p className="mb-2 text-[0.65rem] tracking-[0.2em] text-muted-dim uppercase">
                {grupo.titulo}
              </p>
              <ul className="space-y-0.5">
                {grupo.entradas.map((entrada) => (
                  <li key={entrada.href}>
                    <a
                      href={entrada.href}
                      className="block rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-stage-800 hover:text-paper-pure"
                    >
                      {entrada.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* text-ink va acá y no en cada elemento: el body hereda blanco para
            el fondo negro, y sin esto cualquier texto nuevo nacería invisible. */}
        <main className="min-w-0 flex-1 bg-surface px-5 py-8 text-ink sm:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

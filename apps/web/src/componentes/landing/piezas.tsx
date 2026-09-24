import type { ReactNode } from "react";

/* Los tres fondos de la página.

   "claro" no es un tema alternativo: es el mismo sitio cambiando de registro.
   El negro es el escenario, y una página entera de escenario cansa — a la
   tercera sección el ojo deja de distinguir dónde termina una y empieza otra.
   Una banda blanca corta esa inercia y hace que lo que hay dentro se lea como
   un documento y no como un cartel.

   Por eso no se alternan todas. Dos o tres bandas claras en toda la página
   dan ritmo; alternar una sí y una no da cebra, que es otra forma de que todo
   se vea igual.

   Ojo con el borde: border-stage-600 es un granate oscuro y sobre blanco se
   ve como una raya sucia. Cada fondo trae el suyo. */
const FONDOS = {
  base: "border-stage-600 bg-stage-1000",
  elevado: "border-stage-600 bg-stage-900",
  claro: "border-line-strong bg-surface text-ink",
} as const;

export type Fondo = keyof typeof FONDOS;

export function Seccion({
  id,
  children,
  className = "",
  fondo = "base",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  fondo?: Fondo;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t ${FONDOS[fondo]} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">{children}</div>
    </section>
  );
}

/* El antetítulo, en dorado.

   Sobre claro NO puede ser gold-400: da 1,42:1 y es texto pequeño con mucho
   espaciado, que ya de por sí se lee peor. gold-ink es el mismo ámbar bajado
   hasta 6,16:1. Ver packages/ui/src/tokens.css. */
export function Antetitulo({
  children,
  claro = false,
}: {
  children: ReactNode;
  claro?: boolean;
}) {
  return (
    <p
      className={`mb-4 text-xs tracking-[0.3em] uppercase ${
        claro ? "text-gold-ink" : "text-gold-400"
      }`}
    >
      {children}
    </p>
  );
}

export function Titulo({
  children,
  className = "",
  claro = false,
}: {
  children: ReactNode;
  className?: string;
  claro?: boolean;
}) {
  return (
    <h2
      className={`font-display text-4xl leading-[0.95] text-balance uppercase sm:text-5xl ${
        claro ? "text-ink" : "text-paper"
      } ${className}`}
    >
      {children}
    </h2>
  );
}

/** Franja de verbos que se desplaza. El movimiento ES el mensaje. */
export function Marquesina({ verbos }: { verbos: readonly string[] }) {
  const doble = [...verbos, ...verbos];
  return (
    <div
      className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      aria-label={verbos.join(", ")}
    >
      <ul className="marquesina flex w-max gap-8" aria-hidden>
        {doble.map((verbo, i) => (
          <li
            key={`${verbo}-${i}`}
            className="font-display text-lg tracking-wide text-paper/70 uppercase sm:text-xl"
          >
            {verbo}
            <span className="ml-8 text-red-500">·</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

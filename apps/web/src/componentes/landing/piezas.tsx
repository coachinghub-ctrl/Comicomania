import type { ReactNode } from "react";

export function Seccion({
  id,
  children,
  className = "",
  fondo = "base",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  fondo?: "base" | "elevado";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-stage-600 ${
        fondo === "elevado" ? "bg-stage-900" : "bg-stage-1000"
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">{children}</div>
    </section>
  );
}

export function Antetitulo({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs tracking-[0.3em] text-gold-400 uppercase">
      {children}
    </p>
  );
}

export function Titulo({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-4xl leading-[0.95] text-balance text-paper uppercase sm:text-5xl ${className}`}
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

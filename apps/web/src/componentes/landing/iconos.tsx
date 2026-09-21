import type { SVGProps } from "react";

/* Iconografía del journey.
   Vocabulario gráfico de la marca: arcos de sonido, escenario, micrófono,
   expansión. Trazo de 1.6, extremos redondeados, currentColor — heredan el
   color de donde se pongan y no pesan ni una petición extra. */

type Props = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Descubre: una lente que encuentra una sonrisa. */
export function IconoDescubre(props: Props) {
  return (
    <Base {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.6-4.6" />
      <path d="M8 10.5c.7 1.8 4.3 1.8 5 0" />
    </Base>
  );
}

/** Mira: pantalla de escenario con el play. */
export function IconoMira(props: Props) {
  return (
    <Base {...props}>
      <rect x="2.5" y="4.5" width="19" height="13" rx="2.5" />
      <path d="M10 9.2l4.2 2.3-4.2 2.3z" fill="currentColor" stroke="none" />
      <path d="M8 21h8" />
    </Base>
  );
}

/** Vota: el impulso que levanta a alguien. Arcos de onda sobre el gesto. */
export function IconoVota(props: Props) {
  return (
    <Base {...props}>
      <path d="M8.5 21v-8.5l3.6-7.2a1.8 1.8 0 013.4.8V11h3.6a2 2 0 011.95 2.45l-1.3 5.6A2 2 0 0117.3 21z" />
      <path d="M5 12.5v8.5" />
    </Base>
  );
}

/** Comparte: el humor viajando de persona a persona. */
export function IconoComparte(props: Props) {
  return (
    <Base {...props}>
      <circle cx="18" cy="5.5" r="2.8" />
      <circle cx="6" cy="12" r="2.8" />
      <circle cx="18" cy="18.5" r="2.8" />
      <path d="M8.5 10.7l7-3.9M8.5 13.3l7 3.9" />
    </Base>
  );
}

/** Aprende: libro abierto. */
export function IconoAprende(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 6.5C10.4 5.2 8.3 4.5 5.5 4.5H3v13h2.5c2.8 0 4.9.7 6.5 2 1.6-1.3 3.7-2 6.5-2H21v-13h-2.5c-2.8 0-4.9.7-6.5 2z" />
      <path d="M12 6.5v13" />
    </Base>
  );
}

/** Participa: el micrófono. El objeto central de toda la marca. */
export function IconoParticipa(props: Props) {
  return (
    <Base {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0" />
      <path d="M12 17.5V21M9 21h6" />
    </Base>
  );
}

/** Crece: la audiencia que sube, con la curva por encima. */
export function IconoCrece(props: Props) {
  return (
    <Base {...props}>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5v-3.5M11 20.5v-6.5M15.5 20.5v-9.5M20 20.5v-13" />
      <path d="M4.5 9.5l4-3.5 3.5 2.5 5-4.5" />
      <path d="M13.5 4h3.5v3.5" />
    </Base>
  );
}

/** Conecta: el mundo con las ondas cruzando fronteras. */
export function IconoConecta(props: Props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.4 3.5 5.3 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.3-3.5-8.5S9.7 5.9 12 3.5z" />
    </Base>
  );
}

export const ICONOS: Record<string, (p: Props) => React.JSX.Element> = {
  Descubre: IconoDescubre,
  Mira: IconoMira,
  Vota: IconoVota,
  Comparte: IconoComparte,
  Aprende: IconoAprende,
  Participa: IconoParticipa,
  Crece: IconoCrece,
  Conecta: IconoConecta,
};

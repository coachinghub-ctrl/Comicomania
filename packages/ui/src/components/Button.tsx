import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variante = "primaria" | "secundaria" | "fantasma" | "premio";
type Tamano = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide " +
  "transition-[background-color,border-color,transform] duration-150 ease-stage " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-40 rounded-md";

/* El relleno rojo usa red-600 y no red-500: sobre red-500 el crema da 3,94:1
   y reprueba AA. Sobre red-600 llega a 6,40:1. Ver docs/11. */
const variantes: Record<Variante, string> = {
  primaria: "bg-red-600 text-paper hover:bg-red-500 border border-red-500/40",
  secundaria:
    "bg-stage-700 text-paper-pure hover:bg-stage-600 border border-stage-600",
  fantasma: "text-paper-pure hover:bg-stage-800 border border-transparent",
  // Oro + texto negro = 14,3:1, la combinación más legible de la paleta.
  premio: "bg-gold-400 text-stage-900 hover:bg-gold-500 border border-gold-700/30",
};

const tamanos: Record<Tamano, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg",
};

function clases(variante: Variante, tamano: Tamano, extra?: string) {
  return [base, variantes[variante], tamanos[tamano], extra].filter(Boolean).join(" ");
}

type PropsBoton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
};

export function Button({
  variante = "primaria",
  tamano = "md",
  className,
  ...props
}: PropsBoton) {
  return <button className={clases(variante, tamano, className)} {...props} />;
}

type PropsEnlace = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: Variante;
  tamano?: Tamano;
};

export function ButtonLink({
  variante = "primaria",
  tamano = "md",
  className,
  ...props
}: PropsEnlace) {
  return <a className={clases(variante, tamano, className)} {...props} />;
}

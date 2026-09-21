type Props = {
  ciudad: string;
  estado?: "abierto" | "votacion" | "proximo";
  href?: string;
};

const estilos = {
  abierto: "border-gold-400/50 text-gold-400",
  votacion: "border-red-400/60 text-red-300",
  proximo: "border-stage-600 text-muted",
} as const;

const etiquetas = {
  abierto: "Inscripciones abiertas",
  votacion: "Votación en vivo",
  proximo: "Próximamente",
} as const;

export function CityPill({ ciudad, estado = "proximo", href }: Props) {
  const Etiqueta = href ? "a" : "span";
  return (
    <Etiqueta
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-150 ease-stage hover:bg-stage-800 ${estilos[estado]}`}
    >
      {estado === "votacion" && (
        <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
      )}
      <span className="font-semibold text-paper-pure">{ciudad}</span>
      <span className="text-xs opacity-80">{etiquetas[estado]}</span>
    </Etiqueta>
  );
}

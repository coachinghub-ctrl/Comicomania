/* El logo trae su propia sombra y su propio contorno: nunca se le agrega
   borde, sombra ni filtro. El aire alrededor se pone acá, no en el archivo,
   porque el maestro casi no trae margen propio. */
type Props = {
  /** "completo" = máscaras + cinta. "mascaras" = solo las máscaras (iconos). */
  variante?: "completo" | "mascaras";
  /** Ancho en px. Bajo 48 px usa "mini": las dos máscaras se vuelven una mancha. */
  ancho?: number;
  mini?: boolean;
  className?: string;
  prioridad?: boolean;
};

export function Logo({
  variante = "completo",
  ancho = 240,
  mini = false,
  className,
  prioridad = false,
}: Props) {
  const src = mini
    ? "/brand/comicomania-mascara-mini-512.png"
    : variante === "mascaras"
      ? "/brand/comicomania-mascaras-512.png"
      : "/brand/comicomania-logo-sombra-1080.png";
  const proporcion = variante === "completo" && !mini ? 966 / 1080 : 1;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="COMICOMANÍA"
      width={ancho}
      height={Math.round(ancho * proporcion)}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      className={className}
    />
  );
}

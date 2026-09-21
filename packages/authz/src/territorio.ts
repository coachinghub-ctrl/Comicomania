/**
 * Contención de territorio: GLOBAL ⊃ COUNTRY ⊃ REGION ⊃ CITY.
 *
 * El path va separado por puntos ('US.FL.MIA'), así que la contención es una
 * comparación de prefijo — pero SOLO en el límite del punto. Sin esa
 * condición, un grant sobre 'US.F' abarcaría Florida entera, y un grant
 * sobre la ciudad 'MX.CDMX.CDMX' abarcaría cualquier path que empiece igual.
 * Es el bug silencioso más caro de este modelo: no falla, filtra.
 */
export function contieneTerritorio(
  alcancePath: string | null | undefined,
  objetoPath: string | null | undefined,
): boolean {
  if (!alcancePath) return false;
  if (!objetoPath) return false;
  if (alcancePath === objetoPath) return true;
  return objetoPath.startsWith(`${alcancePath}.`);
}

/** Profundidad del territorio: 'US' = 1, 'US.FL' = 2, 'US.FL.MIA' = 3. */
export function profundidad(path: string | null | undefined): number {
  if (!path) return 0;
  return path.split(".").length;
}

/* Cálculo del puntaje de una ronda.

   Es una función pura a propósito: mismo input, mismo resultado, sin base de
   datos, sin reloj, sin azar. Quien reclame un resultado tiene derecho a que
   se le pueda reproducir el cálculo delante, y eso no se puede hacer con una
   consulta que devuelve algo distinto cada vez.

   Los resultados se materializan en `round_results` al resolver la ronda,
   junto con la configuración usada. Cambiar los pesos después no reescribe la
   historia: reescribir la historia es la forma más rápida de perder un
   concurso en un juzgado.

   Todo error es una EXCEPCIÓN y no un valor por defecto. Un puntaje mal
   calculado que devuelve cero se ve igual que un participante que lo hizo mal:
   es preferible que el cálculo se niegue a continuar. */

export type Criterio = { slug: string; peso: number };
export type Escala = { min: number; max: number; paso: number };
export type Mezcla = { jurado: number; audiencia: number };

export type ConfiguracionPuntaje = {
  criterios: Criterio[];
  escala: Escala;
  mezcla: Mezcla;
};

export type NotaDeJuez = {
  juezId: string;
  /** slug del criterio → puntaje en la escala del concurso */
  puntajes: Record<string, number>;
};

export type PuntajeDeRonda = {
  jurado: number | null;
  audiencia: number | null;
  final: number;
};

export class ErrorDePuntaje extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDePuntaje";
  }
}

/** Redondeo a dos decimales, medio hacia arriba. Fijo para que el mismo
 *  input dé el mismo número en cualquier máquina. */
export function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function validarConfiguracion(config: ConfiguracionPuntaje) {
  if (config.criterios.length === 0) {
    throw new ErrorDePuntaje("La configuración no tiene criterios.");
  }
  const slugs = new Set(config.criterios.map((c) => c.slug));
  if (slugs.size !== config.criterios.length) {
    throw new ErrorDePuntaje("Hay criterios repetidos.");
  }
  if (config.criterios.some((c) => c.peso < 0)) {
    throw new ErrorDePuntaje("Un criterio no puede pesar menos que cero.");
  }
  const suma = config.criterios.reduce((t, c) => t + c.peso, 0);
  if (suma <= 0) {
    throw new ErrorDePuntaje("Los pesos suman cero: no hay nada que ponderar.");
  }
  if (config.escala.max <= config.escala.min) {
    throw new ErrorDePuntaje("La escala está al revés o es de un solo punto.");
  }
  if (config.mezcla.jurado < 0 || config.mezcla.audiencia < 0) {
    throw new ErrorDePuntaje("La mezcla no admite porcentajes negativos.");
  }
  if (config.mezcla.jurado + config.mezcla.audiencia <= 0) {
    throw new ErrorDePuntaje("La mezcla suma cero: el resultado no existiría.");
  }
}

/** La nota de un juez, normalizada a 0–100 según la escala del concurso. */
export function notaNormalizada(
  config: ConfiguracionPuntaje,
  nota: NotaDeJuez,
): number {
  validarConfiguracion(config);

  const { min, max } = config.escala;
  const sumaPesos = config.criterios.reduce((t, c) => t + c.peso, 0);
  let acumulado = 0;

  for (const criterio of config.criterios) {
    const valor = nota.puntajes[criterio.slug];

    /* Un criterio sin nota NO vale cero. Si un juez se saltó "presencia", el
       participante no tiene por qué cargar con esa omisión: el cálculo se
       detiene y alguien la completa. */
    if (valor === undefined || valor === null) {
      throw new ErrorDePuntaje(
        `El juez ${nota.juezId} no puntuó "${criterio.slug}".`,
      );
    }
    if (!Number.isFinite(valor)) {
      throw new ErrorDePuntaje(
        `El puntaje de ${nota.juezId} en "${criterio.slug}" no es un número.`,
      );
    }
    if (valor < min || valor > max) {
      throw new ErrorDePuntaje(
        `El puntaje de ${nota.juezId} en "${criterio.slug}" (${valor}) se sale de la escala ${min}–${max}.`,
      );
    }

    // Cada criterio se lleva a 0–1 dentro de la escala y luego se pondera.
    const enUnidad = (valor - min) / (max - min);
    acumulado += enUnidad * (criterio.peso / sumaPesos);
  }

  return acumulado * 100;
}

/** El promedio simple de los jueces. Simple a propósito: descartar extremos
 *  suena más justo, pero con tres o cuatro jueces descarta casi todo. */
export function puntajeDeJurado(
  config: ConfiguracionPuntaje,
  notas: NotaDeJuez[],
): number {
  if (notas.length === 0) {
    throw new ErrorDePuntaje("No hay notas de jurado para promediar.");
  }
  const suma = notas.reduce((t, n) => t + notaNormalizada(config, n), 0);
  return suma / notas.length;
}

/** Los votos, normalizados contra el más votado de la ronda.
 *
 *  Es relativo y no absoluto: con 40 votos no se sabe si es mucho o poco sin
 *  saber cuántos sacó el primero. El más votado se lleva 100 y el resto se
 *  mide contra él. */
export function puntajeDeAudiencia(votos: number, votosDelMayor: number): number {
  if (votos < 0 || votosDelMayor < 0) {
    throw new ErrorDePuntaje("Los votos no pueden ser negativos.");
  }
  if (votos > votosDelMayor) {
    throw new ErrorDePuntaje(
      `Alguien tiene ${votos} votos y el máximo declarado es ${votosDelMayor}.`,
    );
  }
  // Nadie votó: todos empatan en cero, que es la verdad.
  if (votosDelMayor === 0) return 0;
  return (votos / votosDelMayor) * 100;
}

export function puntajeFinal(
  config: ConfiguracionPuntaje,
  notas: NotaDeJuez[],
  votos: number,
  votosDelMayor: number,
): PuntajeDeRonda {
  validarConfiguracion(config);

  const { jurado: pesoJurado, audiencia: pesoAudiencia } = config.mezcla;
  const sumaMezcla = pesoJurado + pesoAudiencia;

  /* Si el jurado pesa y no hay notas, el cálculo se niega. Publicar un
     resultado con la parte del jurado inventada en cero convertiría una ronda
     sin puntuar en una ronda perdida. */
  const jurado = pesoJurado > 0 ? puntajeDeJurado(config, notas) : null;
  const audiencia =
    pesoAudiencia > 0 ? puntajeDeAudiencia(votos, votosDelMayor) : null;

  const final =
    ((jurado ?? 0) * pesoJurado + (audiencia ?? 0) * pesoAudiencia) / sumaMezcla;

  return {
    jurado: jurado === null ? null : redondear(jurado),
    audiencia: audiencia === null ? null : redondear(audiencia),
    final: redondear(final),
  };
}

/** La configuración recomendada en docs/04. Se copia al crear la ronda y se
 *  congela en el resultado: es un punto de partida, no una constante. */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionPuntaje = {
  criterios: [
    { slug: "originalidad", peso: 30 },
    { slug: "risa", peso: 25 },
    { slug: "presencia", peso: 15 },
    { slug: "creatividad", peso: 15 },
    { slug: "conexion", peso: 15 },
  ],
  escala: { min: 1, max: 10, paso: 0.5 },
  mezcla: { jurado: 70, audiencia: 30 },
};

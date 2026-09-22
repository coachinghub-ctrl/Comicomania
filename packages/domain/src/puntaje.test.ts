import { describe, expect, it } from "vitest";
import {
  CONFIGURACION_POR_DEFECTO,
  ErrorDePuntaje,
  notaNormalizada,
  puntajeDeAudiencia,
  puntajeDeJurado,
  puntajeFinal,
  redondear,
  type ConfiguracionPuntaje,
  type NotaDeJuez,
} from "./puntaje";

/* Tests de tabla, como pide docs/04. El cálculo que decide quién gana un
   concurso tiene que ser reproducible delante de quien reclame. */

const CONFIG = CONFIGURACION_POR_DEFECTO;

function nota(juezId: string, valor: number): NotaDeJuez {
  return {
    juezId,
    puntajes: Object.fromEntries(CONFIG.criterios.map((c) => [c.slug, valor])),
  };
}

describe("redondeo", () => {
  it.each([
    [1.005, 1.01],
    [2.344, 2.34],
    [2.345, 2.35],
    [100, 100],
    [0, 0],
  ])("redondea %s a %s", (entrada, esperado) => {
    expect(redondear(entrada)).toBe(esperado);
  });
});

describe("nota de un juez", () => {
  it.each([
    [1, 0],    // el mínimo de la escala es cero, no uno
    [10, 100], // el máximo es cien
    [5.5, 50], // el punto medio de 1–10
  ])("puntuar todo en %s da %s sobre 100", (valor, esperado) => {
    expect(redondear(notaNormalizada(CONFIG, nota("j1", valor)))).toBe(esperado);
  });

  it("pondera por peso y no por cantidad de criterios", () => {
    // Solo originalidad (peso 30) al máximo; el resto al mínimo.
    const parcial: NotaDeJuez = {
      juezId: "j1",
      puntajes: { originalidad: 10, risa: 1, presencia: 1, creatividad: 1, conexion: 1 },
    };
    // 30 de 100 puntos de peso → 30 sobre 100.
    expect(redondear(notaNormalizada(CONFIG, parcial))).toBe(30);
  });

  it("normaliza aunque los pesos no sumen 100", () => {
    const raro: ConfiguracionPuntaje = {
      criterios: [
        { slug: "a", peso: 1 },
        { slug: "b", peso: 3 },
      ],
      escala: { min: 0, max: 10, paso: 1 },
      mezcla: { jurado: 100, audiencia: 0 },
    };
    // a al máximo, b al mínimo → 1/4 del total.
    expect(redondear(notaNormalizada(raro, { juezId: "j", puntajes: { a: 10, b: 0 } }))).toBe(25);
  });

  it("un criterio sin puntuar detiene el cálculo, no vale cero", () => {
    const incompleta: NotaDeJuez = {
      juezId: "olvidadizo",
      puntajes: { originalidad: 8, risa: 7, creatividad: 6, conexion: 6 },
    };
    expect(() => notaNormalizada(CONFIG, incompleta)).toThrow(ErrorDePuntaje);
    expect(() => notaNormalizada(CONFIG, incompleta)).toThrow(/presencia/);
  });

  it("rechaza un puntaje fuera de la escala", () => {
    expect(() => notaNormalizada(CONFIG, nota("tramposo", 11))).toThrow(/escala/);
    expect(() => notaNormalizada(CONFIG, nota("tramposo", 0))).toThrow(/escala/);
  });

  it("rechaza configuraciones imposibles", () => {
    expect(() =>
      notaNormalizada({ ...CONFIG, criterios: [] }, nota("j", 5)),
    ).toThrow(/criterios/);
    expect(() =>
      notaNormalizada(
        { ...CONFIG, criterios: [{ slug: "a", peso: 1 }, { slug: "a", peso: 2 }] },
        { juezId: "j", puntajes: { a: 5 } },
      ),
    ).toThrow(/repetidos/);
    expect(() =>
      notaNormalizada({ ...CONFIG, escala: { min: 10, max: 1, paso: 1 } }, nota("j", 5)),
    ).toThrow(/escala/);
  });
});

describe("promedio del jurado", () => {
  it("promedia a todos por igual", () => {
    const notas = [nota("a", 10), nota("b", 1)]; // 100 y 0
    expect(redondear(puntajeDeJurado(CONFIG, notas))).toBe(50);
  });

  it("sin notas no inventa un promedio", () => {
    expect(() => puntajeDeJurado(CONFIG, [])).toThrow(/jurado/);
  });
});

describe("puntaje de audiencia", () => {
  it.each([
    [100, 100, 100],
    [50, 100, 50],
    [0, 100, 0],
    [0, 0, 0], // nadie votó: todos empatan en cero, que es la verdad
    [7, 7, 100],
  ])("con %s votos de un máximo de %s da %s", (votos, mayor, esperado) => {
    expect(redondear(puntajeDeAudiencia(votos, mayor))).toBe(esperado);
  });

  it("no acepta más votos que el máximo declarado", () => {
    expect(() => puntajeDeAudiencia(101, 100)).toThrow(/máximo/);
  });

  it("no acepta votos negativos", () => {
    expect(() => puntajeDeAudiencia(-1, 10)).toThrow(/negativos/);
  });
});

describe("puntaje final", () => {
  it("mezcla 70/30 como manda la configuración por defecto", () => {
    // Jurado 100, audiencia 0 → 70.
    expect(puntajeFinal(CONFIG, [nota("a", 10)], 0, 100)).toEqual({
      jurado: 100,
      audiencia: 0,
      final: 70,
    });
    // Jurado 0, audiencia 100 → 30.
    expect(puntajeFinal(CONFIG, [nota("a", 1)], 100, 100)).toEqual({
      jurado: 0,
      audiencia: 100,
      final: 30,
    });
  });

  it("una ronda solo de jurado ignora los votos", () => {
    const soloJurado = { ...CONFIG, mezcla: { jurado: 100, audiencia: 0 } };
    const r = puntajeFinal(soloJurado, [nota("a", 10)], 0, 0);
    expect(r.audiencia).toBeNull();
    expect(r.final).toBe(100);
  });

  it("una ronda solo de audiencia no exige jurado", () => {
    const soloPublico = { ...CONFIG, mezcla: { jurado: 0, audiencia: 100 } };
    const r = puntajeFinal(soloPublico, [], 40, 80);
    expect(r.jurado).toBeNull();
    expect(r.final).toBe(50);
  });

  it("si el jurado pesa y no puntuó, el cálculo se niega", () => {
    // Lo contrario —contar cero— convertiría una ronda sin puntuar en una
    // ronda perdida para todos.
    expect(() => puntajeFinal(CONFIG, [], 100, 100)).toThrow(ErrorDePuntaje);
  });

  it("es reproducible: el mismo input da el mismo número", () => {
    const notas = [nota("a", 8), nota("b", 6.5), nota("c", 9)];
    const primero = puntajeFinal(CONFIG, notas, 37, 91);
    for (let i = 0; i < 50; i++) {
      expect(puntajeFinal(CONFIG, notas, 37, 91)).toEqual(primero);
    }
  });

  it("caso completo, calculado a mano", () => {
    /* Tres jueces con 8, 6.5 y 9 en todos los criterios.
       En escala 1–10: (8-1)/9 = 77.78, (6.5-1)/9 = 61.11, (9-1)/9 = 88.89.
       Promedio = 75.9259…
       Audiencia: 37 de 91 = 40.6593…
       Final = 75.9259*0.7 + 40.6593*0.3 = 53.1481 + 12.1978 = 65.3459 → 65.35 */
    const r = puntajeFinal(CONFIG, [nota("a", 8), nota("b", 6.5), nota("c", 9)], 37, 91);
    expect(r.jurado).toBe(75.93);
    expect(r.audiencia).toBe(40.66);
    expect(r.final).toBe(65.35);
  });
});

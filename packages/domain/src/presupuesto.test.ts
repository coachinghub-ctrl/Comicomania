import { describe, expect, it } from "vitest";
import {
  calcularPresupuesto,
  estaVigente,
  ErrorDePresupuesto,
  type Linea,
} from "./presupuesto";

const CACHE: Linea = {
  concepto: "Show de 45 minutos",
  tipo: "FEE",
  cantidad: 1,
  precioUnitario: 3500,
};

describe("calcularPresupuesto", () => {
  it("suma las líneas", () => {
    const t = calcularPresupuesto({ lineas: [CACHE] });
    expect(t.subtotal).toBe(3500);
    expect(t.total).toBe(3500);
  });

  it("multiplica cantidad por precio", () => {
    const t = calcularPresupuesto({
      lineas: [
        CACHE,
        { concepto: "Hotel", tipo: "LODGING", cantidad: 2, precioUnitario: 180 },
      ],
    });
    expect(t.subtotal).toBe(3860);
  });

  it("acepta cantidades fraccionarias", () => {
    const t = calcularPresupuesto({
      lineas: [
        { concepto: "Viáticos", tipo: "PER_DIEM", cantidad: 2.5, precioUnitario: 60 },
      ],
    });
    expect(t.subtotal).toBe(150);
  });

  it("aplica el descuento ANTES de la comisión", () => {
    const t = calcularPresupuesto({
      lineas: [CACHE],
      descuento: 500,
      comisionPct: 10,
    });
    expect(t.base).toBe(3000);
    expect(t.comision).toBe(300); // 10% de 3000, no de 3500
    expect(t.total).toBe(3300);
  });

  it("aplica el impuesto sobre la base MÁS la comisión", () => {
    const t = calcularPresupuesto({
      lineas: [CACHE],
      comisionPct: 10,
      impuestoPct: 7,
    });
    expect(t.base).toBe(3500);
    expect(t.comision).toBe(350);
    expect(t.impuesto).toBe(269.5); // 7% de 3850
    expect(t.total).toBe(4119.5);
  });

  it("dice cuánto se lleva el humorista", () => {
    const t = calcularPresupuesto({
      lineas: [CACHE],
      comisionPct: 20,
      impuestoPct: 7,
    });
    // Lo suyo es la base menos la comisión; el impuesto no es de nadie.
    expect(t.paraElTalento).toBe(2800);
  });

  it("desglosa por tipo", () => {
    const t = calcularPresupuesto({
      lineas: [
        CACHE,
        { concepto: "Vuelo", tipo: "TRAVEL", cantidad: 1, precioUnitario: 420 },
        { concepto: "Hotel", tipo: "LODGING", cantidad: 2, precioUnitario: 180 },
        { concepto: "Vuelo vuelta", tipo: "TRAVEL", cantidad: 1, precioUnitario: 380 },
      ],
    });
    expect(t.porTipo.FEE).toBe(3500);
    expect(t.porTipo.TRAVEL).toBe(800);
    expect(t.porTipo.LODGING).toBe(360);
    expect(t.porTipo.TECH).toBe(0);
  });

  /* El motivo de que todo esto se haga en centavos enteros. En coma flotante
     0.1 + 0.2 da 0.30000000000000004, y tres líneas de 0,10 darían 0,30000004
     en el presupuesto que ve el cliente. */
  it("no arrastra error de coma flotante", () => {
    const t = calcularPresupuesto({
      lineas: [
        { concepto: "a", tipo: "OTHER", cantidad: 1, precioUnitario: 0.1 },
        { concepto: "b", tipo: "OTHER", cantidad: 1, precioUnitario: 0.2 },
      ],
    });
    expect(t.subtotal).toBe(0.3);
  });

  it("redondea cada línea al centavo, como hará la factura", () => {
    // 3 × 0,335 = 1,005. Cada línea se redondea antes de sumar.
    const t = calcularPresupuesto({
      lineas: [
        { concepto: "x", tipo: "OTHER", cantidad: 3, precioUnitario: 0.335 },
      ],
    });
    // 0,335 → 34 centavos (redondeo al centavo), × 3 = 1,02
    expect(t.subtotal).toBe(1.02);
  });

  it("redondea la comisión al centavo", () => {
    const t = calcularPresupuesto({
      lineas: [{ concepto: "x", tipo: "FEE", cantidad: 1, precioUnitario: 333.33 }],
      comisionPct: 15,
    });
    expect(t.comision).toBe(50); // 49,9995 → 50,00
  });

  it("admite un presupuesto sin comisión ni impuesto", () => {
    const t = calcularPresupuesto({ lineas: [CACHE] });
    expect(t.comision).toBe(0);
    expect(t.impuesto).toBe(0);
    expect(t.paraElTalento).toBe(3500);
  });

  it("admite una línea gratis", () => {
    const t = calcularPresupuesto({
      lineas: [
        CACHE,
        { concepto: "Cortesía", tipo: "OTHER", cantidad: 1, precioUnitario: 0 },
      ],
    });
    expect(t.subtotal).toBe(3500);
  });

  it("acepta un descuento igual al subtotal", () => {
    const t = calcularPresupuesto({ lineas: [CACHE], descuento: 3500 });
    expect(t.base).toBe(0);
    expect(t.total).toBe(0);
  });
});

describe("calcularPresupuesto rechaza lo que no cuadra", () => {
  it("sin líneas", () => {
    expect(() => calcularPresupuesto({ lineas: [] })).toThrow(ErrorDePresupuesto);
  });

  it("línea sin concepto", () => {
    expect(() =>
      calcularPresupuesto({
        lineas: [{ concepto: "  ", tipo: "FEE", cantidad: 1, precioUnitario: 10 }],
      }),
    ).toThrow(/sin concepto/);
  });

  it("cantidad cero", () => {
    expect(() =>
      calcularPresupuesto({
        lineas: [{ concepto: "x", tipo: "FEE", cantidad: 0, precioUnitario: 10 }],
      }),
    ).toThrow(/mayor que cero/);
  });

  it("precio negativo", () => {
    expect(() =>
      calcularPresupuesto({
        lineas: [{ concepto: "x", tipo: "FEE", cantidad: 1, precioUnitario: -1 }],
      }),
    ).toThrow(/negativo/);
  });

  it("descuento mayor que el subtotal", () => {
    expect(() =>
      calcularPresupuesto({ lineas: [CACHE], descuento: 4000 }),
    ).toThrow(/negativo/);
  });

  it("descuento negativo", () => {
    expect(() =>
      calcularPresupuesto({ lineas: [CACHE], descuento: -100 }),
    ).toThrow(/negativo/);
  });

  it("comisión fuera de rango", () => {
    expect(() =>
      calcularPresupuesto({ lineas: [CACHE], comisionPct: 120 }),
    ).toThrow(/entre 0 y 100/);
    expect(() =>
      calcularPresupuesto({ lineas: [CACHE], comisionPct: -5 }),
    ).toThrow(/entre 0 y 100/);
  });

  it("impuesto fuera de rango", () => {
    expect(() =>
      calcularPresupuesto({ lineas: [CACHE], impuestoPct: 101 }),
    ).toThrow(/entre 0 y 100/);
  });

  it("un precio que no es número", () => {
    expect(() =>
      calcularPresupuesto({
        lineas: [
          { concepto: "x", tipo: "FEE", cantidad: 1, precioUnitario: Number.NaN },
        ],
      }),
    ).toThrow(ErrorDePresupuesto);
  });
});

describe("estaVigente", () => {
  it("vale todo el último día", () => {
    expect(estaVigente("2026-09-30", new Date("2026-09-30T23:59:00Z"))).toBe(true);
  });

  it("caduca al día siguiente", () => {
    expect(estaVigente("2026-09-30", new Date("2026-10-01T00:01:00Z"))).toBe(false);
  });

  it("uno de dentro de un mes sigue vigente", () => {
    expect(estaVigente("2026-10-30", new Date("2026-09-30T12:00:00Z"))).toBe(true);
  });
});

/* El caso completo: el encargo real que hay en los datos de ejemplo.
   Cena de fin de año en un hotel de Brickell, 40 minutos, 200 personas. */
describe("un presupuesto de verdad", () => {
  it("cuadra de punta a punta", () => {
    const t = calcularPresupuesto({
      lineas: [
        { concepto: "Show de 40 minutos", tipo: "FEE", cantidad: 1, precioUnitario: 3500 },
        { concepto: "Vuelo ida y vuelta", tipo: "TRAVEL", cantidad: 1, precioUnitario: 420 },
        { concepto: "Hotel", tipo: "LODGING", cantidad: 1, precioUnitario: 180 },
        { concepto: "Viáticos", tipo: "PER_DIEM", cantidad: 2, precioUnitario: 60 },
        { concepto: "Sonido y micrófono inalámbrico", tipo: "TECH", cantidad: 1, precioUnitario: 250 },
      ],
      descuento: 200,
      comisionPct: 15,
      impuestoPct: 7,
    });

    expect(t.subtotal).toBe(4470);
    expect(t.base).toBe(4270);
    expect(t.comision).toBe(640.5);
    expect(t.impuesto).toBe(343.74); // 7% de 4910,50 = 343,735 → 343,74
    expect(t.total).toBe(5254.24);
    expect(t.paraElTalento).toBe(3629.5);
  });
});

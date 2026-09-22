/**
 * El cotizador de presupuestos de talento.
 *
 * Esto es aritmética de dinero, así que se hace en CENTAVOS ENTEROS. En coma
 * flotante, 0.1 + 0.2 no da 0.3, y un presupuesto que descuadra un centavo
 * respecto a la factura es una discusión con un cliente. Las entradas llegan
 * en unidades (3500.50) y se convierten a centavos en el borde.
 *
 * El orden de las operaciones NO es intercambiable, y por eso está escrito
 * aquí una sola vez:
 *
 *   1. Suma de las líneas            → subtotal
 *   2. Menos el descuento            → base
 *   3. Más la comisión sobre la base → con comisión
 *   4. Más el impuesto sobre todo    → total
 *
 * Aplicar el descuento después de la comisión daría otro número, y ninguno de
 * los dos es "el correcto" por sí mismo: lo correcto es que siempre sea el
 * mismo. Ver docs/09-finanzas.md
 */

export type TipoDeLinea =
  | "FEE"
  | "TRAVEL"
  | "LODGING"
  | "PER_DIEM"
  | "TECH"
  | "OTHER";

export type Linea = {
  concepto: string;
  tipo: TipoDeLinea;
  /** Puede ser fraccionaria: 2,5 días de viáticos. */
  cantidad: number;
  /** En unidades de la moneda, no en centavos. */
  precioUnitario: number;
};

export type Presupuesto = {
  lineas: Linea[];
  /** En unidades. Se resta antes de comisión e impuesto. */
  descuento?: number;
  /** Porcentaje 0-100. La comisión de la casa sobre la base. */
  comisionPct?: number;
  /** Porcentaje 0-100. Se aplica al final, sobre todo lo anterior. */
  impuestoPct?: number;
};

export type Totales = {
  /** Suma de las líneas. */
  subtotal: number;
  descuento: number;
  /** Subtotal menos descuento. Sobre esto se calcula la comisión. */
  base: number;
  comision: number;
  impuesto: number;
  total: number;
  /** Lo que se lleva el humorista: la base menos la comisión. */
  paraElTalento: number;
  /** Desglose por tipo, para poder decir "de esto, X es viaje". */
  porTipo: Record<TipoDeLinea, number>;
};

export class ErrorDePresupuesto extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDePresupuesto";
  }
}

/** Unidades a centavos, redondeando al centavo más cercano. */
function aCentavos(valor: number, campo: string): number {
  if (!Number.isFinite(valor)) {
    throw new ErrorDePresupuesto(`${campo} no es un número.`);
  }
  return Math.round(valor * 100);
}

function deCentavos(centavos: number): number {
  return centavos / 100;
}

/**
 * Porcentaje sobre una cantidad en centavos, redondeando medio hacia arriba.
 *
 * `Math.round` en JavaScript redondea -0,5 hacia cero, no hacia arriba, así
 * que con números negativos se desvía. Aquí nunca hay negativos —está
 * comprobado en la validación— pero se deja explícito para que quien lo lea
 * no tenga que deducirlo.
 */
function porcentaje(centavos: number, pct: number): number {
  return Math.round((centavos * pct) / 100);
}

const TIPOS: TipoDeLinea[] = [
  "FEE",
  "TRAVEL",
  "LODGING",
  "PER_DIEM",
  "TECH",
  "OTHER",
];

/**
 * Calcula los totales de un presupuesto.
 *
 * Lanza en vez de devolver ceros cuando algo no cuadra: un presupuesto con un
 * porcentaje imposible que sale a cero se manda al cliente sin que nadie se
 * entere. Un error, no.
 */
export function calcularPresupuesto(p: Presupuesto): Totales {
  if (p.lineas.length === 0) {
    throw new ErrorDePresupuesto(
      "Un presupuesto sin líneas no es un presupuesto: es un número suelto.",
    );
  }

  const comisionPct = p.comisionPct ?? 0;
  const impuestoPct = p.impuestoPct ?? 0;

  if (comisionPct < 0 || comisionPct > 100) {
    throw new ErrorDePresupuesto("La comisión tiene que estar entre 0 y 100.");
  }
  if (impuestoPct < 0 || impuestoPct > 100) {
    throw new ErrorDePresupuesto("El impuesto tiene que estar entre 0 y 100.");
  }

  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<
    TipoDeLinea,
    number
  >;

  let subtotalC = 0;
  for (const l of p.lineas) {
    if (!l.concepto.trim()) {
      throw new ErrorDePresupuesto("Hay una línea sin concepto.");
    }
    if (!Number.isFinite(l.cantidad) || l.cantidad <= 0) {
      throw new ErrorDePresupuesto(
        `La cantidad de "${l.concepto}" tiene que ser mayor que cero.`,
      );
    }
    if (!Number.isFinite(l.precioUnitario) || l.precioUnitario < 0) {
      throw new ErrorDePresupuesto(
        `El precio de "${l.concepto}" no puede ser negativo.`,
      );
    }

    /* Se redondea CADA línea al centavo antes de sumar, igual que hará la
       factura. Sumar en fracciones de centavo y redondear al final da un
       total que no coincide con la suma de lo que el cliente ve escrito. */
    const importeC = Math.round(aCentavos(l.precioUnitario, l.concepto) * l.cantidad);
    subtotalC += importeC;
    porTipo[l.tipo] += importeC;
  }

  const descuentoC = aCentavos(p.descuento ?? 0, "El descuento");
  if (descuentoC < 0) {
    throw new ErrorDePresupuesto("El descuento no puede ser negativo.");
  }
  if (descuentoC > subtotalC) {
    throw new ErrorDePresupuesto(
      "El descuento es mayor que el subtotal: el presupuesto saldría negativo.",
    );
  }

  const baseC = subtotalC - descuentoC;
  const comisionC = porcentaje(baseC, comisionPct);
  const impuestoC = porcentaje(baseC + comisionC, impuestoPct);
  const totalC = baseC + comisionC + impuestoC;

  return {
    subtotal: deCentavos(subtotalC),
    descuento: deCentavos(descuentoC),
    base: deCentavos(baseC),
    comision: deCentavos(comisionC),
    impuesto: deCentavos(impuestoC),
    total: deCentavos(totalC),
    paraElTalento: deCentavos(baseC - comisionC),
    porTipo: Object.fromEntries(
      TIPOS.map((t) => [t, deCentavos(porTipo[t])]),
    ) as Record<TipoDeLinea, number>,
  };
}

/**
 * ¿Sigue vigente este presupuesto?
 *
 * Un presupuesto sin fecha de caducidad es un precio al que te comprometes
 * para siempre, y los vuelos de dentro de ocho meses no cuestan lo mismo. La
 * comparación es por DÍA, no por instante: un presupuesto válido "hasta el 30"
 * vale todo el día 30.
 */
export function estaVigente(validoHasta: string, hoy = new Date()): boolean {
  const dia = hoy.toISOString().slice(0, 10);
  return validoHasta >= dia;
}

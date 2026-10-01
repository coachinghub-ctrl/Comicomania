/* ¿Podemos cobrar?
 *
 * Hoy no: no hay pasarela de pago conectada. Y eso tiene una consecuencia que
 * se nos escapó hasta que un tercero revisó el sitio y la encontró: había
 * etiquetas prometiendo lo que el sistema no puede hacer. La página de un
 * evento decía "Entradas a la venta" y tres párrafos más abajo admitía que no
 * se podía cobrar; la tienda marcaba una taza como "Últimas unidades" sin
 * vender ninguna.
 *
 * Cada una por separado era un descuido pequeño. Juntas le dicen a quien
 * mira que el sitio no sabe lo que puede hacer, y eso cuesta más que la
 * funcionalidad que falta.
 *
 * La bandera vive aquí, en un solo sitio, por un motivo concreto: el día que
 * se conecte la pasarela hay que cambiar UNA línea y todas las etiquetas
 * vuelven solas a decir la verdad. Repartida por las pantallas, alguna se
 * quedaría atrás — que es exactamente lo que acaba de pasar.
 */
export const COBRO_ACTIVO = false;

/** Lo que se le dice a alguien que quiere comprar y todavía no puede. */
export const SIN_COBRO =
  "Todavía no podemos cobrar: falta conectar la pasarela de pago.";

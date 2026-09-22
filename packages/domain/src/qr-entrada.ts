/* El código QR de una entrada.

   No lleva el id a secas: un id se adivina o se copia del de al lado. Lleva una
   firma HMAC sobre el id, la versión y el secreto de la entrada, así que un
   código inventado no valida y uno transferido deja de servir —porque al
   transferir, la base rota el secreto y sube la versión—.

   Todo acá es puro: se firma y se verifica con las mismas reglas, y se puede
   probar sin base de datos. Quien verifica en la puerta compara contra lo que
   dice la base, nunca contra lo que dice el código. */

export type ContenidoQR = {
  ticketId: string;
  version: number;
  firma: string;
};

const SEPARADOR = ".";
const PREFIJO = "CM1";

async function hmac(secreto: string, mensaje: string): Promise<string> {
  const codificador = new TextEncoder();
  const llave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", llave, codificador.encode(mensaje));
  return Array.from(new Uint8Array(firma))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** El texto que va dentro del QR. */
export async function firmarEntrada(
  ticketId: string,
  version: number,
  secreto: string,
): Promise<string> {
  const cuerpo = `${ticketId}${SEPARADOR}${version}`;
  const firma = await hmac(secreto, cuerpo);
  return `${PREFIJO}${SEPARADOR}${cuerpo}${SEPARADOR}${firma}`;
}

export function leerQR(texto: string): ContenidoQR | null {
  const partes = texto.trim().split(SEPARADOR);
  if (partes.length !== 4) return null;
  const [prefijo, ticketId, version, firma] = partes;
  if (prefijo !== PREFIJO) return null;
  const n = Number(version);
  if (!Number.isInteger(n) || n < 1) return null;
  if (!/^[0-9a-f]{32}$/.test(firma!)) return null;
  return { ticketId: ticketId!, version: n, firma: firma! };
}

/** ¿El código corresponde a esta entrada tal como está HOY en la base? */
export async function verificarEntrada(
  texto: string,
  entrada: { id: string; qr_version: number; qr_secret: string },
): Promise<{ valido: boolean; motivo?: string }> {
  const leido = leerQR(texto);
  if (!leido) return { valido: false, motivo: "CODIGO_ILEGIBLE" };
  if (leido.ticketId !== entrada.id) return { valido: false, motivo: "OTRA_ENTRADA" };

  /* La versión es lo que invalida un código viejo: al transferir la entrada, la
     base sube la versión, así que el QR que guardó quien la revendió deja de
     servir sin tener que perseguirlo. */
  if (leido.version !== entrada.qr_version) {
    return { valido: false, motivo: "CODIGO_VENCIDO" };
  }

  const esperada = await hmac(entrada.qr_secret, `${entrada.id}${SEPARADOR}${leido.version}`);

  // Comparación en tiempo constante: comparar con === filtra información sobre
  // cuántos caracteres acertó quien lo intenta.
  if (esperada.length !== leido.firma.length) {
    return { valido: false, motivo: "FIRMA_INVALIDA" };
  }
  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ leido.firma.charCodeAt(i);
  }
  if (diferencia !== 0) return { valido: false, motivo: "FIRMA_INVALIDA" };

  return { valido: true };
}

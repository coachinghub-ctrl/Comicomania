import { describe, expect, it } from "vitest";
import { firmarEntrada, leerQR, verificarEntrada } from "./qr-entrada";

const ENTRADA = {
  id: "0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b",
  qr_version: 1,
  qr_secret: "secreto-de-prueba-largo-y-aburrido",
};

describe("código QR de una entrada", () => {
  it("lo que firma, valida", async () => {
    const qr = await firmarEntrada(ENTRADA.id, ENTRADA.qr_version, ENTRADA.qr_secret);
    expect(await verificarEntrada(qr, ENTRADA)).toEqual({ valido: true });
  });

  it("es determinista: el mismo QR sale igual siempre", async () => {
    const a = await firmarEntrada(ENTRADA.id, 1, ENTRADA.qr_secret);
    const b = await firmarEntrada(ENTRADA.id, 1, ENTRADA.qr_secret);
    expect(a).toBe(b);
  });

  it("no acepta un código inventado", async () => {
    const r = await verificarEntrada("CM1.0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b.1." + "0".repeat(32), ENTRADA);
    expect(r).toEqual({ valido: false, motivo: "FIRMA_INVALIDA" });
  });

  it("no acepta el código de OTRA entrada", async () => {
    const qr = await firmarEntrada("otro-id-cualquiera", 1, ENTRADA.qr_secret);
    expect(await verificarEntrada(qr, ENTRADA)).toEqual({
      valido: false,
      motivo: "OTRA_ENTRADA",
    });
  });

  it("al transferir la entrada, el código viejo deja de servir", async () => {
    // Quien revendió se queda con este código.
    const viejo = await firmarEntrada(ENTRADA.id, 1, ENTRADA.qr_secret);

    // La base rota el secreto y sube la versión.
    const despues = { ...ENTRADA, qr_version: 2, qr_secret: "otro-secreto-distinto" };

    expect(await verificarEntrada(viejo, despues)).toEqual({
      valido: false,
      motivo: "CODIGO_VENCIDO",
    });

    const nuevo = await firmarEntrada(despues.id, despues.qr_version, despues.qr_secret);
    expect(await verificarEntrada(nuevo, despues)).toEqual({ valido: true });
  });

  it("no acepta un código con el mismo id pero otro secreto", async () => {
    const falsificado = await firmarEntrada(ENTRADA.id, 1, "secreto-adivinado");
    expect(await verificarEntrada(falsificado, ENTRADA)).toEqual({
      valido: false,
      motivo: "FIRMA_INVALIDA",
    });
  });

  it.each([
    ["", "vacío"],
    ["CM1.solo.dos", "incompleto"],
    ["XX1.id.1." + "a".repeat(32), "otro prefijo"],
    ["CM1.id.0." + "a".repeat(32), "versión cero"],
    ["CM1.id.1.ZZZ", "firma que no es hexadecimal"],
  ])("rechaza un código %s (%s)", async (texto) => {
    expect(leerQR(texto)).toBeNull();
    expect((await verificarEntrada(texto, ENTRADA)).valido).toBe(false);
  });
});

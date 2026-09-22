import { describe, expect, it } from "vitest";
import { rutaSegura } from "./volver";

/* Estas pruebas existen por una razón concreta: `volver` viaja en la URL,
   pasa por el proveedor de OAuth y vuelve. Es el sitio exacto donde alguien
   intentaría colar un destino ajeno para recibir a la persona justo después
   de iniciar sesión, con la sesión recién puesta y con toda la confianza de
   venir de un enlace nuestro. */

describe("rutaSegura deja pasar lo de casa", () => {
  it.each([
    ["/mi", "/mi"],
    ["/mi/academia/stand-up-desde-cero", "/mi/academia/stand-up-desde-cero"],
    ["/participa", "/participa"],
    ["/humoristas/la-ferrer", "/humoristas/la-ferrer"],
    ["/admin/talento?filtro=activos", "/admin/talento?filtro=activos"],
    ["  /mi/entradas  ", "/mi/entradas"],
  ])("%s", (entrada, esperado) => {
    expect(rutaSegura(entrada)).toBe(esperado);
  });
});

describe("rutaSegura no deja salir del sitio", () => {
  it.each([
    ["https://sitio-falso.test/login", "absoluta"],
    ["http://sitio-falso.test", "absoluta sin TLS"],
    ["//sitio-falso.test", "relativa al protocolo"],
    ["///sitio-falso.test", "tres barras"],
    ["/\\sitio-falso.test", "barra invertida"],
    ["javascript:alert(1)", "esquema javascript"],
    ["data:text/html,<script>", "esquema data"],
    ["mi", "sin barra inicial"],
    ["/mi\nSet-Cookie: a=b", "con salto de línea"],
    ["/mi\rotra", "con retorno de carro"],
    ["", "vacía"],
  ])("%s (%s)", (entrada) => {
    expect(rutaSegura(entrada)).toBe("/mi");
  });

  it("null y undefined", () => {
    expect(rutaSegura(null)).toBe("/mi");
    expect(rutaSegura(undefined)).toBe("/mi");
  });
});

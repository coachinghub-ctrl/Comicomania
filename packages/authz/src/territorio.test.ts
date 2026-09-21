import { describe, expect, it } from "vitest";
import { contieneTerritorio, profundidad } from "./territorio";

describe("contención de territorio", () => {
  it("un territorio se contiene a sí mismo", () => {
    expect(contieneTerritorio("US.FL.MIA", "US.FL.MIA")).toBe(true);
  });

  it("el país contiene a sus regiones y ciudades", () => {
    expect(contieneTerritorio("US", "US.FL")).toBe(true);
    expect(contieneTerritorio("US", "US.FL.MIA")).toBe(true);
    expect(contieneTerritorio("US.FL", "US.FL.ORLANDO")).toBe(true);
  });

  it("la ciudad no contiene a su región ni a su país", () => {
    expect(contieneTerritorio("US.FL.MIA", "US.FL")).toBe(false);
    expect(contieneTerritorio("US.FL.MIA", "US")).toBe(false);
  });

  it("territorios hermanos no se contienen", () => {
    expect(contieneTerritorio("US.FL.MIA", "US.FL.ORLANDO")).toBe(false);
    expect(contieneTerritorio("US.FL", "US.NY")).toBe(false);
    expect(contieneTerritorio("US", "MX")).toBe(false);
  });

  // El bug que no falla: filtra. Sin el límite del punto, un grant sobre
  // 'US.F' abarcaría Florida entera por simple prefijo de texto.
  it("respeta el límite del punto y no el prefijo de texto", () => {
    expect(contieneTerritorio("US.F", "US.FL.MIA")).toBe(false);
    expect(contieneTerritorio("US.FL.MI", "US.FL.MIA")).toBe(false);
    expect(contieneTerritorio("U", "US")).toBe(false);
    expect(contieneTerritorio("MX.CDMX.CD", "MX.CDMX.CDMX")).toBe(false);
  });

  it("sin path no hay contención", () => {
    expect(contieneTerritorio(null, "US.FL.MIA")).toBe(false);
    expect(contieneTerritorio("US", null)).toBe(false);
    expect(contieneTerritorio(undefined, undefined)).toBe(false);
    expect(contieneTerritorio("", "US")).toBe(false);
  });

  it("calcula la profundidad", () => {
    expect(profundidad("US")).toBe(1);
    expect(profundidad("US.FL")).toBe(2);
    expect(profundidad("US.FL.MIA")).toBe(3);
    expect(profundidad(null)).toBe(0);
  });
});

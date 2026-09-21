import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PERMISOS_CON_MFA } from "./puede";

/**
 * El riesgo silencioso de tener la autorización en dos lugares —la función
 * de TypeScript y la de Postgres— es que se separen. Estos tests fallan
 * el build si el seed y el código dejan de decir lo mismo.
 */
const seed = readFileSync("supabase/seed.sql", "utf8");
const acceso = readFileSync("supabase/migrations/20260921120200_acceso.sql", "utf8");

describe("el SQL y el TypeScript dicen lo mismo", () => {
  it("la lista de acciones con MFA coincide con la del seed", () => {
    const inicio = seed.indexOf("(s.section, a.action) in (");
    const bloque = seed.slice(inicio, seed.indexOf("from (values", inicio));
    const enSql = new Set(
      [...bloque.matchAll(/\('([A-Z_]+)','([A-Z_]+)'\)/g)].map(
        (m) => `${m[1]}.${m[2]}`,
      ),
    );
    expect(enSql.size).toBeGreaterThan(0);
    expect([...enSql].sort()).toEqual([...PERMISOS_CON_MFA].sort());
  });

  it("todo rol del seed declara sus denegaciones de forma explícita", () => {
    const roles = [...seed.matchAll(/\('([A-Z_]+)',\s*'[^']+',\s*true,/g)].map(
      (m) => m[1],
    );
    expect(roles).toContain("OWNER");
    expect(roles).toContain("SUPER_ADMIN_TECH");
    expect(roles.length).toBeGreaterThanOrEqual(10);
  });

  it("el admin técnico tiene bloqueado el dinero y los resultados", () => {
    const bloque = seed.slice(
      seed.indexOf("('SUPER_ADMIN_TECH'"),
      seed.indexOf("('COUNTRY_DIRECTOR'"),
    );
    for (const prohibido of [
      "ORDERS.REFUND",
      "FINANCE.VIEW",
      "SCORING.EDIT",
      "VOTING.MANAGE",
      "ACCESS_CONTROL.MANAGE",
    ]) {
      expect(bloque).toContain(prohibido);
    }
  });

  it("has_permission aplica la lista de denegación", () => {
    expect(acceso).toMatch(/not \(\(p_section \|\| '\.' \|\| p_action\) = any\(r\.denied_permissions\)\)/);
  });

  it("has_permission compara el territorio con límite de punto", () => {
    // Sin el '.' final, un grant sobre 'US.F' abarcaría Florida entera.
    expect(acceso).toContain("p_path like g.scope_path || '.%'");
  });

  it("la auditoría no se puede reescribir", () => {
    expect(acceso).toContain("audit_logs_sin_update");
    expect(acceso).toContain("audit_logs_sin_delete");
  });
});

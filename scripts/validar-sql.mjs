import { parse, loadModule } from "libpg-query";
import { readdirSync, readFileSync, existsSync } from "node:fs";

/* Valida las migraciones contra el parser real de Postgres.
   No reemplaza correrlas: verifica sintaxis, no semántica. */
await loadModule();

const archivos = [
  ...readdirSync("supabase/migrations").sort().map((f) => `supabase/migrations/${f}`),
  ...(existsSync("supabase/seed.sql") ? ["supabase/seed.sql"] : []),
];

let fallos = 0;
for (const archivo of archivos) {
  try {
    const { stmts } = await parse(readFileSync(archivo, "utf8"));
    console.log(`OK     ${archivo} — ${stmts.length} sentencias`);
  } catch (error) {
    fallos++;
    console.error(`FALLA  ${archivo}`);
    console.error(`       ${String(error.message).split("\n")[0]}`);
  }
}

if (fallos) {
  console.error(`\n${fallos} archivo(s) con error de sintaxis`);
  process.exit(1);
}
console.log(`\n${archivos.length} archivos válidos`);

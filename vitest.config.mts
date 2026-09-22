import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // También apps/web: lib/volver.ts decide a dónde se manda a alguien
    // recién autenticado, y eso merece pruebas esté donde esté el archivo.
    include: ["packages/*/src/**/*.test.ts", "apps/web/src/lib/**/*.test.ts"],
    reporters: ["default"],
  },
});

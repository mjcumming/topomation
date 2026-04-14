import { defineConfig } from "vitest/config";

export default defineConfig({
  // Match tsconfig-wtr.json / Vite build: Lit legacy decorators need these flags.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["vitest/**/*.test.ts", "*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage-vitest",
      include: ["*.ts"],
      exclude: [
        "node_modules/**",
        "coverage/**",
        "coverage-vitest/**",
        "*.test.ts",
        "*.stories.ts",
        "mock-*.ts",
        "vite.config.ts",
        "web-test-runner.config.js",
      ],
    },
  },
});



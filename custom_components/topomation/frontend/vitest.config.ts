import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["vitest/**/*.test.ts"],
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



import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.HA_URL || process.env.HA_URL_LOCAL || "http://localhost:8123";

export default defineConfig({
  testDir: "./playwright",
  testMatch: /live-.*\.spec\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

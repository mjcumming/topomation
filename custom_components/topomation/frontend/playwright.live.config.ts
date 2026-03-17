import { defineConfig, devices } from "@playwright/test";

const livePanelPath = process.env.LIVE_PANEL_PATH || "";
const useRealPanel = livePanelPath === "/topomation" || livePanelPath === "topomation";
const localHarnessBaseURL = process.env.LIVE_HARNESS_BASE_URL || "http://127.0.0.1:4174";
const baseURL = useRealPanel
  ? process.env.HA_URL || process.env.HA_URL_LOCAL || "http://localhost:8123"
  : localHarnessBaseURL;

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
  webServer: useRealPanel
    ? undefined
    : {
        command: "npx vite --host 127.0.0.1 --port 4174",
        url: localHarnessBaseURL,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});

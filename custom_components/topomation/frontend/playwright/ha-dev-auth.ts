import { expect, type Page } from "@playwright/test";

type ExternalAuthOptions = {
  callback?: string;
  force?: boolean;
};

function parseExternalAuthOptions(options: unknown): ExternalAuthOptions {
  if (typeof options === "string") {
    try {
      return JSON.parse(options) as ExternalAuthOptions;
    } catch {
      return {};
    }
  }
  if (options && typeof options === "object") {
    return options as ExternalAuthOptions;
  }
  return {};
}

export async function openHaDevPanel(page: Page): Promise<void> {
  const baseUrl = (process.env.HA_URL || "http://127.0.0.1:8123").replace(/\/+$/, "");
  const token = process.env.HA_TOKEN || "";
  if (!token) throw new Error("HA_TOKEN is required for HA dev Playwright tests");

  await page.addInitScript(
    ({ t }: { t: string }) => {
      const parseOptions = (options: unknown): { callback?: string } => {
        if (typeof options === "string") {
          try {
            return JSON.parse(options);
          } catch {
            return {};
          }
        }
        return options && typeof options === "object" ? options : {};
      };
      (window as any).externalApp = {
        getExternalAuth(options: unknown) {
          const parsed = parseOptions(options);
          const callbackName = typeof parsed.callback === "string" ? parsed.callback : "";
          const callback =
            (callbackName && typeof (window as any)[callbackName] === "function"
              ? (window as any)[callbackName]
              : undefined) ||
            (typeof (window as any).externalAuthSetToken === "function"
              ? (window as any).externalAuthSetToken
              : undefined);
          callback?.(true, { access_token: t, expires_in: 86400 });
        },
        revokeExternalAuth(options: unknown) {
          const parsed = parseOptions(options);
          const callbackName = typeof parsed.callback === "string" ? parsed.callback : "";
          const callback =
            (callbackName && typeof (window as any)[callbackName] === "function"
              ? (window as any)[callbackName]
              : undefined) ||
            (typeof (window as any).externalAuthRevokeToken === "function"
              ? (window as any).externalAuthRevokeToken
              : undefined);
          callback?.(true);
        },
      };
    },
    { t: token }
  );
  await page.goto(`${baseUrl}/topomation?external_auth=1`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await expect(page.locator("topomation-panel")).toBeVisible({ timeout: 20_000 });
}

export { parseExternalAuthOptions };

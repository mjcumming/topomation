#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");

function resolveChromePath() {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }

  try {
    const playwright = require("playwright");
    const fromPlaywright = playwright.chromium.executablePath();
    if (fromPlaywright && existsSync(fromPlaywright)) {
      return fromPlaywright;
    }
  } catch {
    // Ignore; caller gets actionable error below.
  }

  return "";
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error(
    "[wtr] Unable to resolve CHROME_PATH. Set CHROME_PATH or run: npx playwright install chromium"
  );
  process.exit(1);
}

process.env.CHROME_PATH = chromePath;
console.log(`[wtr] CHROME_PATH=${chromePath}`);

const wtrBin = path.resolve(
  frontendDir,
  "node_modules/@web/test-runner/dist/bin.js"
);
const args = [wtrBin, "--config", "web-test-runner.config.js", ...process.argv.slice(2)];
const result = spawnSync(process.execPath, args, {
  cwd: frontendDir,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

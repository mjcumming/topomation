import { copyFile, rename, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("dist/topomation-panel.js");
const target = resolve("topomation-panel.js");
const temp = resolve("topomation-panel.js.tmp");

const publish = async () => {
  try {
    await unlink(temp);
  } catch {
    // Ignore stale temp files from interrupted prior runs.
  }

  await copyFile(source, temp);
  await rename(temp, target);
  console.log(`Published ${source} -> ${target} atomically`);
};

publish().catch((error) => {
  console.error("Failed to publish frontend bundle", error);
  process.exitCode = 1;
});

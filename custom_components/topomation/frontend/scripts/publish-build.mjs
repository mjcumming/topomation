import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("dist/topomation-panel.js");
const target = resolve("topomation-panel.js");
const temp = resolve("topomation-panel.js.tmp");

const normalizeGeneratedBundle = (contents) =>
  contents
    // Lit's generated whitespace char class can span physical lines, which trips
    // git's trailing-whitespace check even though the bundle is valid.
    .replaceAll("[ \t\n\\f\\r]", "[ \\t\\n\\f\\r]")
    .replaceAll("[^ \t\n\\f\\r\"'\\`<>=]", "[^ \\t\\n\\f\\r\"'\\`<>=]");

const publish = async () => {
  try {
    await unlink(temp);
  } catch {
    // Ignore stale temp files from interrupted prior runs.
  }

  const bundle = normalizeGeneratedBundle(await readFile(source, "utf8"));
  await writeFile(source, bundle, "utf8");
  await writeFile(temp, bundle, "utf8");
  await rename(temp, target);
  console.log(`Published ${source} -> ${target} atomically`);
};

publish().catch((error) => {
  console.error("Failed to publish frontend bundle", error);
  process.exitCode = 1;
});

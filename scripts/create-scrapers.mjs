import { readFileSync, writeFileSync } from "node:fs";
import { bdata, extractCollectorId } from "./lib/bdata.mjs";

const CONFIG_PATH = new URL("../config/targets.json", import.meta.url);
const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

for (const target of config.targets) {
  if (target.collectorId) {
    console.log(`[skip] ${target.name} already has collector ${target.collectorId}`);
    continue;
  }

  console.log(`[create] ${target.name} -> ${target.url}`);
  const { status, stdout, stderr } = bdata(["scraper", "create", target.url, target.description]);
  process.stdout.write(stdout);
  if (status !== 0) {
    console.error(`[fail] ${target.name}: ${stderr}`);
    continue;
  }

  const collectorId = extractCollectorId(stdout);
  if (!collectorId) {
    console.error(`[warn] ${target.name}: could not find a Collector ID in CLI output, set it manually in config/targets.json`);
    continue;
  }

  target.collectorId = collectorId;
  console.log(`[ok] ${target.name} -> ${collectorId}`);
}

writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
console.log("\nSaved collector IDs to config/targets.json. Pin them in CLAUDE.md too.");

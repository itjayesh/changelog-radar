import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { bdata } from "./lib/bdata.mjs";
import { spawnSync } from "node:child_process";

const LOG_PATH = new URL("../data/heal-log.json", import.meta.url);

function logHealEvent(event) {
  mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
  const log = existsSync(LOG_PATH) ? JSON.parse(readFileSync(LOG_PATH, "utf8")) : [];
  log.push({ ...event, timestamp: new Date().toISOString() });
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}

const [, , name, ...descParts] = process.argv;
const description = descParts.join(" ");

if (!name || !description) {
  console.error('Usage: node scripts/heal-and-rerun.mjs <target-name> "<what broke>"');
  process.exit(1);
}

const config = JSON.parse(readFileSync(new URL("../config/targets.json", import.meta.url), "utf8"));
const target = config.targets.find((t) => t.name === name);
if (!target || !target.collectorId) {
  console.error(`No collector found for target "${name}"`);
  process.exit(1);
}

console.log(`[heal] ${name} (${target.collectorId}): ${description}`);
const healResult = bdata(["scraper", "heal", target.collectorId, description]);
process.stdout.write(healResult.stdout);
if (healResult.status !== 0) {
  console.error(`[heal-fail] ${healResult.stderr}`);
  logHealEvent({ target: name, collectorId: target.collectorId, description, step: "heal", ok: false });
  process.exit(1);
}

console.log(`[approve] ${target.collectorId}`);
const approveResult = bdata(["scraper", "approve", target.collectorId, "--auto-save"]);
process.stdout.write(approveResult.stdout);
if (approveResult.status !== 0) {
  console.error(`[approve-fail] ${approveResult.stderr}`);
  logHealEvent({ target: name, collectorId: target.collectorId, description, step: "approve", ok: false });
  process.exit(1);
}

logHealEvent({ target: name, collectorId: target.collectorId, description, step: "approve", ok: true });

console.log(`[rerun] ${name}`);
const rerun = spawnSync(process.execPath, ["scripts/run-pipeline.mjs", name], { stdio: "inherit" });
process.exit(rerun.status ?? 0);

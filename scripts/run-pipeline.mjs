import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { bdata, extractJson } from "./lib/bdata.mjs";

const CONFIG_PATH = new URL("../config/targets.json", import.meta.url);
const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

const onlyName = process.argv[2]; // optional: run a single target by name
const webhook = process.env.DISCORD_WEBHOOK_URL;

let anyFailed = false;
const digest = [];

for (const target of config.targets) {
  if (onlyName && target.name !== onlyName) continue;
  if (!target.collectorId) {
    console.error(`[skip] ${target.name}: no collectorId yet, run \`npm run create\` first`);
    continue;
  }

  console.log(`[run] ${target.name} (${target.collectorId})`);
  const { status, stdout, stderr } = bdata(["scraper", "run", target.collectorId, target.url, "--pretty"]);

  if (status !== 0) {
    console.error(`[fail] ${target.name}: ${stderr}`);
    anyFailed = true;
    console.log(`::set-output name=broken_target::${target.name}`); // legacy-safe marker for CI logs
    continue;
  }

  const entries = extractJson(stdout);
  const isEmpty = !entries || (Array.isArray(entries) && entries.length === 0);
  const crawlerError = Array.isArray(entries) && entries.length > 0 && entries.every((e) => e && typeof e === "object" && "error" in e);

  if (isEmpty || crawlerError) {
    const reason = crawlerError ? entries[0].error : "extraction returned nothing";
    console.error(`[fail] ${target.name}: ${reason} (site likely changed)`);
    anyFailed = true;
    console.log(`BROKEN_TARGET=${target.name}`);
    continue;
  }

  const dir = new URL(`../data/${target.name}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });

  const latestPath = new URL("latest.json", dir);
  const previous = existsSync(latestPath) ? JSON.parse(readFileSync(latestPath, "utf8")) : [];

  const previousKeys = new Set(previous.map((e) => JSON.stringify(e)));
  const added = entries.filter((e) => !previousKeys.has(JSON.stringify(e)));

  writeFileSync(latestPath, JSON.stringify(entries, null, 2) + "\n");
  writeFileSync(new URL(`${new Date().toISOString().slice(0, 10)}.json`, dir), JSON.stringify(entries, null, 2) + "\n");

  if (added.length > 0) {
    console.log(`[diff] ${target.name}: ${added.length} new entr${added.length === 1 ? "y" : "ies"}`);
    digest.push({ target: target.name, url: target.url, added });
  } else {
    console.log(`[diff] ${target.name}: no change`);
  }
}

if (digest.length > 0 && webhook) {
  const lines = digest.flatMap((d) =>
    d.added.slice(0, 5).map((e) => `**${d.target}** — ${e.title ?? e.date ?? JSON.stringify(e).slice(0, 80)}`)
  );
  const content = `📡 Changelog Radar — ${digest.length} source(s) updated\n\n${lines.join("\n")}`;
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 2000) }),
  });
  if (!res.ok) console.error(`[discord] failed to post: ${res.status} ${await res.text()}`);
}

if (anyFailed) process.exit(1);

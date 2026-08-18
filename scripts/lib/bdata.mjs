import { spawnSync } from "node:child_process";

const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const IS_WIN = process.platform === "win32";

// On Windows, shell:true just joins argv with spaces before handing it to cmd.exe,
// so every argument has to be quoted ourselves first — quoting only when whitespace
// is present would still let cmd.exe metacharacters (&, |, ^, %, <, >) in an
// unquoted argument (e.g. a heal description with no spaces around an "&") be
// interpreted as shell syntax instead of passed through literally.
function winQuote(arg) {
  return `"${String(arg).replace(/"/g, '\\"')}"`;
}

// Runs `npx -p @brightdata/cli bdata <args>` and returns { status, stdout, stderr }.
export function bdata(args, { input } = {}) {
  const finalArgs = IS_WIN ? args.map(winQuote) : args;
  const result = spawnSync(NPX, ["-p", "@brightdata/cli", "bdata", ...finalArgs], {
    encoding: "utf8",
    input,
    maxBuffer: 64 * 1024 * 1024,
    shell: IS_WIN, // Windows requires a shell to invoke a .cmd file directly
  });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

// Bright Data CLI prints the Collector ID somewhere in stdout on `scraper create`.
export function extractCollectorId(text) {
  const match = text.match(/\bc_[a-z0-9]+\b/i);
  return match ? match[0] : null;
}

// `scraper run --pretty` prints human text plus a JSON blob; pull out the JSON payload.
export function extractJson(text) {
  const start = text.indexOf("[");
  const startObj = text.indexOf("{");
  const from = start === -1 ? startObj : startObj === -1 ? start : Math.min(start, startObj);
  if (from === -1) return null;
  const candidate = text.slice(from);
  try {
    return JSON.parse(candidate);
  } catch {
    // fall back to trimming trailing non-JSON lines
    const lines = candidate.split("\n");
    while (lines.length) {
      try {
        return JSON.parse(lines.join("\n"));
      } catch {
        lines.pop();
      }
    }
    return null;
  }
}

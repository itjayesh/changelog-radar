# Changelog Radar

Scraper Studio project for the Scrape-Verse hackathon. Targets and their Collector IDs
live in `config/targets.json` — treat that file as the source of truth, don't hardcode
Collector IDs elsewhere.

- To add a target: append to `config/targets.json`, then run `npm run create`.
- To run all scrapers: `npm run run`.
- To heal a broken one: `node scripts/heal-and-rerun.mjs <name> "<what broke>"`.
- Never rebuild a scraper with `scraper create` if it already has a `collectorId` — heal it instead.
- Never call `bdata scraper approve` without `--auto-save` — without it the approval
  finishes that heal job but never persists the fix, so every later `scraper run` keeps
  executing the old broken code (this actually happened, see README's "Self-healing,
  for real"). `scripts/heal-and-rerun.mjs` already does this correctly — don't bypass it
  by calling the CLI directly.

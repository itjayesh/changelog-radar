# Changelog Radar

Scraper Studio project for the Scrape-Verse hackathon. Targets and their Collector IDs
live in `config/targets.json` — treat that file as the source of truth, don't hardcode
Collector IDs elsewhere.

- To add a target: append to `config/targets.json`, then run `npm run create`.
- To run all scrapers: `npm run run`.
- To heal a broken one: `node scripts/heal-and-rerun.mjs <name> "<what broke>"`.
- Never rebuild a scraper with `scraper create` if it already has a `collectorId` — heal it instead.

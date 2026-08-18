# Changelog Radar

Self-healing changelog tracker for the [Scrape-Verse Hackathon](https://wemakedevs.org). Built on
Bright Data Scraper Studio.

Every week it scrapes the changelog pages of a handful of voice-AI / dev-tool companies
(Deepgram, ElevenLabs, Cartesia — see `config/targets.json`), diffs the results against
last week's snapshot, and posts what's new to Discord. When one of those sites redesigns
its changelog page and the scraper starts coming back empty, CI catches it, runs
`bdata scraper heal`, approves the fix, and re-runs — same Collector ID, no code changes,
no human in the loop.

## Why these targets

Voice-AI tooling changes fast and none of these changelog pages are in Bright Data's
800+ pre-built scraper library — a good fit for Scraper Studio rather than a reason to
reinvent something that already exists.

## Setup

1. `npx -p @brightdata/cli bdata login` (opens a browser; needs a free Bright Data account —
   sign up and apply promo code `wemakedevs` in Billing for extra credits).
2. Copy `.env.example` to `.env` and fill in `BRIGHTDATA_API_KEY` (from the CLI login output
   or the Bright Data dashboard) and a `DISCORD_WEBHOOK_URL` if you want notifications.
3. `npm run create` — builds a scraper per target in `config/targets.json` and writes
   back each Collector ID (`c_*`).
4. `npm run run` — runs every scraper, saves a dated snapshot under `data/<target>/`,
   and diffs against `data/<target>/latest.json`.

## Self-healing demo

```
node scripts/heal-and-rerun.mjs deepgram "price selector / changelog card markup changed, extraction returns empty"
```

This calls `bdata scraper heal`, then `bdata scraper approve`, then re-runs that one
target — same Collector ID throughout.

## CI

`.github/workflows/scrape.yml` runs the pipeline every Monday. If a target's extraction
comes back empty, it automatically heals + approves + re-runs before failing the job,
then commits the new snapshots back to the repo. Secrets needed: `BRIGHTDATA_API_KEY`,
optionally `DISCORD_WEBHOOK_URL`.

## Project layout

```
config/targets.json       # target URLs, field descriptions, Collector IDs
scripts/create-scrapers.mjs   # bdata scraper create for each target
scripts/run-pipeline.mjs      # bdata scraper run + diff + Discord notify
scripts/heal-and-rerun.mjs    # bdata scraper heal + approve + re-run one target
data/<target>/latest.json     # most recent snapshot, diffed against on each run
data/<target>/<date>.json     # dated snapshot history
```

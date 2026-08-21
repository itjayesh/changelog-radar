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

## Self-healing, for real

This isn't a staged demo. While building this, the Deepgram collector (`c_msz0byeniqr2tdb79`)
broke on its own, mid-development, with a genuine crawler error:

```
Crawler error: Timeout waiting for new .fern-changelog-card-link children in .fern-changelog-timeline
```

Deepgram's changelog lazy-loads entries, and the scraper was waiting on that to finish
before extracting anything. Healing it took three rounds, and the process itself surfaced
a real bug worth documenting:

1. **First heal** (19:17 UTC) — described the timeout, asked the scraper not to wait for
   lazy-loaded content. `bdata scraper heal` proposed a fix, the preview looked right, approved it.
   The next full `scraper run` failed with the *exact same error*.
2. **Second heal** (19:34 UTC) — sharper prompt, explicitly forbidding scroll/pagination.
   Preview succeeded again. Approved again. Same production failure again.
3. Turned out `bdata scraper approve` has an `--auto-save` flag — without it, an approval
   finishes that one healing job but never persists the fix as the collector's active
   template, so every subsequent `scraper run` kept executing the old broken code. This
   wasn't documented anywhere obvious; found it in `bdata scraper approve --help`.
4. **Third heal** (19:39 UTC), same prompt, `--auto-save` now wired into
   `heal-and-rerun.mjs`'s approve call — the fix persisted. Deepgram returned 28 live
   changelog entries on the next run. `heal-and-rerun.mjs` and the CI workflow both use
   `--auto-save` for every heal from here on.

Full timestamps and prompts for all three attempts are in `data/heal-log.json`.

To trigger a heal yourself:

```
node scripts/heal-and-rerun.mjs deepgram "price selector / changelog card markup changed, extraction returns empty"
```

This calls `bdata scraper heal`, then `bdata scraper approve --auto-save`, then re-runs
and verifies that one target — same Collector ID throughout, logging the real outcome
(not just whether the approval succeeded) to `data/heal-log.json`.

## CI

`.github/workflows/scrape.yml` runs the pipeline every Monday. If a target's extraction
comes back empty, it automatically heals + approves + re-runs before failing the job,
then commits the new snapshots back to the repo. Secrets needed: `BRIGHTDATA_API_KEY`,
optionally `DISCORD_WEBHOOK_URL`.

## Dashboard

https://claude.ai/code/artifact/3081acb8-c78c-4867-8254-ffbfa5131c2e

Three views — source overview (real Collector IDs and entry counts), a unified
changelog feed, and the self-healing log — populated with real data pulled from this
project's own `data/` and `heal-log.json` as of Aug 21, 2026. It's a static snapshot,
not live-refreshing against the repo yet (Collector ID as a live production API is what
`scripts/run-pipeline.mjs` + the CI workflow demonstrate instead).

## Project layout

```
config/targets.json       # target URLs, field descriptions, Collector IDs
scripts/create-scrapers.mjs   # bdata scraper create for each target
scripts/run-pipeline.mjs      # bdata scraper run + diff + Discord notify
scripts/heal-and-rerun.mjs    # bdata scraper heal + approve + re-run one target
data/<target>/latest.json     # most recent snapshot, diffed against on each run
data/<target>/<date>.json     # dated snapshot history
```

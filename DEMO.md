# Demo script

A ~2-3 minute walkthrough for the submission video. Everything below is real — nothing
staged for the camera. Screens/commands to show are marked `>`.

## 1. The problem (15s)

"Changelog Radar tracks release notes for three voice-AI companies — Deepgram,
ElevenLabs, Cartesia — none of which are in Bright Data's 800+ prebuilt scraper
library. It runs on a schedule, diffs against last week, and posts what's new. The
actual point: when one of those sites redesigns its changelog page, it fixes itself."

## 2. The one-prompt scraper (20s)

> Show `config/targets.json` — three targets, three real Collector IDs (`c_msz0byeniqr2tdb79`,
> `c_msz0jtju1zg2a2rf9v`, `c_msz13klb288chp5xge`).

"Each one was built with a single `bdata scraper create <url> "<what I want>"` call —
Scraper Studio's AI wrote the extraction logic."

## 3. It's a real production API (20s)

> Run `npm run run` locally, or better: trigger the GitHub Actions workflow live
> (`gh workflow run scrape.yml` or the Actions tab) and show it complete in ~1 minute.

"That Collector ID isn't just a CLI toy — it's triggered on a cron in GitHub Actions,
scrapes all three sources, diffs against last week, and commits the new snapshot back
to the repo with no human involved. [show the bot commit: `chore: weekly changelog snapshot`]"

## 4. The self-heal — the actual point (60-90s, most of the video)

"This part isn't staged. While building this, Deepgram's scraper broke on its own —
[show the real error from `data/heal-log.json` or the README]:

```
Crawler error: Timeout waiting for new .fern-changelog-card-link children in .fern-changelog-timeline
```

I described what broke in plain language and ran `bdata scraper heal`:

> `node scripts/heal-and-rerun.mjs deepgram "..."`

First heal: approved, preview looked right — but the next full run failed with the
*exact same error*. Same thing on the second attempt. Turned out `bdata scraper approve`
has an `--auto-save` flag, and without it an approval finishes that healing job but never
persists the fix — so every following run just executed the old broken code. That's not
in any tutorial; found it in `--help`. Third attempt, same prompt, `--auto-save` wired
in — fix persisted, Deepgram now returns 28 live entries. Same Collector ID the entire
time, zero code changes downstream."

> Show `README.md`'s "Self-healing, for real" section with the three real timestamps.

## 5. Wired into something real (15s)

> Show the dashboard (or Discord notification, if set up) with real Collector IDs and
> entry counts pulled from the actual scraped data.

"The Collector ID feeds a Discord digest and this dashboard — not just a terminal
demo, an actual pipeline something downstream depends on."

## 6. Close (10s)

"Same Collector ID, no code changes, no human in the loop — that's the whole pitch."

---

## Recording checklist

- [ ] Terminal font size large enough to read on a recording
- [ ] Show `config/targets.json` with real Collector IDs
- [ ] Show a live (or recent) GitHub Actions run completing
- [ ] Show the real error text and the three-attempt heal story from the README
- [ ] Show the dashboard or Discord notification
- [ ] Keep API tokens and `.env` out of frame

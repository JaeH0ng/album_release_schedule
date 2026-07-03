# Codex Project Instructions

## Role: reviewer (Claude implements, Codex reviews)

- In this repo the work is split: **Claude Code implements, Codex reviews.** When you pick up a change Claude made, your primary job is to **review it**, not to reimplement it.
- Read [docs/REVIEW_GUIDE.md](docs/REVIEW_GUIDE.md) for the review loop, the project-specific review checklist, severity levels, and the finding format.
- Review target: the current branch `git diff main...HEAD` plus the newest entry in `docs/HANDOFF_FOR_CODEX.md`.
- Record findings in [docs/REVIEW_FROM_CODEX.md](docs/REVIEW_FROM_CODEX.md) (newest on top, one issue per entry, cite `file:line`). Do not merge/deploy while any Blocker or Major is open.
- **Do not edit source files during review.** Do not fix issues yourself, even small ones — write them up in `docs/REVIEW_FROM_CODEX.md` and let Claude implement every fix. Attach a diff snippet inside a finding only as a *suggestion*, not as an applied change. (The single exception: if the user explicitly tells you to implement something, then you write code and log it in `docs/HANDOFF_FOR_CODEX.md`.)

## Project rules

- Start by reading `docs/PROJECT_CONTEXT.md`, `docs/SCHEDULE.md`, `docs/DEMO_PLAN.md`, and `docs/TRACK_STATUS.md`.
- Then read `docs/HANDOFF_FOR_CODEX.md` for recent changes made via other agents (e.g. Claude), the deploy runbook, and open follow-ups.
- Treat `C:\workSpace\album_release` as the canonical project location.
- Keep album information in Markdown and use the cleaned files in `lyrics` as the canonical lyrics.
- Do not silently correct or rewrite lyrics. Preserve the artist's wording unless explicitly asked to edit it.
- Track numbers are temporary management IDs until the album order is confirmed.
- The calendar/track schedule has two coordinated edit paths, no hand-maintained duplicates:
  - `schedule-data.js` is the versioned seed and offline fallback (imported by `app.js` in the browser and by `scripts/build-schedule-sql.mjs` for SQL generation). Edit it for bulk/baseline changes, then run `npm run schedule:sync` to push the generated `album_events`/`album_tracks` rows to Supabase. Do not hand-edit `app.js` schedule arrays or write a seed migration by hand.
  - The in-app admin panel (Supabase login as an `admin_users` account) edits `album_events`/`album_tracks` live in Supabase for day-to-day tweaks. Supabase is the runtime source of truth; `schedule-data.js` only shows when Supabase is unreachable/empty. After large live edits, re-align `schedule-data.js` if you want the fallback to match.
- Keep the December 4 release date and November 13 distributor deadline visible when changing the plan.
- Prefer realistic weekly deliverables and 30-minute fallback sessions over moving the entire schedule.
- Do not push to GitHub until repository-specific authentication verifies as `JaeH0ng`.

# 04 · Morning Check-in + Plan My Day

## Goal
The guided morning ritual and the day planner. This ships **before** any external API exists: steps use deep links + quick-add for now; Sessions 05/06 will feed them live suggestions. Build the step UI so a suggestions list renders whenever suggestions exist for that source.

## Check-in wizard — `/(app)/checkin`
One `checkin_runs` row per user per day; `steps` jsonb records per-step `{ completed_at, added_task_ids, skipped }`. Step definitions live in a config array in `lib/checkin.ts` so later phases can attach suggestion sources.

Steps (titles/copy mirror the client's own words — "…so that I don't forget"):
1. **Hostaway escalations** — "Check Hostaway for guest-reported issues escalated overnight." Deep-link button to `https://dashboard.hostaway.com/`. Renders pending suggestions with `source='hostaway'` when the integration is live.
2. **Breezeway reports** — "Review issue reports created yesterday." Deep link `https://app.breezeway.io/`. Suggestions `source='breezeway'`.
3. **Maintenance backlog** — lists the user's open `source='maintenance'` tasks not planned for today with one-click "Do today"; quick-add here creates `source='maintenance'`.
4. **Homeowner emails** — deep link built from `homeowners.emails`: `https://mail.google.com/mail/u/0/#search/` + URL-encoded `from:(a@x OR b@y) newer_than:2d`. If no homeowners exist yet, link to plain Gmail plus an inline nudge to add homeowners in Settings. Suggestions `source='gmail'`.
5. **Inspections & inventory** — "Which inspections and inventory do you need to deliver or schedule today?" One input: **total minutes for inspections today** → upsert today's task `title='Inspections'`, `source='inspection'`, `estimate_minutes` = input, `do_on` = today (update, never duplicate).

Every step: quick-add form (title, minutes, defaults to `do_on` today), Skip, Next, progress indicator. Finishing sets `completed_at` and shows a "Plan my day →" CTA.

Shared suggestion row component: title, summary, source badge, external-link icon, **Add to diary** (opens a prefilled quick-add; on save set suggestion status='added' + task_id) and **Dismiss**.

## Plan My Day — `/(app)/plan`
- Lists today's open tasks (`do_on` = today) with a checkbox each (default checked). Estimate required — inline edit, default 30 if empty.
- Start-time input (default `organizations.workday_start`). Sequential stacking: each item's start = previous end; end = start + estimate.
- Reorder with ↑/↓ buttons (no drag library). Times recompute live; show the finish time ("Done by 3:40 PM").
- **Confirm plan** → upsert `day_plans` + replace `day_plan_items` (position, start_at, end_at in UTC). Re-confirming replaces items cleanly. Then call `syncPlanToGoogle(planId)` — for now a stub in `lib/google/calendar.ts` returning `{ synced: false, reason: 'google_not_connected' }`; surface as a quiet notice. (Real implementation in 06.)
- A confirmed plan renders as a timeline card on the Today page.

## Dashboard hook
Top of Today: a "Morning check-in" card — Not started / In progress (Resume) / Done ✓ based on today's `checkin_runs`.

## Acceptance
- A full wizard run persists step state; running the inspections step twice still yields one Inspections task.
- Plan: reorder recomputes times; confirm writes plan + items; re-confirm replaces without orphans; timeline shows on Today.
- Deep links are correct (Gmail query properly encoded). Mobile pass at 390px. Build; PROGRESS.md; commit.

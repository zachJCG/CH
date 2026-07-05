# 08 · Team Visibility, History, Polish & Handoff

## Goal
The coverage view of teammates' diaries, the "where did my time go" history, and release polish. This is the last session before UAT.

## Team diary
- `/(app)/team` — member cards: name, role, open + overdue counts, "check-in done today?" indicator.
- `/(app)/team/[userId]` — a read-only Today view of that member (same three groups) plus their confirmed plan timeline. v1 decision, matching the client's vacation/sick-coverage use case: **any org member can view any teammate's diary**; only owners additionally get a quick-add that assigns a task to that person. All queries stay RLS-scoped to the shared org.

## History upgrade — `/(app)/history`
- Week strip (Mon–Sun, org tz) with per-day total-minutes bars (plain divs, no chart lib) · click a day to drill into the completed list (task, source badge, actual minutes) · month total line · person switcher (self by default; teammates selectable).
- **Export CSV** for a date range: date, assignee, title, source, estimate_minutes, actual_minutes.

## Polish pass
- First-run experience: a brand-new org lands on a 3-item "Get set up" card — invite your team → add homeowners → connect integrations & Google — each linking to the right settings page, checking itself off when done.
- Empty states everywhere a list can be empty; one sentence + one action.
- Mobile sweep at 390px: Today, Check-in, and Plan must be comfortably one-handed; nav collapses.
- Errors and loading: server actions return typed errors surfaced as toasts; suspense fallbacks on data pages.
- Accessibility basics: labels on inputs, visible focus states, real buttons/links.
- Rewrite `README.md`: what the app is, local setup, env table, deploy notes, cron overview, and a short user guide (owner + manager).
- Extend `scripts/seed.ts`: a confirmed plan for yesterday and completed tasks with minutes spread across the past week, so History demos well.

## Acceptance
- Manager A views Manager B read-only; an owner can add a task to B's diary.
- History week totals match seeded data; the CSV opens cleanly in Excel.
- Fresh clone → install → seed → full click-through as owner and manager with zero dead ends. Build; PROGRESS.md; final commit.

# 03 · Work Diary (core)

## Goal
The diary itself: tasks with minute estimates, a Do-today flag, done-with-minutes, automatic carryover, a backlog, and a first history view. This is the heart of the app — the client's #1 requirement is "nothing slips between the cracks."

## Behavior rules
- Carryover is a property of the model, not a nightly job: an open task never leaves the diary. The **Today** page shows, for the signed-in user, three groups in order: **Overdue** (status open, `do_on` < today in org tz), **Today** (`do_on` = today), and a **Backlog preview** (`do_on` null, latest 5, linking to the full Backlog).
- Marking done opens a small dialog pre-filled with `actual_minutes = estimate_minutes` (editable) → sets status done, `done_at`, `actual_minutes`. Undo supported from the same view.
- Dismiss = soft delete for things that stopped mattering.

## Build
1. `lib/dates.ts` — `todayInOrgTz(org)` and display helpers (date-fns-tz).
2. Server actions in `app/(app)/diary/actions.ts`: `createTask`, `updateTask`, `setDoOn(taskId, date | null)`, `completeTask(taskId, actualMinutes)`, `reopenTask`, `dismissTask`. Zod-validate inputs; run as the RLS user (no admin client here).
3. **Today** `/(app)/today`: the three groups; each task row shows title, source badge, estimate chip (`~45m`), expandable notes, and actions (Done, Do today ↔ Backlog, Edit, Dismiss). Inline quick-add at top (title + minutes + "today" checkbox). Header shows the Today group's planned total ("Planned: 3h 25m").
4. **Backlog** `/(app)/backlog`: all open tasks with `do_on` null or in the future; same row component; filter by source; bulk "Do today".
5. **History v1** `/(app)/history`: date picker (default yesterday) → tasks completed that day (org tz) with actual minutes and a day total. (Weekly rollup + CSV arrive in 08.)
6. Empty states with one line of guidance on every list.
7. Seed script `scripts/seed.ts` (`pnpm seed`, uses the admin client, dev only): demo org, one owner + one manager with printed passwords, ~12 varied tasks (some overdue, some today, some backlog, mixed sources). Every later session tests against this.

## Acceptance
- Add → estimate → Do today → Done(minutes) round-trips; a task with yesterday's `do_on` appears under Overdue.
- Totals correct; history lists completions with minutes.
- Usable at 390px width. Build passes; PROGRESS.md; commit.

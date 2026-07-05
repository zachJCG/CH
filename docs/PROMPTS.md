# Claude Code Prompts

## Ground rules (context discipline)
- **One task doc per session.** Run `/clear` before starting each phase — never carry a previous phase's chat into the next.
- The only memory between sessions is `CLAUDE.md` + `docs/PROGRESS.md`. Each task doc is self-contained on purpose.
- If a session runs long (context feels heavy, responses degrade), run the **Checkpoint** prompt, `/clear`, then re-run Kickoff — it resumes from PROGRESS.md.
- For phases 02, 05, and 06, prepend: "Propose a short plan first and wait for my OK before writing code."

## Kickoff — start of every session (swap the doc name)
```
Read CLAUDE.md and docs/PROGRESS.md. Then read docs/tasks/01-foundation.md and implement it completely.
Stay strictly within that doc's scope. Don't read the other task docs. If the doc involves a third-party API, fetch the official docs before writing the client.
When done: pnpm lint && pnpm build must pass, exercise the feature in the browser, append ≤10 lines to docs/PROGRESS.md, and commit as "feat(01): foundation".
```

## Wrap-up — end of every session
```
Run pnpm lint && pnpm build and fix anything broken. Append a ≤10-line summary to docs/PROGRESS.md: what shipped, key files, open TODOs. Commit everything.
```

## Checkpoint — mid-session context rescue
```
Pause. Write your current state to docs/PROGRESS.md: what's done, what's half-done with exact file paths, and the exact next steps. Keep it under 15 lines. Commit as "wip".
```
Then `/clear` and run Kickoff again.

## Phase verification prompts
After **02**:
```
Prove RLS works: write SQL I can run in the Supabase SQL editor showing that a user from org B gets zero rows selecting org A's tasks, and cannot insert into org A's org_members. Then list every table and confirm RLS is enabled on each.
```
After **04**:
```
Walk through the morning check-in in the browser as a fresh user: complete all 5 steps, enter 90 minutes of inspections, plan the day with 3 tasks, confirm. Fix any dead ends, missing empty states, or mobile-width overflow you hit along the way.
```
After **05**:
```
Run the Hostaway and Breezeway syncs twice in a row and prove no duplicate suggestions are created. Then show how a bad credential surfaces in Settings → Integrations without breaking anything else.
```
After **06**:
```
Test the Google flow end to end: connect, run the Gmail sync, confirm a day plan, verify events on the calendar. Then simulate a revoked token and confirm the app degrades gracefully with a "Reconnect Google" prompt.
```
After **07**:
```
Trigger /api/cron/hourly locally with the CRON_SECRET header. Prove: the reminder email sends once per user per day (show notification_log), and escalation fires only for tasks overdue ≥ escalation_after_days and only once per task.
```
After **08** (pre-flight):
```
Do a full pre-flight: fresh install, build, run the seed script, then click through every page as owner and as manager. Update README.md with setup + a short user guide. List anything you would flag before handing this to a client.
```

## If it goes sideways
```
Stop. Re-read the session rules in CLAUDE.md. Revert any changes outside the current task doc's scope, then continue only with the doc's remaining acceptance criteria.
```

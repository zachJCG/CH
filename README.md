# CH Ops Diary

The daily operations app for a short-term-rental management company (169
properties). Managers run a guided **morning check-in** that will pull
escalated guest issues (Hostaway), issue reports (Breezeway), and homeowner
emails (Gmail) into a running to-do list — the **work diary**. Tasks carry
minute estimates, can be flagged **Do today**, and never disappear until done
(automatic carryover). Managers confirm an ordered day plan; overdue work
reminds and escalates; teammates can read each other's diaries for coverage.

Full product memory lives in [`CLAUDE.md`](CLAUDE.md); the phased build plan
lives in [`docs/tasks/`](docs/tasks) with the operator runbook in
[`docs/BUILD-RUNBOOK.md`](docs/BUILD-RUNBOOK.md).

## Current status — interactive framework (demo mode)

This build is the **clickable framework**: every screen works end-to-end on an
in-browser demo data layer (localStorage) that mirrors the future Supabase
schema 1:1. No database, API keys, or webhooks are required to run or deploy
it. The sidebar user switcher lets you demo as the owner or a manager, and
"Reset demo data" restores the seed.

| Area | State |
| --- | --- |
| Landing, login/signup placeholders | ✅ demo sign-in, real auth in phase 02 |
| Today (Overdue · Today · Backlog preview) | ✅ interactive |
| Morning check-in (5-step wizard) | ✅ interactive, deep links + seeded suggestions |
| Plan My Day (stacked schedule, reorder, confirm) | ✅ interactive, Calendar sync stubbed |
| Backlog, History (+ CSV export) | ✅ interactive |
| Team coverage views | ✅ interactive |
| Settings (org, team, homeowners, integrations) | ✅ interactive; credential forms await phase 05/06 |
| Supabase schema/RLS/auth, syncs, emails, crons | ⏳ phases 02–07 |

## Local setup

```bash
corepack enable   # Node 20+
pnpm install
pnpm dev          # http://localhost:3000
```

`pnpm lint` and `pnpm build` must pass before committing. No `.env` is needed
yet — [`.env.example`](.env.example) documents every variable and the phase
that activates it.

## Deploying to Vercel

Import the GitHub repo (Next.js is auto-detected) and deploy — the demo needs
no environment variables. When later phases land: add the env vars from
`.env.example`, upgrade to Pro before enabling the `vercel.json` crons
(phases 05/07), and follow `docs/BUILD-RUNBOOK.md` §4.

## Repo map

```
app/            routes (App Router) — (app)/ is the signed-in shell
components/app/ shared product components (task rows, quick-add, shell…)
components/ui/  shadcn/ui primitives (Base UI)
lib/demo/       demo data layer: types, seed, store, selectors
lib/            dates, formatting, check-in config, calendar stub
docs/           build kit: runbook, prompts, progress log, task docs
```

The demo store (`lib/demo/store.tsx`) is deliberately shaped like the phase-02
data layer: every action maps 1:1 to a future server action, and pages only
touch `lib/demo/selectors.ts`, so swapping in Supabase is a data-layer change,
not a UI rewrite.

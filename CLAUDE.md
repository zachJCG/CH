# CH Ops Diary — Claude Code Project Memory

## What we're building
A daily operations app for a short-term-rental management company (169 properties, Hostaway PMS). Managers run a guided **morning check-in** that pulls escalated guest issues (Hostaway), issue reports (Breezeway), and homeowner emails (Gmail) into a running to-do list — the **work diary**. Tasks carry time estimates in minutes, can be flagged **Do today**, and never disappear until done (automatic carryover). Managers confirm a suggested day schedule and the app writes it to their personal **Google Calendar**. Overdue tasks **remind and escalate**. Managers can view each other's diaries for vacation/sick coverage. Hostaway is the source of truth for reservations and guest data — this app never writes to Hostaway, Breezeway, or Gmail.

## Session rules — follow strictly
1. At session start read: this file, `docs/PROGRESS.md`, and the ONE task doc you were assigned. Do not crawl the repo looking for context.
2. Stay inside your task doc's scope. No unrelated refactors.
3. Never invent third-party API shapes. Fetch the official docs (Hostaway, Breezeway, Google) before writing an API client.
4. Before finishing: `pnpm lint && pnpm build` must pass; exercise the feature in the browser; append ≤10 lines to `docs/PROGRESS.md`; commit.
5. If the task doc conflicts with reality, note it in PROGRESS.md and take the smallest sane fix — don't stall.

## Stack
- Next.js 15, App Router, TypeScript strict, Tailwind, shadcn/ui, lucide-react
- Supabase: Postgres + Auth + RLS. Plain SQL migrations in `supabase/migrations/`. Generated types in `lib/database.types.ts`.
- Resend for email. Vercel for hosting + cron. Zod validation. date-fns + date-fns-tz.
- No ORM.

## Conventions
- Server Components by default. Mutations = Server Actions. Cron / OAuth / sync = Route Handlers under `app/api/`.
- Supabase clients in `lib/supabase/`: `browser.ts`, `server.ts` (RLS as the signed-in user), `admin.ts` (service role). **`admin.ts` may only be imported by:** cron routes, OAuth callbacks, invite acceptance, integration sync code, and owner-gated settings actions that store credentials. Never in client components.
- Every tenant table has `org_id` and RLS enabled. New table → new policies, no exceptions.
- Store timestamps as `timestamptz` (UTC). Convert for display using `organizations.timezone`.
- Keep pages thin; logic lives in `lib/`.

## Glossary
- **Work diary** — a manager's open task list. Open tasks always show until done or dismissed (that IS the carryover).
- **Do today / `do_on`** — date flag. Today view = `do_on = today` + Overdue (`do_on < today`, still open) + Backlog (`do_on` null).
- **Suggestion** — an item synced from Hostaway / Breezeway / Gmail, pending review. Approve → task. Dismiss → hidden.
- **Morning check-in** — 5-step wizard: Hostaway escalations → Breezeway reports → maintenance backlog → homeowner emails → inspections & inventory. Ends at Plan My Day.
- **Day plan** — confirmed, ordered schedule for one date; syncs to Google Calendar.
- **Roles** — `owner` (admin, receives escalations) and `manager`.

## Env vars (mirror in `.env.example`)
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY · NEXT_PUBLIC_APP_URL · RESEND_API_KEY · EMAIL_FROM · CRON_SECRET · GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET · TOKEN_ENCRYPTION_KEY (32-byte base64)
Hostaway / Breezeway credentials are per-org, stored in the `integrations` table — not env vars.

## Open questions — do NOT guess. Use the default and leave a `// TODO(client)` marker
- What exactly counts as "escalated" in Hostaway → default: keyword match on recent guest messages, keywords editable in org settings.
- Who receives escalations → default: all org owners.
- Workday start time → default 08:30, org setting.

## Definition of done, every session
Build + lint pass · feature works end-to-end in the browser · RLS verified for any new tables · PROGRESS.md updated · committed.

# 01 · Foundation

## Goal
A running Next.js app wired to Supabase clients, with repo hygiene, ready to deploy to Vercel. No product features yet.

## Steps
1. This repo already contains `CLAUDE.md` and `docs/`. `create-next-app` refuses non-empty directories — scaffold into a temp dir and move the output in:
   `pnpm create next-app@latest tmp-app --ts --tailwind --eslint --app --import-alias "@/*"`, then move everything from `tmp-app/` into the repo root (keep our `CLAUDE.md` and `docs/`; let the scaffold's README land as-is), and delete `tmp-app`.
2. Install deps: `@supabase/supabase-js @supabase/ssr zod resend date-fns date-fns-tz lucide-react server-only`. Init shadcn/ui (`pnpm dlx shadcn@latest init`) and add: button, card, input, label, dialog, badge, checkbox, select, tabs, textarea, dropdown-menu, sonner.
3. Create `lib/supabase/browser.ts`, `lib/supabase/server.ts` (cookie-based, per current `@supabase/ssr` docs), and `lib/supabase/admin.ts` (service role). `admin.ts` must import `server-only` and carry a header comment: "service role — allowed import sites listed in CLAUDE.md".
4. `.env.example` listing every var from CLAUDE.md, with one-line comments. Confirm `.env*` is gitignored.
5. `lib/config.ts` — reads env vars and throws early with a clear message when one is missing (distinguish public vs server vars).
6. App shell: `app/layout.tsx` (Inter font, sonner toaster) · `app/page.tsx` minimal landing ("CH Ops Diary" + Sign in link placeholder) · `app/(app)/layout.tsx` authenticated shell with a sidebar: Today, Check-in, Plan, Backlog, History, Team, Settings (links may 404 for now; collapse to a bottom bar or sheet on mobile).
7. `app/api/health/route.ts` returning `{ ok: true }`.
8. `vercel.json` with an empty `"crons": []` (filled in later phases).
9. Verify: `pnpm lint && pnpm build` clean; `pnpm dev` renders the landing and health endpoint.

## Acceptance
- Build and lint pass; landing renders; `/api/health` returns ok.
- Supabase helpers exist with correct browser/server/admin separation.
- `.env.example` complete; nothing secret committed.
- PROGRESS.md updated; committed.

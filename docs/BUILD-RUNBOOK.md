# Build Runbook — CH Ops Diary

Claude Code does the coding. This file is your part: accounts, keys, order of operations, and acceptance.

## 0 · File placement
Unzip into an empty git repo: `CLAUDE.md` at the root; everything else under `docs/` as shipped. Commit and push before the first Claude Code session. You'll need Node 20+ and pnpm (`corepack enable`).

## 1 · Order of operations
1. Create the GitHub repo, add these docs, push.
2. Create the Supabase project (§2) — you need its keys before Session 01.
3. Run Sessions 01 (foundation) and 02 (database + auth).
4. Deploy to Vercel now (§4) — the real URL is needed to finish Supabase auth redirect settings and Google OAuth redirect URIs.
5. Run Sessions 03 and 04. **This is the demo-able v1: auth, work diary, morning check-in with deep links, day planner — zero client credentials required.**
6. Collect client credentials (§6) while you demo.
7. Run Sessions 05 → 06 → 07 → 08.
8. UAT (§8), then invite his managers.

## 2 · Supabase
- Create a project (region near the client). Save: Project URL, anon key, service_role key.
- Install the CLI (`brew install supabase/tap/supabase`), then `supabase login` and `supabase link --project-ref <ref>`. Claude Code writes migrations; you apply them with `supabase db push` (or paste into the SQL Editor).
- Auth → URL Configuration: Site URL = your production URL; add `http://localhost:3000/**` and your Vercel domain(s) to redirect URLs.
- Auth → SMTP: the default Supabase mailer is rate-limited to a couple of emails per hour — point it at Resend SMTP (host `smtp.resend.com`) or invite emails will silently choke.

## 3 · Google Cloud (Gmail + Calendar)
- The clean path: create the Google Cloud project **inside the client's Google Workspace** and set the OAuth consent screen to **Internal**. Internal apps skip Google's verification entirely.
- Why it matters: `gmail.readonly` is a **restricted** scope. An External app needs Google verification plus a paid third-party security assessment (weeks). External-in-Testing sort of works, but refresh tokens expire every 7 days — managers would have to reconnect weekly.
- Enable APIs: Gmail API, Google Calendar API.
- Create an OAuth client (Web application) with redirect URIs `http://localhost:3000/api/google/callback` and `https://<prod-domain>/api/google/callback`.
- Scopes used: `gmail.readonly`, `calendar.events`, `openid`, `email`.

## 4 · Vercel
- Import the GitHub repo (Next.js auto-detected).
- **Upgrade to Pro (~$20/mo)** — Hobby crons run at most once per day; syncs and reminders need 30-min/hourly schedules.
- Environment variables (set for Production + Preview):

| Var | Source |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase (secret — server only) |
| NEXT_PUBLIC_APP_URL | your production URL |
| RESEND_API_KEY / EMAIL_FROM | Resend |
| CRON_SECRET | `openssl rand -hex 24` |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google Cloud |
| TOKEN_ENCRYPTION_KEY | `openssl rand -base64 32` |

- Cron schedules come from `vercel.json` (written in Sessions 05 and 07). After deploying those, confirm they appear under Project → Cron Jobs.

## 5 · Resend
- Create an account and **verify the sending domain** (DNS records) before reminder emails will deliver. Set `EMAIL_FROM` to something like `ops@yourdomain.com`.

## 6 · Collect from CH — send the ask today (Breezeway can take days)
- Hostaway: Account ID + API key (Hostaway dashboard → Settings → Hostaway API).
- Breezeway: API client ID + secret — he has to request these from his Breezeway rep.
- Homeowner list: names + email addresses (this drives the Gmail flagging).
- Confirmations: what "escalated" means to his team in Hostaway · who overdue tasks escalate to · default workday start time · the list of managers to invite.

## 7 · Security hygiene
- Never commit `.env*`. Service-role key stays server-side. Rotate any key that ever lands in chat or email.
- Google refresh tokens are AES-encrypted at rest with TOKEN_ENCRYPTION_KEY — losing that key means everyone reconnects Google.

## 8 · UAT checklist (run with CH before rollout)
- Owner signs up → org created → invites a manager → manager accepts via email link.
- Manager adds tasks with estimates, flags Do today, completes one; an unfinished task from yesterday shows under Overdue today.
- Morning check-in runs end to end; entering 90 inspection minutes creates/updates the Inspections task.
- Plan My Day → confirm → events appear on that manager's Google Calendar; reorder + re-confirm updates them.
- Hostaway and Breezeway "Sync now" pull suggestions; approving one creates a task with a working link.
- A homeowner email lands as a suggestion within a sync cycle.
- Leave a task overdue past the threshold → owner gets an escalation email; managers get the daily reminder at the set hour, once.
- Manager A opens Manager B's diary read-only.
- History shows yesterday's completed tasks with minutes; CSV export opens cleanly.

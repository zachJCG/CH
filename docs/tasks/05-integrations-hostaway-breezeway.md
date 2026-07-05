# 05 · Hostaway & Breezeway Sync

## Goal
Pull escalated guest issues (Hostaway) and yesterday's issue reports (Breezeway) into `suggestions`, feeding check-in steps 1–2. Read-only, idempotent, failures visible in Settings — one broken key must never break the app.

## Before writing any code
Fetch the current official API docs: Hostaway public API (token via client credentials using Account ID + API key; conversations and messages endpoints) and Breezeway public API (OAuth client credentials; tasks/issue reports). **Where those docs disagree with this file's field guesses, the docs win.**

## Settings → Integrations — `/(app)/settings/integrations` (owner-only)
- One card per provider: status (unconfigured / connected / error with `last_error`), `last_synced_at`, credential form (Hostaway: account_id + api_key · Breezeway: client_id + client_secret), **Test connection**, **Sync now**.
- Credentials save through an owner-gated server action using the admin client into `integrations.credentials` (the table has no RLS policies — service-role only). Never round-trip secrets back to the client: render `••••` with a "Replace" action.
- Also on this page: editable `escalation_keywords` chips (org setting) with a short explainer.

## Sync engine
- `lib/sync/hostaway.ts` — `getToken(creds)` with a token cache stored inside the credentials jsonb (token + expiry) · fetch conversations with messages updated in the last 24h · a conversation is **escalated** when any guest message in that window contains an org keyword, case-insensitive · upsert suggestion: `external_id` = conversation id, `title` = "Guest issue — {listing or guest name}", `summary` = the matched snippet (≤200 chars), `link` = Hostaway inbox deep link, `payload` = minimal raw fields. Extract the keyword matcher as a pure function and unit-test it.
- `lib/sync/breezeway.ts` — token · fetch issue-type reports created yesterday (org tz) · upsert with `external_id` = report id and a sensible title/summary/link.
- Upsert semantics on `unique(org_id, source, external_id)`: refresh title/summary while status='pending'; never resurrect rows already 'added' or 'dismissed'.
- Route `app/api/sync/[provider]/route.ts`: POST from Settings (auth: org owner) and GET from cron (auth: `x-cron-secret` header equals CRON_SECRET). Cron mode loops all configured orgs; wrap each org in try/catch → write `status`/`last_error`, never let one org's failure stop the rest.
- Add to `vercel.json`: cron `*/30 * * * *` → `/api/sync/all` (a small route that runs both providers for every configured org, plus Gmail once 06 lands).

## Check-in wiring
Steps 1–2 already render suggestion lists — verify Approve creates a task carrying source + `source_ref` (with the link) and Dismiss hides permanently.

## Acceptance
- With test credentials: Test connection is truthful; running Sync now twice creates zero duplicates; editing keywords changes what matches (matcher unit test passes).
- Bad credentials → status=error with a human-readable `last_error`; the rest of the app is unaffected.
- The cron route 401s without the secret. Build; PROGRESS.md; commit.

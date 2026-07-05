# 02 · Database, RLS & Auth

## Goal
Full schema with row-level security, email/password auth, org creation on signup, and owner→manager invites.

## Migration — one file: `supabase/migrations/0001_init.sql`
Enable `pgcrypto`. Create these tables exactly (add `created_at timestamptz default now()` everywhere; `updated_at` where noted):

- **organizations** — `id uuid pk default gen_random_uuid()` · `name text not null` · `timezone text not null default 'America/New_York'` · `workday_start time not null default '08:30'` · `reminder_hour int not null default 7` · `escalation_after_days int not null default 2` · `escalation_keywords text[] not null default '{broken,leak,leaking,"not working",urgent,"no hot water",wifi,lock,dirty,smell,refund,complaint}'`
- **profiles** — `id uuid pk references auth.users on delete cascade` · `full_name text` · `email text not null`. Add the standard `handle_new_user()` trigger on `auth.users` insert.
- **org_members** — `org_id` · `user_id` · `role text not null check (role in ('owner','manager'))` · pk `(org_id, user_id)`
- **invites** — `id uuid pk` · `org_id` · `email text not null` · `role` (same check) · `token text unique not null default encode(gen_random_bytes(24),'hex')` · `invited_by uuid` · `expires_at timestamptz default now() + interval '7 days'` · `accepted_at timestamptz`
- **homeowners** — `id uuid pk` · `org_id` · `name text not null` · `emails text[] not null default '{}'`
- **tasks** — `id uuid pk` · `org_id` · `assignee_id uuid references profiles` · `title text not null` · `notes text` · `source text not null default 'manual' check (source in ('manual','hostaway','breezeway','gmail','maintenance','inspection'))` · `source_ref jsonb` · `estimate_minutes int` · `actual_minutes int` · `do_on date` · `status text not null default 'open' check (status in ('open','done','dismissed'))` · `done_at timestamptz` · `escalated_at timestamptz` · `created_by uuid` · `updated_at`. Index `(org_id, assignee_id, status, do_on)`.
- **suggestions** — `id uuid pk` · `org_id` · `source text check (source in ('hostaway','breezeway','gmail'))` · `external_id text not null` · `title text not null` · `summary text` · `link text` · `payload jsonb` · `status text not null default 'pending' check (status in ('pending','added','dismissed'))` · `task_id uuid` · `suggested_for uuid` · unique `(org_id, source, external_id)`
- **checkin_runs** — `id uuid pk` · `org_id` · `user_id` · `run_date date not null` · `steps jsonb not null default '{}'` · `completed_at timestamptz` · unique `(org_id, user_id, run_date)`
- **day_plans** — `id uuid pk` · `org_id` · `user_id` · `plan_date date not null` · `start_time time not null` · `confirmed_at timestamptz` · unique `(org_id, user_id, plan_date)`
- **day_plan_items** — `id uuid pk` · `day_plan_id uuid references day_plans on delete cascade` · `task_id uuid references tasks` · `position int not null` · `start_at timestamptz` · `end_at timestamptz` · `gcal_event_id text`
- **integrations** — `id uuid pk` · `org_id` · `provider text check (provider in ('hostaway','breezeway'))` · `credentials jsonb not null` · `status text not null default 'unconfigured'` · `last_synced_at timestamptz` · `last_error text` · unique `(org_id, provider)`
- **google_connections** — `user_id uuid pk references profiles` · `org_id` · `google_email text` · `refresh_token_enc text` · `scopes text[]` · `updated_at`
- **notification_log** — `id uuid pk` · `org_id` · `user_id` · `kind text not null` · `ref_date date not null` · unique `(org_id, user_id, kind, ref_date)`

## RLS
Enable RLS on **every** table. Helpers (security definer, stable, `set search_path = public`):
```sql
create function public.is_org_member(p_org uuid) returns boolean ...
  select exists (select 1 from org_members where org_id = p_org and user_id = auth.uid());
create function public.is_org_owner(p_org uuid) returns boolean ... -- same, plus role = 'owner'
```
Policies:
- organizations: select where member; update where owner.
- profiles: select own row plus rows sharing any org with you; update own.
- org_members: select where member; insert/delete where owner (invite acceptance uses the admin client).
- homeowners, tasks, suggestions, checkin_runs, day_plans: full CRUD where `is_org_member(org_id)`. day_plan_items: authorize through the parent day_plan's org.
- invites: select/insert/delete where owner.
- **integrations: no policies at all** — service-role access only.
- google_connections: select/update/delete own row (`user_id = auth.uid()`); inserts happen server-side.
- notification_log: no policies — service-role only.

Apply with `supabase db push`, then generate types: `supabase gen types typescript --linked > lib/database.types.ts` (add script `pnpm gen:types`).

## Auth flows
- `middleware.ts` — standard `@supabase/ssr` session refresh; protect `/(app)` routes → redirect to `/login`.
- `/signup` — full name, email, password, **organization name** → create user, then a server action (admin client) inserts the organization + `org_members` owner row.
- `/login`, logout action, `/forgot-password` (Supabase reset email).
- Invites: Settings → Team (owner only): member list, invite form (email + role) → insert invite + send a Resend email linking to `${NEXT_PUBLIC_APP_URL}/invite/[token]`. The `/invite/[token]` page validates token + expiry, collects name + password, then via admin client: create user (email confirmed), insert org_members, mark invite accepted, sign them in.
- Signed-in users with no org membership see a simple "ask your admin for an invite" page (v1 assumption: one org per user).

## Acceptance
- Sign up creates org + owner; an invited manager joins via the emailed link.
- RLS proof: a user in a second org sees zero of the first org's rows — demonstrate with SQL.
- `lib/database.types.ts` committed; build passes; PROGRESS.md; commit.

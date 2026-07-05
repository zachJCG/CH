# 07 · Reminders & Escalation

## Goal
A daily reminder email per manager, automatic escalation of stale tasks to org owners, and in-app overdue visibility. Exactly-once delivery guarded by `notification_log`.

## Email
- `lib/email.ts` — Resend wrapper using `EMAIL_FROM`; simple typed HTML string templates (no react-email): `reminderEmail`, `escalationEmail` (and fold in the existing invite email if it isn't already here).
- Reminder content: greeting · overdue count with the top 5 (title, days overdue) · today's plan timeline if confirmed, otherwise "No plan yet — start your morning check-in" · one button linking to `/today`.
- Escalation content (to org owners): the tasks that just crossed the threshold — assignee, title, `do_on`, days overdue, link to that manager's diary.

## Cron
- `app/api/cron/hourly/route.ts` (GET; require `x-cron-secret` == CRON_SECRET; use the admin client). For each org where the current org-local hour equals `reminder_hour`:
  1. **Reminders** — per active member: skip if `notification_log(kind='reminder', ref_date=today)` exists; otherwise send and log.
  2. **Escalations** — open tasks with `do_on <= today − escalation_after_days` and `escalated_at is null` → one grouped email to the org's owners → set `escalated_at` on each task (that's the true once-only guard) and log `kind='escalation'` per owner for the day.
- `vercel.json`: add `0 * * * *` → `/api/cron/hourly`, keeping the `*/30` sync cron from 05.
- Rerunning within the same hour must send nothing new.

## In-app
- Sidebar badge on Today with the overdue count; a red banner on Today when > 0 ("3 tasks overdue — oldest is 4 days").
- Settings → Organization (owner): edit `timezone`, `workday_start`, `reminder_hour`, `escalation_after_days`.

## Acceptance
- Local trigger with the header: emails send once; a second call no-ops (show the `notification_log` rows).
- A task at the threshold escalates exactly once and never re-escalates; completing tasks clears the badge.
- Missing/wrong secret → 401. Build; PROGRESS.md; commit.

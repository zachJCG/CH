# 06 · Google — Gmail Flagging + Calendar Sync

## Goal
Per-user Google connection. Gmail: surface homeowner emails as suggestions for the check-in. Calendar: a confirmed day plan becomes events on that manager's primary calendar. Verify request/response shapes against Google's REST docs; use plain `fetch`, no heavy SDK.

## OAuth
- `app/api/google/start/route.ts` — redirect to Google consent: scopes `gmail.readonly calendar.events openid email`, `access_type=offline`, `prompt=consent`, `state` = signed nonce tied to the session.
- `app/api/google/callback/route.ts` — verify state, exchange the code, encrypt the refresh token, upsert `google_connections` for the signed-in user (google_email from the id token).
- `lib/crypto.ts` — AES-256-GCM encrypt/decrypt using TOKEN_ENCRYPTION_KEY (base64, 32 bytes); store `iv.tag.ciphertext` base64 in `refresh_token_enc`.
- `lib/google/client.ts` — `getAccessToken(userId)`: decrypt → refresh-token grant → short in-memory cache. On `invalid_grant`, mark the connection revoked (clear the token, keep the row) so the UI can prompt reconnection.
- Settings → Google (any role, per user): Connect / "Connected as x@y" / Disconnect (revoke at Google, delete the row).

## Homeowners UI
`/(app)/settings/homeowners` (owner-only): CRUD for name + email chips. (Table exists from 02.) This list drives both the Gmail query and the check-in deep link.

## Gmail sync
- `lib/sync/gmail.ts` — for each connected user in an org that has homeowners: `users.messages.list` with `q = from:(a@x OR b@y) newer_than:2d`, then fetch metadata (From, Subject, snippet, internalDate).
- Upsert suggestions: `source='gmail'`, `external_id` = messageId, `suggested_for` = that user, `title` = "Homeowner email — {matched homeowner name}", `summary` = subject + snippet, `link` = `https://mail.google.com/mail/u/0/#all/{messageId}`.
- Wire into `/api/sync/all` (cron) and add a "Sync now" affordance on check-in step 4. Step 4 shows the current user's pending gmail suggestions; when not connected, it falls back to the deep link from 04 plus a Connect prompt.

## Calendar sync
- Implement `syncPlanToGoogle(planId)`, replacing the 04 stub: using the plan owner's connection, mirror `day_plan_items` to their primary calendar — insert/patch/delete so events exactly match items (summary = task title; description = notes + a link back to the app; times from start_at/end_at). Persist `gcal_event_id` per item; on re-confirm, reconcile: patch kept items, delete removed ones, insert new ones — no orphans.
- No connection → return `{ synced: false }` and let the plan confirm succeed with a quiet notice. Add a "Resync calendar" button on the plan timeline card.

## Acceptance
- Connect → Gmail sync → a homeowner email appears as a suggestion; approving creates a task with a working Gmail link.
- Confirm plan → events on Google Calendar; reorder + re-confirm updates them with none orphaned; disconnecting doesn't break plan confirmation.
- Revoked token surfaces a Reconnect prompt without crashes. Build; PROGRESS.md; commit.

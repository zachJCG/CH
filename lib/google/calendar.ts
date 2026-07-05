// Google Calendar sync stub (docs/tasks/04-morning-checkin.md).
// The real implementation lands in phase 06 with per-user OAuth.

export interface SyncPlanResult {
  synced: boolean;
  reason?: "google_not_connected";
}

export function syncPlanToGoogle(_planId: string): SyncPlanResult {
  void _planId;
  return { synced: false, reason: "google_not_connected" };
}

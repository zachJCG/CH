// Domain types for the demo data layer.
// These mirror the Supabase schema in docs/tasks/02-database-auth.md so the
// localStorage store can be swapped for real queries without reshaping the UI.

export type Role = "owner" | "manager";

export type TaskSource =
  | "manual"
  | "hostaway"
  | "breezeway"
  | "gmail"
  | "maintenance"
  | "inspection";

export type TaskStatus = "open" | "done" | "dismissed";

export type SuggestionSource = "hostaway" | "breezeway" | "gmail";

export type SuggestionStatus = "pending" | "added" | "dismissed";

export type IntegrationProvider = "hostaway" | "breezeway";

export type IntegrationStatus = "unconfigured" | "connected" | "error";

export interface Organization {
  id: string;
  name: string;
  timezone: string;
  /** "HH:mm" — default start time for Plan My Day */
  workdayStart: string;
  reminderHour: number;
  escalationAfterDays: number;
  escalationKeywords: string[];
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
}

export interface OrgMember {
  userId: string;
  role: Role;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface Homeowner {
  id: string;
  name: string;
  emails: string[];
}

export interface Task {
  id: string;
  assigneeId: string | null;
  title: string;
  notes: string | null;
  source: TaskSource;
  sourceRef: { link?: string } | null;
  estimateMinutes: number | null;
  actualMinutes: number | null;
  /** "yyyy-MM-dd" in org timezone, or null = backlog */
  doOn: string | null;
  status: TaskStatus;
  doneAt: string | null;
  escalatedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  source: SuggestionSource;
  externalId: string;
  title: string;
  summary: string | null;
  link: string | null;
  status: SuggestionStatus;
  taskId: string | null;
  /** null = anyone in the org can act on it */
  suggestedFor: string | null;
  createdAt: string;
}

export interface CheckinStepState {
  completedAt: string | null;
  addedTaskIds: string[];
  skipped: boolean;
}

export interface CheckinRun {
  id: string;
  userId: string;
  /** "yyyy-MM-dd" in org timezone */
  runDate: string;
  steps: Record<string, CheckinStepState>;
  completedAt: string | null;
}

export interface DayPlan {
  id: string;
  userId: string;
  /** "yyyy-MM-dd" in org timezone */
  planDate: string;
  /** "HH:mm" */
  startTime: string;
  confirmedAt: string | null;
}

export interface DayPlanItem {
  id: string;
  dayPlanId: string;
  taskId: string;
  position: number;
  /** ISO timestamps (UTC) */
  startAt: string;
  endAt: string;
}

export interface Integration {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface DemoState {
  /** bump to invalidate persisted demo data after breaking changes */
  version: number;
  seededAt: string;
  currentUserId: string;
  org: Organization;
  profiles: Profile[];
  members: OrgMember[];
  invites: Invite[];
  homeowners: Homeowner[];
  tasks: Task[];
  suggestions: Suggestion[];
  checkinRuns: CheckinRun[];
  dayPlans: DayPlan[];
  dayPlanItems: DayPlanItem[];
  integrations: Integration[];
}

// Pure read helpers over DemoState. Pages use these instead of filtering
// inline so the queries move to Supabase (phase 02+) in exactly one place.

import { dayInOrgTz, daysBetween, todayInOrgTz } from "@/lib/dates";
import type {
  CheckinRun,
  DayPlan,
  DayPlanItem,
  DemoState,
  Profile,
  Role,
  Suggestion,
  SuggestionSource,
  Task,
} from "@/lib/demo/types";

export function orgToday(state: DemoState): string {
  return todayInOrgTz(state.org.timezone);
}

export function currentProfile(state: DemoState): Profile {
  return (
    state.profiles.find((p) => p.id === state.currentUserId) ?? state.profiles[0]
  );
}

export function profileById(state: DemoState, userId: string): Profile | null {
  return state.profiles.find((p) => p.id === userId) ?? null;
}

export function roleOf(state: DemoState, userId: string): Role {
  return state.members.find((m) => m.userId === userId)?.role ?? "manager";
}

export function isOwner(state: DemoState): boolean {
  return roleOf(state, state.currentUserId) === "owner";
}

function byDoOnThenCreated(a: Task, b: Task): number {
  const doOn = (a.doOn ?? "9999").localeCompare(b.doOn ?? "9999");
  if (doOn !== 0) return doOn;
  return a.createdAt.localeCompare(b.createdAt);
}

export function openTasksFor(state: DemoState, userId: string): Task[] {
  return state.tasks.filter(
    (t) => t.status === "open" && t.assigneeId === userId,
  );
}

/** Open tasks with do_on before today (org tz), oldest first. */
export function overdueTasks(state: DemoState, userId: string): Task[] {
  const today = orgToday(state);
  return openTasksFor(state, userId)
    .filter((t) => t.doOn !== null && t.doOn < today)
    .sort(byDoOnThenCreated);
}

/** Open tasks scheduled for today (org tz). */
export function todayTasks(state: DemoState, userId: string): Task[] {
  const today = orgToday(state);
  return openTasksFor(state, userId)
    .filter((t) => t.doOn === today)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Open tasks with no date or a future date — the backlog. */
export function backlogTasks(state: DemoState, userId: string): Task[] {
  const today = orgToday(state);
  return openTasksFor(state, userId)
    .filter((t) => t.doOn === null || t.doOn > today)
    .sort(byDoOnThenCreated);
}

/** Latest N dateless backlog tasks for the Today page preview. */
export function backlogPreview(
  state: DemoState,
  userId: string,
  limit = 5,
): Task[] {
  return openTasksFor(state, userId)
    .filter((t) => t.doOn === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * The org-local day a task's work was logged on: the completion timestamp,
 * not the scheduled do_on (finishing overdue work counts toward today).
 */
export function completionDay(state: DemoState, task: Task): string | null {
  if (task.status !== "done") return null;
  return task.doneAt ? dayInOrgTz(state.org.timezone, task.doneAt) : task.doOn;
}

export function completedOn(
  state: DemoState,
  userId: string,
  date: string,
): Task[] {
  return state.tasks
    .filter(
      (t) =>
        t.status === "done" &&
        t.assigneeId === userId &&
        completionDay(state, t) === date,
    )
    .sort((a, b) => (a.doneAt ?? "").localeCompare(b.doneAt ?? ""));
}

export function plannedMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimateMinutes ?? 0), 0);
}

export function actualMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
}

export function overdueCount(state: DemoState, userId: string): number {
  return overdueTasks(state, userId).length;
}

/** Days overdue for the oldest overdue task, or 0. */
export function oldestOverdueDays(state: DemoState, userId: string): number {
  const overdue = overdueTasks(state, userId);
  if (overdue.length === 0) return 0;
  return daysBetween(overdue[0].doOn as string, orgToday(state));
}

export function pendingSuggestions(
  state: DemoState,
  source: SuggestionSource,
  userId?: string,
): Suggestion[] {
  return state.suggestions.filter(
    (s) =>
      s.source === source &&
      s.status === "pending" &&
      (s.suggestedFor === null || userId === undefined || s.suggestedFor === userId),
  );
}

export function checkinRunFor(
  state: DemoState,
  userId: string,
  date: string,
): CheckinRun | null {
  return (
    state.checkinRuns.find((r) => r.userId === userId && r.runDate === date) ??
    null
  );
}

export function planFor(
  state: DemoState,
  userId: string,
  date: string,
): { plan: DayPlan; items: Array<DayPlanItem & { task: Task | null }> } | null {
  const plan = state.dayPlans.find(
    (p) => p.userId === userId && p.planDate === date && p.confirmedAt !== null,
  );
  if (!plan) return null;
  const items = state.dayPlanItems
    .filter((i) => i.dayPlanId === plan.id)
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      ...i,
      task: state.tasks.find((t) => t.id === i.taskId) ?? null,
    }));
  return { plan, items };
}

/** Gmail search deep link for homeowner emails (docs/tasks/04, step 4). */
export function gmailHomeownerSearchUrl(state: DemoState): string {
  const emails = state.homeowners.flatMap((h) => h.emails);
  if (emails.length === 0) return "https://mail.google.com/mail/u/0/";
  const query = `from:(${emails.join(" OR ")}) newer_than:2d`;
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`;
}

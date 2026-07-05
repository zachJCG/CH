"use client";

// Client-side demo store. Persists to localStorage and stands in for the
// Supabase data layer that arrives in phase 02 — every action here maps 1:1
// to a future server action, so pages won't need reshaping when it lands.

import * as React from "react";

import { orgTimeToUtc, todayInOrgTz } from "@/lib/dates";
import { buildSeedState, DEMO_STATE_VERSION } from "@/lib/demo/seed";
import type {
  CheckinRun,
  CheckinStepState,
  DayPlan,
  DayPlanItem,
  DemoState,
  Homeowner,
  Invite,
  Organization,
  Role,
  Suggestion,
  Task,
  TaskSource,
} from "@/lib/demo/types";

const STORAGE_KEY = "ch-ops-diary-demo";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export interface CreateTaskInput {
  title: string;
  assigneeId?: string;
  notes?: string | null;
  source?: TaskSource;
  sourceRef?: { link?: string } | null;
  estimateMinutes?: number | null;
  doOn?: string | null;
}

export interface PlanItemInput {
  taskId: string;
}

export interface DemoActions {
  // tasks
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<Task, "title" | "notes" | "estimateMinutes" | "doOn" | "assigneeId">
    >,
  ) => void;
  setDoOn: (taskId: string, date: string | null) => void;
  completeTask: (taskId: string, actualMinutes: number | null) => void;
  reopenTask: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
  // suggestions
  addSuggestionToDiary: (
    suggestionId: string,
    overrides?: { title?: string; estimateMinutes?: number | null; doOn?: string | null },
  ) => Task | null;
  dismissSuggestion: (suggestionId: string) => void;
  // check-in
  upsertCheckinStep: (stepKey: string, patch: Partial<CheckinStepState>) => void;
  completeCheckin: () => void;
  upsertInspectionsTask: (minutes: number) => void;
  // plan
  confirmPlan: (startTime: string, items: PlanItemInput[]) => DayPlan;
  // settings
  updateOrg: (patch: Partial<Omit<Organization, "id">>) => void;
  addHomeowner: (name: string, emails: string[]) => void;
  updateHomeowner: (id: string, patch: Partial<Omit<Homeowner, "id">>) => void;
  removeHomeowner: (id: string) => void;
  addInvite: (email: string, role: Role) => void;
  revokeInvite: (inviteId: string) => void;
  // session
  setCurrentUser: (userId: string) => void;
  resetDemo: () => void;
}

interface DemoContextValue {
  state: DemoState | null;
  hydrated: boolean;
  actions: DemoActions;
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

function loadPersisted(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== DEMO_STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DemoState | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  // Mirror of `state` so actions called from event handlers can compute and
  // return new entities synchronously (setState updaters run at render time).
  const stateRef = React.useRef<DemoState | null>(null);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    setState(loadPersisted() ?? buildSeedState());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated || state === null) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — demo keeps working in memory
    }
  }, [state, hydrated]);

  const actions = React.useMemo<DemoActions>(() => {
    const update = (fn: (s: DemoState) => DemoState) => {
      setState((s) => (s === null ? s : fn(s)));
    };

    const touchTask = (task: Task, patch: Partial<Task>): Task => ({
      ...task,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    const patchTask = (s: DemoState, taskId: string, patch: Partial<Task>) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === taskId ? touchTask(t, patch) : t)),
    });

    const buildTask = (s: DemoState, input: CreateTaskInput): Task => {
      const now = new Date().toISOString();
      return {
        id: newId("task"),
        assigneeId: input.assigneeId ?? s.currentUserId,
        title: input.title.trim(),
        notes: input.notes ?? null,
        source: input.source ?? "manual",
        sourceRef: input.sourceRef ?? null,
        estimateMinutes: input.estimateMinutes ?? null,
        actualMinutes: null,
        doOn: input.doOn ?? null,
        status: "open",
        doneAt: null,
        escalatedAt: null,
        createdBy: s.currentUserId,
        createdAt: now,
        updatedAt: now,
      };
    };

    const upsertRun = (
      s: DemoState,
      mutate: (run: CheckinRun) => CheckinRun,
    ): DemoState => {
      const today = todayInOrgTz(s.org.timezone);
      const existing = s.checkinRuns.find(
        (r) => r.userId === s.currentUserId && r.runDate === today,
      );
      if (existing) {
        return {
          ...s,
          checkinRuns: s.checkinRuns.map((r) =>
            r.id === existing.id ? mutate(r) : r,
          ),
        };
      }
      const fresh: CheckinRun = {
        id: newId("run"),
        userId: s.currentUserId,
        runDate: today,
        steps: {},
        completedAt: null,
      };
      return { ...s, checkinRuns: [...s.checkinRuns, mutate(fresh)] };
    };

    return {
      createTask: (input) => {
        const snapshot = stateRef.current;
        if (snapshot === null) throw new Error("demo store not hydrated yet");
        const created = buildTask(snapshot, input);
        update((s) => ({ ...s, tasks: [created, ...s.tasks] }));
        stateRef.current = { ...snapshot, tasks: [created, ...snapshot.tasks] };
        return created;
      },

      updateTask: (taskId, patch) => update((s) => patchTask(s, taskId, patch)),

      setDoOn: (taskId, date) => update((s) => patchTask(s, taskId, { doOn: date })),

      completeTask: (taskId, actualMinutes) =>
        update((s) =>
          patchTask(s, taskId, {
            status: "done",
            actualMinutes,
            doneAt: new Date().toISOString(),
            doOn:
              s.tasks.find((t) => t.id === taskId)?.doOn ??
              todayInOrgTz(s.org.timezone),
          }),
        ),

      reopenTask: (taskId) =>
        update((s) =>
          patchTask(s, taskId, { status: "open", doneAt: null, actualMinutes: null }),
        ),

      dismissTask: (taskId) => update((s) => patchTask(s, taskId, { status: "dismissed" })),

      addSuggestionToDiary: (suggestionId, overrides) => {
        const snapshot = stateRef.current;
        if (snapshot === null) return null;
        const sugg = snapshot.suggestions.find((x) => x.id === suggestionId);
        if (!sugg || sugg.status !== "pending") return null;
        const created = buildTask(snapshot, {
          title: overrides?.title ?? sugg.title,
          source: sugg.source,
          sourceRef: sugg.link ? { link: sugg.link } : null,
          notes: sugg.summary,
          estimateMinutes: overrides?.estimateMinutes ?? null,
          doOn:
            overrides?.doOn !== undefined
              ? overrides.doOn
              : todayInOrgTz(snapshot.org.timezone),
        });
        const markAdded = (list: Suggestion[]): Suggestion[] =>
          list.map((x) =>
            x.id === suggestionId
              ? { ...x, status: "added" as const, taskId: created.id }
              : x,
          );
        update((s) => ({
          ...s,
          tasks: [created, ...s.tasks],
          suggestions: markAdded(s.suggestions),
        }));
        stateRef.current = {
          ...snapshot,
          tasks: [created, ...snapshot.tasks],
          suggestions: markAdded(snapshot.suggestions),
        };
        return created;
      },

      dismissSuggestion: (suggestionId) =>
        update((s) => ({
          ...s,
          suggestions: s.suggestions.map((x) =>
            x.id === suggestionId ? { ...x, status: "dismissed" as const } : x,
          ),
        })),

      upsertCheckinStep: (stepKey, patch) =>
        update((s) =>
          upsertRun(s, (run) => {
            const base: CheckinStepState = run.steps[stepKey] ?? {
              completedAt: null,
              addedTaskIds: [],
              skipped: false,
            };
            return {
              ...run,
              steps: { ...run.steps, [stepKey]: { ...base, ...patch } },
            };
          }),
        ),

      completeCheckin: () =>
        update((s) =>
          upsertRun(s, (run) => ({
            ...run,
            completedAt: run.completedAt ?? new Date().toISOString(),
          })),
        ),

      upsertInspectionsTask: (minutes) =>
        update((s) => {
          const today = todayInOrgTz(s.org.timezone);
          const existing = s.tasks.find(
            (t) =>
              t.assigneeId === s.currentUserId &&
              t.source === "inspection" &&
              t.title === "Inspections" &&
              t.doOn === today &&
              t.status === "open",
          );
          if (existing) {
            return patchTask(s, existing.id, { estimateMinutes: minutes });
          }
          const created = buildTask(s, {
            title: "Inspections",
            source: "inspection",
            estimateMinutes: minutes,
            doOn: today,
          });
          return { ...s, tasks: [created, ...s.tasks] };
        }),

      confirmPlan: (startTime, items) => {
        const snapshot = stateRef.current;
        if (snapshot === null) throw new Error("demo store not hydrated yet");
        const today = todayInOrgTz(snapshot.org.timezone);
        const existing = snapshot.dayPlans.find(
          (p) => p.userId === snapshot.currentUserId && p.planDate === today,
        );
        const plan: DayPlan = existing
          ? { ...existing, startTime, confirmedAt: new Date().toISOString() }
          : {
              id: newId("plan"),
              userId: snapshot.currentUserId,
              planDate: today,
              startTime,
              confirmedAt: new Date().toISOString(),
            };

        let cursor = orgTimeToUtc(snapshot.org.timezone, today, startTime);
        const planItems: DayPlanItem[] = items.map((item, index) => {
          const task = snapshot.tasks.find((t) => t.id === item.taskId);
          const minutes = task?.estimateMinutes ?? 30;
          const startAt = cursor;
          const endAt = new Date(
            new Date(startAt).getTime() + minutes * 60_000,
          ).toISOString();
          cursor = endAt;
          return {
            id: newId("item"),
            dayPlanId: plan.id,
            taskId: item.taskId,
            position: index,
            startAt,
            endAt,
          };
        });

        const apply = (s: DemoState): DemoState => ({
          ...s,
          dayPlans: existing
            ? s.dayPlans.map((p) => (p.id === plan.id ? plan : p))
            : [...s.dayPlans, plan],
          // re-confirming replaces items cleanly — no orphans
          dayPlanItems: [
            ...s.dayPlanItems.filter((i) => i.dayPlanId !== plan.id),
            ...planItems,
          ],
        });
        update(apply);
        stateRef.current = apply(snapshot);
        return plan;
      },

      updateOrg: (patch) => update((s) => ({ ...s, org: { ...s.org, ...patch } })),

      addHomeowner: (name, emails) =>
        update((s) => ({
          ...s,
          homeowners: [...s.homeowners, { id: newId("ho"), name, emails }],
        })),

      updateHomeowner: (id, patch) =>
        update((s) => ({
          ...s,
          homeowners: s.homeowners.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      removeHomeowner: (id) =>
        update((s) => ({
          ...s,
          homeowners: s.homeowners.filter((h) => h.id !== id),
        })),

      addInvite: (email, role) =>
        update((s) => {
          const invite: Invite = {
            id: newId("invite"),
            email,
            role,
            invitedBy: s.currentUserId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
            acceptedAt: null,
          };
          return { ...s, invites: [...s.invites, invite] };
        }),

      revokeInvite: (inviteId) =>
        update((s) => ({
          ...s,
          invites: s.invites.filter((i) => i.id !== inviteId),
        })),

      setCurrentUser: (userId) =>
        update((s) =>
          s.profiles.some((p) => p.id === userId) ? { ...s, currentUserId: userId } : s,
        ),

      resetDemo: () => setState(buildSeedState()),
    };
  }, []);

  const value = React.useMemo(
    () => ({ state, hydrated, actions }),
    [state, hydrated, actions],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

/** Store access for pages that can render before hydration (landing, login). */
export function useDemoMaybe(): DemoContextValue {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemoMaybe must be used inside <DemoProvider>");
  return ctx;
}

/** Store access inside the app shell, which only renders after hydration. */
export function useDemo(): { state: DemoState; actions: DemoActions } {
  const ctx = useDemoMaybe();
  if (ctx.state === null) {
    throw new Error("useDemo must be used under the hydrated app shell");
  }
  return { state: ctx.state, actions: ctx.actions };
}

// Deterministic demo seed, built relative to "today" in the org timezone so
// Overdue / Today / Backlog / History always have something to show.
// Mirrors the seed described in docs/tasks/03-work-diary.md (and the history
// spread from docs/tasks/08-sharing-history-polish.md).

import { dateInOrgTz, orgTimeToUtc, todayInOrgTz } from "@/lib/dates";
import type {
  DemoState,
  Organization,
  Suggestion,
  Task,
  TaskSource,
} from "@/lib/demo/types";

export const DEMO_STATE_VERSION = 1;

export const OWNER_ID = "user-sarah";
export const MANAGER_ID = "user-mike";

const ORG: Organization = {
  id: "org-ch",
  name: "CH Property Management",
  timezone: "America/New_York",
  workdayStart: "08:30",
  reminderHour: 7,
  escalationAfterDays: 2,
  escalationKeywords: [
    "broken",
    "leak",
    "leaking",
    "not working",
    "urgent",
    "no hot water",
    "wifi",
    "lock",
    "dirty",
    "smell",
    "refund",
    "complaint",
  ],
};

let taskCounter = 0;

function makeTask(
  input: Partial<Task> & { title: string; assigneeId: string },
  createdOffsetDays: number,
  tz: string,
): Task {
  taskCounter += 1;
  const createdAt = orgTimeToUtc(tz, dateInOrgTz(tz, createdOffsetDays), "08:00");
  return {
    id: `task-seed-${taskCounter}`,
    notes: null,
    source: "manual" as TaskSource,
    sourceRef: null,
    estimateMinutes: null,
    actualMinutes: null,
    doOn: null,
    status: "open",
    doneAt: null,
    escalatedAt: null,
    createdBy: input.assigneeId,
    createdAt,
    updatedAt: createdAt,
    ...input,
  };
}

function doneOn(
  task: Task,
  offsetDays: number,
  actualMinutes: number,
  tz: string,
): Task {
  return {
    ...task,
    status: "done",
    doOn: dateInOrgTz(tz, offsetDays),
    actualMinutes,
    doneAt: orgTimeToUtc(tz, dateInOrgTz(tz, offsetDays), "15:00"),
  };
}

export function buildSeedState(): DemoState {
  taskCounter = 0;
  const tz = ORG.timezone;
  const d = (offset: number) => dateInOrgTz(tz, offset);
  const now = new Date().toISOString();

  const openTasks: Task[] = [
    // ---- Sarah (owner) — overdue
    makeTask(
      {
        title: "Replace smart lock batteries — Unit 47",
        assigneeId: OWNER_ID,
        source: "maintenance",
        estimateMinutes: 30,
        doOn: d(-3),
        notes: "Guest reported the keypad was sluggish at checkout.",
      },
      -4,
      tz,
    ),
    makeTask(
      {
        title: "Call homeowner re: deck repair quote (Beachside 12)",
        assigneeId: OWNER_ID,
        source: "gmail",
        estimateMinutes: 20,
        doOn: d(-1),
        sourceRef: { link: "https://mail.google.com/mail/u/0/#inbox" },
      },
      -2,
      tz,
    ),
    // ---- Sarah — today
    makeTask(
      {
        title: "Walk-through with new cleaning vendor",
        assigneeId: OWNER_ID,
        estimateMinutes: 60,
        doOn: d(0),
        notes: "Meet at the Harborview lobby. Bring the inspection checklist.",
      },
      -1,
      tz,
    ),
    makeTask(
      {
        title: "Approve pool heater invoice — Unit 8",
        assigneeId: OWNER_ID,
        source: "breezeway",
        estimateMinutes: 15,
        doOn: d(0),
        sourceRef: { link: "https://app.breezeway.io/" },
      },
      -1,
      tz,
    ),
    makeTask(
      {
        title: "Guest issue — WiFi down at Sandpiper Cottage",
        assigneeId: OWNER_ID,
        source: "hostaway",
        estimateMinutes: 45,
        doOn: d(0),
        sourceRef: { link: "https://dashboard.hostaway.com/" },
        notes: "Router may need replacement; spare in the office storage.",
      },
      0,
      tz,
    ),
    // ---- Sarah — backlog
    makeTask(
      {
        title: "Re-photograph Unit 23 after furniture swap",
        assigneeId: OWNER_ID,
        estimateMinutes: 90,
      },
      -6,
      tz,
    ),
    makeTask(
      {
        title: "Draft winter maintenance schedule",
        assigneeId: OWNER_ID,
        source: "maintenance",
        estimateMinutes: 120,
      },
      -5,
      tz,
    ),
    makeTask(
      {
        title: "Order replacement patio umbrellas (3)",
        assigneeId: OWNER_ID,
        estimateMinutes: 25,
        doOn: d(2),
      },
      -3,
      tz,
    ),
    // ---- Mike (manager) — overdue
    makeTask(
      {
        title: "Fix dripping faucet — Unit 31 master bath",
        assigneeId: MANAGER_ID,
        source: "maintenance",
        estimateMinutes: 45,
        doOn: d(-2),
      },
      -3,
      tz,
    ),
    // ---- Mike — today
    makeTask(
      {
        title: "Restock welcome baskets for weekend arrivals",
        assigneeId: MANAGER_ID,
        estimateMinutes: 40,
        doOn: d(0),
      },
      -1,
      tz,
    ),
    makeTask(
      {
        title: "Guest issue — smell in hallway, Dockside 4",
        assigneeId: MANAGER_ID,
        source: "hostaway",
        estimateMinutes: 30,
        doOn: d(0),
        sourceRef: { link: "https://dashboard.hostaway.com/" },
      },
      0,
      tz,
    ),
    // ---- Mike — backlog
    makeTask(
      {
        title: "Inventory count — linen closet, main office",
        assigneeId: MANAGER_ID,
        source: "inspection",
        estimateMinutes: 60,
      },
      -7,
      tz,
    ),
    makeTask(
      {
        title: "Touch-up paint in Unit 15 stairwell",
        assigneeId: MANAGER_ID,
        source: "maintenance",
        estimateMinutes: 90,
      },
      -4,
      tz,
    ),
  ];

  // Completed tasks spread across the past week so History demos well.
  const completedSpecs: Array<{
    title: string;
    assigneeId: string;
    source?: TaskSource;
    offset: number;
    actual: number;
  }> = [
    { title: "Deep clean after checkout — Unit 12", assigneeId: OWNER_ID, offset: -1, actual: 95 },
    { title: "Reset smart thermostat — Harborview 3", assigneeId: OWNER_ID, source: "hostaway", offset: -1, actual: 20 },
    { title: "Monthly fire-extinguisher checks", assigneeId: OWNER_ID, source: "inspection", offset: -2, actual: 75 },
    { title: "Replace shower head — Unit 19", assigneeId: OWNER_ID, source: "maintenance", offset: -3, actual: 35 },
    { title: "Homeowner statement questions — Grayson", assigneeId: OWNER_ID, source: "gmail", offset: -5, actual: 30 },
    { title: "Unclog kitchen sink — Dockside 2", assigneeId: MANAGER_ID, source: "maintenance", offset: -1, actual: 50 },
    { title: "Stage Unit 40 for photos", assigneeId: MANAGER_ID, offset: -2, actual: 110 },
    { title: "Pool chemical balance — Beachside", assigneeId: MANAGER_ID, source: "breezeway", offset: -4, actual: 40 },
    { title: "Weekly inspections — north cluster", assigneeId: MANAGER_ID, source: "inspection", offset: -6, actual: 150 },
  ];

  const completedTasks = completedSpecs.map((spec) =>
    doneOn(
      makeTask(
        {
          title: spec.title,
          assigneeId: spec.assigneeId,
          source: spec.source ?? "manual",
          estimateMinutes: Math.round(spec.actual / 5) * 5,
        },
        spec.offset - 1,
        tz,
      ),
      spec.offset,
      spec.actual,
      tz,
    ),
  );

  const suggestions: Suggestion[] = [
    {
      id: "sugg-ha-1",
      source: "hostaway",
      externalId: "conv-88231",
      title: "Guest issue — Unit 26 (Kramer party)",
      summary:
        '"...the hot tub is not working and we leave Saturday — can someone come today?"',
      link: "https://dashboard.hostaway.com/",
      status: "pending",
      taskId: null,
      suggestedFor: null,
      createdAt: now,
    },
    {
      id: "sugg-ha-2",
      source: "hostaway",
      externalId: "conv-88245",
      title: "Guest issue — Sandpiper Cottage (Alvarez)",
      summary: '"...back door lock keeps jamming, feels broken."',
      link: "https://dashboard.hostaway.com/",
      status: "pending",
      taskId: null,
      suggestedFor: null,
      createdAt: now,
    },
    {
      id: "sugg-bw-1",
      source: "breezeway",
      externalId: "report-5512",
      title: "Issue report — cracked tile, Unit 8 entry",
      summary: "Filed by cleaning crew yesterday afternoon, photo attached.",
      link: "https://app.breezeway.io/",
      status: "pending",
      taskId: null,
      suggestedFor: null,
      createdAt: now,
    },
    {
      id: "sugg-bw-2",
      source: "breezeway",
      externalId: "report-5518",
      title: "Issue report — dryer vent needs cleaning, Unit 31",
      summary: "Flagged during turnover inspection.",
      link: "https://app.breezeway.io/",
      status: "pending",
      taskId: null,
      suggestedFor: null,
      createdAt: now,
    },
    {
      id: "sugg-gm-1",
      source: "gmail",
      externalId: "msg-19af2",
      title: "Homeowner email — Patricia Grayson",
      summary: "Re: October statement — question about the landscaping charge.",
      link: "https://mail.google.com/mail/u/0/#inbox",
      status: "pending",
      taskId: null,
      suggestedFor: OWNER_ID,
      createdAt: now,
    },
  ];

  return {
    version: DEMO_STATE_VERSION,
    seededAt: now,
    currentUserId: OWNER_ID,
    org: { ...ORG, escalationKeywords: [...ORG.escalationKeywords] },
    profiles: [
      { id: OWNER_ID, fullName: "Sarah Calhoun", email: "sarah@chproperties.com" },
      { id: MANAGER_ID, fullName: "Mike Rivera", email: "mike@chproperties.com" },
    ],
    members: [
      { userId: OWNER_ID, role: "owner" },
      { userId: MANAGER_ID, role: "manager" },
    ],
    invites: [],
    homeowners: [
      {
        id: "ho-1",
        name: "Patricia Grayson",
        emails: ["pgrayson@gmail.com"],
      },
      {
        id: "ho-2",
        name: "Tom & Ellen Whitfield",
        emails: ["twhitfield@outlook.com", "ellen.whitfield@gmail.com"],
      },
    ],
    tasks: [...openTasks, ...completedTasks],
    suggestions,
    checkinRuns: [],
    dayPlans: [],
    dayPlanItems: [],
    integrations: [
      { provider: "hostaway", status: "unconfigured", lastSyncedAt: null, lastError: null },
      { provider: "breezeway", status: "unconfigured", lastSyncedAt: null, lastError: null },
    ],
  };
}

export function todayForOrg(state: { org: Organization }): string {
  return todayInOrgTz(state.org.timezone);
}

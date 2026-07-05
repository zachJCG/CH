"use client";

// Cards composed on the Today page: morning check-in status, confirmed plan
// timeline, overdue banner, and the first-run "Get set up" checklist.

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatOrgTime } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import {
  checkinRunFor,
  isOwner,
  oldestOverdueDays,
  orgToday,
  overdueCount,
  planFor,
} from "@/lib/demo/selectors";
import { formatMinutes, plural } from "@/lib/format";
import { CHECKIN_STEPS } from "@/lib/checkin";

export function OverdueBanner() {
  const { state } = useDemo();
  const count = overdueCount(state, state.currentUserId);
  if (count === 0) return null;
  const oldest = oldestOverdueDays(state, state.currentUserId);
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
    >
      <TriangleAlert className="size-4 shrink-0" />
      {plural(count, "task")} overdue — oldest is {plural(oldest, "day")}.
    </div>
  );
}

export function CheckinCard() {
  const { state } = useDemo();
  const run = checkinRunFor(state, state.currentUserId, orgToday(state));

  const stepCount = CHECKIN_STEPS.length;
  const doneSteps = run
    ? CHECKIN_STEPS.filter(
        (s) => run.steps[s.key]?.completedAt || run.steps[s.key]?.skipped,
      ).length
    : 0;

  let status: "not-started" | "in-progress" | "done" = "not-started";
  if (run?.completedAt) status = "done";
  else if (run) status = "in-progress";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="size-4" /> Morning check-in
        </CardTitle>
        <CardDescription>
          {status === "done" && "Done for today ✓"}
          {status === "in-progress" && `In progress — ${doneSteps}/${stepCount} steps`}
          {status === "not-started" &&
            "Walk Hostaway, Breezeway, maintenance, homeowner email and inspections so nothing slips."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status !== "done" ? (
          <Button size="sm" render={<Link href="/checkin" />}>
            {status === "in-progress" ? "Resume check-in" : "Start check-in"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" render={<Link href="/plan" />}>
            Plan my day <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanTimelineCard() {
  const { state } = useDemo();
  const tz = state.org.timezone;
  const result = planFor(state, state.currentUserId, orgToday(state));
  if (!result) return null;
  const { items } = result;
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" /> Today&apos;s plan
        </CardTitle>
        <CardDescription>
          Done by {formatOrgTime(tz, items[items.length - 1].endAt)} ·{" "}
          <Link href="/plan" className="underline underline-offset-2">
            adjust
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 text-sm">
              <span className="w-32 shrink-0 tabular-nums text-muted-foreground">
                {formatOrgTime(tz, item.startAt)}–{formatOrgTime(tz, item.endAt)}
              </span>
              <span
                className={
                  item.task?.status === "done"
                    ? "text-muted-foreground line-through"
                    : ""
                }
              >
                {item.task?.title ?? "(task removed)"}
              </span>
              {item.task?.estimateMinutes != null && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {formatMinutes(item.task.estimateMinutes)}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Google Calendar sync arrives with phase 06 — plans stay in the app for
          now.
        </p>
      </CardContent>
    </Card>
  );
}

/** First-run checklist (docs/tasks/08) — owner only. */
export function GetSetUpCard() {
  const { state } = useDemo();
  if (!isOwner(state)) return null;

  const items = [
    {
      label: "Invite your team",
      href: "/settings/team",
      done: state.members.length > 1 || state.invites.length > 0,
    },
    {
      label: "Add homeowners",
      href: "/settings/homeowners",
      done: state.homeowners.length > 0,
    },
    {
      label: "Connect integrations & Google",
      href: "/settings/integrations",
      done: state.integrations.some((i) => i.status === "connected"),
    },
  ];
  if (items.every((i) => i.done)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Get set up</CardTitle>
        <CardDescription>
          Three steps and the whole morning routine comes alive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className={item.done ? "text-muted-foreground line-through" : ""}>
                  {item.label}
                </span>
                <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

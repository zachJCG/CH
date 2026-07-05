"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Circle } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { QuickAdd } from "@/components/app/quick-add";
import { TaskRow } from "@/components/app/task-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDayLong, formatOrgTime } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import {
  backlogPreview,
  checkinRunFor,
  isOwner,
  orgToday,
  overdueTasks,
  planFor,
  plannedMinutes,
  profileById,
  roleOf,
  todayTasks,
} from "@/lib/demo/selectors";
import { formatMinutes } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamMemberPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { state } = useDemo();
  const profile = profileById(state, userId);

  if (!profile) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold">Team</h1>
        </header>
        <EmptyState
          message="This teammate isn't in your org."
          action={
            <Button variant="outline" size="sm" render={<Link href="/team" />}>
              <ArrowLeft data-icon="inline-start" /> Back to team
            </Button>
          }
        />
      </div>
    );
  }

  const today = orgToday(state);
  const tz = state.org.timezone;
  const firstName = profile.fullName.split(/\s+/)[0];
  const isSelf = userId === state.currentUserId;
  const checkinDone = checkinRunFor(state, userId, today)?.completedAt != null;

  const overdue = overdueTasks(state, userId);
  const todays = todayTasks(state, userId);
  const preview = backlogPreview(state, userId);
  const planned = plannedMinutes(todays);
  const planResult = planFor(state, userId, today);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/team" />}
        >
          <ArrowLeft data-icon="inline-start" /> Team
        </Button>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
              <span className="truncate">{profile.fullName}</span>
              <Badge variant="secondary" className="capitalize">
                {roleOf(state, userId)}
              </Badge>
            </h1>
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              {checkinDone ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  Check-in done today
                </>
              ) : (
                <>
                  <Circle className="size-4 shrink-0" />
                  Check-in not yet
                </>
              )}
              <span>
                · {formatDayLong(today)}
                {planned > 0 && <> · Planned: {formatMinutes(planned)}</>}
              </span>
            </p>
          </div>
        </div>
      </header>

      {isSelf && (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          This is your own diary —{" "}
          <Link href="/today" className="underline underline-offset-2">
            head to Today
          </Link>{" "}
          to work it.
        </p>
      )}

      {planResult && planResult.items.length > 0 && (
        <section aria-labelledby="plan-heading">
          <h2
            id="plan-heading"
            className="mb-1 flex items-center gap-1.5 text-sm font-semibold"
          >
            <CalendarClock className="size-4" /> Confirmed plan
          </h2>
          <ol className="space-y-2 rounded-lg border bg-muted/20 p-3">
            {planResult.items.map((item) => (
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
        </section>
      )}

      {isOwner(state) && !isSelf && (
        <div>
          <QuickAdd
            assigneeId={userId}
            placeholder={`Add a task to ${firstName}'s diary…`}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Adds to their diary.
          </p>
        </div>
      )}

      <section aria-labelledby="overdue-heading">
        <h2
          id="overdue-heading"
          className="mb-1 text-sm font-semibold text-destructive"
        >
          Overdue
        </h2>
        {overdue.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing overdue.
          </p>
        ) : (
          <div>
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} readOnly showOverdueAge />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="mb-1 text-sm font-semibold">
          Today
        </h2>
        {todays.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing on {firstName}&apos;s plate for today.
          </p>
        ) : (
          <div>
            {todays.map((task) => (
              <TaskRow key={task.id} task={task} readOnly />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="backlog-heading">
        <h2
          id="backlog-heading"
          className="mb-1 text-sm font-semibold text-muted-foreground"
        >
          Backlog
        </h2>
        {preview.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No undated backlog tasks.
          </p>
        ) : (
          <div>
            {preview.map((task) => (
              <TaskRow key={task.id} task={task} readOnly />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

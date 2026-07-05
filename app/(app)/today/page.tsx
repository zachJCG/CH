"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { QuickAdd } from "@/components/app/quick-add";
import { TaskRow } from "@/components/app/task-row";
import {
  CheckinCard,
  GetSetUpCard,
  OverdueBanner,
  PlanTimelineCard,
} from "@/components/app/today-cards";
import { Button } from "@/components/ui/button";
import { formatDayLong } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import {
  backlogPreview,
  currentProfile,
  orgToday,
  overdueTasks,
  plannedMinutes,
  todayTasks,
} from "@/lib/demo/selectors";
import { formatMinutes } from "@/lib/format";

export default function TodayPage() {
  const { state } = useDemo();
  const me = currentProfile(state);
  const today = orgToday(state);

  const overdue = overdueTasks(state, me.id);
  const todays = todayTasks(state, me.id);
  const preview = backlogPreview(state, me.id);
  const planned = plannedMinutes(todays);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Today</h1>
        <p className="text-sm text-muted-foreground">
          {formatDayLong(today)}
          {planned > 0 && <> · Planned: {formatMinutes(planned)}</>}
        </p>
      </header>

      <OverdueBanner />

      <div className="grid gap-4 lg:grid-cols-2">
        <CheckinCard />
        <GetSetUpCard />
      </div>
      <PlanTimelineCard />

      <QuickAdd defaultToday />

      <section aria-labelledby="overdue-heading">
        <h2 id="overdue-heading" className="mb-1 text-sm font-semibold text-destructive">
          Overdue
        </h2>
        {overdue.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing overdue — nice work.
          </p>
        ) : (
          <div>
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} showOverdueAge />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="mb-1 text-sm font-semibold">
          Today
        </h2>
        {todays.length === 0 ? (
          <EmptyState message="Nothing planned for today yet — add a task above or pull one up from the backlog." />
        ) : (
          <div>
            {todays.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="backlog-heading">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="backlog-heading" className="text-sm font-semibold text-muted-foreground">
            Backlog
          </h2>
          <Button variant="ghost" size="sm" render={<Link href="/backlog" />}>
            View all <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        {preview.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Backlog is empty — quick-add with “Today” unchecked to park a task.
          </p>
        ) : (
          <div>
            {preview.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

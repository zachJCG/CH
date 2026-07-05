"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { SourceBadge } from "@/components/app/source-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDayLong, formatOrgTime } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { orgToday, planFor, todayTasks } from "@/lib/demo/selectors";
import type { Task } from "@/lib/demo/types";
import { formatMinutes, plural } from "@/lib/format";
import { syncPlanToGoogle } from "@/lib/google/calendar";
import { cn } from "@/lib/utils";

const DEFAULT_ESTIMATE = 30;
const TIME_RE = /^\d{1,2}:\d{2}$/;

/** "HH:mm" → a Date on an arbitrary base day, for stacking math only. */
function clockFrom(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(2000, 0, 1, h, m);
}

interface Slot {
  start: string;
  end: string;
}

export default function PlanPage() {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const tz = state.org.timezone;
  const tasks = todayTasks(state, state.currentUserId);
  const confirmed = planFor(state, state.currentUserId, today);

  const [startTime, setStartTime] = React.useState(
    () => confirmed?.plan.startTime ?? state.org.workdayStart,
  );
  // Task ids in plan order, seeded from the confirmed plan's item order.
  const [order, setOrder] = React.useState<string[]>(
    () => confirmed?.items.map((i) => i.taskId) ?? [],
  );
  const [excludedIds, setExcludedIds] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // Seeded order first (tasks still open + today only), new today-tasks appended.
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const orderedIds = [
    ...order.filter((id) => byId.has(id)),
    ...tasks.map((t) => t.id).filter((id) => !order.includes(id)),
  ];
  const orderedTasks = orderedIds.flatMap((id) => byId.get(id) ?? []);
  const includedIds = orderedIds.filter((id) => !excludedIds.has(id));

  // Sequential stacking: each included item starts where the previous ended.
  const validStart = TIME_RE.test(startTime)
    ? startTime
    : TIME_RE.test(state.org.workdayStart)
      ? state.org.workdayStart
      : "08:30";
  const slots = new Map<string, Slot>();
  let cursor = clockFrom(validStart);
  let totalMinutes = 0;
  for (const task of orderedTasks) {
    if (excludedIds.has(task.id)) continue;
    const minutes = task.estimateMinutes ?? DEFAULT_ESTIMATE;
    const end = new Date(cursor.getTime() + minutes * 60_000);
    slots.set(task.id, {
      start: format(cursor, "h:mm a"),
      end: format(end, "h:mm a"),
    });
    totalMinutes += minutes;
    cursor = end;
  }
  const doneBy = includedIds.length > 0 ? format(cursor, "h:mm a") : null;

  const move = (taskId: string, delta: -1 | 1) => {
    const index = orderedIds.indexOf(taskId);
    const next = index + delta;
    if (index === -1 || next < 0 || next >= orderedIds.length) return;
    const copy = [...orderedIds];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setOrder(copy);
  };

  const toggleInclude = (taskId: string, included: boolean) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (included) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const setEstimate = (taskId: string, raw: string) => {
    const parsed = parseInt(raw, 10);
    actions.updateTask(taskId, {
      estimateMinutes: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    });
  };

  const confirmPlan = () => {
    const plan = actions.confirmPlan(
      validStart,
      includedIds.map((id) => ({ taskId: id })),
    );
    setOrder(orderedIds);
    const sync = syncPlanToGoogle(plan.id);
    if (sync.synced) {
      toast.success("Saved and synced to Google Calendar.");
    } else {
      toast("Saved. Google Calendar sync arrives in phase 06.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Plan my day</h1>
        <p className="text-sm text-muted-foreground">
          {formatDayLong(today)} · stack today&apos;s tasks from a start time
        </p>
      </header>

      {confirmed && confirmed.items.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Confirmed plan
            </CardTitle>
            <CardDescription>
              {confirmed.plan.confirmedAt && (
                <>Confirmed at {formatOrgTime(tz, confirmed.plan.confirmedAt)} — </>
              )}
              done by{" "}
              {formatOrgTime(tz, confirmed.items[confirmed.items.length - 1].endAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1">
              {confirmed.items.map((item) => (
                <li key={item.id} className="flex items-baseline gap-3 text-sm">
                  <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatOrgTime(tz, item.startAt)}
                  </span>
                  <span className="truncate">
                    {item.task?.title ?? "(task removed)"}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Adjust below and confirm again — the plan is replaced cleanly.
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          message="No tasks are set for today yet — pull some in from your diary or run the morning check-in."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" render={<Link href="/today" />}>
                Go to Today
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/checkin" />}>
                Start check-in
              </Button>
            </div>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build the schedule</CardTitle>
            <CardDescription>
              Uncheck a task to leave it out — it stays in your diary for today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="plan-start-time">Start time</Label>
              <Input
                id="plan-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-32"
              />
            </div>

            <ul className="divide-y border-t">
              {orderedTasks.map((task, index) => (
                <PlanRow
                  key={task.id}
                  task={task}
                  included={!excludedIds.has(task.id)}
                  slot={slots.get(task.id) ?? null}
                  canMoveUp={index > 0}
                  canMoveDown={index < orderedTasks.length - 1}
                  onToggle={(included) => toggleInclude(task.id, included)}
                  onMove={(delta) => move(task.id, delta)}
                  onEstimateChange={(raw) => setEstimate(task.id, raw)}
                />
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {doneBy ? `Done by ${doneBy}` : "Nothing selected"}
              </p>
              <p className="text-xs text-muted-foreground">
                {includedIds.length === 0
                  ? "Check at least one task to confirm a plan."
                  : `${formatMinutes(totalMinutes)} across ${plural(includedIds.length, "task")} · Google Calendar sync arrives in phase 06`}
              </p>
            </div>
            <Button onClick={confirmPlan} disabled={includedIds.length === 0}>
              Confirm plan
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function PlanRow({
  task,
  included,
  slot,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMove,
  onEstimateChange,
}: {
  task: Task;
  included: boolean;
  slot: Slot | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (included: boolean) => void;
  onMove: (delta: -1 | 1) => void;
  onEstimateChange: (raw: string) => void;
}) {
  const estimateId = React.useId();

  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox
        className="mt-1"
        checked={included}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={`Include “${task.title}” in the plan`}
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn("text-sm font-medium", !included && "text-muted-foreground")}
          >
            {task.title}
          </span>
          <SourceBadge source={task.source} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">
            {included && slot
              ? `${slot.start} – ${slot.end}`
              : "Skipped — stays in the diary"}
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              id={estimateId}
              type="number"
              min={0}
              step={5}
              value={task.estimateMinutes ?? ""}
              onChange={(e) => onEstimateChange(e.target.value)}
              placeholder="30"
              aria-label={`Estimate for “${task.title}” in minutes`}
              className="h-7 w-16 text-sm"
            />
            <Label htmlFor={estimateId} className="text-xs font-normal text-muted-foreground">
              {task.estimateMinutes == null ? "30 (default)" : "min"}
            </Label>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
          aria-label={`Move “${task.title}” up`}
        >
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
          aria-label={`Move “${task.title}” down`}
        >
          <ArrowDown />
        </Button>
      </div>
    </li>
  );
}

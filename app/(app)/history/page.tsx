"use client";

import * as React from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { CompletedTaskRow } from "@/components/app/task-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateInOrgTz, formatDayLong } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import {
  actualMinutes,
  completedOn,
  completionDay,
  currentProfile,
  profileById,
} from "@/lib/demo/selectors";
import { formatMinutes, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/demo/types";

const BAR_MAX_PX = 64;

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export default function HistoryPage() {
  const { state } = useDemo();
  const tz = state.org.timezone;

  const [personId, setPersonId] = React.useState(() => currentProfile(state).id);
  const [selectedDate, setSelectedDate] = React.useState(() => dateInOrgTz(tz, -1));
  // Export-range overrides; null = follow the viewed week.
  const [fromOverride, setFromOverride] = React.useState<string | null>(null);
  const [toOverride, setToOverride] = React.useState<string | null>(null);

  const person = profileById(state, personId) ?? currentProfile(state);

  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );
  const dayMinutes = weekDays.map((d) =>
    actualMinutes(completedOn(state, personId, d)),
  );
  const weekMax = Math.max(...dayMinutes);

  const dayTasks = completedOn(state, personId, selectedDate);
  const dayTotal = actualMinutes(dayTasks);

  const monthPrefix = selectedDate.slice(0, 7);
  const monthTotal = actualMinutes(
    state.tasks.filter(
      (t) =>
        t.assigneeId === personId &&
        (completionDay(state, t)?.startsWith(monthPrefix) ?? false),
    ),
  );

  const exportFrom = fromOverride ?? weekDays[0];
  const exportTo = toOverride ?? weekDays[6];

  const personItems = state.members
    .map((member) => profileById(state, member.userId))
    .filter((profile): profile is NonNullable<typeof profile> => profile !== null)
    .map((profile) => ({
      value: profile.id,
      label:
        profile.id === state.currentUserId
          ? `${profile.fullName} (you)`
          : profile.fullName,
    }));

  const shiftWeek = (days: number) => {
    setSelectedDate(format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd"));
  };

  const handleExport = () => {
    if (exportFrom === "" || exportTo === "") {
      toast.error("Pick both dates for the export range.");
      return;
    }
    if (exportFrom > exportTo) {
      toast.error("The start date must be on or before the end date.");
      return;
    }
    const rows = state.tasks
      .map((t) => ({ task: t, day: completionDay(state, t) }))
      .filter(
        (r): r is { task: Task; day: string } =>
          r.task.assigneeId === personId &&
          r.day !== null &&
          r.day >= exportFrom &&
          r.day <= exportTo,
      )
      .sort(
        (a, b) =>
          a.day.localeCompare(b.day) ||
          (a.task.doneAt ?? "").localeCompare(b.task.doneAt ?? ""),
      );
    const lines = [
      "date,assignee,title,source,estimate_minutes,actual_minutes",
      ...rows.map(({ task, day }) =>
        [
          day,
          person.fullName,
          task.title,
          task.source,
          task.estimateMinutes?.toString() ?? "",
          task.actualMinutes?.toString() ?? "",
        ]
          .map(csvEscape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ch-ops-history.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${plural(rows.length, "task")}`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Completed work by day — dates and totals use the org timezone ({tz}).
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="history-person" className="text-muted-foreground">
          Person
        </Label>
        <Select
          items={personItems}
          value={personId}
          onValueChange={(value) => {
            if (typeof value === "string") setPersonId(value);
          }}
        >
          <SelectTrigger id="history-person" className="min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section aria-labelledby="week-heading">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 id="week-heading" className="text-sm font-semibold">
            {format(parseISO(weekDays[0]), "MMM d")} –{" "}
            {format(parseISO(weekDays[6]), "MMM d")}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous week"
              onClick={() => shiftWeek(-7)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next week"
              onClick={() => shiftWeek(7)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border p-2">
          <div className="flex min-w-72 items-end gap-1">
            {weekDays.map((day, i) => {
              const minutes = dayMinutes[i];
              const selected = day === selectedDate;
              const barHeight =
                minutes === 0 || weekMax === 0
                  ? 2
                  : Math.max(2, Math.round((minutes / weekMax) * BAR_MAX_PX));
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  aria-pressed={selected}
                  aria-label={`${formatDayLong(day)} — ${formatMinutes(minutes)} completed`}
                  className={cn(
                    "flex min-w-8 flex-1 flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    selected && "bg-muted",
                  )}
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {minutes}
                  </span>
                  <span
                    className="flex w-full items-end"
                    style={{ height: BAR_MAX_PX }}
                  >
                    <span
                      className={cn(
                        "w-full rounded-sm",
                        selected ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                      style={{ height: barHeight }}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      selected ? "font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {format(parseISO(day), "EEEEE")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="day-heading">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <h2 id="day-heading" className="text-sm font-semibold">
            {formatDayLong(selectedDate)}
          </h2>
          <span className="text-sm text-muted-foreground">
            Total: {formatMinutes(dayTotal)}
          </span>
        </div>
        {dayTasks.length === 0 ? (
          <EmptyState message="Nothing completed this day." />
        ) : (
          <div>
            {dayTasks.map((task) => (
              <CompletedTaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {format(parseISO(selectedDate), "MMMM")} total:{" "}
          {formatMinutes(monthTotal)}
        </p>
      </section>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Export CSV</CardTitle>
          <CardDescription>
            Tasks {person.fullName} completed in the date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="export-from">From</Label>
              <Input
                id="export-from"
                type="date"
                value={exportFrom}
                onChange={(e) => setFromOverride(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-to">To</Label>
              <Input
                id="export-to"
                type="date"
                value={exportTo}
                onChange={(e) => setToOverride(e.target.value)}
                className="w-36"
              />
            </div>
            <Button onClick={handleExport}>
              <Download data-icon="inline-start" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

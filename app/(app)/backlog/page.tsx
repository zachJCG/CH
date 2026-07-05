"use client";

import * as React from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { QuickAdd } from "@/components/app/quick-add";
import { TaskRow } from "@/components/app/task-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDay } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { backlogTasks, orgToday, plannedMinutes } from "@/lib/demo/selectors";
import { formatMinutes, plural } from "@/lib/format";
import type { Task, TaskSource } from "@/lib/demo/types";

const SOURCE_LABELS: Record<TaskSource, string> = {
  manual: "Manual",
  hostaway: "Hostaway",
  breezeway: "Breezeway",
  gmail: "Gmail",
  maintenance: "Maintenance",
  inspection: "Inspection",
};

// Stable chip order regardless of task order in the backlog.
const SOURCE_ORDER: TaskSource[] = [
  "manual",
  "hostaway",
  "breezeway",
  "gmail",
  "maintenance",
  "inspection",
];

export default function BacklogPage() {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const all = backlogTasks(state, state.currentUserId);

  const [filter, setFilter] = React.useState<TaskSource | "all">("all");
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(
    new Set(),
  );
  const selectAllId = React.useId();

  const sources = SOURCE_ORDER.filter((s) => all.some((t) => t.source === s));
  // The active chip's source can vanish (task completed or scheduled) — fall
  // back to All instead of showing an empty page behind a ghost filter.
  const activeFilter =
    filter !== "all" && sources.includes(filter) ? filter : "all";

  const filtered =
    activeFilter === "all" ? all : all.filter((t) => t.source === activeFilter);
  const unscheduled = filtered.filter((t) => t.doOn === null);
  const scheduled = filtered.filter((t) => t.doOn !== null);

  // backlogTasks sorts by doOn — group consecutive rows per date.
  const byDate: Array<{ date: string; tasks: Task[] }> = [];
  for (const task of scheduled) {
    const last = byDate[byDate.length - 1];
    if (last && last.date === task.doOn) last.tasks.push(task);
    else byDate.push({ date: task.doOn as string, tasks: [task] });
  }

  const selectedTasks = filtered.filter((t) => selectedIds.has(t.id));
  const allSelected =
    filtered.length > 0 && selectedTasks.length === filtered.length;
  const totalEstimate = plannedMinutes(filtered);

  const toggleOne = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map((t) => t.id)) : new Set());
  };

  const handleDoToday = () => {
    const count = selectedTasks.length;
    for (const task of selectedTasks) actions.setDoOn(task.id, today);
    setSelectedIds(new Set());
    toast.success(`Moved ${plural(count, "task")} to today`);
  };

  const renderRow = (task: Task) => (
    <SelectableRow
      key={task.id}
      task={task}
      selected={selectedIds.has(task.id)}
      onSelectedChange={(checked) => toggleOne(task.id, checked)}
    />
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Backlog</h1>
        <p className="text-sm text-muted-foreground">
          {plural(filtered.length, "open task")}
          {totalEstimate > 0 && <> · Estimated: {formatMinutes(totalEstimate)}</>}
        </p>
      </header>

      <QuickAdd defaultToday={false} placeholder="Park a task in the backlog…" />

      {all.length === 0 ? (
        <EmptyState message="Backlog is empty — anything added without a date lands here." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div
              role="group"
              aria-label="Filter by source"
              className="flex flex-wrap gap-1.5"
            >
              <Button
                size="xs"
                variant={activeFilter === "all" ? "secondary" : "outline"}
                aria-pressed={activeFilter === "all"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              {sources.map((source) => (
                <Button
                  key={source}
                  size="xs"
                  variant={activeFilter === source ? "secondary" : "outline"}
                  aria-pressed={activeFilter === source}
                  onClick={() => setFilter(source)}
                >
                  {SOURCE_LABELS[source]}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={selectAllId}
                checked={allSelected}
                onCheckedChange={(checked) => toggleAll(checked === true)}
              />
              <Label htmlFor={selectAllId} className="text-sm font-normal">
                Select all
              </Label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nothing in the backlog matches this filter.
            </p>
          ) : (
            <>
              <section aria-labelledby="unscheduled-heading">
                <h2 id="unscheduled-heading" className="mb-1 text-sm font-semibold">
                  Unscheduled
                </h2>
                {unscheduled.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Nothing waiting without a date.
                  </p>
                ) : (
                  <div>{unscheduled.map(renderRow)}</div>
                )}
              </section>

              <section aria-labelledby="scheduled-heading">
                <h2
                  id="scheduled-heading"
                  className="mb-1 text-sm font-semibold text-muted-foreground"
                >
                  Scheduled later
                </h2>
                {byDate.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Nothing scheduled for a future date.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {byDate.map(({ date, tasks }) => (
                      <div key={date}>
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatDay(date)}
                        </p>
                        <div>{tasks.map(renderRow)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      {selectedTasks.length > 0 && (
        <div className="sticky bottom-16 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur md:bottom-4">
          <span className="text-sm font-medium">
            {plural(selectedTasks.length, "task")} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <Button size="sm" onClick={handleDoToday}>
              <CalendarPlus data-icon="inline-start" /> Do today (
              {selectedTasks.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// TaskRow with a bulk-select checkbox on the left. The wrapper carries the
// row border because TaskRow drops its own when it's an only child.
function SelectableRow({
  task,
  selected,
  onSelectedChange,
}: {
  task: Task;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b last:border-b-0">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelectedChange(checked === true)}
        aria-label={`Select "${task.title}"`}
        className="mt-3.5"
      />
      <div className="min-w-0 flex-1">
        <TaskRow task={task} />
      </div>
    </div>
  );
}

"use client";

// Per-kind step bodies for the morning check-in wizard (docs/tasks/04).
// The wizard shell in page.tsx owns progress + quick-add; these render only
// what is unique to each step.

import * as React from "react";
import Link from "next/link";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { SuggestionRow } from "@/components/app/suggestion-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { daysBetween, formatDay } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import {
  gmailHomeownerSearchUrl,
  openTasksFor,
  orgToday,
  pendingSuggestions,
} from "@/lib/demo/selectors";
import { formatEstimate, plural } from "@/lib/format";
import type { CheckinStepDef } from "@/lib/checkin";
import type { Suggestion, Task } from "@/lib/demo/types";

type OnAdded = (task: Task) => void;

const NO_SUGGESTIONS = "No pending suggestions — live sync arrives in phase 05.";

function SuggestionList({
  suggestions,
  onAdded,
}: {
  suggestions: Suggestion[];
  onAdded?: OnAdded;
}) {
  if (suggestions.length === 0) {
    return <EmptyState message={NO_SUGGESTIONS} />;
  }
  return (
    <div className="space-y-2">
      {suggestions.map((s) => (
        <SuggestionRow key={s.id} suggestion={s} onAdded={onAdded} />
      ))}
    </div>
  );
}

/** Hostaway / Breezeway: deep link out + whatever suggestions are pending. */
export function SuggestionsStepContent({
  step,
  onAdded,
}: {
  step: CheckinStepDef;
  onAdded?: OnAdded;
}) {
  const { state } = useDemo();
  const suggestions = step.suggestionSource
    ? pendingSuggestions(state, step.suggestionSource, state.currentUserId)
    : [];

  return (
    <div className="space-y-3">
      {step.deepLink && (
        <Button
          variant="outline"
          render={
            <a href={step.deepLink.href} target="_blank" rel="noreferrer" />
          }
        >
          {step.deepLink.label} <ExternalLink data-icon="inline-end" />
        </Button>
      )}
      <SuggestionList suggestions={suggestions} onAdded={onAdded} />
    </div>
  );
}

/** Open maintenance tasks not planned for today, with one-click "Do today". */
export function MaintenanceStepContent() {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const tasks = openTasksFor(state, state.currentUserId)
    .filter((t) => t.source === "maintenance" && t.doOn !== today)
    .sort(
      (a, b) =>
        (a.doOn ?? "9999").localeCompare(b.doOn ?? "9999") ||
        a.createdAt.localeCompare(b.createdAt),
    );

  if (tasks.length === 0) {
    return (
      <EmptyState message="No open maintenance tasks waiting — quick-add below if something came up." />
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {tasks.map((task) => {
        const overdueDays =
          task.doOn && task.doOn < today ? daysBetween(task.doOn, today) : 0;
        return (
          <li
            key={task.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{task.title}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {formatEstimate(task.estimateMinutes)}
              </span>
              {overdueDays > 0 ? (
                <span className="text-xs font-medium text-destructive">
                  {plural(overdueDays, "day")} overdue
                </span>
              ) : (
                task.doOn && (
                  <span className="text-xs text-muted-foreground">
                    planned {formatDay(task.doOn)}
                  </span>
                )
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                actions.setDoOn(task.id, today);
                toast.success("Moved to today");
              }}
            >
              <CalendarPlus data-icon="inline-start" /> Do today
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/** Gmail search deep link built from homeowner emails + gmail suggestions. */
export function GmailStepContent({ onAdded }: { onAdded?: OnAdded }) {
  const { state } = useDemo();
  const suggestions = pendingSuggestions(state, "gmail", state.currentUserId);
  // Falls back to plain Gmail when no homeowners exist yet.
  const href = gmailHomeownerSearchUrl(state);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Button
          variant="outline"
          render={<a href={href} target="_blank" rel="noreferrer" />}
        >
          Open homeowner email search <ExternalLink data-icon="inline-end" />
        </Button>
        {state.homeowners.length === 0 && (
          <p className="text-xs text-muted-foreground">
            <Link
              href="/settings/homeowners"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Add homeowners in Settings
            </Link>{" "}
            to build this search automatically.
          </p>
        )}
      </div>
      <SuggestionList suggestions={suggestions} onAdded={onAdded} />
    </div>
  );
}

/** One number: total inspection minutes → upserts today's Inspections task. */
export function InspectionsStepContent() {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const existing = state.tasks.find(
    (t) =>
      t.assigneeId === state.currentUserId &&
      t.source === "inspection" &&
      t.title === "Inspections" &&
      t.doOn === today &&
      t.status === "open",
  );
  const [minutes, setMinutes] = React.useState(
    () => existing?.estimateMinutes?.toString() ?? "",
  );
  const inputId = React.useId();
  const parsed = parseInt(minutes, 10);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        actions.upsertInspectionsTask(parsed);
        toast.success(
          existing ? "Inspections estimate updated" : "Inspections added to today",
        );
      }}
      className="space-y-2"
    >
      <Label htmlFor={inputId}>Total minutes for inspections today</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={inputId}
          type="number"
          min={0}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="e.g. 90"
          className="w-28"
        />
        <Button type="submit" disabled={!valid}>
          {existing ? "Update" : "Save"}
        </Button>
      </div>
      {existing && (
        <p className="text-xs text-muted-foreground">
          “Inspections” ({formatEstimate(existing.estimateMinutes)}) is already
          in today&apos;s diary — saving updates it, never duplicates.
        </p>
      )}
    </form>
  );
}

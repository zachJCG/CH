"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/lib/demo/store";
import { orgToday } from "@/lib/demo/selectors";
import type { Task, TaskSource } from "@/lib/demo/types";

/** Inline quick-add: title + minutes + "today" checkbox (docs/tasks/03). */
export function QuickAdd({
  defaultToday = true,
  showTodayToggle = true,
  source = "manual",
  assigneeId,
  placeholder = "Add a task…",
  onCreated,
}: {
  defaultToday?: boolean;
  showTodayToggle?: boolean;
  source?: TaskSource;
  /** defaults to the signed-in demo user */
  assigneeId?: string;
  placeholder?: string;
  onCreated?: (task: Task) => void;
}) {
  const { state, actions } = useDemo();
  const [title, setTitle] = React.useState("");
  const [minutes, setMinutes] = React.useState("");
  const [today, setToday] = React.useState(defaultToday);
  const checkboxId = React.useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const parsed = parseInt(minutes, 10);
    const task = actions.createTask({
      title,
      source,
      assigneeId,
      estimateMinutes: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
      doOn: today ? orgToday(state) : null,
    });
    onCreated?.(task);
    toast.success(today ? "Added to today" : "Added to backlog");
    setTitle("");
    setMinutes("");
    setToday(defaultToday);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label="Task title"
        className="min-w-40 flex-1 bg-background"
      />
      <Input
        type="number"
        min={0}
        step={5}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        placeholder="min"
        aria-label="Estimate in minutes"
        className="w-20 bg-background"
      />
      {showTodayToggle && (
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={checkboxId}
            checked={today}
            onCheckedChange={(checked) => setToday(checked === true)}
          />
          <Label htmlFor={checkboxId} className="text-sm font-normal">
            Today
          </Label>
        </div>
      )}
      <Button type="submit" size="sm" disabled={!title.trim()}>
        <Plus data-icon="inline-start" /> Add
      </Button>
    </form>
  );
}

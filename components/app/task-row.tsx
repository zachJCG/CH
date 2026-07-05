"use client";

import * as React from "react";
import {
  CalendarArrowDown,
  CalendarPlus,
  Check,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SourceBadge } from "@/components/app/source-badge";
import { daysBetween } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { orgToday } from "@/lib/demo/selectors";
import { formatEstimate, formatMinutes, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/demo/types";

export function TaskRow({
  task,
  readOnly = false,
  showOverdueAge = false,
}: {
  task: Task;
  readOnly?: boolean;
  /** show "3 days overdue" next to the estimate (Overdue group) */
  showOverdueAge?: boolean;
}) {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const isToday = task.doOn === today;
  const overdueDays =
    task.doOn && task.doOn < today ? daysBetween(task.doOn, today) : 0;
  const link = task.sourceRef?.link;

  const handleComplete = (actualMinutes: number | null) => {
    actions.completeTask(task.id, actualMinutes);
    setCompleteOpen(false);
    toast.success(
      actualMinutes != null
        ? `Done — ${formatMinutes(actualMinutes)} logged`
        : "Done",
      {
        action: {
          label: "Undo",
          onClick: () => actions.reopenTask(task.id),
        },
      },
    );
  };

  const handleDismiss = () => {
    actions.dismissTask(task.id);
    toast("Task dismissed", {
      action: { label: "Undo", onClick: () => actions.reopenTask(task.id) },
    });
  };

  return (
    <div className="group flex items-start gap-3 border-b px-1 py-3 last:border-b-0">
      {!readOnly && (
        <button
          type="button"
          aria-label={`Mark "${task.title}" done`}
          onClick={() => setCompleteOpen(true)}
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-transparent transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="size-3.5" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{task.title}</span>
          <SourceBadge source={task.source} />
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {formatEstimate(task.estimateMinutes)}
          </span>
          {showOverdueAge && overdueDays > 0 && (
            <span className="text-xs font-medium text-destructive">
              {plural(overdueDays, "day")} overdue
            </span>
          )}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open source link"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        {task.notes && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn("size-3 transition-transform", notesOpen && "rotate-180")}
              />
              Notes
            </button>
            {notesOpen && (
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                {task.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => actions.setDoOn(task.id, isToday ? null : today)}
          >
            {isToday ? (
              <>
                <CalendarArrowDown data-icon="inline-start" /> Backlog
              </>
            ) : (
              <>
                <CalendarPlus data-icon="inline-start" /> Do today
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Task actions" />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => actions.setDoOn(task.id, isToday ? null : today)}
              >
                {isToday ? <CalendarArrowDown /> : <CalendarPlus />}
                {isToday ? "Move to backlog" : "Do today"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDismiss}>
                <Trash2 /> Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <CompleteTaskDialog
        task={task}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onConfirm={handleComplete}
      />
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function CompleteTaskDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (actualMinutes: number | null) => void;
}) {
  const [minutes, setMinutes] = React.useState<string>("");

  React.useEffect(() => {
    if (open) setMinutes(task.estimateMinutes?.toString() ?? "");
  }, [open, task.estimateMinutes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark done</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseInt(minutes, 10);
            onConfirm(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`actual-${task.id}`}>How many minutes did it take?</Label>
            <Input
              id={`actual-${task.id}`}
              type="number"
              min={0}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Check data-icon="inline-start" /> Done
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { actions } = useDemo();
  const [title, setTitle] = React.useState(task.title);
  const [minutes, setMinutes] = React.useState(task.estimateMinutes?.toString() ?? "");
  const [notes, setNotes] = React.useState(task.notes ?? "");
  const [doOn, setDoOn] = React.useState(task.doOn ?? "");

  React.useEffect(() => {
    if (open) {
      setTitle(task.title);
      setMinutes(task.estimateMinutes?.toString() ?? "");
      setNotes(task.notes ?? "");
      setDoOn(task.doOn ?? "");
    }
  }, [open, task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            const parsed = parseInt(minutes, 10);
            actions.updateTask(task.id, {
              title: title.trim(),
              estimateMinutes: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
              notes: notes.trim() === "" ? null : notes.trim(),
              doOn: doOn === "" ? null : doOn,
            });
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`title-${task.id}`}>Title</Label>
            <Input
              id={`title-${task.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`est-${task.id}`}>Estimate (min)</Label>
              <Input
                id={`est-${task.id}`}
                type="number"
                min={0}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`doon-${task.id}`}>Do on</Label>
              <Input
                id={`doon-${task.id}`}
                type="date"
                value={doOn}
                onChange={(e) => setDoOn(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${task.id}`}>Notes</Label>
            <Textarea
              id={`notes-${task.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Row for completed tasks (History and Team views). */
export function CompletedTaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 border-b px-1 py-3 last:border-b-0">
      <Check className="size-4 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm">{task.title}</span>
          <SourceBadge source={task.source} />
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {task.actualMinutes != null ? formatMinutes(task.actualMinutes) : "—"}
      </span>
    </div>
  );
}

"use client";

// Shared suggestion row (docs/tasks/04): title, summary, source badge,
// external link, "Add to diary" (prefilled quick-add dialog) and Dismiss.

import * as React from "react";
import { ExternalLink, Plus, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceBadge } from "@/components/app/source-badge";
import { useDemo } from "@/lib/demo/store";
import { orgToday } from "@/lib/demo/selectors";
import type { Suggestion } from "@/lib/demo/types";

export function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const { state, actions } = useDemo();
  const [addOpen, setAddOpen] = React.useState(false);
  const [title, setTitle] = React.useState(suggestion.title);
  const [minutes, setMinutes] = React.useState("30");
  const [today, setToday] = React.useState(true);
  const checkboxId = React.useId();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const parsed = parseInt(minutes, 10);
    actions.addSuggestionToDiary(suggestion.id, {
      title: title.trim(),
      estimateMinutes: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
      doOn: today ? orgToday(state) : null,
    });
    setAddOpen(false);
    toast.success("Added to your diary");
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{suggestion.title}</span>
          <SourceBadge source={suggestion.source} />
          {suggestion.link && (
            <a
              href={suggestion.link}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open in source system"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        {suggestion.summary && (
          <p className="mt-1 text-sm text-muted-foreground">{suggestion.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus data-icon="inline-start" /> Add to diary
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Dismiss suggestion"
          onClick={() => {
            actions.dismissSuggestion(suggestion.id);
            toast("Suggestion dismissed");
          }}
        >
          <X />
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to diary</DialogTitle>
            <DialogDescription>
              Creates a task carrying the {suggestion.source} source and link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`sugg-title-${suggestion.id}`}>Title</Label>
              <Input
                id={`sugg-title-${suggestion.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor={`sugg-min-${suggestion.id}`}>Estimate (min)</Label>
                <Input
                  id={`sugg-min-${suggestion.id}`}
                  type="number"
                  min={0}
                  step={5}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-28"
                />
              </div>
              <div className="flex items-center gap-1.5 pb-2">
                <Checkbox
                  id={checkboxId}
                  checked={today}
                  onCheckedChange={(checked) => setToday(checked === true)}
                />
                <Label htmlFor={checkboxId} className="text-sm font-normal">
                  Do today
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

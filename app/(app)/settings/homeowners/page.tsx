"use client";

import * as React from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/lib/demo/store";
import { isOwner } from "@/lib/demo/selectors";
import type { Homeowner } from "@/lib/demo/types";

/** "a@x.com, b@y.com" → valid emails, or null when any part looks wrong. */
function parseEmails(raw: string): string[] | null {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.some((part) => !part.includes("@"))) {
    return null;
  }
  return parts;
}

export default function HomeownersSettingsPage() {
  const { state, actions } = useDemo();
  const owner = isOwner(state);

  const [name, setName] = React.useState("");
  const [emails, setEmails] = React.useState("");

  const [editing, setEditing] = React.useState<Homeowner | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmails, setEditEmails] = React.useState("");

  const [removing, setRemoving] = React.useState<Homeowner | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = parseEmails(emails);
    if (parsed === null) {
      toast.error("Emails look off — separate full addresses with commas.");
      return;
    }
    actions.addHomeowner(name.trim(), parsed);
    toast.success("Homeowner added");
    setName("");
    setEmails("");
  };

  const openEdit = (homeowner: Homeowner) => {
    setEditing(homeowner);
    setEditName(homeowner.name);
    setEditEmails(homeowner.emails.join(", "));
  };

  const saveEdit = () => {
    if (editing === null || !editName.trim()) return;
    const parsed = parseEmails(editEmails);
    if (parsed === null) {
      toast.error("Emails look off — separate full addresses with commas.");
      return;
    }
    actions.updateHomeowner(editing.id, { name: editName.trim(), emails: parsed });
    toast.success("Homeowner updated");
    setEditing(null);
  };

  const confirmRemove = () => {
    if (removing === null) return;
    actions.removeHomeowner(removing.id);
    toast(`Removed ${removing.name}`);
    setRemoving(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This list drives the homeowner-email step of the morning check-in and
        the Gmail search built in phase 06.
      </p>

      {!owner && (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Only owners can manage homeowners — ask an owner to make changes.
        </p>
      )}

      {owner && (
        <form
          onSubmit={add}
          className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
        >
          <div className="min-w-36 flex-1 space-y-1.5">
            <Label htmlFor="homeowner-name">Name</Label>
            <Input
              id="homeowner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patricia Grayson"
              className="bg-background"
            />
          </div>
          <div className="min-w-52 flex-[2] space-y-1.5">
            <Label htmlFor="homeowner-emails">Emails (comma-separated)</Label>
            <Input
              id="homeowner-emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="pgrayson@gmail.com, pat@work.com"
              className="bg-background"
            />
          </div>
          <Button type="submit" disabled={!name.trim() || !emails.trim()}>
            Add homeowner
          </Button>
        </form>
      )}

      {state.homeowners.length === 0 ? (
        <EmptyState
          message={
            owner
              ? "No homeowners yet — add one above so their emails surface in the morning check-in."
              : "No homeowners yet."
          }
        />
      ) : (
        <div className="divide-y rounded-lg border">
          {state.homeowners.map((homeowner) => (
            <div
              key={homeowner.id}
              className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{homeowner.name}</p>
                <div className="flex flex-wrap gap-1">
                  {homeowner.emails.map((email) => (
                    <Badge key={email} variant="outline">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
              {owner && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(homeowner)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoving(homeowner)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit homeowner</DialogTitle>
            <DialogDescription>
              Separate multiple emails with commas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-homeowner-name">Name</Label>
              <Input
                id="edit-homeowner-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-homeowner-emails">Emails</Label>
              <Input
                id="edit-homeowner-emails"
                value={editEmails}
                onChange={(e) => setEditEmails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveEdit} disabled={!editName.trim() || !editEmails.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>
              Their emails stop feeding the check-in and the Gmail search.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

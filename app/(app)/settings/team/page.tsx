"use client";

import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDay } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { isOwner, profileById } from "@/lib/demo/selectors";
import type { Role } from "@/lib/demo/types";

const ROLE_ITEMS = [
  { value: "manager", label: "Manager" },
  { value: "owner", label: "Owner" },
];

export default function TeamSettingsPage() {
  const { state, actions } = useDemo();
  const owner = isOwner(state);

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("manager");

  const members = state.members.flatMap((member) => {
    const profile = profileById(state, member.userId);
    return profile ? [{ member, profile }] : [];
  });
  const pending = state.invites.filter((invite) => invite.acceptedAt === null);

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@")) return;
    actions.addInvite(trimmed, role);
    toast.success(
      "Invite recorded — invite emails start sending in phase 02 (Supabase + Resend)",
    );
    setEmail("");
    setRole("manager");
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="members-heading" className="space-y-2">
        <h2 id="members-heading" className="text-sm font-semibold">
          Members
        </h2>
        {members.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No members yet — this org is a ghost town.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {members.map(({ member, profile }) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {profile.fullName}
                    {member.userId === state.currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {!owner ? (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Ask an owner to invite teammates.
        </p>
      ) : (
        <>
          <section aria-labelledby="invites-heading" className="space-y-2">
            <h2 id="invites-heading" className="text-sm font-semibold">
              Pending invites
            </h2>
            {pending.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No pending invites — send one below.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {pending.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDay(invite.expiresAt.slice(0, 10))}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {invite.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        actions.revokeInvite(invite.id);
                        toast("Invite revoked");
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="invite-form-heading" className="space-y-2">
            <h2 id="invite-form-heading" className="text-sm font-semibold">
              Invite a teammate
            </h2>
            <form
              onSubmit={sendInvite}
              className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
            >
              <div className="min-w-44 flex-1 space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  items={ROLE_ITEMS}
                  value={role}
                  onValueChange={(value) => {
                    if (value === "owner" || value === "manager") setRole(value);
                  }}
                >
                  <SelectTrigger id="invite-role" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!email.trim().includes("@")}>
                Send invite
              </Button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

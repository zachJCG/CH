"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemo } from "@/lib/demo/store";
import {
  checkinRunFor,
  openTasksFor,
  orgToday,
  overdueTasks,
  profileById,
} from "@/lib/demo/selectors";
import { plural } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamPage() {
  const { state } = useDemo();
  const today = orgToday(state);

  const members = state.members.flatMap((member) => {
    const profile = profileById(state, member.userId);
    return profile ? [{ member, profile }] : [];
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Coverage view — open any teammate&apos;s diary to see their day.
        </p>
      </header>

      {members.length === 0 ? (
        <EmptyState message="No members in this org yet — invite your team from Settings." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map(({ member, profile }) => {
            const open = openTasksFor(state, member.userId).length;
            const overdue = overdueTasks(state, member.userId).length;
            const checkinDone =
              checkinRunFor(state, member.userId, today)?.completedAt != null;
            const isMe = member.userId === state.currentUserId;

            return (
              <Link
                key={member.userId}
                href={`/team/${member.userId}`}
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Card className="h-full transition-colors hover:bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {initials(profile.fullName)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {profile.fullName}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </span>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {member.role}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <p className="text-muted-foreground">
                      {plural(open, "open task")} ·{" "}
                      <span
                        className={
                          overdue > 0 ? "font-medium text-destructive" : ""
                        }
                      >
                        {overdue} overdue
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      {checkinDone ? (
                        <>
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          Check-in done today
                        </>
                      ) : (
                        <>
                          <Circle className="size-4 shrink-0" />
                          Check-in not yet
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";

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
import { useDemo } from "@/lib/demo/store";
import { isOwner } from "@/lib/demo/selectors";

const TIMEZONE_ITEMS = [
  { value: "America/New_York", label: "Eastern — America/New_York" },
  { value: "America/Chicago", label: "Central — America/Chicago" },
  { value: "America/Denver", label: "Mountain — America/Denver" },
  { value: "America/Phoenix", label: "Arizona — America/Phoenix" },
  { value: "America/Los_Angeles", label: "Pacific — America/Los_Angeles" },
  { value: "America/Anchorage", label: "Alaska — America/Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii — Pacific/Honolulu" },
];

function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? "AM" : "PM"}`;
}

const HOUR_ITEMS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: hourLabel(hour),
}));

export default function OrganizationSettingsPage() {
  const { state, actions } = useDemo();
  const owner = isOwner(state);
  const org = state.org;

  const [name, setName] = React.useState(org.name);
  const [timezone, setTimezone] = React.useState(org.timezone);
  const [workdayStart, setWorkdayStart] = React.useState(org.workdayStart);
  const [reminderHour, setReminderHour] = React.useState(String(org.reminderHour));
  const [escalationDays, setEscalationDays] = React.useState(
    String(org.escalationAfterDays),
  );

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(escalationDays, 10);
    actions.updateOrg({
      name: name.trim() || org.name,
      timezone,
      workdayStart: /^\d{1,2}:\d{2}$/.test(workdayStart)
        ? workdayStart
        : org.workdayStart,
      reminderHour: parseInt(reminderHour, 10),
      escalationAfterDays:
        Number.isFinite(days) && days >= 1 ? days : org.escalationAfterDays,
    });
    toast.success("Organization settings saved");
  };

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      {!owner && (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Only owners can change organization settings.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!owner}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-timezone">Timezone</Label>
        <Select
          items={TIMEZONE_ITEMS}
          value={timezone}
          onValueChange={(value) => {
            if (typeof value === "string") setTimezone(value);
          }}
        >
          <SelectTrigger id="org-timezone" className="w-full" disabled={!owner}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-workday-start">Workday start</Label>
        <Input
          id="org-workday-start"
          type="time"
          required
          value={workdayStart}
          onChange={(e) => setWorkdayStart(e.target.value)}
          disabled={!owner}
          className="w-40"
        />
        <p className="text-xs text-muted-foreground">
          Default start time when planning your day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="org-reminder-hour">Reminder hour</Label>
          <Select
            items={HOUR_ITEMS}
            value={reminderHour}
            onValueChange={(value) => {
              if (typeof value === "string") setReminderHour(value);
            }}
          >
            <SelectTrigger
              id="org-reminder-hour"
              className="w-full"
              disabled={!owner}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-escalation-days">Escalate after (days)</Label>
          <Input
            id="org-escalation-days"
            type="number"
            min={1}
            value={escalationDays}
            onChange={(e) => setEscalationDays(e.target.value)}
            disabled={!owner}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Reminder &amp; escalation emails arrive in phase 07.
      </p>

      {owner && <Button type="submit">Save changes</Button>}
    </form>
  );
}

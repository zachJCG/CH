"use client";

import * as React from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, formatOrgTime } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { isOwner } from "@/lib/demo/selectors";
import type {
  Integration,
  IntegrationProvider,
  IntegrationStatus,
} from "@/lib/demo/types";

const PROVIDER_META: Record<
  IntegrationProvider,
  {
    name: string;
    description: string;
    fields: Array<{ key: string; label: string }>;
  }
> = {
  hostaway: {
    name: "Hostaway",
    description: "Escalated guest conversations become check-in suggestions.",
    fields: [
      { key: "account_id", label: "Account ID" },
      { key: "api_key", label: "API key" },
    ],
  },
  breezeway: {
    name: "Breezeway",
    description: "Yesterday's issue reports become check-in suggestions.",
    fields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client secret" },
    ],
  },
};

const STATUS_BADGE: Record<
  IntegrationStatus,
  { label: string; variant: "secondary" | "default" | "destructive" }
> = {
  unconfigured: { label: "Not configured", variant: "secondary" },
  connected: { label: "Connected", variant: "default" },
  error: { label: "Error", variant: "destructive" },
};

function ProviderCard({
  integration,
  timezone,
}: {
  integration: Integration;
  timezone: string;
}) {
  const meta = PROVIDER_META[integration.provider];
  const badge = STATUS_BADGE[integration.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meta.name}</CardTitle>
        <CardDescription>{meta.description}</CardDescription>
        <CardAction>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {integration.lastSyncedAt
            ? `Last synced ${formatDay(integration.lastSyncedAt.slice(0, 10))} · ${formatOrgTime(timezone, integration.lastSyncedAt)}`
            : "Never synced yet"}
        </p>
        {integration.status === "error" && integration.lastError && (
          <p className="text-xs text-destructive">{integration.lastError}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {meta.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`${integration.provider}-${field.key}`}>
                {field.label}
              </Label>
              <Input
                id={`${integration.provider}-${field.key}`}
                disabled
                placeholder="••••••••"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled>
            Test connection
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sync now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Credential storage &amp; sync engine arrive in phase 05.
        </p>
      </CardContent>
    </Card>
  );
}

function GoogleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Google</CardTitle>
        <CardDescription>
          Each teammate connects their own account for Gmail and Calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" disabled>
          Connect Google
        </Button>
        <p className="text-xs text-muted-foreground">
          Per-manager Gmail flagging and Calendar sync arrive in phase 06.
        </p>
      </CardContent>
    </Card>
  );
}

function EscalationKeywordsCard() {
  const { state, actions } = useDemo();
  const owner = isOwner(state);
  const keywords = state.org.escalationKeywords;
  const [draft, setDraft] = React.useState("");

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = draft.trim().toLowerCase();
    if (!keyword) return;
    if (keywords.includes(keyword)) {
      toast(`"${keyword}" is already in the list`);
      setDraft("");
      return;
    }
    actions.updateOrg({ escalationKeywords: [...keywords, keyword] });
    setDraft("");
  };

  const removeKeyword = (keyword: string) => {
    actions.updateOrg({
      escalationKeywords: keywords.filter((k) => k !== keyword),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation keywords</CardTitle>
        <CardDescription>
          A guest message containing any of these marks a Hostaway conversation
          escalated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No keywords yet — nothing will be flagged as escalated.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                {owner && (
                  <button
                    type="button"
                    aria-label={`Remove keyword "${keyword}"`}
                    onClick={() => removeKeyword(keyword)}
                    className="-mr-1 rounded-full p-0.5 hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
        {owner ? (
          <form onSubmit={addKeyword} className="flex flex-wrap gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. flooded"
              aria-label="New escalation keyword"
              className="max-w-56"
            />
            <Button type="submit" variant="outline" disabled={!draft.trim()}>
              Add
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only owners can edit escalation keywords.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsSettingsPage() {
  const { state } = useDemo();

  return (
    <div className="space-y-4">
      {state.integrations.map((integration) => (
        <ProviderCard
          key={integration.provider}
          integration={integration}
          timezone={state.org.timezone}
        />
      ))}
      <GoogleCard />
      <EscalationKeywordsCard />
    </div>
  );
}

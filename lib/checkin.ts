// Morning check-in step definitions (docs/tasks/04-morning-checkin.md).
// Step copy mirrors the client's own words. Later phases attach live
// suggestion feeds to the hostaway / breezeway / gmail steps.

import type { SuggestionSource, TaskSource } from "@/lib/demo/types";

export interface CheckinStepDef {
  key: string;
  title: string;
  description: string;
  /** static deep link; the gmail step builds its link from homeowners instead */
  deepLink?: { href: string; label: string };
  suggestionSource?: SuggestionSource;
  /** source applied to quick-adds made on this step */
  quickAddSource: TaskSource;
  kind: "suggestions" | "maintenance" | "gmail" | "inspections";
}

export const CHECKIN_STEPS: CheckinStepDef[] = [
  {
    key: "hostaway",
    title: "Hostaway escalations",
    description:
      "Check Hostaway for guest-reported issues escalated overnight, so that nothing waits until a guest complains twice.",
    deepLink: { href: "https://dashboard.hostaway.com/", label: "Open Hostaway" },
    suggestionSource: "hostaway",
    quickAddSource: "hostaway",
    kind: "suggestions",
  },
  {
    key: "breezeway",
    title: "Breezeway reports",
    description: "Review issue reports created yesterday.",
    deepLink: { href: "https://app.breezeway.io/", label: "Open Breezeway" },
    suggestionSource: "breezeway",
    quickAddSource: "breezeway",
    kind: "suggestions",
  },
  {
    key: "maintenance",
    title: "Maintenance backlog",
    description:
      "Scan your open maintenance items and pull anything urgent into today — so that I don't forget.",
    quickAddSource: "maintenance",
    kind: "maintenance",
  },
  {
    key: "gmail",
    title: "Homeowner emails",
    description:
      "Scan recent homeowner emails for anything that needs action today.",
    suggestionSource: "gmail",
    quickAddSource: "gmail",
    kind: "gmail",
  },
  {
    key: "inspections",
    title: "Inspections & inventory",
    description:
      "Which inspections and inventory do you need to deliver or schedule today?",
    quickAddSource: "inspection",
    kind: "inspections",
  },
];

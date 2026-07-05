"use client";

// Morning check-in wizard (docs/tasks/04): five guided steps, one run per
// user per day. Step state persists via upsertCheckinStep, so leaving and
// coming back resumes where you stopped.

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Minus } from "lucide-react";

import { QuickAdd } from "@/components/app/quick-add";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHECKIN_STEPS, type CheckinStepDef } from "@/lib/checkin";
import { formatDayLong } from "@/lib/dates";
import { useDemo } from "@/lib/demo/store";
import { checkinRunFor, orgToday } from "@/lib/demo/selectors";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CheckinRun } from "@/lib/demo/types";

import {
  GmailStepContent,
  InspectionsStepContent,
  MaintenanceStepContent,
  SuggestionsStepContent,
} from "./step-content";

const STEP_SHORT_LABELS: Record<string, string> = {
  hostaway: "Hostaway",
  breezeway: "Breezeway",
  maintenance: "Maintenance",
  gmail: "Gmail",
  inspections: "Inspections",
};

function firstOpenStepIndex(run: CheckinRun | null): number {
  const index = CHECKIN_STEPS.findIndex((step) => {
    const s = run?.steps[step.key];
    return !s?.completedAt && !s?.skipped;
  });
  return index === -1 ? CHECKIN_STEPS.length - 1 : index;
}

function StepBody({
  step,
  onAdded,
}: {
  step: CheckinStepDef;
  onAdded: (task: { id: string }) => void;
}) {
  switch (step.kind) {
    case "maintenance":
      return <MaintenanceStepContent />;
    case "gmail":
      return <GmailStepContent onAdded={onAdded} />;
    case "inspections":
      return <InspectionsStepContent />;
    default:
      return <SuggestionsStepContent step={step} onAdded={onAdded} />;
  }
}

export default function CheckinPage() {
  const { state, actions } = useDemo();
  const today = orgToday(state);
  const run = checkinRunFor(state, state.currentUserId, today);

  // Resume at the first unfinished step; a completed run opens on the
  // finished screen. Local state only — revisiting never wipes step data.
  const [activeIndex, setActiveIndex] = React.useState(() =>
    firstOpenStepIndex(run),
  );
  const [finished, setFinished] = React.useState(() =>
    Boolean(run?.completedAt),
  );

  const step = CHECKIN_STEPS[activeIndex];
  const stepState = run?.steps[step.key];
  const addedTaskIds = stepState?.addedTaskIds ?? [];
  const isLast = activeIndex === CHECKIN_STEPS.length - 1;

  const goTo = (index: number) => {
    setActiveIndex(index);
    setFinished(false);
  };

  const advance = () => {
    if (isLast) {
      actions.completeCheckin();
      setFinished(true);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleSkip = () => {
    actions.upsertCheckinStep(step.key, { skipped: true });
    advance();
  };

  const handleDone = () => {
    actions.upsertCheckinStep(step.key, {
      completedAt: stepState?.completedAt ?? new Date().toISOString(),
      skipped: false,
    });
    advance();
  };

  const addedCount = run
    ? Object.values(run.steps).reduce((n, s) => n + s.addedTaskIds.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Morning check-in</h1>
        <p className="text-sm text-muted-foreground">
          {formatDayLong(today)} ·{" "}
          {finished
            ? "Done for today"
            : `Step ${activeIndex + 1} of ${CHECKIN_STEPS.length}`}
        </p>
      </header>

      <nav aria-label="Check-in steps">
        <ol className="flex flex-wrap gap-1.5">
          {CHECKIN_STEPS.map((s, index) => {
            const st = run?.steps[s.key];
            const done = Boolean(st?.completedAt);
            const skipped = !done && Boolean(st?.skipped);
            const isCurrent = !finished && index === activeIndex;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${s.title}${
                    done ? " (done)" : skipped ? " (skipped)" : ""
                  }`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                    isCurrent
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : skipped ? (
                    <Minus className="size-3" />
                  ) : (
                    <span className="tabular-nums">{index + 1}</span>
                  )}
                  {STEP_SHORT_LABELS[s.key] ?? s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {finished ? (
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-10 text-emerald-600" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Check-in complete</h2>
              <p className="text-sm text-muted-foreground">
                All {CHECKIN_STEPS.length} steps handled
                {addedCount > 0 && (
                  <> — {plural(addedCount, "task")} added to your diary</>
                )}
                .
              </p>
            </div>
            <Button size="lg" render={<Link href="/plan" />}>
              Plan my day <ArrowRight data-icon="inline-end" />
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
              <Link
                href="/today"
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Back to Today
              </Link>
              <button
                type="button"
                onClick={() => goTo(0)}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Review today&apos;s steps
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card key={step.key}>
          <CardHeader>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StepBody
              step={step}
              onAdded={(task) =>
                actions.upsertCheckinStep(step.key, {
                  addedTaskIds: [...addedTaskIds, task.id],
                })
              }
            />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Quick-add a task from this step
              </p>
              <QuickAdd
                defaultToday
                source={step.quickAddSource}
                onCreated={(task) =>
                  actions.upsertCheckinStep(step.key, {
                    addedTaskIds: [...addedTaskIds, task.id],
                  })
                }
              />
              {addedTaskIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {plural(addedTaskIds.length, "task")} added from this step.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleDone}>
              <Check data-icon="inline-start" />
              {isLast
                ? "Finish check-in"
                : stepState?.completedAt
                  ? "Next"
                  : "Mark done & next"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

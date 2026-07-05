import Link from "next/link";
import {
  CalendarClock,
  ClipboardCheck,
  Clock3,
  ListChecks,
  Mail,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Morning check-in",
    text: "A five-step ritual across Hostaway, Breezeway, maintenance, homeowner email and inspections — so nothing slips between the cracks.",
  },
  {
    icon: ListChecks,
    title: "Work diary",
    text: "Every task carries a minute estimate and never disappears until it's done. Unfinished work carries over automatically.",
  },
  {
    icon: CalendarClock,
    title: "Plan my day",
    text: "Confirm an ordered schedule with a finish time. Google Calendar sync lands with the integrations phase.",
  },
  {
    icon: Clock3,
    title: "Where the time goes",
    text: "Done means minutes logged. History rolls the week up per person, exportable to CSV.",
  },
  {
    icon: Users,
    title: "Coverage built in",
    text: "Teammates can read each other's diaries for vacation and sick cover; owners can assign directly.",
  },
  {
    icon: Mail,
    title: "Reminders & escalation",
    text: "Daily nudges for managers, automatic escalation of stale tasks to owners — arriving in a later phase.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            CH
          </div>
          <span className="font-semibold">CH Ops Diary</span>
        </div>
        <Button variant="outline" render={<Link href="/login" />}>
          Sign in
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Nothing slips between the cracks.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            The daily operations diary for short-term-rental teams: a guided
            morning check-in, a work diary with time estimates, and a confirmed
            plan for the day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/today" />}>
              Try the live demo
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Sign in
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Demo data lives in your browser — no account needed yet.
          </p>
        </section>

        <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border p-5">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        CH Ops Diary — built for CH Property Management.
      </footer>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  ClipboardCheck,
  History,
  Inbox,
  LogOut,
  MoreHorizontal,
  RefreshCcw,
  Settings,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDemo, useDemoMaybe } from "@/lib/demo/store";
import {
  currentProfile,
  isOwner,
  overdueCount,
  roleOf,
} from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/checkin", label: "Check-in", icon: ClipboardCheck },
  { href: "/plan", label: "Plan", icon: CalendarClock },
  { href: "/backlog", label: "Backlog", icon: Inbox },
  { href: "/history", label: "History", icon: History },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Gates the app shell on store hydration to avoid SSR/localStorage mismatch. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated } = useDemoMaybe();

  if (!hydrated || state === null) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading your diary…
      </div>
    );
  }
  return <AppShellInner>{children}</AppShellInner>;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { state } = useDemo();
  const pathname = usePathname();
  const overdue = overdueCount(state, state.currentUserId);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r bg-muted/20 md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            CH
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">CH Ops Diary</div>
            <div className="text-xs text-muted-foreground">{state.org.name}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-2" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
              {href === "/today" && overdue > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1 tabular-nums">
                  {overdue}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t p-2">
          <UserSwitcher />
        </div>
      </aside>

      {/* Main column — keyed by user so page-local state (wizard position,
          plan draft, filters) resets when demoing as someone else */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <main
          key={state.currentUserId}
          className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 md:pb-10"
        >
          {children}
        </main>
      </div>

      <MobileNav overdue={overdue} isActive={isActive} />
    </div>
  );
}

function MobileNav({
  overdue,
  isActive,
}: {
  overdue: number;
  isActive: (href: string) => boolean;
}) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primary = NAV.slice(0, 4);
  const more = NAV.slice(4);
  const moreActive = more.some(({ href }) => isActive(href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur md:hidden"
    >
      {primary.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground",
            isActive(href) && "text-foreground",
          )}
        >
          <Icon className="size-5" />
          {label}
          {href === "/today" && overdue > 0 && (
            <span className="absolute top-1 right-1/2 -mr-5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {overdue}
            </span>
          )}
        </Link>
      ))}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground",
                moreActive && "text-foreground",
              )}
            />
          }
        >
          <MoreHorizontal className="size-5" />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 px-4">
            {more.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive(href) && "bg-muted text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
            <div className="mt-2 border-t pt-2">
              <UserSwitcher onNavigate={() => setMoreOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { state, actions } = useDemo();
  const router = useRouter();
  const me = currentProfile(state);
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <>
      {confirmReset && (
        <Dialog open onOpenChange={setConfirmReset}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset demo data?</DialogTitle>
              <DialogDescription>
                Everything you added or changed in this browser is discarded and
                the original seed comes back. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  actions.resetDemo();
                  setConfirmReset(false);
                  toast("Demo data reset");
                }}
              >
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
          />
        }
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
          {initials(me.fullName)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium">{me.fullName}</span>
          <span className="block text-xs text-muted-foreground capitalize">
            {roleOf(state, me.id)}
            {isOwner(state) ? "" : " · demo"}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Demo as</DropdownMenuLabel>
        {state.profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => {
              actions.setCurrentUser(profile.id);
              toast(`Now viewing as ${profile.fullName}`);
              onNavigate?.();
            }}
          >
            <UserRound />
            <span className="flex-1">{profile.fullName}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {roleOf(state, profile.id)}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setConfirmReset(true)}>
          <RefreshCcw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onNavigate?.();
            router.push("/");
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function DemoBanner() {
  return (
    <div className="border-b bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      Demo mode — data lives in your browser. Supabase auth &amp; live syncs
      arrive in later phases (see docs/tasks).
    </div>
  );
}

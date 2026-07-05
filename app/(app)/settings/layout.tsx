"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/settings", label: "Organization" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/homeowners", label: "Homeowners" },
  { href: "/settings/integrations", label: "Integrations" },
] as const;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/settings"
      ? pathname === "/settings"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Organization preferences, people, and connections.
        </p>
      </header>

      <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max items-center gap-1 border-b pb-2">
          {SECTIONS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {children}
    </div>
  );
}

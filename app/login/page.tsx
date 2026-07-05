"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MANAGER_ID, OWNER_ID } from "@/lib/demo/seed";
import { useDemoMaybe } from "@/lib/demo/store";

export default function LoginPage() {
  const router = useRouter();
  const { actions } = useDemoMaybe();

  const signInAs = (userId: string) => {
    actions.setCurrentUser(userId);
    router.push("/today");
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Email &amp; password auth arrives with the database phase (02). For
            now, pick a demo account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button onClick={() => signInAs(OWNER_ID)}>
              <UserRound data-icon="inline-start" />
              Continue as Sarah — owner
            </Button>
            <Button variant="secondary" onClick={() => signInAs(MANAGER_ID)}>
              <UserRound data-icon="inline-start" />
              Continue as Mike — manager
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">coming soon</span>
            <Separator className="flex-1" />
          </div>

          <form className="space-y-3 opacity-60" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" disabled />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled>
              Sign in with email
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New team?{" "}
            <Link href="/signup" className="underline underline-offset-2">
              Create an organization
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

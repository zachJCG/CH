"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

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

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your organization</CardTitle>
          <CardDescription>
            Signup creates your org and makes you its owner. Real accounts
            arrive with the database phase (02) — explore the demo meanwhile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3 opacity-60" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Sarah Calhoun" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organization name</Label>
              <Input id="org" placeholder="CH Property Management" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" disabled />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled>
              Create organization
            </Button>
          </form>

          <Button className="w-full" onClick={() => router.push("/today")}>
            <Sparkles data-icon="inline-start" /> Explore the demo instead
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already set up?{" "}
            <Link href="/login" className="underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

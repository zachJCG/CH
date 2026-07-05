import { AppShell } from "@/components/app/app-shell";

// Authenticated shell. Once Supabase auth lands (phase 02), this layout gains
// the session check + redirect to /login; the shell itself stays as-is.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

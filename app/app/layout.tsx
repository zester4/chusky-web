import { AppShell } from "@/components/app/app-shell";
import { AuthenticatedApp } from "@/components/app/authenticated-app";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedApp><AppShell>{children}</AppShell></AuthenticatedApp>;
}

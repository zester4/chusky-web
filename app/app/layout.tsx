import { AppShell } from "@/components/app/app-shell";
import { AppErrorBoundary } from "@/components/app/app-error-boundary";
import { AuthenticatedApp } from "@/components/app/authenticated-app";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedApp>
      <AppErrorBoundary>
        <div className="app-depth-root min-h-svh" data-depth="subtle">
          <AppShell>{children}</AppShell>
        </div>
      </AppErrorBoundary>
    </AuthenticatedApp>
  );
}

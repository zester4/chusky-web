"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Keep one malformed client payload from turning the entire workspace black. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chusky workspace rendering failed", { name: error.name, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground">
        <section className="w-full max-w-md border border-foreground/10 bg-background p-6 shadow-sm sm:p-8" role="alert">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace recovery</p>
          <h1 className="mt-2 font-display text-2xl">This workspace could not render.</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Your call and saved data are still protected. Reload the workspace to fetch a clean view.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-10 border border-foreground bg-foreground px-4 text-xs font-medium text-background">Reload workspace</button>
        </section>
      </main>
    );
  }
}

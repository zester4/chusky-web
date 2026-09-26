import { CircleDot, LockKeyhole, RefreshCw, Route, UserRound } from "lucide-react";

const executionStages = [
  { icon: UserRound, label: "Identity", title: "The request enters an owned workspace", description: "A verified channel or trusted application maps the request to one Chusky account. That boundary determines which history, explicit memories, connected apps, files, and approvals are available." },
  { icon: Route, label: "Intent", title: "The agent chooses a path", description: "Chusky interprets the outcome, reuses relevant context, and selects the capabilities your workspace has made available. It does not treat arbitrary text from a website, document, or tool result as permission." },
  { icon: LockKeyhole, label: "Control", title: "Risky work stops at a clear boundary", description: "Sending, publishing, deleting, spending, changing permissions, or placing a call can create an approval record. The record contains the exact action, arguments, owner, and expiry." },
  { icon: RefreshCw, label: "Durability", title: "Long work keeps its place", description: "Runs and tasks have IDs and observable states. Background continuation and persistence across restarts require Redis and QStash in production." },
];

export function HowItWorksDetails() {
  return (
    <>
      <section className="border-b border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Behind the answer</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">A simple conversation on top of a careful system.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">The experience feels conversational because the complexity is handled underneath. Each request is scoped by identity and policy before tool selection; persistence and background delivery depend on the services enabled for the deployment.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {executionStages.map(({ icon: Icon, label, title, description }, index) => (
              <article key={label} className="border border-foreground/10 p-5 sm:p-7">
                <div className="flex items-center justify-between"><Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" /><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span></div>
                <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-chusky-amber">{label}</p>
                <h3 className="mt-3 font-display text-2xl tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 bg-foreground/[0.02] py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">One visible lifecycle</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Inspect the saved state before you retry.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">A dropped client stream is not proof that a run failed. With the required persistence and scheduling services configured, reconnect using the saved run or task ID and choose a recovery action based on its current state.</p>
          </div>
          <div className="border border-foreground/10 bg-background">
            {["Queued · accepted and waiting to execute", "Running · the agent is reasoning or using a tool", "Approval required · a person must review the exact action", "Completed · the result and any artifacts are available", "Failed or cancelled · the state explains what can be retried"].map((item, index) => (
              <div key={item} className="flex items-start gap-3 border-b border-foreground/10 px-4 py-4 last:border-0 sm:px-5"><CircleDot className={`mt-0.5 h-4 w-4 shrink-0 ${index === 2 ? "text-chusky-amber" : "text-foreground/35"}`} /><span className="text-xs leading-relaxed text-foreground/80 sm:text-sm">{item}</span></div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

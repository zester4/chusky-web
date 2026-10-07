import Link from "next/link";
import { Activity, CircleDot, FileCheck2, LockKeyhole, Radio, RefreshCw, Route, UserRound } from "lucide-react";

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

      <section className="border-b border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Beyond the first reply</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Useful work, ready to pick up.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">Chusky can turn a request into a deliverable, keep authorized work moving, and bring the result back to the places you already work.</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/features" className="underline underline-offset-4 transition-colors hover:text-foreground">Explore capabilities</Link>
              <Link href="/integrations" className="underline underline-offset-4 transition-colors hover:text-foreground">See integrations</Link>
            </div>
          </div>

          <div className="divide-y divide-foreground/10 border-y border-foreground/10">
            <article className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-4 sm:py-6">
              <FileCheck2 className="mt-1 h-5 w-5 text-chusky-amber" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3 className="font-display text-xl tracking-tight sm:text-2xl">Create files you can use</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Turn research and business work into reports, PDFs, Word documents, presentations, spreadsheets, and other supported artifacts. Where a guarded builder is available, it checks the output before registering it so you can retrieve or download the result.</p>
              </div>
            </article>

            <article className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-4 sm:py-6">
              <Activity className="mt-1 h-5 w-5 text-chusky-amber" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3 className="font-display text-xl tracking-tight sm:text-2xl">Keep authorized work moving</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Missions, tasks, reminders, triggers, and the Attention Pulse preserve progress and revisit work on schedule. Pulse can review durable work and watches you configured, then handle or delegate within their existing permissions. It does not silently monitor every connected app. Reliable background continuation requires production Redis and QStash setup.</p>
              </div>
            </article>

            <article className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-4 sm:py-6">
              <Radio className="mt-1 h-5 w-5 text-chusky-amber" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3 className="font-display text-xl tracking-tight sm:text-2xl">Work across your channels</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Reach Chusky on the web, Telegram, Slack, WhatsApp, linked iMessage, or the CLI. With supported providers connected, it can also help with meetings and business calls. Each channel and provider must be linked and configured; available actions still follow its permissions and approval rules.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 bg-foreground/[0.02] py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">A request becomes a run</p><h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">The model chooses a capability; the runtime decides whether it can run.</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">Tool selection is not a permission grant. Chusky checks the live capability surface, account scope, input schema, approval policy, and provider state at the execution boundary. This is why the same sentence can take a different path in a private workspace, a shared channel, or a host with fewer connections.</p></div><div className="mt-10 grid gap-3 md:grid-cols-3"><article className="border border-foreground/10 bg-background p-5"><h3 className="font-display text-2xl">Available</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The capability is connected, the caller is in scope, and the arguments pass validation.</p></article><article className="border border-foreground/10 bg-background p-5"><h3 className="font-display text-2xl">Waiting</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The run needs an approval, connection, owner answer, or scheduled wake-up before it can continue.</p></article><article className="border border-foreground/10 bg-background p-5"><h3 className="font-display text-2xl">Unconfirmed</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The provider response is incomplete or transport is uncertain, so Chusky preserves the state instead of claiming a side effect.</p></article></div></div>
      </section>

    </>
  );
}

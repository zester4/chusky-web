import Link from "next/link";
import { ArrowRight, Braces, Check, Code2, Globe2, ShieldCheck, Webhook } from "lucide-react";

const entryPoints = [
  {
    icon: Code2,
    label: "TypeScript SDK",
    title: "The fastest path to a product feature",
    description: "Create threads, stream runs, upload verified files, handle approvals, and inspect durable tasks from a typed server-side client.",
    href: "/docs/quickstart",
    action: "Start with the SDK",
  },
  {
    icon: Globe2,
    label: "REST API",
    title: "Keep your own application architecture",
    description: "Call the versioned /v1 API from your server, mobile backend, job runner, or internal service. The same ownership and approval rules still apply.",
    href: "/docs/rest-api",
    action: "Read the API guide",
  },
  {
    icon: Braces,
    label: "Remote MCP",
    title: "Give another agent a governed Chusky connection",
    description: "Connect Claude, Cursor, ChatGPT, or another MCP host with a project key and stable end-user identity. The host can discover and call Chusky operations without receiving provider credentials.",
    href: "/docs/mcp",
    action: "Connect through MCP",
  },
];

const platformCapabilities = [
  ["Durable threads and runs", "Keep conversation continuity and recover a run after a disconnected client."],
  ["Tool orchestration", "Use native Chusky tools and owner-approved Composio connections through one agent loop."],
  ["Human approvals", "Pause before consequential actions and bind approval to the exact tool, arguments, owner, and expiry."],
  ["Files and artifacts", "Upload verified files and return generated reports, documents, PDFs, images, and other deliverables."],
  ["Tasks and webhooks", "Move long work into durable task state and receive signed completion or failure events."],
  ["Usage and audit", "Keep project limits, run status, tool activity, and safe audit records visible to your operations team."],
];

export function DeveloperPlatformSection() {
  return (
    <>
      <section className="border-y border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Three ways in</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Put Chusky behind the experience you already own.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your product stays responsible for sign-in, billing, and the interface your customers see. Chusky supplies the durable agent runtime underneath: threads, tools, approvals, files, tasks, and delivery events.
            </p>
          </div>
          <div className="mt-10 grid gap-px bg-foreground/10 lg:grid-cols-3">
            {entryPoints.map(({ icon: Icon, label, title, description, href, action }) => (
              <article key={label} className="flex min-h-full flex-col bg-background p-5 sm:p-7">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-chusky-amber">{label}</p>
                <h3 className="mt-3 font-display text-2xl leading-tight tracking-tight">{title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <Link href={href} className="mt-7 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">
                  {action} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">The integration contract</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">One request, with a durable identity behind it.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Call Chusky from a trusted server. Your project key identifies the application; your authenticated user ID identifies whose private threads, files, memories, approvals, and connected accounts the run may use.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              {["Keep project keys out of browser code", "Derive userId from your own authenticated session", "Persist thread and run IDs in your application", "Treat a disconnected stream as recoverable, not automatically failed"].map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-foreground/10 pt-3 text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden border border-foreground/15 bg-[#111] text-sm text-[#f7f7f4] shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/50"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="ml-2">server.ts</span></div>
            <pre className="overflow-x-auto p-5 text-[11px] leading-7 sm:p-6 sm:text-sm"><code>{`import { Chusky } from "@chusky/sdk";

const chusky = new Chusky({
  apiKey: process.env.CHUSKY_API_KEY!,
  userId: session.user.id,
});

const thread = await chusky.threads.create();

for await (const event of chusky.threads
  .runs(thread.id).stream({
    input: "Prepare a renewal brief.",
  })) {
  if (event.type === "run.delta") sendToClient(event.text);
  if (event.type === "run.approval_required")
    showApproval(event.approval);
}`}</code></pre>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">What you get</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">A runtime for work that cannot disappear when the tab closes.</h2>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-0 border-t border-foreground/10 sm:grid-cols-2">
            {platformCapabilities.map(([title, description], index) => (
              <div key={title} className="border-b border-foreground/10 py-5 sm:py-6">
                <div className="flex gap-4">
                  <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                  <div><h3 className="text-sm font-medium sm:text-base">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Before production</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Make the boundary explicit.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">A reliable integration is a shared contract between your application and Chusky. Decide which side owns each responsibility before you ship.</p>
          </div>
          <div className="grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-2">
            <div className="bg-background p-5 sm:p-6"><ShieldCheck className="h-5 w-5" /><h3 className="mt-7 text-sm font-medium">Your application owns</h3><ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground"><li>Authentication and account identity</li><li>Product UI and customer permissions</li><li>Business-specific approval decisions</li><li>Storage of thread and run references</li></ul></div>
            <div className="bg-background p-5 sm:p-6"><Webhook className="h-5 w-5" /><h3 className="mt-7 text-sm font-medium">Chusky owns</h3><ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground"><li>Agent execution and tool routing</li><li>Durable run state and recovery</li><li>Connected-app boundaries and approvals</li><li>Task, webhook, audit, and usage state</li></ul></div>
          </div>
        </div>
      </section>
    </>
  );
}

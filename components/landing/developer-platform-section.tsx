import Link from "next/link";
import { ArrowRight, Braces, Check, Code2, Globe2, ShieldCheck, Webhook } from "lucide-react";
import styles from "./product-page.module.css";
import { ContentCard, ContentSection } from "./content-page";

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
    description: "Connect a compatible remote MCP host with a project key and stable end-user identity. It can discover and call Chusky operations without receiving provider credentials.",
    href: "/docs/mcp",
    action: "Connect through MCP",
  },
  {
    icon: Webhook,
    label: "Agent-to-Agent",
    title: "Make Chusky part of a wider agent team",
    description: "Let another agent hand work to Chusky through A2A. Keep the caller identity, permitted tools, and execution limits attached to the job.",
    href: "/api-reference",
    action: "Explore the integration surface",
  },
];

const platformCapabilities = [
  ["Durable threads and runs", "Keep conversation continuity and recover a run after a disconnected client."],
  ["Long-running missions", "Compose dependency-aware work with checkpoints, bounded budgets, waits, retries, and resumable execution."],
  ["Verified outcomes and recovery", "Read current provider state, retain linked receipts, and require exact owner approval for consequential compensation actions."],
  ["Tool orchestration", "Use Chusky capabilities and owner-approved app connections through one agent loop."],
  ["Human approvals", "Pause before consequential actions and bind approval to the exact tool, arguments, owner, and expiry."],
  ["Files and image workflows", "Upload verified files, route owner-scoped images through exact connected-app schemas, and return generated deliverables."],
  ["Tasks and webhooks", "Move long work into durable task state and receive signed completion or failure events."],
  ["Operations and audit", "Inspect run timelines, receipts, verifications, provider-proof status, and safe audit records."],
];

export function DeveloperPlatformSection() {
  return (
    <>
      <section className="border-y border-foreground/10 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Choose your entry point</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Put Chusky behind the experience you already own.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your product owns authentication and its customer-facing experience. Chusky provides the agent execution API; the caller identity and project scopes define whose work and tools the run may use.
            </p>
          </div>
          <div className={`mt-10 ${styles.entryPoints}`}>
            {entryPoints.map(({ icon: Icon, label, title, description, href, action }) => (
              <article key={label} className={styles.entryPoint}>
                <div><Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" /><span>{label}</span></div>
                <h3>{title}</h3>
                <div><p>{description}</p><Link href={href}>
                  {action} <ArrowRight className="h-3.5 w-3.5" />
                </Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContentSection id="business-widget" eyebrow="For the conversations on your site" title="Your website can be where the work starts." description="Embed a Chusky chat widget on your business website so visitors can reach the agent without switching channels. Connect it to the knowledge, tools, and workflows your business allows.">
        <div className="grid sm:grid-cols-2"><ContentCard title="A conversation with somewhere to go.">The widget is an entry point into the agent. Behind it, a request can draw on connected apps, lead to a next task, and remain part of an ongoing workflow.</ContentCard><ContentCard title="The same controls behind the chat.">Keep visitor and workspace context separated, limit the available tools, and keep owner approval on important changes. Embedding chat does not give a visitor unrestricted access to your accounts.</ContentCard></div><Link href="/docs/quickstart" className={styles.secondaryAction}>Start with the integration guide <ArrowRight size={16} aria-hidden="true" /></Link>
      </ContentSection>

      <ContentSection eyebrow="Build around follow-through" title="The job can continue after the first response." description="Your interface can be a chat, an internal tool, a business workflow, or another agent. Chusky brings work that can wait, resume, and return a result with its history intact.">
        <div className="grid sm:grid-cols-2"><ContentCard title="Missions and named agents.">Keep steps, budgets, an agreed finish line, and evidence with longer work. Give named agents specific responsibilities and let them hand work between roles.</ContentCard><ContentCard title="Events and scheduled work.">Bring email, calendar, HubSpot, and Slack events into configured workflows. Attention Pulse, reminders, and recurring jobs cover the work you want revisited on a schedule.</ContentCard></div>
      </ContentSection>

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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.codePanel}>
            <div className={styles.codeHeader}><span>server.ts</span><span>TypeScript SDK</span></div>
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
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Addressable state for long-running work.</h2>
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
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Production background execution and recovery require Redis and QStash to be configured in the Chusky deployment.</p>
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

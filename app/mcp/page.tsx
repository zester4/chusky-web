import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, KeyRound, LockKeyhole, Plug, ShieldCheck, Terminal } from "lucide-react";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "MCP | Chusky",
  description: "Connect Chusky to MCP-capable hosts with a scoped key, stable identity, and governed agent execution.",
};

const endpoint = "https://chusky-mcp.adesrnd.workers.dev/mcp";
const config = `{
  "mcpServers": {
    "chusky": {
      "url": "${endpoint}",
      "headers": {
        "Authorization": "Bearer \${CHUSKY_API_KEY}",
        "X-Chusky-User-Id": "\${CHUSKY_END_USER_ID}"
      }
    }
  }
}`;

const steps = [
  { number: "01", icon: KeyRound, title: "Create a project key", description: "In the Chusky app, open Developer API or your organization project and create a project-scoped key with only the permissions your host needs." },
  { number: "02", icon: Plug, title: "Connect your MCP host", description: "Add the Chusky endpoint to Claude, Cursor, an IDE agent, or your own server. Store the key in that host’s secret manager, never in browser code." },
  { number: "03", icon: ShieldCheck, title: "Run with control", description: "Give each caller a stable application identity. Chusky keeps runs, tools, files, approvals, and durable work scoped to that identity." },
];

const guarantees = [
  [LockKeyhole, "Scoped by design", "Project keys carry explicit scopes. Start read-only, then add run or management access only when the workflow requires it."],
  [ShieldCheck, "Human approval stays human", "MCP hosts can inspect approval status, but they cannot approve their own external actions."],
  [Terminal, "Built for durable work", "A dropped connection does not erase a run. Reconnect with the returned thread and run IDs to inspect progress or continue safely."],
] as const;

export default function McpLandingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Model Context Protocol"
        title={<>Connect Chusky<br /><span className="text-muted-foreground">to the agents you use.</span></>}
        description="Connect an MCP host that supports remote Streamable HTTP to Chusky’s project-scoped tools. Caller identity and server-side policy scope the work; background continuation depends on production persistence and scheduling configuration."
        artwork={{ src: "/chusky/chusky-developer.png", alt: "Chusky connecting an agent workspace to developer tools" }}
      />

      <section className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">From setup to first run</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">A clean path from key to capability.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">MCP is the connection layer. Your project key defines what the host may do, and the end-user identity defines whose work it can see.</p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="bg-background p-5 sm:p-7">
                <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-chusky-amber" strokeWidth={1.6} /><span className="font-mono text-[10px] text-muted-foreground">{number}</span></div>
                <h3 className="mt-10 font-display text-2xl tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">01 · Connect a host</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Use the endpoint wherever your agent works.</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">For custom backends and hosts that support headers, use the configuration below. The environment variables are placeholders: keep their real values in the host’s server-side secret store.</p>
            <Link href="/app/developer-api" className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Create an API key in Chusky <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-foreground/15 bg-[#111] text-sm text-[#f7f7f4] shadow-[0_20px_60px_-30px_rgba(8,18,39,0.7)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/55"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="ml-2">mcp.json</span></div><span>server-side config</span></div>
            <pre className="overflow-x-auto p-4 text-[11px] leading-6 sm:p-5 sm:text-xs"><code>{config}</code></pre>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 md:grid-cols-3">
            {guarantees.map(([Icon, title, description]) => <div key={title} className="bg-background p-5 sm:p-7"><Icon className="h-5 w-5 text-chusky-amber" strokeWidth={1.6} /><h3 className="mt-8 font-display text-2xl tracking-tight">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-12">
          <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">02 · Identity and safety</p><h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">The key opens the project. Identity scopes the work.</h2><p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Send a stable, non-PII application identity in <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-xs">X-Chusky-User-Id</code>. Chusky uses it to keep conversations, files, connected accounts, approvals, and usage separated between callers.</p></div>
          <div className="space-y-3">{["Never put a chsk_ key in browser code or a prompt.", "Do not use an email address or display name as the stable identity.", "Start with a read-only test before enabling external actions."].map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-foreground/10 px-4 py-4 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</div>)}</div>
        </div>
      </section>

      <section className="border-t border-foreground/10 bg-foreground py-14 text-background sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-12"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-background/55">Ready when your host is</p><h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Give your agents a way to get real work done.</h2><p className="mt-4 text-sm leading-relaxed text-background/65 sm:text-base">Create a scoped key, connect the endpoint, and let Chusky handle the governed execution behind the scenes.</p></div><div className="flex flex-wrap gap-2"><Link href="/sign-up" className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 text-xs font-medium text-foreground">Start with Chusky <ArrowRight className="h-3.5 w-3.5" /></Link><Link href="/docs/mcp" className="inline-flex h-10 items-center rounded-full border border-background/25 px-4 text-xs font-medium text-background">Read the guide</Link></div></div>
      </section>
    </ProductPageShell>
  );
}

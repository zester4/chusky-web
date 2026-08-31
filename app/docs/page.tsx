import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, Code2, FileText, ShieldCheck, Sparkles, Webhook } from "lucide-react";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Documentation | Chusky",
  description: "Build persistent, tool-using AI experiences with the Chusky SDK and Developer API.",
};

const guides = [
  { icon: Sparkles, title: "Quickstart", description: "Install the SDK, authenticate an end user, create a thread, and stream your first response.", href: "#quickstart" },
  { icon: Code2, title: "Agent runs", description: "Understand threads, runs, streaming events, approvals, cancellation, and recovery.", href: "#runs" },
  { icon: FileText, title: "Files and knowledge", description: "Upload verified files through R2 and attach them to image, document, and audio-aware runs.", href: "#files" },
  { icon: Webhook, title: "Webhooks and tasks", description: "Receive durable notifications and build workflows that survive restarts and disconnected clients.", href: "#durable" },
];

export default function DocsPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Chusky documentation"
        title={<>Build with the agent.<br /><span className="text-muted-foreground">Keep the work durable.</span></>}
        description="Chusky gives developers a secure API and TypeScript SDK for building conversational products around a persistent, tool-using agent. Start in a server route, then add streaming, files, approvals, tasks, and webhooks as your product grows."
      />

      <section className="border-b border-foreground/10 py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map(({ icon: Icon, title, description, href }) => (
              <a key={title} href={href} className="group bg-background p-5 transition-colors hover:bg-foreground hover:text-background sm:p-7">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <h2 className="mt-10 font-display text-2xl tracking-tight">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground group-hover:text-background/70">{description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-xs font-medium">Read guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">01 · Quickstart</p><h2 className="mt-4 font-display text-4xl tracking-tight sm:text-6xl">A useful agent in minutes.</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground">The SDK is designed for trusted server environments. Your application owns authentication; Chusky owns agent execution, tools, and durable state.</p></div>
          <div className="overflow-hidden border border-foreground/15 bg-[#111] text-sm text-[#f7f7f4] shadow-sm"><div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/50"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="ml-2">server.ts</span></div><pre className="overflow-x-auto p-5 leading-7"><code>{`import { Chusky } from "@chusky/sdk";\n\nconst chusky = new Chusky({\n  apiKey: process.env.CHUSKY_API_KEY!,\n  baseUrl: process.env.CHUSKY_BASE_URL,\n  userId: session.user.id,\n});\n\nconst thread = await chusky.threads.create();\n\nfor await (const event of chusky.threads\n  .runs(thread.id).stream({\n    input: "Prepare my renewal brief.",\n  })) {\n  if (event.type === "run.delta") {\n    sendToClient(event.text);\n  }\n}`}</code></pre></div>
        </div>
      </section>

      <section id="runs" className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">02 · The execution model</p><h2 className="mt-4 font-display text-4xl tracking-tight sm:text-6xl">Conversation is the interface. Durable runs are the engine.</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">A thread holds continuity. Each run can stream text, call connected tools, request human approval, create a durable task, and be recovered after a network interruption.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="border border-foreground/10 p-5"><BookOpen className="h-5 w-5" /><h3 className="mt-8 font-display text-2xl">Threads</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Private, user-owned context that can continue across web, terminal, and connected channels.</p></div><div className="border border-foreground/10 p-5"><ShieldCheck className="h-5 w-5" /><h3 className="mt-8 font-display text-2xl">Approvals</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Exact, expiring, one-time approval records protect consequential actions.</p></div><div className="border border-foreground/10 p-5"><Braces className="h-5 w-5" /><h3 className="mt-8 font-display text-2xl">Events</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Typed run events make progress, tools, failures, and completion easy to render.</p></div></div></div>
      </section>

      <section id="files" className="border-b border-foreground/10 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-12"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">03 · Files</p><h2 className="mt-4 font-display text-4xl tracking-tight sm:text-6xl">Give the agent verified context.</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Files are uploaded directly to Cloudflare R2 using short-lived URLs. Chusky verifies ownership, size, and content type before a file reaches the model.</p></div><div className="space-y-3">{["Create an upload intent", "Upload bytes to the signed URL", "Complete server-side verification", "Attach the verified file ID to a run"].map((item) => <div key={item} className="flex items-center gap-3 border border-foreground/10 px-4 py-4 text-sm"><Check className="h-4 w-4 text-emerald-600" />{item}</div>)}</div></div>
      </section>

      <section id="durable" className="py-14 sm:py-20 lg:py-28"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:px-12"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">04 · Keep building</p><h2 className="mt-4 font-display text-4xl tracking-tight sm:text-6xl">Tasks, webhooks, models, and more.</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Use the complete SDK documentation for model selection, file workflows, approvals, durable tasks, webhooks, security, errors, and production operations.</p></div><Link href="https://github.com/zester4/chusky-sdk/tree/main/docs" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Open full SDK docs <ArrowRight className="h-4 w-4" /></Link></div></section>
    </ProductPageShell>
  );
}

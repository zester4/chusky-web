import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, CircleDot, ShieldCheck } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Status and reliability | Chusky",
  description: "Understand how Chusky reports work state, delivery state, approvals, and recovery.",
};

export default function StatusPage() {
  return (
    <ContentPage eyebrow="Status and reliability" title={<>Know where work stands.<br /><span className="text-muted-foreground">At every step.</span></>} description="Chusky is built around visible work states instead of a vague loading screen. The authenticated Operations dashboard is the source of truth for your workspace; this page explains what those states mean." artwork={{ src: "/chusky/chusky-workflow.png", alt: "Chusky tracking work through a visible workflow" }}>
      <ContentSection eyebrow="The public promise" title="We do not replace a live status feed with a reassuring number." description="When you are signed in, Chusky shows the health of the services and delivery paths your workspace depends on. When a provider is unavailable, the dashboard should tell you what is affected and what can be retried.">
        <div className="grid gap-3 sm:grid-cols-3"><ContentCard eyebrow="Live workspace" title="Operations dashboard"><Activity className="mb-3 h-5 w-5 text-chusky-amber" /><p>See runtime checks, connected channels, delivery failures, and the last recorded incident inside your workspace.</p></ContentCard><ContentCard eyebrow="Per run" title="Clear execution state"><CircleDot className="mb-3 h-5 w-5 text-chusky-amber" /><p>Queued, running, approval required, completed, failed, and cancelled states remain attached to the work they describe.</p></ContentCard><ContentCard eyebrow="When things change" title="Recoverable by design"><CheckCircle2 className="mb-3 h-5 w-5 text-chusky-amber" /><p>Streams can disconnect without erasing the run. Reopen the thread, inspect the result, and continue from the latest durable state.</p></ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="What to do next" title="If a run needs attention, the state should point you somewhere useful." description="Review an approval, reconnect a channel, retry a failed delivery, or open the conversation that owns the task. The system should make the next decision legible instead of asking you to guess.">
        <div className="grid gap-3 sm:grid-cols-2"><ContentCard title="For workspace owners"><p>Open Operations to understand the current service health and Delivery to inspect what actually left Chusky.</p><Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open your workspace <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="For builders"><p>Use typed run events, approval records, and task state in your own interface so users can see progress without refreshing.</p><Link href="/docs" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Read the integration guide <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard></div>
      </ContentSection>
      <section className="py-14 sm:py-20 lg:py-28"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12"><p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Workspace health is visible to the people responsible for the work.</p><Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Start with Chusky <ArrowRight className="h-4 w-4" /></Link></div></section>
    </ContentPage>
  );
}

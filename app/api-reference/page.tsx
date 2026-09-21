import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, KeyRound, Radio, ShieldCheck } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "API reference | Chusky",
  description: "Understand the Chusky API surface for threads, runs, files, approvals, tasks, and delivery.",
};

const endpoints = [
  ["Threads", "Create or reopen the conversation that owns the context for a piece of work."],
  ["Runs", "Send an objective, stream progress, inspect tool activity, and receive the final result."],
  ["Approvals", "Present an exact action for review and continue only after the owner decides."],
  ["Files and artifacts", "Attach verified inputs and retrieve the documents, images, or exports the agent creates."],
  ["Tasks and delivery", "Track work that continues beyond the current request and the channels it reaches."],
];

export default function ApiReferencePage() {
  return (
    <ContentPage eyebrow="Developer reference" title={<>Build around the agent.<br /><span className="text-muted-foreground">Keep every state visible.</span></>} description="The Chusky API gives your product a clear contract for starting work, streaming progress, asking for approval, and recovering the result. Use it from a trusted server and keep your own customer identity in charge." artwork={{ src: "/chusky/chusky-developer.png", alt: "Chusky helping a developer build an agent workflow" }}>
      <ContentSection eyebrow="The surface" title="Small primitives. A complete work loop." description="Most integrations begin with a thread and a run. Add the surrounding primitives only when your product needs them: files for context, approvals for control, tasks for continuity, and delivery events for follow-through.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{endpoints.map(([title, description]) => <ContentCard key={title} title={title}>{description}</ContentCard>)}</div>
      </ContentSection>
      <ContentSection id="request-lifecycle" eyebrow="Request lifecycle" title="A run is more than a response." description="Your interface can render the work as it happens instead of waiting for a single opaque answer.">
        <div className="grid gap-px bg-foreground/10 sm:grid-cols-4">{[["01", "Authenticate", "Your server identifies the project and the end user."], ["02", "Start", "Chusky accepts the objective and begins a tracked run."], ["03", "Review", "An exact approval pauses the run when the action matters."], ["04", "Recover", "The final result and artifacts remain available after the stream ends."]].map(([number, title, text]) => <div key={number} className="bg-background p-5 sm:p-6"><span className="font-mono text-[10px] text-muted-foreground">{number}</span><h3 className="mt-7 text-sm font-medium">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p></div>)}</div>
      </ContentSection>
      <ContentSection eyebrow="Production boundary" title="Keep credentials and identity on the server." description="Project keys authorize your application. The stable end-user identity determines which private threads, files, memories, approvals, and connections the run may use. Never place project keys in browser code.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[KeyRound, "Project key", "Identifies your Chusky project."], [Braces, "User identity", "Scopes private work to your authenticated user."], [ShieldCheck, "Approval boundary", "Keeps consequential actions reviewable."], [Radio, "Run events", "Makes progress and recovery renderable."]].map(([Icon, title, text]) => { const IconComponent = Icon as typeof KeyRound; return <ContentCard key={title as string} title={title as string}><IconComponent className="mb-3 h-5 w-5 text-chusky-amber" />{text as string}</ContentCard>; })}</div>
        <div className="mt-8 flex flex-wrap gap-4"><Link href="/docs" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Read the documentation <ArrowRight className="h-4 w-4" /></Link><Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Create a workspace <ArrowRight className="h-4 w-4" /></Link></div>
      </ContentSection>
    </ContentPage>
  );
}

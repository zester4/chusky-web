import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, MessageSquareText } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Notes from Chusky",
  description: "Product notes and practical ideas for building AI agents that carry work through.",
};

const notes = [
  [Compass, "The agent should own the outcome", "A useful agent does more than produce a polished paragraph. It keeps the objective, the constraints, the next action, and the state of the work in view."],
  [MessageSquareText, "Conversation is only the beginning", "The best interface can be a message, but the work underneath needs tasks, files, approvals, reminders, and a result that remains available after the tab closes."],
  [BookOpen, "Designing for trust in action", "Trust grows when the agent makes its decisions legible: what it understood, what it plans to do, what needs permission, and what actually happened."],
] as const;

export default function BlogPage() {
  return (
    <ContentPage eyebrow="Field notes" title={<>Ideas for agents<br /><span className="text-muted-foreground">that finish the work.</span></>} description="A small collection of product notes from the people building Chusky: practical thinking about agent behavior, durable work, and the human boundaries that make automation useful." artwork={{ src: "/chusky/chusky-poster.png", alt: "Chusky turning an idea into completed work" }}>
      <ContentSection eyebrow="From the Chusky team" title="Build an agent people can return to." description="We care less about the novelty of a single response and more about whether the agent can help someone make progress again tomorrow. These notes are the principles behind that work.">
        <div className="grid gap-3 md:grid-cols-3">{notes.map(([Icon, title, description]) => <ContentCard key={title} eyebrow="Chusky note" title={title}><Icon className="mb-4 h-5 w-5 text-chusky-amber" />{description}</ContentCard>)}</div>
      </ContentSection>
      <section className="py-14 sm:py-20 lg:py-28"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-12"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Keep exploring</p><h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">See how those ideas become a working product.</h2></div><div className="flex flex-wrap gap-4"><Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">How it works <ArrowRight className="h-4 w-4" /></Link><Link href="/developers" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">For developers <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </ContentPage>
  );
}

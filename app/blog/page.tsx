import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, MessageSquareText } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Product principles | Chusky",
  description: "The product principles behind Chusky’s approach to useful, reviewable agent work.",
};

const notes = [
    [Compass, "Progress deserves a history", "Long work should leave an inspectable record of what ran, what is waiting, and what can safely happen next—not just a final summary."],
    [MessageSquareText, "A connection is not an open-ended grant", "An app connection makes specific provider actions possible. It should not be mistaken for blanket permission across every conversation or operation."],
    [BookOpen, "Approval is an event, not a message", "A consequential action needs a decision tied to the exact request, owner, and expiry. A casual follow-up in chat should never silently replace that decision."],
] as const;

export default function BlogPage() {
  return (
    <ContentPage eyebrow="Product principles" title={<>How we think about<br /><span className="text-muted-foreground">agents at work.</span></>} description="These are the design principles we use to make choices about Chusky. They are product perspective, not customer testimonials or performance claims." artwork={{ src: "/chusky/chusky-poster.png", alt: "Chusky working through a multi-step task" }}>
      <ContentSection eyebrow="Our point of view" title="Capability is only useful when the boundary is clear." description="We judge an agent by the quality of its handoffs as well as its answers: what it understood, what it changed, and what still needs a person.">
        <div className="grid gap-3 md:grid-cols-3">{notes.map(([Icon, title, description]) => <ContentCard key={title} eyebrow="Principle" title={title}><Icon className="mb-4 h-5 w-5 text-chusky-amber" />{description}</ContentCard>)}</div>
      </ContentSection>
      <section className="py-14 sm:py-20 lg:py-28"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-12"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Keep exploring</p><h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">See how those ideas become a working product.</h2></div><div className="flex flex-wrap gap-4"><Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">How it works <ArrowRight className="h-4 w-4" /></Link><Link href="/developers" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">For developers <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </ContentPage>
  );
}

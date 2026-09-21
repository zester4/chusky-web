import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Careers | Chusky",
  description: "Help build an AI agent that makes useful work easier to start, understand, and finish.",
};

export default function CareersPage() {
  return (
    <ContentPage eyebrow="Careers at Chusky" title={<>Build tools that<br /><span className="text-muted-foreground">help people finish.</span></>} description="Chusky is focused on a simple, difficult idea: an AI agent should be useful in the real world, clear about its boundaries, and accountable for what it does." artwork={{ src: "/chusky/chusky-developer.png", alt: "Chusky helping people build useful agent workflows" }}>
      <ContentSection eyebrow="What we value" title="The work is ambitious. The product should feel calm." description="We are building a system that touches real work, so we care about judgment as much as speed. The details matter: the wording of an approval, the recovery path after a failure, and the trust a user feels when the agent takes action.">
        <div className="grid gap-3 md:grid-cols-3"><ContentCard title="Useful over impressive"><Lightbulb className="mb-4 h-5 w-5 text-chusky-amber" /><p>Choose clarity and completed outcomes over demos that only look good in the happy path.</p></ContentCard><ContentCard title="Boundaries are product"><ShieldCheck className="mb-4 h-5 w-5 text-chusky-amber" /><p>Identity, permissions, approvals, and recovery are part of the experience—not paperwork around it.</p></ContentCard><ContentCard title="Build with care"><HeartHandshake className="mb-4 h-5 w-5 text-chusky-amber" /><p>Work with curiosity, write things down, and leave the system easier for the next person to understand.</p></ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="Open roles" title="We are not listing a public role today." description="When we open a role, we will describe the work honestly and make the application path clear. Until then, the best way to understand Chusky is to try it, read the documentation, and see what you would improve.">
        <div className="flex flex-wrap gap-4"><Link href="/start-creating" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Try Chusky <ArrowRight className="h-4 w-4" /></Link><Link href="https://github.com/zester4/chusky-web" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Explore the project <ArrowRight className="h-4 w-4" /></Link></div>
      </ContentSection>
    </ContentPage>
  );
}

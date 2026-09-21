import type { Metadata } from "next";
import { CtaSection } from "@/components/landing/cta-section";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Features | Chusky AI Agent",
  description: "Connect apps, discover the right tools, create files, and automate work with Chusky.",
};

export default function FeaturesPage() {
  return (
    <ContentPage
        eyebrow="What Chusky can do"
        title={<>One agent.<br /><span className="text-muted-foreground">1,000+ tools.</span></>}
        description="Chusky is built for work that has a beginning, a middle, and a result. Give it the objective and context; it can research, use connected apps, create files, coordinate follow-through, and keep the state of the work visible."
        artwork={{ src: "/chusky/chusky-connected-tools.png", alt: "Chusky connecting work across apps and tools" }}
      >
      <ContentSection eyebrow="The capability stack" title="From a clear objective to a finished result." description="Chusky is not a collection of isolated buttons. The value comes from the way its capabilities work together around the outcome you asked for.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ContentCard eyebrow="01 · Understand" title="Context that stays useful">Bring a request, a file, a conversation, or a half-formed idea. Chusky can use the context you provide and keep the useful parts available as the work develops.</ContentCard>
          <ContentCard eyebrow="02 · Act" title="Tools that move work">Research the web, work across connected apps, run focused computer tasks, update records, and create the documents or files the outcome requires.</ContentCard>
          <ContentCard eyebrow="03 · Coordinate" title="Long work with a place to go">Turn a multi-step request into tasks, reminders, recurring work, or a follow-up that can continue after the current conversation ends.</ContentCard>
          <ContentCard eyebrow="04 · Create" title="Outputs people can use">Generate briefs, PDFs, spreadsheets, images, code, summaries, and structured handoffs instead of leaving the result trapped in chat.</ContentCard>
          <ContentCard eyebrow="05 · Review" title="Boundaries before consequences">When an action can affect another person, a system, or a commitment, Chusky can pause with the exact request ready for review.</ContentCard>
          <ContentCard eyebrow="06 · Continue" title="Work that remains recoverable">Follow the state of a run, reopen the thread, inspect artifacts, and continue from the last known step instead of starting over.</ContentCard>
        </div>
      </ContentSection>
      <ContentSection eyebrow="Made for the whole workday" title="Chat is the entry point, not the limit." description="Use Chusky where the work starts, then move naturally between research, files, apps, meetings, calls, and follow-through. The agent keeps the objective connected while the surface changes.">
        <div className="grid gap-3 sm:grid-cols-3"><ContentCard title="Research and writing">Find the relevant information, shape it into a useful brief, and create a deliverable with the right level of detail.</ContentCard><ContentCard title="Operations and admin">Update the places where work is tracked, coordinate the next step, and keep the human decision points clear.</ContentCard><ContentCard title="Meetings and calls">Join supported conversations, handle approved calls, and turn what happened into private follow-through.</ContentCard></div>
      </ContentSection>
      <CtaSection />
    </ContentPage>
  );
}

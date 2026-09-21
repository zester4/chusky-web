import type { Metadata } from "next";
import { HowItWorksDetails } from "@/components/landing/how-it-works-details";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "How it works | Chusky AI Agent",
  description: "See how Chusky moves from an authenticated request to connected work, human review, durable execution, and a result you can recover.",
};

export default function HowItWorksPage() {
  return (
    <ContentPage
        eyebrow="How it works"
        title={<>Ask once.<br /><span className="text-muted-foreground">Ship more.</span></>}
        description="Chusky turns a natural-language request into connected, visible work across your apps and the tools it needs to get the job done."
        artwork={{ src: "/chusky/chusky-workflow.png", alt: "Chusky moving a request through a connected workflow" }}
      >
      <ContentSection eyebrow="The handoff" title="You describe the outcome. Chusky carries the middle." description="A good agent does not make you translate a goal into a dozen tool-specific instructions. It keeps the objective in view while the work moves through the steps required to complete it.">
        <div className="grid gap-px bg-foreground/10 sm:grid-cols-3"><ContentCard eyebrow="01 · Brief" title="Start with intent">Give the result you want, the context that matters, and the constraints the agent must respect.</ContentCard><ContentCard eyebrow="02 · Work" title="See the path">Chusky gathers context, uses the capabilities available to the workspace, and reports progress as the run moves.</ContentCard><ContentCard eyebrow="03 · Result" title="Keep the outcome">Receive the answer, file, update, reminder, or next step—and keep enough state to return to it.</ContentCard></div>
      </ContentSection>
      <HowItWorksDetails />
      <ContentSection eyebrow="The result" title="Less coordination overhead. More finished work." description="The point is not to hide complexity from you. It is to put the complexity in the right place: inside a visible, reviewable workflow that can keep moving when the task is bigger than a single response.">
        <div className="grid gap-3 sm:grid-cols-3"><ContentCard title="A clear next step">Every run should leave you knowing what happened and what can happen next.</ContentCard><ContentCard title="A useful artifact">The work should end in something you can send, edit, approve, or use—not only a transcript.</ContentCard><ContentCard title="A path back in">When you return later, the conversation and its work state should still make sense.</ContentCard></div>
      </ContentSection>
    </ContentPage>
  );
}

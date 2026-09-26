import type { Metadata } from "next";
import { HowItWorksDetails } from "@/components/landing/how-it-works-details";
import { ContentPage } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "How it works | Chusky AI Agent",
  description: "Follow a Chusky run from request and tool selection through approval, result delivery, and recovery.",
};

export default function HowItWorksPage() {
  return (
    <ContentPage
        eyebrow="How it works"
        title={<>From request<br /><span className="text-muted-foreground">to recorded result.</span></>}
        description="A Chusky run ties a request to an account, available capabilities, and a lifecycle you can inspect. The exact path depends on the task and enabled providers."
        artwork={{ src: "/chusky/chusky-workflow.png", alt: "Chusky moving a request through a connected workflow" }}
      >
      <HowItWorksDetails />
    </ContentPage>
  );
}

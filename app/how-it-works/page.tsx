import type { Metadata } from "next";
import { HowItWorksDetails } from "@/components/landing/how-it-works-details";
import { ContentPage } from "@/components/landing/content-page";
import { ControlSection, MissionLifecycleSection, TaskOutcomeLoopSection } from "@/components/landing/product-stories";

export const metadata: Metadata = {
  title: "How it works | Chusky",
  description: "Talk to Chusky, give it a task, and get the outcome. See how one virtual worker handles calls, meetings, tools, longer missions, approvals, and proof.",
};

export default function HowItWorksPage() {
  return (
    <ContentPage
        eyebrow="How it works"
        title={<>Give the task.<br /><span>Get the outcome.</span></>}
        description="Start with a message, call, meeting, or event. Chusky understands the goal, works through the connected steps, and brings back the result—with your approval on anything that matters."

      >
      <TaskOutcomeLoopSection />
      <HowItWorksDetails />
      <MissionLifecycleSection />
      <ControlSection />
    </ContentPage>
  );
}

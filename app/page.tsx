import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { AgentLoopSection } from "@/components/landing/agent-loop-section";
import { BrowserSection } from "@/components/landing/browser-section";
import { WorkExamplesSection } from "@/components/landing/work-examples-section";
import { ChannelsSection, MeetingsAndCallsSection } from "@/components/landing/channels-and-business-section";
import { FooterSection } from "@/components/landing/footer-section";
import { LandingMotion } from "@/components/landing/landing-motion";
import { AiExplainedSection } from "@/components/landing/ai-explained-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";

export default function Home() {
  return (
    <main data-landing-motion className="landing-motion-root relative min-h-screen overflow-x-hidden noise-overlay">
      <LandingMotion />
      <Navigation />
      <HeroSection />
      <AgentLoopSection />
      <AiExplainedSection />
      <IntegrationsSection />
      <BrowserSection />
      <WorkExamplesSection />
      <ChannelsSection />
      <MeetingsAndCallsSection />
      <FooterSection />
    </main>
  );
}

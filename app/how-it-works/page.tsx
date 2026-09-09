import type { Metadata } from "next";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "How it works | Chusky AI Agent",
  description: "See how Chusky understands intent, connects the right tools, and turns requests into completed work.",
};

export default function HowItWorksPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="How it works"
        title={<>Ask once.<br /><span className="text-muted-foreground">Ship more.</span></>}
        description="Chusky turns a natural-language request into connected, visible work across your apps and the tools it needs to get the job done."
        artwork={{ src: "/chusky/chusky-workflow.png", alt: "Chusky moving a request through a connected workflow" }}
      />
      <HowItWorksSection />
      <InfrastructureSection />
    </ProductPageShell>
  );
}

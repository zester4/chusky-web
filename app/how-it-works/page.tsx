import type { Metadata } from "next";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "How it works | Chusky AI Agent",
  description: "See how Chusky connects your tools, understands intent, and executes work from Telegram or a linked terminal.",
};

export default function HowItWorksPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="How it works"
        title={<>Ask once.<br /><span className="text-muted-foreground">Ship more.</span></>}
        description="Chusky turns a natural-language request into connected, observable work across your apps, remote workspace, and terminal."
      />
      <HowItWorksSection />
      <InfrastructureSection />
    </ProductPageShell>
  );
}

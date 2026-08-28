import type { Metadata } from "next";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { CtaSection } from "@/components/landing/cta-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Features | Chusky AI Agent",
  description: "Connect apps, discover tools, run commands, and automate work with Chusky from Telegram.",
};

export default function FeaturesPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="What Chusky can do"
        title={<>One agent.<br /><span className="text-muted-foreground">1,000+ tools.</span></>}
        description="Chusky brings your apps, shell commands, web browsing, and real-time workflows into one production-ready Telegram AI agent."
      />
      <FeaturesSection />
      <IntegrationsSection />
      <CtaSection />
    </ProductPageShell>
  );
}

import type { Metadata } from "next";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { CtaSection } from "@/components/landing/cta-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Features | Chusky AI Agent",
  description: "Connect apps, discover the right tools, create files, and automate work with Chusky.",
};

export default function FeaturesPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="What Chusky can do"
        title={<>One agent.<br /><span className="text-muted-foreground">1,000+ tools.</span></>}
        description="Chusky brings your apps, web research, files, and workflows together in one capable AI agent."
        artwork={{ src: "/chusky/chusky-connected-tools.png", alt: "Chusky connecting work across apps and tools" }}
      />
      <FeaturesSection />
      <IntegrationsSection />
      <CtaSection />
    </ProductPageShell>
  );
}

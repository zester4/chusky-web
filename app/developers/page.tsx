import type { Metadata } from "next";
import { DevelopersSection } from "@/components/landing/developers-section";
import { SecuritySection } from "@/components/landing/security-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Developers | Chusky AI Agent",
  description: "Build reliable agent experiences with Chusky, connected tools, flexible intelligence, and clear controls.",
};

export default function DevelopersPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="For developers"
        title={<>Build the agent<br /><span className="text-muted-foreground">your stack needs.</span></>}
        description="Bring Chusky into your product, tools, and workflows. Build experiences that understand intent, use the right capabilities, and keep work moving."
        artwork={{ src: "/chusky/chusky-developer.png", alt: "Chusky working with developer tools and connected infrastructure" }}
      />
      <DevelopersSection />
      <SecuritySection />
    </ProductPageShell>
  );
}

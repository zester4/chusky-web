import type { Metadata } from "next";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Pricing | Chusky AI Agent",
  description: "Start free with Chusky and scale your AI agent access as your workflows grow.",
};

export default function PricingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Pricing"
        title={<>Start free.<br /><span className="text-muted-foreground">Scale naturally.</span></>}
        description="Choose the level of access that fits your workflow. Start experimenting today, then add capacity as Chusky becomes part of your team."
      />
      <PricingSection />
    </ProductPageShell>
  );
}

import type { Metadata } from "next";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Plans and access | Chusky",
  description: "See where Chusky publishes current account access and usage information.",
};

export default function PricingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Plans and access"
        title={<>Know what is<br /><span className="text-muted-foreground">actually available.</span></>}
        description="Chusky does not publish plan prices or limits on this site. Sign in to see the usage and capabilities available to your workspace."
        artwork={{ src: "/chusky/chusky-wave.png", alt: "Chusky mascot waving hello" }}
      />
      <PricingSection />
    </ProductPageShell>
  );
}

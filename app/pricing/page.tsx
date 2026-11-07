import type { Metadata } from "next";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Pricing | Chusky",
  description: "Choose the amount of work you want Chusky to carry, with plans for every stage of growth.",
};

export default function PricingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Plans"
        title={<>Choose the amount of work you want Chusky to carry.</>}
        description="Compare monthly plans for agent actions, active missions, meetings, voice, and team access."

      />
      <PricingSection />
    </ProductPageShell>
  );
}

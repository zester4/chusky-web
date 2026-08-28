import type { Metadata } from "next";
import { DevelopersSection } from "@/components/landing/developers-section";
import { SecuritySection } from "@/components/landing/security-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Developers | Chusky AI Agent",
  description: "Build with Chusky, Composio managed auth, remote workspaces, triggers, and any OpenRouter model.",
};

export default function DevelopersPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="For developers"
        title={<>Build the agent<br /><span className="text-muted-foreground">your stack needs.</span></>}
        description="Use Chusky as a Telegram interface for your tools, workflows, and code. Discover capabilities by intent and keep sessions persistent across devices."
      />
      <DevelopersSection />
      <SecuritySection />
    </ProductPageShell>
  );
}

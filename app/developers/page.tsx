import type { Metadata } from "next";
import { DeveloperPlatformSection } from "@/components/landing/developer-platform-section";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Developers | Chusky AI Agent",
  description: "Build reliable agent experiences with Chusky: durable runs, connected tools, human approvals, files, tasks, and clear controls.",
};

export default function DevelopersPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="For developers"
        title={<>Build the agent<br /><span className="text-muted-foreground">your stack needs.</span></>}
        description="Integrate Chusky’s agent runtime behind your product with typed APIs, stable caller identity, run events, and scoped tool access."
        artwork={{ src: "/chusky/chusky-developer.png", alt: "Chusky working with developer tools and connected infrastructure" }}
      />
      <DeveloperPlatformSection />
    </ProductPageShell>
  );
}

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
        description="Bring 6,000+ tools, ongoing agent work, and human approvals behind your product. Use the API or SDK, embed chat on your business site, or connect another agent through MCP and A2A."

      />
      <DeveloperPlatformSection />
    </ProductPageShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageCircle, Wrench } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Contact Chusky",
  description: "Find the right path for product support, technical questions, and collaboration with Chusky.",
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Contact" title={<>Bring us the<br /><span className="text-muted-foreground">real question.</span></>} description="Whether you are trying to recover a run, connect a workspace, or understand how Chusky fits your product, start with the path that matches the work you need to do." artwork={{ src: "/chusky/chusky-wave.png", alt: "Chusky welcoming a new conversation" }}>
      <ContentSection eyebrow="Choose a path" title="Help should begin with context, not a maze." description="The fastest answer usually comes from the place where your work already lives."
        className="bg-foreground/[0.02]">
        <div className="grid gap-3 md:grid-cols-3"><ContentCard title="Product support"><LifeBuoy className="mb-4 h-5 w-5 text-chusky-amber" /><p>Sign in to your workspace so support questions can include the relevant run, channel, approval, or delivery state.</p><Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open your workspace <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Technical questions"><Wrench className="mb-4 h-5 w-5 text-chusky-amber" /><p>Read the API and MCP guides, then use the project repositories when you are working through an integration detail.</p><Link href="/docs" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Read the docs <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Ideas and collaboration"><MessageCircle className="mb-4 h-5 w-5 text-chusky-amber" /><p>Tell us what you are trying to make and where the current workflow breaks down. Concrete examples are more useful than a generic pitch.</p><Link href="https://github.com/zester4/chusky-web" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open the project <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard></div>
      </ContentSection>
    </ContentPage>
  );
}

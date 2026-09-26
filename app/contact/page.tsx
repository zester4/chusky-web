import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageCircle, Wrench } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Contact Chusky",
  description: "Choose the available route for workspace help, technical guidance, or public project feedback.",
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Contact and support" title={<>Choose the right<br /><span className="text-muted-foreground">support path.</span></>} description="This page has no direct-contact form. Use the relevant workspace or public project route below, and keep private account information out of public issues." artwork={{ src: "/chusky/chusky-wave.png", alt: "Chusky welcoming a new conversation" }}>
      <ContentSection eyebrow="Available routes" title="Start with the context that belongs to the question."
        className="bg-foreground/[0.02]">
        <div className="grid gap-3 md:grid-cols-3"><ContentCard title="Workspace questions"><LifeBuoy className="mb-4 h-5 w-5 text-chusky-amber" /><p>Sign in to inspect the run, approval, channel, or delivery state before seeking help.</p><Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open your workspace <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Integration questions"><Wrench className="mb-4 h-5 w-5 text-chusky-amber" /><p>Use the current API, SDK, and MCP documentation for setup and behavior.</p><Link href="/docs" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Read the docs <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Public project feedback"><MessageCircle className="mb-4 h-5 w-5 text-chusky-amber" /><p>Use the public web repository to review the project or report an issue. Never include credentials or private workspace data.</p><Link href="https://github.com/zester4/chusky-web" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open the web repository <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard></div>
      </ContentSection>
    </ContentPage>
  );
}

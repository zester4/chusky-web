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
    <ContentPage eyebrow="Contact and support" title={<>Choose the right<br /><span className="text-muted-foreground">support path.</span></>} description="This page has no direct-contact form. Use the relevant workspace or public project route below, and keep private account information out of public issues.">
      <ContentSection eyebrow="Available routes" title="Start with the context that belongs to the question."
        className="bg-foreground/[0.02]">
        <div className="grid gap-3 md:grid-cols-3"><ContentCard title="Workspace questions"><LifeBuoy className="mb-4 h-5 w-5 text-chusky-amber" /><p>Sign in to inspect the run, approval, channel, or delivery state before seeking help.</p><Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open your workspace <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Integration questions"><Wrench className="mb-4 h-5 w-5 text-chusky-amber" /><p>Use the current API, SDK, and MCP documentation for setup and behavior.</p><Link href="/docs" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Read the docs <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard><ContentCard title="Public project feedback"><MessageCircle className="mb-4 h-5 w-5 text-chusky-amber" /><p>Use the public web repository to review the project or report an issue. Never include credentials or private workspace data.</p><Link href="https://github.com/zester4/chusky-web" className="mt-5 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4">Open the web repository <ArrowRight className="h-3.5 w-3.5" /></Link></ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="Help us find the right thread" title="Bring the job and what happened." description="Useful context makes a question easier to answer. Keep private details in the workspace and use public project channels for issues that can be described without account data."><div className="grid sm:grid-cols-2"><ContentCard title="For a meeting or call.">Note the meeting platform or call direction, what Chusky was asked to do, and whether the issue happened during the conversation or the follow-up. Check the saved outcome in your workspace.</ContentCard><ContentCard title="For ongoing work.">Find the mission or run, its latest progress, and any approval or connection it is waiting for. If the question involves Elena, check the schedule and the watches you enabled.</ContentCard></div></ContentSection>
      <ContentSection eyebrow="Before the first task" title="Get to know the work Chusky can do." description="If you are deciding where to start, explore the workflows before configuring more tools. Meetings, business calls, connected apps, and background projects each have a different setup path."><div className="flex flex-wrap gap-6"><Link href="/features" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">Explore capabilities <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">See how it works <ArrowRight size={16} aria-hidden="true" /></Link></div></ContentSection>
    </ContentPage>
  );
}

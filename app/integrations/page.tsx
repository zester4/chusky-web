import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Workflow } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";
import { IntegrationsSection } from "@/components/landing/integrations-section";

export const metadata: Metadata = {
  title: "Integrations | Chusky AI Agent",
  description: "See example connected apps and understand how Chusky scopes provider actions to your account.",
};

export default function IntegrationsPage() {
  return (
    <ContentPage eyebrow="Connected app access" title={<>Access by connection,<br /><span className="text-muted-foreground">not assumption.</span></>} description="Chusky routes actions through the app accounts you connect. Available tools and permissions come from the provider and your workspace configuration." artwork={{ src: "/chusky/chusky-connected-tools.png", alt: "Chusky coordinating work across connected applications" }}>
      <IntegrationsSection />
      <ContentSection eyebrow="How connections behave" title="Access follows the work, not the other way around." description="A connection gives Chusky a way to work in an app; it does not give every conversation unlimited access. The workspace owner decides what is available, and consequential actions remain visible."
        className="bg-foreground/[0.02]">
        <div className="grid gap-px bg-foreground/10 sm:grid-cols-3">
          <ContentCard eyebrow="01" title="Connect once"><p>Authorize the app you want Chusky to work with and keep that connection attached to the right workspace.</p></ContentCard>
          <ContentCard eyebrow="02" title="Give context"><p>Describe the outcome, the relevant project, and any limits. Chusky uses that context to choose the next useful step.</p></ContentCard>
          <ContentCard eyebrow="03" title="Stay in control"><p>Review sensitive actions, inspect the result, and disconnect access whenever the work no longer needs it.</p></ContentCard>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-600" /> Workspace-scoped access</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Reviewable actions</span><span className="inline-flex items-center gap-2"><Workflow className="h-4 w-4 text-emerald-600" /> Context carried forward</span></div>
      </ContentSection>
      <ContentSection eyebrow="Bring your stack" title="Start with one workflow, then expand naturally." description="You do not need to reorganize your tools around Chusky. Start with a task that crosses two or three apps, prove the handoff, and add more capability as the agent earns its place in the workflow.">
        <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Connect your first workspace <ArrowRight className="h-4 w-4" /></Link>
      </ContentSection>
      <ContentSection eyebrow="Beyond connected apps" title="One integration layer, several ways to work." description="Connected business apps are only one part of the system. Chusky can combine them with its native tools, research capabilities, files, MCP servers, and the channels where people already communicate.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ContentCard eyebrow="Native tools" title="Built-in operations">Tool discovery, memory, files, artifacts, tasks, approvals, and run inspection are exposed through Chusky’s own controlled tool surface.</ContentCard>
          <ContentCard eyebrow="Research" title="Current information">Web and provider research can inform a task, while the agent keeps research evidence distinct from a confirmed external action.</ContentCard>
          <ContentCard eyebrow="MCP" title="Bring another host">MCP lets a compatible client discover Chusky capabilities through a remote endpoint with a project scope and stable caller identity.</ContentCard>
          <ContentCard eyebrow="Channels" title="Meet people where they are">Web, Telegram, Slack, WhatsApp, iMessage, and CLI entry points can share the right private context without collapsing every conversation into one audience.</ContentCard>
        </div>
      </ContentSection>
      <ContentSection eyebrow="When something changes" title="Connections are inspectable and recoverable." description="Tokens expire, providers change schemas, and accounts are sometimes disconnected. A good integration experience should explain what is missing, preserve the original work, and let you reconnect the same account instead of silently creating a duplicate.">
        <div className="grid gap-3 md:grid-cols-3">
          <ContentCard title="Before execution">Chusky checks that the app, account, action, and required arguments are available before claiming it can proceed.</ContentCard>
          <ContentCard title="During execution">Provider errors, approvals, missing connections, and uncertain transport states remain visible as distinct run states.</ContentCard>
          <ContentCard title="After recovery">Resume the existing run or mission after reconnecting. Use the provider receipt and a fresh readback to verify a write.</ContentCard>
        </div>
      </ContentSection>
    </ContentPage>
  );
}

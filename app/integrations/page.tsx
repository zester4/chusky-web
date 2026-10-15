import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Workflow } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { TaskOutcomeLoopSection, WorkChannelsSection } from "@/components/landing/product-stories";
import styles from "@/components/landing/product-page.module.css";

export const metadata: Metadata = {
  title: "Integrations | Chusky",
  description: "Connect Chusky to 6,000+ tools and let one virtual worker carry tasks across communication, calls, meetings, CRM, productivity, payments, MCP, and A2A.",
};

export default function IntegrationsPage() {
  return (
    <ContentPage eyebrow="Integrations" title={<>Your tools.<br /><span>One connected worker.</span></>} description="Connect Chusky to the tools you already run on, with thousands of apps through one connection. Give the task once. Let the work move across the right channels, meetings, and apps.">
      <IntegrationsSection />
      <ContentSection eyebrow="One task, several tools" title="The handoff should not become your job." description="A conversation often needs more than one app. Chusky can carry the same task across the connected steps, keeping the outcome and the controls together.">
        <div className={styles.featureList}>{[
          ["01 / Conversation", "Start with the customer.", "A call, message, website chat, or meeting gives Chusky the request and the context behind it."],
          ["02 / Context", "Bring in what the work needs.", "Chusky can read the relevant email, calendar event, account note, file, or customer record through the connections you allow."],
          ["03 / Action", "Complete the next useful step.", "It can prepare the reply, book time, save a document, update HubSpot or Salesforce, or pause for approval before a sensitive action."],
          ["04 / Outcome", "Return with proof.", "The result comes back with the available provider receipt, created file, updated record, or clear explanation of what still needs attention."],
        ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </ContentSection>
      <WorkChannelsSection />
      <TaskOutcomeLoopSection />
      <ContentSection eyebrow="How connections behave" title="Access follows the work, not the other way around." description="A connection gives Chusky a way to work in an app; it does not give every conversation unlimited access. The workspace owner decides what is available, and consequential actions remain visible."
        className="bg-foreground/[0.02]">
        <div className="grid gap-px bg-foreground/10 sm:grid-cols-3">
          <ContentCard eyebrow="01" title="Connect once"><p>Authorize the app you want Chusky to work with and keep that connection attached to the right workspace.</p></ContentCard>
          <ContentCard eyebrow="02" title="Give context"><p>Describe the outcome, the relevant project, and any limits. Chusky uses that context to choose the next useful step.</p></ContentCard>
          <ContentCard eyebrow="03" title="Stay in control"><p>Review sensitive actions, inspect the result, and disconnect access whenever the work no longer needs it.</p></ContentCard>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-foreground" /> Workspace-scoped access</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-foreground" /> Reviewable actions</span><span className="inline-flex items-center gap-2"><Workflow className="h-4 w-4 text-foreground" /> Context carried forward</span></div>
      </ContentSection>
      <ContentSection eyebrow="Bring your stack" title="Start with one workflow, then expand naturally." description="You do not need to reorganize your tools around Chusky. Start with a task that crosses two or three apps, prove the handoff, and add more capability as Chusky earns its place in the workflow.">
        <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Connect your first workspace <ArrowRight className="h-4 w-4" /></Link>
      </ContentSection>
      <ContentSection eyebrow="Beyond connected apps" title="One integration layer, several ways to work." description="Connected business apps are only one part of the system. Chusky can combine them with its own controlled tools, research, files, MCP servers, A2A, and the channels where people already communicate.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ContentCard eyebrow="Native tools" title="Built-in operations">Tool discovery, memory, files, artifacts, tasks, approvals, and run inspection are exposed through Chusky’s own controlled tool surface.</ContentCard>
          <ContentCard eyebrow="Research" title="Current information">Web and provider research can inform a task, while Chusky keeps research evidence distinct from a confirmed external action.</ContentCard>
          <ContentCard eyebrow="MCP" title="Bring another host">MCP lets a compatible client discover Chusky capabilities through a remote endpoint with a project scope and stable caller identity.</ContentCard>
          <ContentCard eyebrow="A2A" title="Let another system hand off the work">Compatible systems can reach Chusky through A2A alongside MCP. Keep the caller identity, tools, and allowed actions connected to the request.</ContentCard>
        </div>
      </ContentSection>
      <ContentSection eyebrow="Start when something changes" title="The event can be the invitation." description="A new email, calendar update, HubSpot deal change, or Slack event can start work without another message from you. Connect the source and decide what the next step should be."><div className="grid sm:grid-cols-2"><ContentCard title="A new customer message.">Bring in the relevant context, prepare a reply, and wait for your review when the next send needs approval.</ContentCard><ContentCard title="A deal moves forward.">Keep the customer record and next task together. Prepare the follow-up that belongs to the new stage.</ContentCard></div></ContentSection>
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

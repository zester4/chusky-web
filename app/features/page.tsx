import type { Metadata } from "next";
import Link from "next/link";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Features | Chusky AI Agent",
  description: "Explore Chusky agent capabilities, including connected apps, durable work, approvals, and artifact creation.",
};

export default function FeaturesPage() {
  return (
    <ContentPage
        eyebrow="What Chusky can do"
        title={<>Capabilities for<br /><span className="text-muted-foreground">work beyond chat.</span></>}
        description="Chusky combines an agent loop with connected app actions, native tools, files, and durable workflows. What is available depends on your account, connected providers, and deployment configuration."
        artwork={{ src: "/chusky/chusky-connected-tools.png", alt: "Chusky connecting work across apps and tools" }}
      >
      <ContentSection eyebrow="What the agent can do" title="Tools and state that work together." description="These are product capabilities, not a promise that every provider is enabled in every workspace.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ContentCard eyebrow="Connected apps" title="Use the actions your account authorizes">Discover and call available provider actions through Composio. The connected account, selected toolkit, permissions, and action schema determine what can run.</ContentCard>
          <ContentCard eyebrow="Research and tools" title="Gather information, then act">Use web research and native capabilities alongside connected-app actions. Research results are inputs to review—not authority to make a consequential change.</ContentCard>
          <ContentCard eyebrow="Files and artifacts" title="Create, verify, and retrieve">Supported workflows can produce reports, PDFs, DOCX, PPTX, XLSX, images, and other files, then register artifacts for later retrieval.</ContentCard>
          <ContentCard eyebrow="Durable workflows" title="Keep work beyond one response">Missions, tasks, reminders, recurring jobs, triggers, and resumable workflows retain state. Production continuation requires Redis and QStash configuration.</ContentCard>
          <ContentCard eyebrow="Approval and control" title="Review actions at the boundary">Approval policy can stop consequential external actions until the owner approves the exact request. Approval is action-specific and can expire.</ContentCard>
          <ContentCard eyebrow="Developer access" title="Integrate through supported interfaces">Use the versioned REST API and TypeScript SDK, or connect external agents through A2A and MCP with project scopes and stable caller identity.</ContentCard>
        </div>
      </ContentSection>
      <ContentSection eyebrow="Optional capabilities" title="Some work needs an enabled provider." description="Computer/browser sessions, meetings, phone calls, and background continuation depend on provider setup and workspace permissions. See the integration and setup guides before relying on a specific workflow.">
        <div className="flex flex-wrap gap-4 text-sm"><Link href="/integrations" className="underline underline-offset-4">Connected apps</Link><Link href="/how-it-works" className="underline underline-offset-4">How runs work</Link><Link href="/docs" className="underline underline-offset-4">Configuration docs</Link></div>
      </ContentSection>
      <ContentSection eyebrow="How the pieces fit" title="An agent that can move from understanding to follow-through." description="Chusky is most useful when a request crosses several kinds of work. It can interpret the outcome, gather context, use an approved capability, and return a result that remains addressable after the first response.">
        <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          <ContentCard eyebrow="01 · Understand" title="Start with the outcome">The agent works from the goal you describe, not only from a keyword. It can ask for missing information when the target, account, or intended result is unclear.</ContentCard>
          <ContentCard eyebrow="02 · Gather" title="Use the right context">Relevant conversation, saved memory, files, live research, and connected-app results are kept separate by account and scope.</ContentCard>
          <ContentCard eyebrow="03 · Act" title="Take the next useful step">Native tools, Composio actions, browser capabilities, and artifact builders each have their own schemas, permissions, and evidence requirements.</ContentCard>
          <ContentCard eyebrow="04 · Close" title="Leave an honest result">The agent reports what happened, what is waiting, and what can be resumed. A model saying “done” is not treated as proof that a provider changed.</ContentCard>
        </div>
      </ContentSection>
      <ContentSection eyebrow="A practical boundary" title="Capability is not the same as permission." description="Chusky can know how to perform an action without being allowed to perform it in your workspace. Connections, project scopes, account ownership, approval policy, provider state, and fresh readbacks all matter.">
        <div className="grid gap-3 md:grid-cols-3">
          <ContentCard title="Read">Research, inspect, compare, summarize, and retrieve information that the connected account exposes.</ContentCard>
          <ContentCard title="Prepare">Draft replies, create files, plan a mission, or stage a change without making an irreversible external commitment.</ContentCard>
          <ContentCard title="Commit">Send, publish, delete, spend, change permissions, or call a third party only when the configured policy and evidence allow it.</ContentCard>
        </div>
      </ContentSection>
    </ContentPage>
  );
}

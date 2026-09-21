import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, KeyRound, ShieldCheck } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = { title: "Security | Chusky", description: "Security principles for Chusky workspaces, agent actions, credentials, and connected services." };

export default function SecurityPage() {
  return (
    <ContentPage eyebrow="Security" title={<>Boundaries you can<br /><span className="text-muted-foreground">reason about.</span></>} description="Chusky is designed for work that crosses conversations, tools, files, and real-world actions. Security is the set of boundaries that keeps those transitions understandable." artwork={{ src: "/chusky/chusky-poster.png", alt: "Chusky working within clear boundaries" }}>
      <ContentSection eyebrow="Security model" title="Identity, capability, context, and approval meet at the run." description="A request is not a blank cheque. The workspace, end-user identity, enabled capabilities, and approval state all shape what the agent may do.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ContentCard eyebrow="01" title="Identity"><KeyRound className="mb-3 h-5 w-5 text-chusky-amber" /><p>Every run is tied to a project and an end-user identity so private work stays scoped.</p></ContentCard><ContentCard eyebrow="02" title="Capability"><ShieldCheck className="mb-3 h-5 w-5 text-chusky-amber" /><p>Connected apps and native actions are made available intentionally, not assumed.</p></ContentCard><ContentCard eyebrow="03" title="Context"><Check className="mb-3 h-5 w-5 text-chusky-amber" /><p>Files, notes, threads, and memories belong to the workspace that owns them.</p></ContentCard><ContentCard eyebrow="04" title="Approval"><ShieldCheck className="mb-3 h-5 w-5 text-chusky-amber" /><p>Consequential actions can pause for an exact, expiring decision before execution.</p></ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="Practical guidance" title="Keep the trusted boundary where you control it." description="Use server-side routes for project keys, derive end-user identity from your own session, and show users the state of work instead of hiding it behind a spinner.">
        <div className="grid gap-3 sm:grid-cols-2"><div className="border border-foreground/10 p-5 sm:p-7"><h3 className="text-sm font-medium">For workspace owners</h3><ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground"><li>Review connected apps and channels regularly.</li><li>Use approvals for actions that affect other people or systems.</li><li>Remove devices and connections when access is no longer needed.</li></ul></div><div className="border border-foreground/10 p-5 sm:p-7"><h3 className="text-sm font-medium">For developers</h3><ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground"><li>Keep keys out of browser code and public logs.</li><li>Persist thread and run IDs in your own trusted backend.</li><li>Handle disconnected streams as recoverable state.</li></ul></div></div>
        <Link href="/docs" className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Read the security and integration docs <ArrowRight className="h-4 w-4" /></Link>
      </ContentSection>
    </ContentPage>
  );
}

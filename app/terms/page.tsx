import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = { title: "Terms | Chusky", description: "The rules for using Chusky responsibly and safely." };

export default function TermsPage() {
  return (
    <ContentPage eyebrow="Terms of use" title={<>Use the agent<br /><span className="text-muted-foreground">with judgment.</span></>} description="Chusky helps people and products move work forward. These plain-language principles describe the responsibilities that come with using an agent that can read, create, and act.">
      <ContentSection eyebrow="The basics" title="You are responsible for the work you authorize." description="Only use Chusky with information and accounts you are allowed to use. Make sure people affected by an automated action have the notice, consent, and review required for your context.">
        <div className="grid gap-3 sm:grid-cols-3"><div className="border border-foreground/10 p-5"><h3 className="text-sm font-medium">Use lawful inputs</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Do not use Chusky to access data, systems, or accounts without permission.</p></div><div className="border border-foreground/10 p-5"><h3 className="text-sm font-medium">Review important actions</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Treat agent output as assistance. Check consequential messages, decisions, documents, and changes before they leave your control.</p></div><div className="border border-foreground/10 p-5"><h3 className="text-sm font-medium">Protect your keys</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Keep account credentials, project keys, and connected-service access out of public repositories and browser bundles.</p></div></div>
      </ContentSection>
      <ContentSection eyebrow="Agent boundaries" title="Automation does not remove accountability." description="Chusky may make mistakes, misunderstand a request, encounter changing external data, or be unable to complete a provider action. You are responsible for checking outputs and deciding when an action is appropriate.">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground"><p>Do not rely on Chusky as a substitute for professional advice, emergency response, safety-critical control, or a person with the authority to make a regulated decision.</p><p>Do not attempt to bypass approval boundaries, impersonate another person, interfere with a service, or use generated content to mislead people about its origin.</p><p>We may limit or suspend access when use creates a security, safety, legal, or reliability risk to other users or the service.</p></div>
      </ContentSection>
      <ContentSection eyebrow="Changes and support" title="The product will keep evolving." description="Capabilities, providers, limits, and documentation can change as Chusky develops. We will aim to keep changes understandable and preserve the user controls that make agent work reviewable.">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">If a workflow matters, keep the relevant identifiers, approvals, and outputs in your own systems as well. That makes your product resilient when an external service changes.</p>
      </ContentSection>
      <section className="py-12"><div className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground sm:px-6 lg:px-12">Last reviewed: September 2026. This summary is informational and does not replace the applicable agreement.</div></section>
    </ContentPage>
  );
}

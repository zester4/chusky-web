import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, Check, Eye, Keyboard, MessageCircle, Volume2, type LucideIcon } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";

export const metadata: Metadata = {
  title: "Accessibility | Chusky",
  description: "How Chusky approaches accessible interaction, readable content, keyboard use, reduced motion, and assistive technology.",
};

const commitments: Array<[LucideIcon, string, string]> = [
  [Keyboard, "Keyboard-first interaction", "Core navigation, forms, dialogs, controls, and recovery actions should be reachable without a mouse. Focus states are kept visible so a person can tell where they are."],
  [Eye, "Readable visual language", "The interface uses semantic headings, meaningful labels, restrained decoration, and contrast-conscious surfaces. Status should not be communicated by color alone."],
  [Volume2, "Content that can be heard", "Progress, approvals, failures, and completion states are written as text and exposed through appropriate labels so assistive technology can follow the same lifecycle."],
  [Accessibility, "Reduced motion", "Decorative reveals should not be required to understand or complete a task. The interface respects reduced-motion preferences and keeps important feedback available without animation."],
];

export default function AccessibilityPage() {
  return <ContentPage eyebrow="Accessibility" title={<>A product people can<br /><span className="text-muted-foreground">use in their own way.</span></>} description="Accessibility is part of making an agent understandable: people should be able to read what it is doing, reach the next action, recover from an error, and review an approval with the tools they already use." artwork={{ src: "/chusky/chusky-wave.png", alt: "Chusky mascot on a calm light background" }}>
    <ContentSection eyebrow="Our approach" title="The agent’s state should never be hidden behind a visual effect." description="Chusky has long-running work, tool activity, approvals, and provider failures. Each of those states needs a text equivalent and a clear next step, whether someone is using a keyboard, screen reader, magnification, voice control, or a small touchscreen.">
      <div className="grid gap-3 sm:grid-cols-2">{commitments.map(([Icon, title, description]) => { const IconComponent = Icon; return <ContentCard key={title as string} title={title as string}><IconComponent className="mb-5 h-5 w-5 text-chusky-amber" strokeWidth={1.5} />{description}</ContentCard>; })}</div>
    </ContentSection>
    <ContentSection eyebrow="Agent activity" title="Progress, waiting, failure, and completion are different states." description="We aim to make agent activity concise enough to scan and detailed enough to act on. A run should explain whether it is working, waiting for approval, missing a connection, retryable, cancelled, or complete. Raw provider payloads and secrets should stay out of the user-facing view.">
      <div className="grid gap-3 md:grid-cols-3"><ContentCard title="When work is running"><Check className="mb-4 h-5 w-5 text-emerald-600" />Show a plain-language progress label and preserve the run identifier for reconnecting.</ContentCard><ContentCard title="When a decision is needed"><MessageCircle className="mb-4 h-5 w-5 text-chusky-amber" />Name the action, target, and consequence before asking someone to approve it.</ContentCard><ContentCard title="When something fails"><Accessibility className="mb-4 h-5 w-5 text-chusky-amber" />Explain what can be retried, what was not confirmed, and how to get back to the saved work.</ContentCard></div>
    </ContentSection>
    <ContentSection eyebrow="Known limits and feedback" title="Accessibility is an ongoing product responsibility." description="Some provider-hosted consent screens, embedded documents, generated files, and third-party browser surfaces are outside the control of the Chusky web interface. We still want reports about barriers so we can improve our surface and document the boundary honestly.">
      <div className="flex flex-wrap items-center gap-4 text-sm"><Link href="/contact" className="underline underline-offset-4">Report an accessibility issue</Link><Link href="/how-it-works" className="underline underline-offset-4">Understand the run lifecycle</Link><Link href="/docs" className="underline underline-offset-4">Read the documentation</Link></div>
    </ContentSection>
  </ContentPage>;
}

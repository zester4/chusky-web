import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ContentPage, ContentSection } from "@/components/landing/content-page";
import styles from "@/components/landing/product-page.module.css";

export const metadata: Metadata = { title: "About | Chusky AI Agent", description: "Why we are building Chusky: useful agent work with context, capability, and human control." };

export default function AboutPage() {
  return <ContentPage eyebrow="About Chusky" title={<>Good work deserves<br /><span>a second brain.</span></>} description="Work does not live in one chat. It happens in messages, meetings, calls, and the projects that take a while. We are building an agent that can be part of that day—and follow through on what comes next.">
    <ContentSection eyebrow="Why we build" title="There is more to work than the answer." description={<><p>A good meeting creates commitments. A customer call changes a plan. An email arrives with the one detail a project was waiting for. The hard part is often keeping those moments connected to the next useful action.</p><p>Chusky brings an agent into those moments. It can join the conversation, work through connected tools, and keep a longer job moving. Your budget and approval still shape how far it can go.</p></>}><figure><Image src="/images/chusky-work-in-motion.webp" alt="Editorial illustration of a team working through the next steps after a meeting" width={1536} height={1024} sizes="(max-width: 760px) calc(100vw - 40px), 85vw" className="aspect-[2/1] w-full rounded-xl object-cover grayscale" /><figcaption className="mt-3 text-xs text-muted-foreground">Built around the way people work. Editorial illustration.</figcaption></figure></ContentSection>
    <ContentSection eyebrow="What we bring together" title="One agent, across the day." description="Your channels, your conversations, and the work that keeps coming back belong in the same picture."><div className={styles.featureList}>{[
      ["Be present", "Meet the work where it happens.", "Messages across Slack, WhatsApp, Telegram, iMessage, SMS, X, web chat, and CLI. Meetings across Zoom, Meet, Teams, and Webex. Incoming and outgoing business calls."],
      ["Follow through", "Stay with the next step.", "Scheduled inbox and calendar checks, event-triggered tasks, reminders, recurring jobs, and missions that can keep their place across days or weeks."],
      ["Make it useful", "Leave something people can use.", "Connected app actions, checked browser work, customer record updates, and research turned into reports, documents, presentations, and spreadsheets."],
    ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ContentSection>
    <ContentSection eyebrow="What guides us" title="Useful. Understandable. Accountable."><div className={styles.featureList}>{[
      ["01 / Context", "Know whose work it is.", "Keep private conversations, memories, files, connections, and approvals scoped to the right identity."],
      ["02 / Capability", "Work with what is available.", "Discover current tools and permissions. Be clear when a provider, connection, or piece of context is missing."],
      ["03 / Control", "Leave room for judgment.", "Pause at configured approval points, preserve the work, and make the next decision understandable."],
      ["04 / Evidence", "Show what happened.", "Retain results, receipts, and state. Explain uncertainty when a provider response cannot confirm a change."],
    ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ContentSection>
    <ContentSection eyebrow="The invitation" title="Bring the work that needs moving." description="Start with a conversation, a question, or a file. Add the tools your task needs as you go."><Link href="/sign-up" className={styles.primaryAction}>Get started <ArrowUpRight size={18} aria-hidden="true" /></Link></ContentSection>
  </ContentPage>;
}

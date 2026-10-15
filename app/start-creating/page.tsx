import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";
import styles from "@/components/landing/product-page.module.css";

export const metadata: Metadata = { title: "Start creating | Chusky AI Agent", description: "Choose your first Chusky task: a meeting follow-up, business call, inbox check-in, or a longer project." };

const startingPoints = [
  ["A conversation", "Give the meeting a next step.", "Ask Chusky to join the client meeting, capture the agreement, and prepare the follow-up. Connect the meeting provider and the apps that need the outcome.", "/features#meetings-and-calls", "Explore meetings and calls"],
  ["A routine", "Give the inbox a second look.", "Set a schedule for Elena to check the inbox and calendar you choose. Decide what should be surfaced, prepared, or handled within your permission.", "/features#work-that-keeps-moving", "Explore scheduled work"],
  ["A project", "Give the goal a working plan.", "Set the result you need, the steps, and the budget. Let a mission keep its place over days or weeks, with progress and evidence attached.", "/how-it-works#ongoing-work", "Explore longer projects"],
  ["A practical task", "Give the browser a clear job.", "Have Chusky work through a website, fill a form, and check the result. Or turn a research question into a report, presentation, or spreadsheet.", "/features#browser-and-agents", "Explore browser work"],
];

export default function StartCreatingPage() {
  return <ContentPage eyebrow="Your first piece of work" title={<>Start with a job.<br /><span>See it move forward.</span></>} description="Create your account and choose one thing you would like off your mind. Bring in the channels and tools that task needs, then decide what Chusky can handle and what comes back for your review.">
    <section><div className={styles.entryPoints}>{startingPoints.map(([label, title, description, href, action]) => <article className={styles.entryPoint} key={label}><div>{label}</div><h3>{title}</h3><div><p>{description}</p><Link href={href}>{action}<ArrowUpRight size={16} aria-hidden="true" /></Link></div></article>)}</div></section>
    <ContentSection eyebrow="A better first request" title="Give it enough to do a useful job." description="Start with the outcome. A few clear details help Chusky choose the next step and know when to come back to you."><div className="grid sm:grid-cols-2"><ContentCard title="The result you want.">A follow-up ready to review, a customer record updated, or a report with a recommendation. Say what finished should look like.</ContentCard><ContentCard title="The context it needs.">Bring the conversation, a file, or the relevant app connection. Name the customer, meeting, or project the job belongs to.</ContentCard><ContentCard title="The room it has to work.">Set a budget for longer work. Say which tools belong in the task and what actions should wait for your review.</ContentCard><ContentCard title="The rhythm that fits.">Ask once, add a reminder, set up a recurring job, or enable a watch. Choose whether the task starts from you, a schedule, or an event.</ContentCard></div></ContentSection>
    <ContentSection eyebrow="Ready for the next step" title="Bring one thing that needs doing." description="The workspace shows the connections and capabilities available to your account. Meetings, calls, and background work may need additional setup before the first task."><div className="flex flex-wrap gap-6"><Link href="/sign-up" className={styles.primaryAction}>Create an account <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href="/sign-in" className={styles.secondaryAction}>I already have an account <ArrowUpRight size={16} aria-hidden="true" /></Link></div></ContentSection>
  </ContentPage>;
}

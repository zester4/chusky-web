import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentCard, ContentPage, ContentSection } from "@/components/landing/content-page";
import styles from "@/components/landing/product-page.module.css";
import { BackgroundWorkSection, BrowserAndTeamSection, CallWorkSection, ControlSection, ConversationWorkSection, MissionLifecycleSection, TaskOutcomeLoopSection } from "@/components/landing/product-stories";

export const metadata: Metadata = { title: "Features | Chusky", description: "One virtual worker for business calls, meetings, research, browser work, connected tools, and multi-step missions—with your approval where it matters." };

const capabilities = [
  ["01 / Conversations", "Talk to Chusky anywhere.", "Slack, WhatsApp, Telegram, iMessage, SMS, X, web chat, or the CLI. Connect the channels you need, or bring Chusky to visitors through a chat widget on your own website."],
  ["02 / Tasks", "Ask for the outcome.", "Call a customer, follow up after a meeting, research a topic, prepare a document, update the CRM, book time, send an email, or complete a longer multi-step job."],
  ["03 / Calls", "Handle the call and what follows.", "Built-in incoming and outgoing call handling can answer customer questions, confirm details, and turn the conversation into the next useful action."],
  ["04 / Meetings", "Carry the agreement forward.", "Chusky can join Zoom, Google Meet, Microsoft Teams, or Webex, capture outcomes and next steps, and turn the meeting into follow-up work. The host may need to admit it."],
  ["05 / Connected tools", "Move across the tools you use.", "Connect to 6,000+ tools and work within 1,000+ of them. Use Gmail, Calendar, Notion, Box, and Stripe, or keep Salesforce and HubSpot records up to date through the accounts you authorize."],
  ["06 / Proactive work", "Catch the next thing early.", "Attention Pulse, also called Elena, can check the inbox and calendar on your schedule. New email, calendar changes, HubSpot deal updates, and Slack events can trigger a next step."],
  ["07 / Longer projects", "Keep the goal in motion.", "Work over days or weeks with saved steps, budgets for time, tool calls, and cost, plus an agreed finish line. Pause, resume, or change course when needed."],
  ["08 / Practical output", "Get more than a reply.", "Use a browser that fills forms and checks its work with screenshots. Turn research into reports, PDF, DOCX, PPTX, XLSX, and image files."],
  ["09 / Memory", "Keep the useful context.", "Chusky can remember the files, decisions, and context needed for the next step while keeping each customer’s memory separate."],
  ["10 / Your control", "Keep your say in the work.", "Risky actions can wait for approval, and approvals can expire. Every run has a budget and a full action record."],
];

export default function FeaturesPage() {
  return (
    <ContentPage eyebrow="Capabilities" title={<>One virtual worker.<br /><span>The whole job.</span></>} description="Talk to Chusky, give it a task, and get the outcome. It can call, meet, browse, research, create, and work across your tools—while you keep the important decisions.">
      <TaskOutcomeLoopSection />
      <section><div className={styles.featureList}>{capabilities.map(([label, title, description]) => <article key={label} className={styles.featureRow}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <CallWorkSection />
      <ConversationWorkSection includeCallSummary={false} />
      <MissionLifecycleSection />
      <BackgroundWorkSection />
      <BrowserAndTeamSection />
      <ContentSection eyebrow="Three levels of authority" title="Choose how far Chusky can go." description="Different work needs different room to act. Set the level that fits the task, then change it as trust and context grow.">
        <div className="grid sm:grid-cols-3"><ContentCard eyebrow="Observe" title="Show me what matters.">Chusky can watch the sources you configure and surface the messages, events, or changes that deserve attention.</ContentCard><ContentCard eyebrow="Prepare" title="Get the next step ready.">It can research, draft, organize, and prepare the action so you can review it before anything consequential happens.</ContentCard><ContentCard eyebrow="Carry out" title="Complete reversible work.">Where your policy allows it, Chusky can take approved, reversible steps and bring back the provider result.</ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="Memory with boundaries" title="The next step starts with the right context." description="Chusky can keep the useful files, facts, and decisions close to the work. Customer memory stays separate, and channel context follows the boundaries you set.">
        <div className="grid sm:grid-cols-2"><ContentCard title="Remember the work.">Keep the brief, prior decisions, created files, and open questions available when the mission returns to its next step.</ContentCard><ContentCard title="Separate each customer.">Do not let one customer’s private context spill into another conversation, channel, or workspace.</ContentCard></div>
      </ContentSection>
      <ContentSection eyebrow="The boundary matters" title="Understand. Prepare. Then act." description="Knowing how to do something is only part of the picture. Your account connections, permissions, and approval policy determine what Chusky can do for your workspace.">
        <div className="grid sm:grid-cols-2"><ContentCard eyebrow="Read and prepare" title="Get the work ready.">Research, compare, summarize, draft a reply, or create a file before committing to an external change.</ContentCard><ContentCard eyebrow="Review and commit" title="Keep the decision yours.">Actions such as sending, publishing, deleting, or spending follow the configured policy and available provider evidence.</ContentCard></div>
      </ContentSection>
      <ControlSection />
      <ContentSection eyebrow="Make it yours" title="Start with the work in front of you." description="Try a request, bring a file, or connect a relevant app. Browser sessions, meetings, calls, and background execution need the corresponding providers enabled."><div className="flex flex-wrap gap-6"><Link href="/how-it-works" className={styles.secondaryAction}>See how it works <ArrowUpRight size={16} aria-hidden="true" /></Link><Link href="/integrations" className={styles.secondaryAction}>Explore integrations <ArrowUpRight size={16} aria-hidden="true" /></Link></div></ContentSection>
    </ContentPage>
  );
}

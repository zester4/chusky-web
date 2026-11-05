import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import styles from "./homepage.module.css";
import { BackgroundWorkSection, CallWorkSection, ControlSection, ConversationWorkSection, TaskOutcomeLoopSection, WorkChannelsSection } from "./product-stories";

const apps = [
  { name: "Gmail", src: "/logos/gmail.svg" },
  { name: "Slack", src: "/logos/slack.svg" },
  { name: "WhatsApp", src: "/logos/whatsapp.svg" },
  { name: "Telegram", src: "/logos/telegram.svg" },
  { name: "iMessage", src: "/logos/imessage.svg" },
  { name: "X", src: "/logos/x-twitter.svg" },
  { name: "Notion", src: "/logos/notion.svg" },
  { name: "Google Calendar", src: "/logos/google-calendar.svg" },
  { name: "Zoom", src: "/logos/zoom.svg" },
  { name: "Google Meet", src: "/logos/google-meet.svg" },
  { name: "Microsoft Teams", src: "/logos/microsoft-teams.svg" },
  { name: "Webex", src: "/logos/webex.svg" },
  { name: "HubSpot", src: "/logos/hubspot.svg" },
  { name: "Salesforce", src: "/logos/salesforce.svg" },
  { name: "Box", src: "/logos/box.png" },
  { name: "Stripe", src: "/logos/stripe.svg" },
  { name: "Twilio", src: "/logos/twilio.svg" },
  { name: "MCP", src: "/logos/mcp.svg" },
];

const questions = [
  { question: "What makes Chusky different?", answer: "Chusky is one virtual worker across messages, meetings, business calls, and work that takes longer than a chat. It can capture what was agreed, work with your connected apps, and keep a project moving with saved steps, a budget, and evidence of the result." },
  { question: "Can it join meetings and handle calls?", answer: "Yes. Chusky can join Zoom, Google Meet, Microsoft Teams, and Webex meetings, capture decisions, and help with follow-up. It can also take incoming business calls and make outgoing calls with the relevant voice provider connected." },
  { question: "Can it work without a new message from me?", answer: "Yes. Set up Attention Pulse, also called Elena, to check the inbox and calendar on a schedule. Triggers can start work from new email, calendar changes, HubSpot deal updates, or Slack events. You choose what is watched and what actions are allowed." },
  { question: "What if a project takes days or weeks?", answer: "Give the project a clear goal, a budget, and a description of what finished means. Chusky missions preserve the steps and progress, wait when needed, and keep evidence with the result. Background execution needs the required workspace services enabled." },
  { question: "Can I review an action before it happens?", answer: "Yes. When your workspace policy requires approval, Chusky pauses so you can review the exact action before it proceeds. Approvals can expire rather than remaining open forever." },
  { question: "Do I need to connect all my apps?", answer: "No. You can start with a request or a file and connect relevant tools as you need them. Each connection uses the permissions you authorize for that account." },
  { question: "What happens to the files it creates?", answer: "Supported workflows can create reports, documents, presentations, spreadsheets, and other artifacts. Registered files remain available to retrieve from your workspace." },
  { question: "Where can I see pricing and usage?", answer: "Sign in to see the access, usage, and capabilities available to your workspace. Public plan prices and limits are not currently published on this site." },
];

export function HomepageSections() {
  return (
    <>
      <TaskOutcomeLoopSection />
      <WorkChannelsSection />

      <section className={styles.connections} aria-labelledby="connections-title">
        <div><p className={styles.eyebrow}>6,000+ tools through one connection</p><h2 id="connections-title">Work across your<br />connected tools.</h2></div>
        <div className={styles.connectionsRight}>
          <div className={styles.appNames} aria-label="Connected tools and channels">{apps.map((app) => <span key={app.name} title={app.name}><Image src={app.src} alt={app.name} width={32} height={32} className={styles.appLogo} /></span>)}</div>
          <div className={styles.connectionNote}><p>Chusky can work across 6,000+ connected tools and take action within 1,000+ of them.</p><Link href="/integrations">Explore integrations <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <BackgroundWorkSection />
      {/* Mission lifecycle: intentionally moved to How it works for a calmer homepage. */}
      {/* <MissionLifecycleSection /> */}
      <CallWorkSection />
      <ConversationWorkSection includeCallSummary={false} />
      <ControlSection />

      {/* The product stories above carry the narrative; keep the homepage focused on the loop and proof. */}

      <section className={styles.faq} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>Before you begin</p><h2 id="faq-title" className={styles.sectionTitle}>A few things<br /><em>worth knowing.</em></h2><Link href="/docs" className={styles.textAction}>Visit the documentation <ArrowUpRight size={17} aria-hidden="true" /></Link></div><div className={styles.faqList}>{questions.map(({ question, answer }) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>

      <section className={styles.closing} aria-labelledby="closing-title"><div className={styles.sectionHeader}><p className={styles.eyebrow}>Make room for the work that matters</p><span className={styles.sectionIndex}>Your next step</span></div><div className={styles.closingRow}><h2 id="closing-title">Get<br /><em>started.</em></h2><div><p>One goal. The steps it takes.<br />The finished work back in your hands.</p><Link href="/sign-up" className={styles.primaryAction}>Start for Free <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>
    </>
  );
}

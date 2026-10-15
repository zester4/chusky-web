import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, FolderOpen, Plus } from "lucide-react";
import styles from "./homepage.module.css";
import { BackgroundWorkSection, CallWorkSection, ControlSection, ConversationWorkSection, MissionLifecycleSection, TaskOutcomeLoopSection, WorkChannelsSection } from "./product-stories";

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
          <div className={styles.connectionNote}><p>Chusky can work across 6,000+ connected tools and take action within 1,000+ of them. Availability depends on your setup and permissions.</p><Link href="/integrations">Explore integrations <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <BackgroundWorkSection />
      <MissionLifecycleSection />
      <CallWorkSection />
      <ConversationWorkSection includeCallSummary={false} />
      <ControlSection />

      <section className={styles.editorial} aria-labelledby="less-switching-title">
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>One worker. A longer thread.</p><span className={styles.sectionIndex}>Context / Action / Follow-through</span></div>
        <div className={styles.editorialGrid}>
          <h2 id="less-switching-title" className={styles.sectionTitle}>Less switching.<br /><em>More following through.</em></h2>
          <div className={styles.editorialCopy}><p>A client agrees to a next step on a call. A deal changes in HubSpot. An important reply arrives while you’re in another meeting.</p><p>Chusky can meet that work where it happens and carry it forward. It can join the conversation, prepare the follow-up, update the right app, or keep a longer project on track—without asking you to reconnect the pieces every time.</p><Link href="/features" className={styles.textAction}>See what Chusky can do <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        </div>
        <div className={styles.benefitRows}>
          <article><span className={styles.rowLabel}>Connected work</span><h3>Work across your connected tools.</h3><p>Messages, meetings, phone calls, your browser, or a chat widget on your business website.</p></article>
          <article><span className={styles.rowLabel}>Proactive work</span><h3>Scheduled checks and follow-ups.</h3><p>Inbox and calendar checks, event-triggered tasks, and projects that continue over days or weeks.</p></article>
          <article><span className={styles.rowLabel}>Owner control</span><h3>Approvals, budgets, and proof.</h3><p>Set limits for each run and review spending, deleting, permission changes, and high-impact sends before they happen.</p></article>
        </div>
        <p className={styles.integrationAccess}>Building with Chusky? Use the <Link href="/developers">API or TypeScript SDK</Link>, or connect compatible systems through <Link href="/mcp">MCP</Link> and <Link href="/api-reference#a2a">A2A</Link>.</p>
      </section>

      <section className={styles.deliverables} aria-labelledby="deliverables-title">
          <div className={styles.deliverableCopy}><p className={styles.eyebrow}>Research and deliverables</p><h2 id="deliverables-title" className={styles.sectionTitle}>Research, reports,<br /><em>and ready-to-use files.</em></h2><p>Turn research into a report, meeting decisions into a presentation, or a comparison into a spreadsheet. Get a PDF, DOCX, PPTX, or XLSX you can take into the next part of your day.</p><p>For work on the web, Chusky can navigate a page, fill a form, and check the result. It can divide a larger job into clear roles and carry the work between them.</p><Link href="/features#browser-and-agents" className={styles.textAction}>Explore browser and research work <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        <div className={styles.fileLibrary}>
          <div className={styles.libraryHeading}><FolderOpen size={20} strokeWidth={1.5} aria-hidden="true" /><h3>Ready-to-use deliverables</h3><span>File formats</span></div>
          {[
            ["Documents & reports", "PDF / DOCX", "Findings, context, and next steps."],
            ["Spreadsheets", "XLSX", "Organized data for the next decision."],
            ["Presentations", "PPTX", "A story you can share with the room."],
          ].map(([name, format, detail]) => <div className={styles.fileRow} key={name}><FileText size={21} strokeWidth={1.5} aria-hidden="true" /><div><p>{name}</p><span>{detail}</span></div><span className={styles.format}>{format}</span></div>)}
          <p className={styles.libraryNote}>Supported outputs vary by workflow and available tools.</p>
        </div>
      </section>

      <section className={styles.process} aria-labelledby="process-title">
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>A clearer way to work</p><span className={styles.sectionIndex}>Ask / Work / Review</span></div>
        <div className={styles.processLayout}><h2 id="process-title" className={styles.sectionTitle}>You set the direction.<br /><em>Chusky works the steps.</em></h2><ol className={styles.processSteps}>
          <li><span>01</span><div><h3>Describe the outcome.</h3><p>Ask in your preferred channel. Connect the tools the job needs, give it a brief, and set the limits.</p></div></li>
          <li><span>02</span><div><h3>Let it work the steps.</h3><p>Join a meeting, make the call, check the inbox, or keep a project moving. Follow progress and step in when your judgment is needed.</p></div></li>
          <li><span>03</span><div><h3>Take the result forward.</h3><p>Review the action, use the file, and inspect the record. Longer work keeps its place for the next step.</p></div></li>
        </ol></div>
        <Link href="/how-it-works" className={styles.textAction}>A closer look at how it works <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>

      <section className={styles.faq} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>Before you begin</p><h2 id="faq-title" className={styles.sectionTitle}>A few things<br /><em>worth knowing.</em></h2><Link href="/docs" className={styles.textAction}>Visit the documentation <ArrowUpRight size={17} aria-hidden="true" /></Link></div><div className={styles.faqList}>{questions.map(({ question, answer }) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>

      <section className={styles.closing} aria-labelledby="closing-title"><div className={styles.sectionHeader}><p className={styles.eyebrow}>Make room for the work that matters</p><span className={styles.sectionIndex}>Your next step</span></div><div className={styles.closingRow}><h2 id="closing-title">Start<br /><em>for free.</em></h2><div><p>One goal. The steps it takes.<br />The finished work back in your hands.</p><Link href="/sign-up" className={styles.primaryAction}>Start for Free <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>
    </>
  );
}

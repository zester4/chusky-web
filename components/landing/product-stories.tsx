import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, Terminal, Globe2 } from "lucide-react";
import { meetingPlatforms, workChannels, type ProductConnection } from "@/lib/product-story";
import styles from "./product-stories.module.css";

const taskLoop = [
  ["01", "Talk to Chusky.", "Start on phone, Slack, WhatsApp, Telegram, iMessage, SMS, X, web chat, or your own website."],
  ["02", "Give it the task.", "Say what you need in plain language, add the useful context, and define what a good outcome looks like."],
  ["03", "Let Chusky work.", "It can call, join a meeting, browse, research, create a file, or act in the tools you have connected."],
  ["04", "Get the outcome.", "A booked meeting, updated record, prepared report, sent follow-up, or a clear account of what happened comes back to you."],
  ["05", "Keep your authority.", "Budgets and approval rules stay with the work. Important actions wait for your decision."],
];

const missionStages = [
  ["01", "Goal", "Start with the business outcome Chusky should pursue."],
  ["02", "Signals", "Chusky can watch for the changes and opportunities that matter."],
  ["03", "List", "It can build a working list of people relevant to the goal."],
  ["04", "Shortlist", "It can surface the strongest fits to pursue first."],
  ["05", "Enrichment", "It can add the available contact and company details the work needs."],
  ["06", "Saved work", "The list can be saved to Notion, Google Sheets, a CRM, or another connected tool."],
  ["07", "Next action", "Chusky can set the reminder and return when the next step is due."],
  ["08", "Research", "It can understand each person and prepare outreach for their situation."],
  ["09", "Outreach", "Chusky can start the conversation and keep the next step moving."],
  ["10", "Meeting", "It can join, listen, participate, take notes, and schedule the follow-up."],
  ["11", "Follow-up", "It can continue the conversation until the mission reaches its defined end."],
  ["12", "Client", "After the sale, Chusky can keep checking that the customer has what they need."],
  ["13", "Feedback", "It can collect what customers say and surface what needs attention."],
];

function ConnectionLogo({ item }: { item: ProductConnection }) {
  if (item.logo) return <Image src={item.logo} alt="" width={24} height={24} className={styles.logo} />;
  const Icon = item.name === "CLI" ? Terminal : item.name === "Web chat" ? Globe2 : MessageSquare;
  return <Icon size={24} strokeWidth={1.5} aria-hidden="true" />;
}

export function TaskOutcomeLoopSection() {
  return (
    <section className={styles.section} id="task-to-outcome" aria-labelledby="task-outcome-title"><div className={styles.inner}>
      <div className={styles.heading}><p className={styles.eyebrow}>One virtual worker</p><h2 id="task-outcome-title">Talk. Assign.<br /><em>Get the outcome.</em></h2><p>Chusky is one place to give work—not a set of separate call, meeting, and workflow products. Start the conversation where you already are. Chusky carries the task across the tools and steps it needs, then returns with the result.</p></div>
      <ol className={styles.outcomeLoop}>{taskLoop.map(([number, title, description]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
    </div></section>
  );
}

export function CallWorkSection() {
  return (
    <section className={styles.section} id="calls" aria-labelledby="calls-title"><div className={styles.inner}>
      <div className={styles.heading}><p className={styles.eyebrow}>Built-in call handling</p><h2 id="calls-title">Calls, handled<br /><em>end to end.</em></h2><p>Chusky can answer incoming business calls and make outgoing ones. It can answer a customer’s question, confirm the details, and carry what was agreed into the next piece of work.</p></div>
      <div className={styles.meetingLayout}>
        <figure className={styles.photo}><Image src="/images/chusky-call-follow-through.webp" alt="Editorial illustration of a business owner handling a call while reviewing the next steps" width={1536} height={1024} sizes="(max-width: 760px) calc(100vw - 40px), 55vw" /><figcaption>A call with somewhere to go next. Editorial illustration.</figcaption></figure>
        <div className={styles.meetingDetails}><h3>The call is the start.<br /><em>The outcome is the job.</em></h3><ol className={styles.list}>
          <li><span>01</span><div><h4>Answer with context.</h4><p>Give Chusky the brief, connected information, and boundaries it needs to handle the conversation.</p></div></li>
          <li><span>02</span><div><h4>Make the call.</h4><p>Reach a lead, supplier, or customer to ask the question, confirm the detail, or move a conversation forward.</p></div></li>
          <li><span>03</span><div><h4>Turn talk into work.</h4><p>Prepare the follow-up, book the next meeting, update the CRM, or bring an important send back for approval.</p></div></li>
        </ol><p className={styles.note}>Calling depends on the voice provider, number, permissions, and instructions configured for the workspace.</p></div>
      </div>
    </div></section>
  );
}

export function ConversationWorkSection({ includeCallSummary = true }: { includeCallSummary?: boolean }) {
  return (
    <section className={styles.section} id="meetings-and-calls" aria-labelledby="conversation-work-title"><div className={styles.inner}>
      <div className={styles.heading}><p className={styles.eyebrow}>Zoom · Meet · Teams · Webex</p><h2 id="conversation-work-title">Meetings that turn<br /><em>into action.</em></h2><p>Chusky can join the conversation, capture the decisions, and help carry out what comes next. The useful part is what happens after everyone leaves.</p></div>
      <div className={styles.meetingLayout}>
        <figure className={styles.photo}><Image src="/images/chusky-work-in-motion.webp" alt="Editorial illustration of colleagues turning a meeting into a working plan" width={1536} height={1024} sizes="(max-width: 760px) calc(100vw - 40px), 55vw" /><figcaption>For the work around the conversation. Editorial illustration.</figcaption></figure>
        <div className={styles.meetingDetails}><h3>From the room to the next step.</h3><ol className={styles.list}>
          <li><span>01</span><div><h4>Join with a purpose.</h4><p>Bring Chusky into a Zoom, Google Meet, Microsoft Teams, or Webex call with the context and the job you need it to do.</p></div></li>
          <li><span>02</span><div><h4>Keep what was agreed.</h4><p>Capture decisions, commitments, open questions, and who needs to do what. Keep the next step connected to the conversation that created it.</p></div></li>
          <li><span>03</span><div><h4>Follow through.</h4><p>Prepare the follow-up, update a customer record, or set the next task in motion using the apps you have connected.</p></div></li>
        </ol><div className={styles.logoLine} aria-label="Meeting platforms">{meetingPlatforms.map(item => <span key={item.name}><ConnectionLogo item={item} />{item.name}</span>)}</div></div>
      </div>
      {includeCallSummary && <div className={styles.callRow}><p className={styles.eyebrow}>On the phone, too</p><h3>Answer the call.<br /><em>Make the follow-up.</em></h3><div><p>Chusky can take incoming business calls and make outgoing calls with a clear brief. Answer a customer’s question, confirm a detail, or follow up on something already agreed—then keep the outcome with the rest of the work.</p><p className={styles.note}>Meetings and calls need the relevant providers connected. Meeting admission and available actions depend on the platform and permissions.</p></div></div>}
    </div></section>
  );
}

export function BackgroundWorkSection() {
  return (
    <section className={styles.section} id="work-that-keeps-moving" aria-labelledby="background-work-title"><div className={styles.inner}>
      <div className={styles.heading}><p className={styles.eyebrow}>Proactive, not just on command</p><h2 id="background-work-title">Ready before<br /><em>you remember to ask.</em></h2><p>Some work starts with a message. Some starts when an email arrives, a meeting changes, or a deal moves forward. Chusky can respond to the events and schedules you choose.</p></div>
      <div className={styles.backgroundGrid}>
        <article><p className={styles.eyebrow}>Attention Pulse · Elena</p><h3>A quiet check-in<br />on the things that matter.</h3><p>Choose when Elena checks your inbox and calendar. Let it surface what needs attention, prepare the next step, or keep an authorized task moving. Set the schedule and the room it has to act.</p><dl className={styles.definitions}><div><dt>You choose the watch.</dt><dd>The inbox, calendar, and work you want it to check.</dd></div><div><dt>You choose the rhythm.</dt><dd>Scheduled check-ins, reminders, and recurring jobs.</dd></div><div><dt>You keep the decision.</dt><dd>Important actions still stop for your approval.</dd></div></dl></article>
        <article><p className={styles.eyebrow}>Projects that take time</p><h3>A goal that stays<br />on the board.</h3><p>Give Chusky a project that takes days or weeks. It can work through the steps, wait for a reply or a missing detail, and pick up again with the progress saved. You set the budget and agree what a finished job should look like.</p><dl className={styles.definitions}><div><dt>A plan to work through.</dt><dd>Steps, handoffs, and a clear finish line.</dd></div><div><dt>Limits you can see.</dt><dd>A budget for the work and a record of the actions.</dd></div><div><dt>A result you can inspect.</dt><dd>Files, evidence, and progress that stay with the project.</dd></div></dl></article>
      </div>
      <div className={styles.eventStrip}><p className={styles.eyebrow}>Start from a change</p><p>New email <span aria-hidden="true">/</span> Calendar changes <span aria-hidden="true">/</span> HubSpot deal updates <span aria-hidden="true">/</span> Slack events</p><Link href="/how-it-works#ongoing-work" className={styles.link}>See how it stays on track <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <p className={styles.note}>Scheduled watches and background work follow your setup and permissions. Chusky checks what you configure; it does not monitor every connected app by default.</p>
    </div></section>
  );
}

export function WorkChannelsSection() {
  return (
    <section className={styles.section} id="channels" aria-labelledby="work-channels-title"><div className={styles.inner}>
      <div className={styles.splitHeading}><div><p className={styles.eyebrow}>One worker, every conversation</p><h2 id="work-channels-title">Works where your customers<br /><em>already talk.</em></h2></div><div><p>Ask from Slack at your desk. Send a message from WhatsApp or Telegram on the move. Use iMessage, SMS, X, web chat, or your terminal when that’s where the work happens.</p><p>Give the task and receive the outcome in the same channel. Private work and shared conversations keep their own boundaries, so the right context reaches the right people.</p></div></div>
      <div className={styles.channels}>{workChannels.map(item => <article key={item.name}><ConnectionLogo item={item} /><div><h3>{item.name}</h3><p>{item.description}</p></div></article>)}</div>
      <div className={styles.widget}><div><p className={styles.eyebrow}>For your own website</p><h3>Bring Chusky<br /><em>to your customers.</em></h3></div><div><p>Embed a Chusky chat widget on your business website. Give visitors a place to ask questions and start a conversation connected to the tools and workflows you allow.</p><p>Your site can be the starting point. The work behind the conversation can continue through the same connections, tasks, and approval controls.</p><Link href="/developers#business-widget" className={styles.link}>Explore Chusky for your business <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div>
    </div></section>
  );
}

export function BrowserAndTeamSection() {
  return <section className={styles.section} id="browser-and-agents" aria-labelledby="browser-team-title"><div className={styles.inner}>
    <div className={styles.heading}><p className={styles.eyebrow}>From the plan to the practical part</p><h2 id="browser-team-title">Open the page.<br /><em>Move the work forward.</em></h2><p>Some tasks need a browser. Others need research, writing, and a careful check. Chusky can bring those steps together as one piece of work.</p></div>
    <div className={styles.backgroundGrid}><article><p className={styles.eyebrow}>Browser work</p><h3>More than a link<br />to the next task.</h3><p>Ask Chusky to navigate a website, fill a form, and check what changed. It reads the page, uses its controls, and verifies the result before reporting back.</p><p>When a site needs a verification code, CAPTCHA, or a decision only you can make, it can pause for your help. Keep the work in the same session and continue when you’re ready.</p></article><article><p className={styles.eyebrow}>One job, several roles</p><h3>Different steps.<br />One outcome.</h3><p>Chusky can divide a larger job into clear roles and pass the work from one step to the next. Research can feed a report, and a checking step can review the result before it comes back to you.</p><p>Each role can have the tools and limits it needs. The handoffs stay part of one mission, with progress and responsibility you can follow.</p></article></div>
  </div></section>;
}

export function MissionLifecycleSection() {
  return <section className={styles.section} id="missions" aria-labelledby="mission-title"><div className={styles.inner}>
    <div className={styles.heading}><p className={styles.eyebrow}>One mission, start to finish</p><h2 id="mission-title">Runs work that takes<br /><em>days, not seconds.</em></h2><div><p>Give Chusky a goal. It can find relevant people, enrich the list, save the work, reach out, join the meeting, follow up, and keep the relationship moving.</p><p>From finding the right people to following up, meeting them, and keeping the relationship healthy—Chusky can run the whole mission.</p></div></div>
    <ol className={styles.missionJourney}>{missionStages.map(([number, title, description]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
    <p className={styles.note}>Available signals, contact details, channels, and actions depend on the providers and accounts you connect. Chusky can continue toward a target, but enrichment, replies, meetings, and deals are not guaranteed.</p>
  </div></section>;
}

export function ControlSection() {
  return <section className={styles.section} id="your-control" aria-labelledby="control-title"><div className={styles.inner}><div className={styles.splitHeading}><div><p className={styles.eyebrow}>Your yes still matters</p><h2 id="control-title">You stay<br /><em>in control.</em></h2></div><div><p>Spending money, deleting something important, changing permissions, and high-impact messages wait for the owner’s approval. Chusky can prepare the work and show the exact action before you decide.</p><p>Approvals can expire. Each run has a budget for time, tool calls, and cost, plus a record of what happened. Nothing is marked done without the available receipt from the provider.</p><Link href="/security" className={styles.link}>Understand the controls <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div></div></section>;
}

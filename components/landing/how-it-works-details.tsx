import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentCard, ContentSection } from "./content-page";
import styles from "./product-page.module.css";

const steps = [
  ["01", "Give it a job worth doing.", "Ask in your preferred channel. Add the context, connect the apps the job needs, and tell Chusky what a good result looks like. Set a budget and any actions you want to review."],
  ["02", "Let the work take its course.", "Chusky can join the meeting, make a call, research a question, or work through a website. It can divide a larger job into clear roles and carry the work between them."],
  ["03", "Review the result. Keep going.", "Use the file, inspect the action record, and decide on any important change waiting for approval. If the work takes longer, its steps and progress stay ready for the next session."],
];
const states = [
  ["Queued", "The request has been accepted and is waiting to execute."],
  ["Running", "Chusky is gathering context, working through a step, or using a connected tool."],
  ["Approval required", "An exact action is waiting for a person to review it."],
  ["Completed", "The recorded result and available artifacts can be retrieved."],
  ["Failed or cancelled", "The saved state explains what happened and what can be retried."],
];

export function HowItWorksDetails() {
  return <>
    <ContentSection eyebrow="Four ways work can begin" title="The first message is only one doorway." description="Start Chusky where the work begins. The same virtual worker can take the task forward without turning every handoff into another job for you."><div className="grid gap-3 sm:grid-cols-2">
      <ContentCard eyebrow="Message" title="Ask where you already talk.">Give Chusky a task through Slack, WhatsApp, Telegram, iMessage, SMS, X, web chat, the CLI, or your own website.</ContentCard>
      <ContentCard eyebrow="Call" title="Let the phone start the work.">An incoming or outgoing business call can become a booked meeting, confirmed detail, CRM update, or prepared follow-up.</ContentCard>
      <ContentCard eyebrow="Meeting" title="Turn agreement into action.">Chusky can join Zoom, Meet, Teams, or Webex, capture what matters, and carry the next step into your connected tools.</ContentCard>
      <ContentCard eyebrow="Event" title="Respond when something changes.">A configured email, calendar, HubSpot, or Slack event can start the next step without another reminder from you.</ContentCard>
    </div></ContentSection>
    <section><div className={styles.steps}><div className={styles.stepsIntro}><p className={styles.eyebrow}>The working rhythm</p><h2 className="mt-5">Start with the outcome.<br />Stay in the loop.</h2><p>You do not need to map every click between the request and the result. Give the work a direction, let Chusky work through the steps, and keep your say where it matters.</p><Link href="/features" className={styles.secondaryAction}>Explore the capabilities <ArrowUpRight size={16} aria-hidden="true" /></Link></div><ol className={styles.stepList}>{steps.map(([number, title, description]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></div></section>
    <ContentSection id="example-workflows" eyebrow="A few ways it comes together" title="Follow the work, from start to next step." description="These are example workflows to help you see how the pieces connect. Choose a scenario to explore what you would ask and how Chusky can help."><div className={styles.scenarioList}>
      <details open><summary>A client meeting that leads somewhere.</summary><p>Ask Chusky to join the call with your brief. It captures the decisions and commitments, prepares the follow-up, and can update Salesforce or HubSpot through your connection. Any important send waits for the owner’s approval.</p><p>The useful result is more than meeting notes: the conversation, customer record, and next task stay connected.</p></details>
      <details><summary>An inbox that gets a regular second look.</summary><p>Set Attention Pulse, or Elena, to check the inbox and calendar on a schedule. Choose what deserves attention and whether it should observe, prepare work, or take allowed reversible steps.</p><p>For immediate changes, a configured email, calendar, deal, or Slack trigger can start a workflow. Your watches and rules determine what happens.</p></details>
      <details><summary>A research project that takes two weeks.</summary><p>Set the question, the research steps, a budget, and what the final report should contain. Chusky can keep its place across work sessions, wait for an input, and return to the next ready step.</p><p>The result can be a report, spreadsheet, or presentation with the supporting evidence. You can inspect what happened along the way.</p></details>
    </div></ContentSection>
    <ContentSection id="ongoing-work" eyebrow="For the work that takes longer" title="A project can outlast the conversation." description="A Chusky mission keeps the goal, the plan, and the progress together over days or weeks. Give it a finish line it can work toward, and keep its limits clear."><div className={styles.featureList}>{[
      ["The goal", "Agree on what finished means.", "Describe the outcome, the deliverable, and the evidence you expect. A useful finish line is more specific than ‘look into this’."],
      ["The plan", "Keep the next step in view.", "Break the job into steps and preserve progress when the work waits for an input, a reply, or an approval."],
      ["The rhythm", "Return when it is time.", "Use reminders, recurring jobs, and scheduled check-ins to revisit work. A new event can also be the reason to take the next step."],
      ["The limits", "Make the budget part of the brief.", "Set budgets for time, tool calls, and cost. Review spending, deletion, permission changes, and high-impact messages, then inspect the saved action record."],
    ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ContentSection>
    <ContentSection eyebrow="Work you can inspect" title="Check the result, not just the promise." description="A completed run should leave something you can use or verify. Chusky keeps the available evidence close to the outcome."><div className={styles.featureList}>{[
      ["Browser", "See what changed.", "Chusky can use its own browser, fill forms, and check the result with screenshots. Verification codes and CAPTCHAs can be handed back to you."],
      ["Connected apps", "Keep the provider receipt.", "An update is not treated as complete without the available response or receipt from Gmail, Calendar, HubSpot, Salesforce, or another connected provider."],
      ["Files", "Take the work with you.", "Research can return as a report, PDF, Word document, presentation, spreadsheet, or image, depending on the workflow and enabled tools."],
      ["Longer missions", "Keep the trail.", "The goal, budget, progress, pauses, approvals, and supporting evidence stay attached to the mission."],
    ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ContentSection>
    <ContentSection eyebrow="Change course without losing the work" title="Pause. Resume. Redirect." description="Longer work does not need to restart because a detail changed. Keep the existing mission, update the instruction, and continue from the right point."><div className="grid sm:grid-cols-3"><ContentCard title="Pause safely.">Stop before the next step when a budget, approval, missing detail, or business decision needs attention.</ContentCard><ContentCard title="Resume in context.">Continue with the saved goal, work completed so far, and the same connected evidence.</ContentCard><ContentCard title="Change the brief.">Adjust the target, timing, priority, or finish line while keeping the useful work already completed.</ContentCard></div></ContentSection>
    <ContentSection eyebrow="See where work stands" title="Every run has a state." description="These are lifecycle definitions, rather than a live activity feed. If a client disconnects, inspect the saved run before starting another attempt."><div className={styles.featureList}>{states.map(([state, description], index) => <article key={state} className={styles.featureRow}><span>0{index + 1}</span><h3>{state}</h3><p>{description}</p></article>)}</div></ContentSection>
    <ContentSection eyebrow="When your input matters" title="Space for the human decision."><div className="grid sm:grid-cols-2"><ContentCard title="See the action before your yes.">Spending, deleting, changing permissions, and high-impact messages wait for the owner’s approval. The request identifies the exact action, and approvals can expire.</ContentCard><ContentCard title="Know what needs setting up.">Meetings, calls, watches, and longer background jobs need the right providers and services enabled. The setup guides explain what your workspace needs.</ContentCard></div></ContentSection>
    <ContentSection eyebrow="Beyond the first reply" title="Bring the work back to your day." description="Use supported files, connected apps, and configured channels to carry the result forward. Browser work, meetings, calls, and background continuation depend on the providers enabled for your workspace."><Link href="/integrations" className={styles.secondaryAction}>Explore the connections <ArrowUpRight size={16} aria-hidden="true" /></Link></ContentSection>
  </>;
}

"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, Link2, MessageSquare, Phone } from "lucide-react";
import styles from "./homepage.module.css";

const examples = [
  {
    name: "Follow through on a meeting",
    prompt: "Join the client meeting, capture what we agree, and prepare the follow-up. Update HubSpot after I’ve reviewed the next steps.",
    tools: "Meetings + HubSpot + your review",
    outcome: "The conversation, carried into action",
    detail: "A meeting can lead to clear commitments, a prepared follow-up, and the customer record that belongs with it.",
    icon: CalendarDays,
  },
  {
    name: "Keep a longer project moving",
    prompt: "Over the next two weeks, research our shortlist, compare the findings, and build a report. Keep to the budget we set and show the evidence behind the recommendation.",
    tools: "A saved plan + research + a report",
    outcome: "A project that keeps its place",
    detail: "Steps, limits, and an agreed finish line give the work a way to continue beyond a single reply.",
    icon: Clock3,
  },
  {
    name: "Handle a business call",
    prompt: "Call the supplier to confirm the delivery details. Keep a record of what they agree and prepare an update for the team.",
    tools: "Business calls + the next step",
    outcome: "The call and its outcome together",
    detail: "A clear brief helps Chusky handle the conversation and bring the agreed details back to your work.",
    icon: Phone,
  },
];

export function RequestExplorer() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const example = examples[selected];
  const Icon = example.icon;

  return (
    <div className={styles.explorer} id="work-in-practice">
      <div className={styles.explorerAside}>
        <p className={styles.eyebrow}>A place to start</p>
        <h2>What would you<br /><em>like to move forward?</em></h2>
        <p>Start with the job, not a list of instructions for every app.</p>
        <div className={styles.exampleChoices} role="group" aria-label="Explore example requests">
          {examples.map((item, index) => (
            <button key={item.name} type="button" aria-pressed={selected === index} aria-controls={`${id}-example`} onClick={() => setSelected(index)} className={styles.exampleChoice}>
              <span className={styles.exampleNumber}>0{index + 1}</span>{item.name}<ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.requestWindow}>
        <div className={styles.windowBar}><span><MessageSquare size={15} aria-hidden="true" /> Chusky workspace</span><span>Product preview · example request</span></div>
        <div className={styles.requestBody} id={`${id}-example`} aria-live="polite" aria-atomic="true">
          <div className={styles.previewStatus}><span className={styles.statusDot} aria-hidden="true" /> <span>Example flow</span><span className={styles.previewStatusLine} aria-hidden="true" /><span>Goal → outcome</span></div>
          <p className={styles.requestGreeting}>You give the goal.<br /><em>Chusky carries it through.</em></p>
          <div className={styles.composer}>
            <p key={example.name} className={styles.requestText}>{example.prompt}</p>
            <div className={styles.composerBottom}><span>{example.tools}</span><Link href="/sign-up" aria-label={`Create an account to ${example.name.toLowerCase()}`} className={styles.composerAction}><ArrowUpRight size={20} aria-hidden="true" /></Link></div>
          </div>
          <div className={styles.exampleOutcome}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><div><p>{example.outcome}</p><span>{example.detail}</span></div></div>
          <div className={styles.previewSteps} aria-label="Example work flow"><span>Brief</span><span>Work across tools</span><span>Finished outcome</span></div>
        </div>
        <div className={styles.windowFoot}><Link2 size={14} aria-hidden="true" /> Connect your tools when you’re ready. You choose the access.</div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { RequestExplorer } from "./request-explorer";
import styles from "./homepage.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroHeading}>
        <p className={styles.eyebrow}>Your virtual worker</p>
        <h1 id="home-title" className={styles.heroTitle}>
          Give Chusky the goal.<br /><em>Get the <span className={styles.heroAccent}>work</span> back.</em>
        </h1>
        <div className={styles.heroIntro}>
          <p>One worker for calls, meetings, research, and the follow-through between them.</p>
          <div className={styles.actions}>
            <Link href="/sign-up" className={styles.primaryAction}>Start for Free <ArrowUpRight size={18} aria-hidden="true" /></Link>
            <a href="#work-in-practice" className={styles.textAction}>See what it does <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <RequestExplorer />
      <div className={styles.heroFootnote}>
        <span>Talk to Chusky. Give it a task. Get the outcome.</span>
        <span>Research <span aria-hidden="true">/</span> Apps <span aria-hidden="true">/</span> Calls &amp; meetings <span aria-hidden="true">/</span> Follow-through</span>
      </div>
    </section>
  );
}

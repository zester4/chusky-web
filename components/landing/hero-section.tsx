import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { RequestExplorer } from "./request-explorer";
import styles from "./homepage.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroHeading}>
        <p className={styles.eyebrow}>One virtual worker · from goal to outcome</p>
        <h1 id="home-title" className={styles.heroTitle}>
          Give Chusky a goal.<br /><em>It <span className={styles.heroAccent}>finishes</span> the work.</em>
        </h1>
        <div className={styles.heroIntro}>
          <p>Talk to Chusky where you already work. It can research, work across your apps, make and answer calls, join meetings, and keep the task moving—with your approval when it matters.</p>
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

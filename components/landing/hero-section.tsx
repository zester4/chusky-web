import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { RequestExplorer } from "./request-explorer";
import styles from "./homepage.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroHeading}>
        <p className={styles.eyebrow}>One virtual worker. The whole follow-through.</p>
        <h1 id="home-title" className={styles.heroTitle}>
          The call is not the job.<br /><em>The follow-up is.</em>
        </h1>
        <div className={styles.heroIntro}>
          <p>Chusky answers and makes your business calls, joins your meetings, and follows through on everything agreed, across phone, chat and your apps, with your approval on anything that matters.</p>
          <div className={styles.actions}>
            <Link href="/contact" className={styles.primaryAction}>Book a pilot <ArrowUpRight size={18} aria-hidden="true" /></Link>
            <a href="#calls" className={styles.textAction}>See what it does <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <RequestExplorer />
      <div className={styles.heroFootnote}>
        <span>Talk to Chusky. Give it a task. Get the outcome.</span>
        <span>Calls <span aria-hidden="true">/</span> Meetings <span aria-hidden="true">/</span> Follow-through</span>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Navigation } from "./navigation";
import { FooterSection } from "./footer-section";
import styles from "./product-page.module.css";

type ProductPageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
};

export function ProductPageHero({ eyebrow, title, description }: ProductPageHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="page-title">
      <div className={styles.heroLabel}><Link href="/">Chusky</Link><span aria-hidden="true">/</span><span>{eyebrow}</span></div>
      <div className={styles.heroGrid}>
        <h1 id="page-title">{title}</h1>
        <div className={styles.heroIntro}><p>{description}</p><div className={styles.heroActions}><Link href="/sign-up" className={styles.primaryAction}>Start for Free <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href="/sign-in" className={styles.secondaryAction}>Sign in <ArrowUpRight size={15} aria-hidden="true" /></Link></div></div>
      </div>
    </section>
  );
}

export function ProductPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#page-content">Skip to content</a>
      <Navigation />
      <main id="page-content" className={styles.main}>{children}</main>
      <FooterSection quiet />
    </div>
  );
}

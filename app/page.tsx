import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FooterSection } from "@/components/landing/footer-section";
import { HomepageSections } from "@/components/landing/homepage-sections";
import styles from "@/components/landing/homepage.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <Navigation />
      <main id="main-content">
        <HeroSection />
        <HomepageSections />
      </main>
      <FooterSection quiet />
    </div>
  );
}

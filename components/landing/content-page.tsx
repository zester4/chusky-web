import { ProductPageHero, ProductPageShell } from "./product-page";
import styles from "./product-page.module.css";

type ContentPageProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
};

export function ContentPage({ eyebrow, title, description, children }: ContentPageProps) {
  return <ProductPageShell><ProductPageHero eyebrow={eyebrow} title={title} description={description} />{children}</ProductPageShell>;
}

export function ContentSection({ id, eyebrow, title, description, children, className = "" }: { id?: string; eyebrow: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`${styles.contentSection} ${className}`}>
      <div>
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>{eyebrow}</p><div><h2>{title}</h2>{description && <div className={styles.description}>{description}</div>}</div></div>
        {children && <div className={styles.sectionBody}>{children}</div>}
      </div>
    </section>
  );
}

export function ContentCard({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return <article className={styles.contentCard}>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h3>{title}</h3><div>{children}</div></article>;
}

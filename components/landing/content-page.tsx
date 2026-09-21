import { ProductPageHero, ProductPageShell } from "./product-page";

type ContentPageProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  artwork?: { src: string; alt: string };
  children: React.ReactNode;
};

export function ContentPage({ eyebrow, title, description, artwork, children }: ContentPageProps) {
  return (
    <ProductPageShell>
      <ProductPageHero eyebrow={eyebrow} title={title} description={description} artwork={artwork} />
      {children}
    </ProductPageShell>
  );
}

export function ContentSection({ id, eyebrow, title, description, children, className = "" }: { id?: string; eyebrow: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`border-b border-foreground/10 py-14 sm:py-20 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-5xl">{title}</h2>
          {description && <div className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</div>}
        </div>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

export function ContentCard({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <article className="border border-foreground/10 bg-background p-5 transition-colors hover:border-foreground/25 sm:p-7">
      {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-chusky-amber">{eyebrow}</p>}
      <h3 className="mt-3 font-display text-2xl leading-tight tracking-tight">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </article>
  );
}

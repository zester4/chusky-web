import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navigation } from "./navigation";
import { FooterSection } from "./footer-section";
import { Button } from "@/components/ui/button";

type ProductPageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
};

export function ProductPageHero({ eyebrow, title, description }: ProductPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-foreground/10 pt-40 pb-24 lg:pt-48 lg:pb-32">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.04]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
            <span className="w-8 h-px bg-foreground/30" />
            {eyebrow}
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-display leading-[0.88] tracking-tight mb-10">
            {title}
          </h1>
          <p className="text-xl lg:text-2xl leading-relaxed text-muted-foreground max-w-2xl mb-10">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5 text-sm">
              <Link href="/start-creating">
                Start creating <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-11 px-5 text-sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      {children}
      <FooterSection />
    </main>
  );
}

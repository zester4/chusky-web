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
    <section className="relative overflow-hidden border-b border-foreground/10 pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-40 lg:pb-24">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.04]" />
      </div>
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl">
          <span className="mb-6 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-7 sm:text-sm">
            <span className="h-px w-6 bg-foreground/30 sm:w-8" />
            {eyebrow}
          </span>
          <h1 className="mb-6 text-4xl font-display leading-[0.92] tracking-tight sm:mb-7 sm:text-6xl md:text-7xl lg:mb-8 lg:text-[7rem]">
            {title}
          </h1>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mb-7 sm:text-lg lg:mb-8 lg:text-xl">
            {description}
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button asChild className="h-10 rounded-full bg-foreground px-4 text-xs text-background hover:bg-foreground/90">
              <Link href="/sign-up">
                Sign up <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-4 text-xs">
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

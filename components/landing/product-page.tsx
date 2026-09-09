import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Navigation } from "./navigation";
import { FooterSection } from "./footer-section";
import { Button } from "@/components/ui/button";

type ProductPageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  artwork?: {
    src: string;
    alt: string;
  };
};

export function ProductPageHero({ eyebrow, title, description, artwork }: ProductPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-foreground/10 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.04]" />
        <div className="absolute -left-24 top-28 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className={artwork ? "grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)] lg:gap-14" : "max-w-4xl"}>
          <div className="max-w-4xl">
            <span className="mb-6 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-7 sm:text-sm">
              <span className="h-px w-6 bg-foreground/30 sm:w-8" />
              {eyebrow}
            </span>
            <h1 className="mb-6 text-4xl font-display leading-[0.92] tracking-tight sm:mb-7 sm:text-6xl md:text-7xl lg:mb-8 lg:text-[clamp(4.5rem,7vw,7rem)]">
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
          {artwork && (
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-[#10182d] p-1 shadow-[0_24px_70px_-35px_rgba(7,15,35,0.65)] sm:rounded-[2rem]">
                <Image
                  src={artwork.src}
                  alt={artwork.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(145deg,transparent_52%,rgba(8,18,39,0.48))]" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0c1530]/80 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:left-5 sm:top-5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  Chusky at work
                </div>
                <span className="chusky-orbit absolute -right-3 bottom-8 h-12 w-12 rounded-full border-[7px] border-cyan-300/90 bg-[#10204a] shadow-[0_0_24px_rgba(103,232,249,0.7)]" aria-hidden="true" />
                <span className="absolute right-10 top-12 h-3 w-10 rotate-[-35deg] rounded-full bg-orange-400" aria-hidden="true" />
                <span className="absolute right-5 top-[4.6rem] h-3 w-6 rotate-[-35deg] rounded-full bg-orange-400" aria-hidden="true" />
              </div>
            </div>
          )}
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

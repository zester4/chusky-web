import Link from "next/link";
import { ArrowUpRight, Globe2, MousePointer2, Search, ShieldCheck } from "lucide-react";

const browserSteps = [
  {
    number: "01",
    title: "Read the page",
    description: "Find visible text, page structure, and the controls that matter.",
    icon: Search,
  },
  {
    number: "02",
    title: "Work through the site",
    description: "Navigate, click, scroll, select options, and fill forms using real browser controls.",
    icon: MousePointer2,
  },
  {
    number: "03",
    title: "Check what changed",
    description: "Inspect the result and capture a screenshot instead of guessing whether a step worked.",
    icon: ShieldCheck,
  },
];

export function BrowserSection() {
  return (
    <section className="border-b border-foreground/10 bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-12">
        <div data-motion-reveal>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">The Chusky browser</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">
            Give the agent a page. It can take the next step.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Chusky can browse websites, understand what is visible, use page controls, and verify the result. It can help with research, everyday forms, and multi-step web tasks—not just return a link.
          </p>

          <div className="mt-9 space-y-0 border-t border-foreground/10">
            {browserSteps.map(({ number, title, description, icon: Icon }) => (
              <article key={number} className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-foreground/10 py-4 sm:grid-cols-[2.75rem_1fr] sm:gap-4">
                <span className="pt-0.5 font-mono text-[10px] text-chusky-amber">{number}</span>
                <div className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" strokeWidth={1.6} aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-medium">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Your saved login details stay private. If a site asks for a CAPTCHA, verification code, or another step only you can complete, Chusky pauses and lets you take over in the same browser session—then it can continue when you&apos;re ready.
          </p>
          <Link href="/features" className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">
            Explore Chusky&apos;s capabilities <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div data-motion-reveal data-motion-card className="relative mx-auto w-full max-w-2xl border border-foreground/15 bg-background p-3 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.45)] sm:p-5">
          <div className="flex items-center gap-2 border-b border-foreground/10 pb-3">
            <span className="h-2 w-2 rounded-full bg-[#d8a22e]" />
            <span className="h-2 w-2 rounded-full bg-foreground/15" />
            <span className="h-2 w-2 rounded-full bg-foreground/15" />
            <div className="ml-3 flex min-w-0 flex-1 items-center gap-2 border border-foreground/10 bg-background px-3 py-2 text-[10px] text-muted-foreground sm:text-xs">
              <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">A website you ask Chusky to visit</span>
            </div>
          </div>

          <div className="grid min-h-[300px] gap-5 py-5 sm:grid-cols-[1fr_10rem] sm:gap-7 sm:py-7">
            <div className="flex flex-col">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Browser workflow · illustrative</p>
              <div className="mt-5 h-3 w-2/3 bg-foreground/10" />
              <div className="mt-3 h-2 w-full bg-foreground/5" />
              <div className="mt-2 h-2 w-5/6 bg-foreground/5" />
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="border border-foreground/10 p-3">
                  <div className="h-16 bg-muted" />
                  <div className="mt-3 h-2 w-4/5 bg-foreground/10" />
                  <div className="mt-2 h-2 w-1/2 bg-foreground/5" />
                </div>
                <div className="border border-foreground/10 p-3">
                  <div className="h-16 bg-muted" />
                  <div className="mt-3 h-2 w-3/4 bg-foreground/10" />
                  <div className="mt-2 h-2 w-2/5 bg-foreground/5" />
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-6 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Inspect · interact · verify
              </div>
            </div>

            <aside className="border-t border-foreground/10 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">What it can do</p>
              <ul className="mt-4 space-y-3 text-[11px] leading-relaxed text-foreground/75">
                {["Read page content", "Use accessible controls", "Fill and submit forms", "Scroll and navigate", "Capture screenshots"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 shrink-0 bg-chusky-amber" />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          <div className="flex items-center gap-2 border-t border-foreground/10 pt-3 text-[10px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Some websites require a person to complete a security check.
          </div>
        </div>
      </div>
    </section>
  );
}

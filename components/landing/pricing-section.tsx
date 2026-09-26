import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-foreground/10 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Plans and access</p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-5xl">Clear answers, not made-up tiers.</h2>
        </div>
        <div className="border border-foreground/10 p-5 sm:p-8">
          <CircleHelp className="h-5 w-5 text-chusky-amber" aria-hidden="true" />
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            This site does not currently publish a price list or plan limits. Availability depends on the workspace and the providers it has enabled; your signed-in workspace shows its current usage and access.
          </p>
          <div className="mt-7 text-sm">
            <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground underline underline-offset-4">Read the product docs <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

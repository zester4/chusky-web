import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, WandSparkles, Workflow } from "lucide-react";

const moments = [
  { icon: MessageSquare, label: "Talk naturally" },
  { icon: WandSparkles, label: "Find the right tool" },
  { icon: Workflow, label: "Keep work moving" },
];

export function MascotStorySection() {
  return (
    <section className="border-b border-foreground/10 py-10 sm:py-14 lg:py-20">
      <div className="mx-auto grid max-w-[1400px] items-center gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] lg:gap-14 lg:px-12">
        <div className="relative order-2 overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-[#10182d] shadow-[0_20px_70px_-35px_rgba(7,15,35,0.7)] lg:order-1">
          <div className="relative aspect-[4/3]">
            <Image src="/chusky/chusky-studio.png" alt="Chusky in a focused workspace" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081126]/70 to-transparent" />
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0c1530]/80 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:bottom-5 sm:left-5">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            Ready when you are
          </div>
        </div>
        <div className="order-1 max-w-xl lg:order-2">
          <p className="font-mono text-xs text-muted-foreground">ONE CALM CONTROL ROOM</p>
          <h2 className="mt-3 font-display text-4xl leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl">A capable agent, without another complicated system.</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">Bring Chusky a request in the flow of your day. It can connect the right app, carry context forward, and show its work as it goes.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {moments.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-background px-3 py-3 text-xs font-medium sm:flex-col sm:items-start sm:gap-3 sm:px-4">
                <Icon className="h-4 w-4 text-chusky-amber" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
          <Link href="/how-it-works" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
            See how Chusky works <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

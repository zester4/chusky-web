import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Start creating | Chusky AI Agent",
  description: "Start using Chusky from Telegram or a linked terminal and connect your tools in minutes.",
};

const startingPoints = [
  {
    icon: Bot,
    title: "Connect Telegram",
    description: "Give Chusky a task in natural language and let it find the right tools for the job.",
    href: "#telegram",
  },
  {
    icon: Terminal,
    title: "Link your terminal",
    description: "Continue the same Redis-backed session from a terminal with an optional isolated workspace.",
    href: "#terminal",
  },
  {
    icon: Zap,
    title: "Explore the tools",
    description: "Discover apps, triggers, shell commands, scheduling, and automations through one agent.",
    href: "/features",
  },
];

export default function StartCreatingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Start creating"
        title={<>Make work<br /><span className="text-muted-foreground">move faster.</span></>}
        description="Chusky is the AI agent that brings your apps, tools, and workflows together. Start in Telegram, then keep going wherever you work."
      />
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
            {startingPoints.map(({ icon: Icon, title, description, href }) => (
              <Link key={title} href={href} className="group bg-background p-8 lg:p-10 min-h-64 border border-transparent hover:border-foreground transition-colors">
                <Icon className="w-6 h-6 mb-12" aria-hidden="true" />
                <h2 className="font-display text-3xl mb-4">{title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">{description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5 text-sm">
              <Link href="/sign-in">I already have an account <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-11 px-5 text-sm">
              <Link href="/features">See all features</Link>
            </Button>
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}

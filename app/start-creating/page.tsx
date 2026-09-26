import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, MonitorCog, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Start creating | Chusky AI Agent",
  description: "Create a Chusky account and choose a first task for your agent.",
};

const startingPoints = [
  {
    icon: Bot,
    title: "Start a conversation",
    description: "Start in a conversation. Chusky can use native capabilities and the connected-app actions available to your account.",
    href: "/sign-up",
  },
  {
    icon: MonitorCog,
    title: "Give your agent a computer",
    description: "Computer and browser work is available when the workspace has its execution provider configured.",
    href: "/features",
  },
  {
    icon: Zap,
    title: "Explore the tools",
    description: "Review the supported app connections and learn how enabled actions, approvals, and durable workflows behave.",
    href: "/features",
  },
];

export default function StartCreatingPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Start creating"
        title={<>Start with a task.<br /><span className="text-muted-foreground">See what is enabled.</span></>}
        description="Create your account, try a request in chat, then connect an app or provider only when your task needs it. Some capabilities require workspace setup."
        artwork={{ src: "/chusky/chusky-workflow.png", alt: "Chusky helping work move from idea to delivery" }}
      />
      <section className="py-14 sm:py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
          <div className="grid gap-px bg-foreground/10 md:grid-cols-3">
            {startingPoints.map(({ icon: Icon, title, description, href }) => (
              <Link key={title} href={href} className="group min-h-52 border border-transparent bg-background p-5 transition-colors hover:border-foreground sm:min-h-64 sm:p-8 lg:p-10">
                <Icon className="mb-8 h-5 w-5 sm:mb-12 sm:h-6 sm:w-6" aria-hidden="true" />
                <h2 className="mb-3 font-display text-2xl sm:mb-4 sm:text-3xl">{title}</h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:mb-8">{description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-2.5 sm:mt-16 sm:flex-row sm:items-center sm:gap-4">
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

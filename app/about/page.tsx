import Link from "next/link";
import { ArrowRight, Bot, MessageSquare, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPageShell } from "@/components/landing/product-page";

export const metadata = {
  title: "About | Chusky AI Agent",
  description: "Learn how Chusky brings conversations, tools, and durable work into one calm workspace.",
};

const principles = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Start where work already happens",
    description: "Talk to Chusky from the channels you already use, then continue the same work from the web dashboard or terminal.",
  },
  {
    number: "02",
    icon: Workflow,
    title: "Make useful work durable",
    description: "Tasks, reminders, approvals, delivery attempts, and connected actions are designed to survive a single chat or process restart.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Keep people in control",
    description: "Chusky asks before consequential actions, keeps channel identities linked to an owner, and makes operational state visible.",
  },
];

export default function AboutPage() {
  return (
    <ProductPageShell>
      <section className="relative overflow-hidden border-b border-foreground/10 pt-40 pb-24 lg:pt-48 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.04]" />
          <div className="absolute -right-32 top-12 h-96 w-96 rounded-full border border-foreground/10" />
          <div className="absolute -right-8 top-36 h-56 w-56 rounded-full border border-foreground/10" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="max-w-5xl">
              <span className="mb-8 inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
                <span className="h-px w-8 bg-foreground/30" />
                About Chusky
              </span>
              <h1 className="font-display text-6xl leading-[0.88] tracking-tight md:text-8xl lg:text-[9rem]">
                A calmer way<br />
                <span className="text-muted-foreground">to put AI to work.</span>
              </h1>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground lg:pb-3">
              Chusky is an agent workspace for turning a message into reliable, connected work—without turning your day into another system to manage.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10 py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-sm font-mono text-muted-foreground">Why we built it</p>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/15">
              <Bot className="h-5 w-5" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h2 className="max-w-3xl font-display text-4xl leading-tight tracking-tight md:text-6xl">
              The best assistant is present when you need it and accountable when work matters.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Chusky combines natural conversation with durable tasks, private context, human approvals, and real delivery monitoring. The result is an agent that can help in the moment while remaining understandable after the moment has passed.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-3">
            {principles.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="border-foreground/10 py-10 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{number}</span>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-16 font-display text-3xl tracking-tight">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-10 px-6 lg:flex-row lg:items-end lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-mono text-muted-foreground">The invitation</p>
            <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">Bring your work into one thoughtful loop.</h2>
          </div>
          <Button asChild className="h-11 rounded-full bg-foreground px-5 text-sm text-background hover:bg-foreground/90">
            <Link href="/start-creating">Start creating <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </ProductPageShell>
  );
}

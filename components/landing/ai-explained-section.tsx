import Link from "next/link";

const layers = [
  ["01", "Reason", "The model turns a request into a plan, asks for missing context when necessary, and chooses among capabilities rather than pretending every tool is always available."],
  ["02", "Use", "Native tools, connected apps, research, browser work, and artifact builders run through typed boundaries with account ownership and policy checks."],
  ["03", "Remember", "Threads, memories, files, approvals, tasks, and missions give the work a durable address. A later response can continue from state instead of guessing from a transcript."],
];

export function AiExplainedSection() {
  return <section className="border-y border-foreground/10 bg-foreground/[0.02] py-16 sm:py-20 lg:py-28"><div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-12"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">What the AI is doing</p><h2 className="mt-4 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">The answer is only one part of the agent.</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Chusky combines model reasoning with controlled execution. That means it can help interpret a goal, gather evidence, take a supported action, and leave behind a result you can inspect.</p><Link href="/how-it-works" className="mt-6 inline-flex text-sm underline underline-offset-4">See the full lifecycle ↗</Link></div><div className="divide-y divide-foreground/10 border-y border-foreground/10">{layers.map(([number,title,text])=><article key={number} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr] sm:gap-6"><span className="font-mono text-xs text-muted-foreground">{number}</span><div><h3 className="font-display text-2xl tracking-tight sm:text-3xl">{title}</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{text}</p></div></article>)}</div></div></section>;
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const examples = [
  {
    number: "01",
    category: "Research → deliverable",
    title: "Turn a question into a report.",
    request: "Compare the options, pull out the trade-offs, and give me a report I can share.",
    result: "Chusky can research the question, organize the findings, and create a supported document such as a PDF or DOCX.",
  },
  {
    number: "02",
    category: "Connected-app work",
    title: "Move a task closer to done.",
    request: "Find the latest project updates and prepare the follow-up for the team.",
    result: "Chusky can use actions available to your connected accounts, then show the result. Actions covered by approval policy pause for your review.",
  },
  {
    number: "03",
    category: "Multi-step work",
    title: "Keep the thread when the work takes longer.",
    request: "Track this deliverable, note what is blocked, and pick it up when it is ready.",
    result: "Tasks and missions retain progress you can inspect or resume. Background continuation depends on production persistence and scheduling setup.",
  },
];

export function WorkExamplesSection() {
  return (
    <section className="border-b border-foreground/10 bg-[#f7f7f4] py-16 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">A few ways to put it to work</p>
          <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">Give it a real job. Keep the result.</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Chusky is built to carry a request through useful steps—not just return another paragraph. Here are examples of the work it can help move forward.
          </p>
          <Link href="/features" className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">
            Explore capabilities <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-foreground/10 border-y border-foreground/10">
          {examples.map((example) => (
            <article key={example.number} className="grid gap-5 py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6 sm:py-9">
              <span className="font-mono text-xs text-muted-foreground">{example.number}</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-chusky-amber">{example.category}</p>
                <h3 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">{example.title}</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">You ask</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">“{example.request}”</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Chusky can</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{example.result}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground lg:col-start-2">
          Available actions depend on your connected accounts, permissions, and deployment configuration. Chusky does not claim an action is complete until it has a result to show.
        </p>
      </div>
    </section>
  );
}

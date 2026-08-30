const surfaces = [
  { label: "Talk", title: "Telegram + iMessage", text: "Message Chusky where conversations already happen. Sendblue adds images, audio transcription, typing indicators, read receipts, and tapbacks." },
  { label: "Work", title: "Tasks + Daytona", text: "Give Chusky a durable objective, then let it work through files, code, browsers, and isolated computer sessions without losing its place." },
  { label: "Remember", title: "Memory + scratchpad", text: "Keep lasting facts explicit and temporary notes private. Chusky brings back only the context relevant to the request." },
  { label: "Trust", title: "Approvals + delivery", text: "Review risky actions before they happen. Redis-backed outbox delivery and workflow retries keep important results moving." },
];

export function AgentLoopSection() {
  return (
    <section className="relative border-y border-foreground/10 bg-[#f7f7f4] py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.4fr] lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="h-px w-8 bg-foreground/30" />
              The agent loop
            </span>
            <h2 className="mt-6 max-w-xl text-4xl font-display tracking-tight lg:text-6xl">More than a chat box.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">Chusky connects conversation, context, tools, safety, and durable delivery into one personal operating layer.</p>
            <a href="#how-it-works" className="mt-8 inline-flex text-xs underline underline-offset-4">See how it works <span className="ml-2">↗</span></a>
          </div>
          <div className="grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-2">
            {surfaces.map((surface, index) => (
              <article key={surface.title} className="bg-background p-6 lg:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{surface.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">0{index + 1}</span>
                </div>
                <h3 className="mt-10 text-2xl font-display tracking-tight">{surface.title}</h3>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">{surface.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

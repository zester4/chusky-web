const surfaces = [
  { label: "Talk", title: "Telegram + iMessage", text: "Message Chusky where conversations already happen. Sendblue adds images, audio transcription, typing indicators, read receipts, and tapbacks." },
  { label: "Work", title: "Tasks + Daytona", text: "Give Chusky a durable objective, then let it work through files, code, browsers, and isolated computer sessions without losing its place." },
  { label: "Remember", title: "Memory + scratchpad", text: "Keep lasting facts explicit and temporary notes private. Chusky brings back only the context relevant to the request." },
  { label: "Trust", title: "Approvals + delivery", text: "Review risky actions before they happen. Redis-backed outbox delivery and workflow retries keep important results moving." },
];

export function AgentLoopSection() {
  return (
    <section className="relative border-y border-foreground/10 bg-[#f7f7f4] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="h-px w-8 bg-foreground/30" />
              The agent loop
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-display tracking-tight sm:text-4xl lg:text-5xl">More than a chat box.</h2>
            <p className="mt-4 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">Chusky connects conversation, context, tools, safety, and durable delivery into one personal operating layer.</p>
            <a href="#how-it-works" className="mt-6 inline-flex text-[11px] underline underline-offset-4">See how it works <span className="ml-2">↗</span></a>
          </div>
          <div className="grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-2">
            {surfaces.map((surface, index) => (
              <article key={surface.title} className="bg-background p-5 sm:p-6 lg:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{surface.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-display tracking-tight sm:text-2xl">{surface.title}</h3>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground sm:text-xs">{surface.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

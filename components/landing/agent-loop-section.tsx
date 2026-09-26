const surfaces = [
  { label: "Connect", title: "Work in your connected apps", text: "Chusky discovers and uses actions available to linked accounts. Provider and action availability depends on your connection and permissions." },
  { label: "Create", title: "Return a usable deliverable", text: "Ask for a report, spreadsheet, presentation, or another supported file. Verified artifacts can be retrieved from your workspace." },
  { label: "Continue", title: "Keep longer work addressable", text: "Missions, tasks, reminders, and run history give multi-step work saved state to review or resume. Background continuation requires production persistence and scheduling." },
  { label: "Review", title: "Pause at important boundaries", text: "Actions covered by approval policy wait for an owner decision tied to that request; an ordinary chat message does not replace approval." },
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
            <h2 className="mt-5 max-w-xl text-3xl font-display tracking-tight sm:text-4xl lg:text-4xl">More than a chat box.</h2>
            <p className="mt-4 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">Connected actions, useful files, saved progress, and explicit review points are the building blocks of Chusky&apos;s agent loop.</p>
            <a href="/features" className="mt-6 inline-flex text-[11px] underline underline-offset-4">Explore capabilities <span className="ml-2">↗</span></a>
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

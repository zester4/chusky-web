import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const orbitItems = [
  { name: "Connected apps", category: "Email, calendar, CRM", logo: "/logos/composio.svg", tone: "coral", x: "7%", y: "37%", rotate: "-12deg", size: "lg" },
  { name: "Slack", category: "Team communication", logo: "/logos/slack.svg", tone: "yellow", x: "17%", y: "14%", rotate: "10deg", size: "md" },
  { name: "Gmail", category: "Inbox and follow-up", logo: "/logos/gmail.svg", tone: "blue", x: "39%", y: "3%", rotate: "-7deg", size: "sm" },
  { name: "Google Calendar", category: "Scheduling", logo: "/logos/google-calendar.svg", tone: "green", x: "65%", y: "7%", rotate: "8deg", size: "md" },
  { name: "Notion", category: "Knowledge and docs", logo: "/logos/notion.svg", tone: "ink", x: "82%", y: "25%", rotate: "-9deg", size: "sm" },
  { name: "iMessage", category: "Private delivery", logo: "/logos/imessage.svg", tone: "blue", x: "84%", y: "61%", rotate: "12deg", size: "md" },
  { name: "Twilio", category: "Calls and SMS", logo: "/logos/twilio.svg", tone: "coral", x: "66%", y: "84%", rotate: "-8deg", size: "lg" },
  { name: "Browser work", category: "Private website tasks", logo: "/logos/daytona.svg", tone: "yellow", x: "38%", y: "88%", rotate: "7deg", size: "sm" },
  { name: "Files and outputs", category: "Reports and artifacts", logo: "/logos/file.svg", tone: "green", x: "13%", y: "72%", rotate: "-10deg", size: "md" },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="relative overflow-hidden border-y border-foreground/10 bg-background py-16 sm:py-20 lg:py-28" aria-labelledby="integrations-title">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="relative mx-auto aspect-square max-w-[840px] lg:min-h-[760px]">
          <div className="absolute inset-[9%] rounded-full border border-foreground/[0.07]" aria-hidden="true" />
          <div className="absolute inset-[20%] rounded-full border border-dashed border-foreground/[0.06]" aria-hidden="true" />
          <div className="absolute inset-[34%] rounded-full bg-primary/[0.04] blur-3xl" aria-hidden="true" />

          <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center sm:px-12">
            <div className="max-w-[31rem]">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-primary sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                Work across your tools
              </p>
              <h2 id="integrations-title" className="mt-5 font-display text-[clamp(2.35rem,6vw,4.75rem)] leading-[0.9] tracking-tight">
                One agent for the work between apps.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Chusky connects the research, messages, meetings, files, and follow-through that keep your work moving. Connect what you use, then ask for the outcome—not a sequence of tabs.
              </p>
              <Link href="/integrations" className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
                Explore connected apps
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="hidden sm:block" aria-label="Examples of connected app and work categories">
            {orbitItems.map((item) => (
              <div key={item.name} className="absolute z-20" style={{ left: item.x, top: item.y, transform: `rotate(${item.rotate})` }}>
                <div className={`integration-orbit-badge integration-orbit-badge-${item.size} integration-orbit-tone-${item.tone} group`} title={`${item.name}: ${item.category}`}>
                  <Image src={item.logo} alt="" width={36} height={36} className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8" />
                  <span className="hidden whitespace-nowrap text-[10px] font-medium sm:block">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:hidden" aria-label="Examples of connected app and work categories">
          {orbitItems.map((item) => (
            <div key={item.name} className={`integration-orbit-mobile-card integration-orbit-tone-${item.tone}`}>
              <Image src={item.logo} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
              <span className="min-w-0"><span className="block truncate text-xs font-medium">{item.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{item.category}</span></span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground">
          Availability depends on the connected account, permissions, and deployment configuration. Chusky only presents an external action as complete when it has a result to show.
        </p>
      </div>
    </section>
  );
}

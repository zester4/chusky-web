import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const channels = [
  { name: "Telegram", logo: "/logos/telegram.svg" },
  { name: "Slack", logo: "/logos/slack.svg" },
  { name: "WhatsApp", logo: "/logos/whatsapp.svg" },
  { name: "iMessage via Sendblue" },
  { name: "SMS via Twilio", logo: "/logos/twilio.svg" },
  { name: "XChat", logo: "/logos/x-twitter.svg" },
  { name: "Web dashboard" },
  { name: "Terminal CLI" },
];

const meetingPlatforms = [
  { name: "Zoom", logo: "/logos/zoom.svg" },
  { name: "Google Meet", logo: "/logos/google-meet.svg" },
  { name: "Microsoft Teams", logo: "/logos/microsoft-teams.svg" },
  { name: "Webex", logo: "/logos/webex.svg" },
];

export function ChannelsSection() {
  return (
    <section className="border-b border-foreground/10 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">One agent, many ways in</p>
          <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">Meet Chusky where the work happens.</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start in a conversation, continue from the web, or bring the agent into your own product. Chusky is available across supported messaging channels, the terminal, and developer interfaces.
          </p>
        </div>

        <div>
          <ul aria-label="Supported ways to access Chusky" className="grid grid-cols-2 border-l border-t border-foreground/10 sm:grid-cols-4">
            {channels.map((channel) => (
              <li key={channel.name} className="flex min-h-20 items-center gap-3 border-b border-r border-foreground/10 px-3 py-4 text-sm sm:min-h-24 sm:px-4 sm:text-base">
                {channel.logo ? (
                  <Image src={channel.logo} alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                ) : null}
                <span>{channel.name}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-4 border-t border-foreground/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Channel setup and features vary. Link the accounts you want to use; private histories stay scoped and are not automatically merged across every channel.
            </p>
            <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-3 text-sm">
              <a href="https://github.com/zester4/chusky#terminal-cli" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                CLI setup <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a href="https://www.npmjs.com/package/@chusky/sdk" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                TypeScript SDK <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <Link href="/docs/quickstart" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                Build with Chusky <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MeetingsAndCallsSection() {
  return (
    <section className="border-b border-foreground/10 bg-[#f7f7f4] py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">For work that happens in real time</p>
          <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-5xl">Show up for the conversation. Carry the next step forward.</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Chusky can join supported meetings, help with configured business phone workflows, and keep agreed follow-ups connected to the work that came before.
          </p>
        </div>

        <div className="mt-10 grid border border-foreground/10 bg-background sm:grid-cols-2">
          <article className="border-b border-foreground/10 p-5 sm:border-b-0 sm:border-r sm:p-7 lg:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Meetings</p>
            <h3 className="mt-4 font-display text-2xl tracking-tight sm:text-3xl">Join the room, not just the invite.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Join meetings on Zoom, Google Meet, Microsoft Teams, or Webex. With a configured meeting profile, Chusky can participate, capture outcomes, and help turn agreed next steps into follow-up work.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Supported meeting platforms">
              {meetingPlatforms.map((platform) => (
                <li key={platform.name} className="inline-flex items-center gap-2 border border-foreground/10 px-3 py-2 text-xs text-foreground">
                  <Image src={platform.logo} alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
                  {platform.name}
                </li>
              ))}
            </ul>
          </article>

          <article className="p-5 sm:p-7 lg:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Business voice</p>
            <h3 className="mt-4 font-display text-2xl tracking-tight sm:text-3xl">Handle the call. Keep the commitment.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Configured voice providers support inbound calls and outbound calls for purposes such as answering customer questions, confirming details, and following up on an agreed next step.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Meeting follow-through can capture contacts and agreed actions, then use only the connected tools the owner has granted for that work.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 border border-foreground/10 px-3 py-2 text-xs text-muted-foreground">
              <Image src="/logos/twilio.svg" alt="" aria-hidden="true" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
              Configured business phone workflows
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-foreground/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Meeting and phone features require provider configuration and workspace permissions. A meeting host may need to admit Chusky; follow-up actions are limited to the owner&apos;s granted tools.
          </p>
          <Link href="/features" className="inline-flex shrink-0 items-center gap-2 text-sm underline underline-offset-4">
            Explore agent capabilities <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

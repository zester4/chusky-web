import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductPageHero, ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Changelog | Chusky",
  description: "A dated record of Chusky product updates across missions, connected apps, developer tools, and operations.",
};

const updates = [
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Developer platform · Generated images",
    title: "Generated images are available to API and SDK clients",
    summary: "Completed runs include metadata for generated images saved to the owner's private image store, and the dashboard can render those previews.",
    details: [
      "The SDK can request a fresh, short-lived download URL through an owner-scoped endpoint; project keys need images:read.",
      "Image bytes, object-storage keys, and signed URLs are not stored in run records. The web client refreshes the link when it loads the image.",
    ],
  },
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Slack · Media delivery",
    title: "Slack replies can include generated images and files",
    summary: "Chusky can deliver supported generated media in Slack replies using Slack's current external file-upload flow.",
    details: [
      "Media is staged from the linked owner's private storage and uploaded directly to the selected Slack conversation or thread.",
      "The Slack app needs the files:write permission; existing installations may need to be re-authorized after that permission is added.",
      "Delivery is confirmed from Slack's file receipt. If completion is uncertain, Chusky records the ambiguity instead of blindly uploading again.",
    ],
  },
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Operations · Verification",
    title: "Provider readiness requires evidence for each capability",
    summary: "A configured integration is no longer mistaken for a proven one, and a single generic smoke check cannot certify every channel and media path.",
    details: [
      "Signed provider reports must include fresh, separate inbound-text, inbound-image, outbound-text, and outbound-image observations.",
      "Each observation is tied to a hashed provider event or receipt identifier; raw identifiers and payloads are not stored in the proof record.",
      "Incomplete or expired reports remain unverified. This contract does not itself claim that a live provider test has passed.",
      "Operators can run a staging-only signed-webhook boundary check without sending messages or changing readiness; it does not certify inbound message handling, media, or delivery.",
    ],
  },
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Missions · Replay",
    title: "Mission replay keeps approval history exact",
    summary: "Replaying a mission now matches approval waits and resumptions by their persisted approval ID, rather than by similar-looking event text.",
    details: [
      "New lifecycle events retain the approval identity needed to reconstruct the exact wait-and-resume sequence.",
      "Older or incomplete history is reported as incomplete instead of being guessed into a successful replay.",
      "This makes mission timelines and recovery decisions more dependable without changing who can approve an action.",
    ],
  },
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Missions · Recovery",
    title: "Mission recovery now checks the result",
    summary: "A recovery action is not treated as done just because a provider accepted a request.",
    details: [
      "Consequential compensation runs against the exact connected-app action covered by an unexpired owner approval.",
      "Chusky stores the external receipt and performs a fresh provider read-back against the expected state before marking recovery successful.",
      "If the provider outcome is uncertain, the mission reconciles its state instead of blindly sending the same write again.",
    ],
  },
  {
    date: "2026-09-26",
    dateLabel: "September 26, 2026",
    area: "Images · Connected apps",
    title: "Images can move from chat into app workflows",
    summary: "Use an image already in the conversation, a generated image, or a saved asset in supported Gmail, Facebook, LinkedIn, and other connected-app actions.",
    details: [
      "Chusky matches each action's current input schema and handles legacy LinkedIn media-action shapes; availability depends on the connected account and its available actions.",
      "Image bytes and signed URLs stay on the trusted server, and separate upload and publish steps remain distinct when a provider requires them.",
    ],
  },
  {
    date: "2026-09-25",
    dateLabel: "September 25, 2026",
    area: "Missions · Verification",
    title: "Mission outcomes can be checked against provider state",
    summary: "Supported outcome checks now use an exact read-only action from the owner's connected-app session.",
    details: [
      "Fresh provider observations are redacted, timestamped, and linked to mission evidence.",
      "A model-generated summary or caller-supplied pass result is not enough to close a strict mission.",
    ],
  },
  {
    date: "2026-09-25",
    dateLabel: "September 25, 2026",
    area: "Operations · Reliability",
    title: "A clearer view of receipts, verification, and readiness",
    summary: "The operator reliability surfaces bring mission timelines and provider evidence into an owner-scoped view.",
    details: [
      "Inspect external-action receipts, outcome verification, delivery recovery, and provider-proof status together.",
      "Configured providers are not automatically presented as certified; missing or stale proof remains visible as unverified.",
    ],
  },
  {
    date: "2026-09-25",
    dateLabel: "September 25, 2026",
    area: "Integrations · MCP",
    title: "Third-party MCP servers are checked before they are saved",
    summary: "Connections now verify discovery before becoming available to the agent.",
    details: [
      "The integration supports Streamable HTTP and a legacy HTTP+SSE fallback, with bounded tool schemas and results.",
      "Credentials stay encrypted on the trusted backend, and private-network destinations and redirects are rejected.",
    ],
  },
  {
    date: "2026-09-24",
    dateLabel: "September 24, 2026",
    area: "Autonomy · Dashboard",
    title: "Long-running work is easier to inspect and recover",
    summary: "The autonomy workspace brings queued work, blockers, watches, and recovery status into one account-scoped view.",
    details: [
      "Mission and task state can be inspected without presenting a checkpoint as a completed outcome.",
      "Delivery recovery records ambiguous sends for owner review rather than automatically replaying a possibly completed action.",
    ],
  },
  {
    date: "2026-09-23",
    dateLabel: "September 23, 2026",
    area: "Developer platform · API and SDK",
    title: "More durable workflow controls are available to developers",
    summary: "The API and SDK cover owner-scoped autonomy queues and dependency-aware workflow composition.",
    details: [
      "Build parallel-ready stages, retry and budget controls, and approval checkpoints into durable workflows.",
      "The same authenticated identity, ownership, and approval boundaries apply across API clients.",
    ],
  },
  {
    date: "2026-09-22",
    dateLabel: "September 22, 2026",
    area: "Developer platform · A2A",
    title: "External agents can discover and track durable tasks",
    summary: "The A2A surface includes discovery and task lifecycle operations, with the same owner-scoped durable execution model.",
    details: [
      "Clients can create, inspect, paginate, and cancel supported tasks through the documented contract.",
      "Task status and completion remain backed by Chusky's persisted lifecycle rather than a disconnected chat response.",
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <ProductPageShell>
      <ProductPageHero
        eyebrow="Chusky changelog"
        title={<>What changed.<br /><span className="text-muted-foreground">What it means.</span></>}
        description="A running record of product updates across the agent, connected apps, missions, and developer platform. We focus on user-visible changes; routine maintenance commits may not appear here."
      />
      <section aria-label="Product updates" className="border-b border-foreground/10 py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-12">
          <ol className="divide-y divide-foreground/10 border-y border-foreground/10">
            {updates.map((update) => (
              <li key={`${update.date}-${update.title}`} className="grid gap-4 py-7 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8 sm:py-9">
                <div>
                  <time dateTime={update.date} className="text-sm text-muted-foreground">{update.dateLabel}</time>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chusky-amber">{update.area}</p>
                </div>
                <article>
                  <h2 className="font-display text-2xl leading-tight tracking-tight sm:text-3xl">{update.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{update.summary}</p>
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground/80">
                    {update.details.map((detail) => <li key={detail} className="flex gap-3"><span aria-hidden="true" className="mt-[0.65rem] h-1 w-1 shrink-0 rounded-full bg-chusky-amber" /><span>{detail}</span></li>)}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-4 border border-foreground/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="font-display text-xl tracking-tight">See the product in action</p>
              <p className="mt-1 text-sm text-muted-foreground">Explore the capabilities and developer surfaces behind these updates.</p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <Link href="/features" className="inline-flex items-center gap-2 underline underline-offset-4">Features <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/developers" className="inline-flex items-center gap-2 underline underline-offset-4">Developers <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}

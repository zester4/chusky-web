"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Activity, ArrowUpRight, Boxes, CheckCircle2, CircleAlert, FileOutput, Link2, MessageSquare, Radar, RefreshCw, ShieldCheck, TriangleAlert, Wrench, Workflow, Zap } from "lucide-react";
import { chuskyApi, type AccountOverview, type Activity as ActivitySnapshot, type Artifact, type AutonomySnapshot, type ChannelConnection, type ConnectedAccount, type Delivery, type HealthSnapshot, type McpConnection, type Mission, type Page, type Thread, type Tool, type Usage, type Worker } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { DASHBOARD_REFRESH_INTERVAL_MS } from "@/lib/polling-policy";
import { Button, Card, PageHeading, Status } from "./app-shell";

type OptionalResult<T> = { value: T; failed?: string };

type OverviewData = {
  usage: Usage;
  threads: Page<Thread>;
  health: HealthSnapshot;
  account: AccountOverview;
  workers: Worker[];
  artifacts: Artifact[];
  channels: ChannelConnection[];
  deliveries: Delivery[];
  activity: ActivitySnapshot;
  autonomy: AutonomySnapshot;
  missions: Mission[];
  connectedAccounts: ConnectedAccount[];
  mcpConnections: McpConnection[];
  tools: Tool[];
};

const emptyActivity: ActivitySnapshot = { now: 0, approvals: [], tasks: [], reminders: [], jobs: [] };
const emptyAutonomy: AutonomySnapshot = {
  userId: 0,
  mode: "personal",
  profile: { enabled: false, defaultAuthority: "observe", maxChecksPerDay: 0, maxAutonomousActionsPerDay: 0, notifyOn: "never" },
  watches: [],
  queue: [],
  counts: {},
  generatedAt: 0,
};

function optional<T>(label: string, promise: Promise<T>, fallback: T): Promise<OptionalResult<T>> {
  return promise.then((value) => ({ value })).catch(() => ({ value: fallback, failed: label }));
}

function formatDate(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function LoadingState() {
  return <div className="flex items-center gap-2 py-10 text-xs text-muted-foreground"><RefreshCw size={15} className="animate-spin" /> Reading your live workspace…</div>;
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
  return <Card className="flex flex-col items-start gap-3 border-amber-300/70 bg-amber-50 p-4"><Status tone="amber">Overview unavailable</Status><p className="max-w-xl text-xs leading-relaxed text-amber-950/70">Chusky could not read the authenticated workspace right now. Your data was not replaced with demo content.</p><Button secondary onClick={onRetry}><RefreshCw size={13} /> Retry</Button></Card>;
}

function SummaryMetric({ label, value, detail, icon, href }: { label: string; value: string; detail: string; icon: ReactNode; href?: string }) {
  const content = <Card className="h-full p-3.5 transition-[border-color,transform] hover:-translate-y-px hover:border-foreground/25 sm:p-4"><div className="flex items-center justify-between text-muted-foreground"><p className="font-mono text-[9px] uppercase tracking-[0.16em]">{label}</p>{icon}</div><p className="mt-2 font-display text-2xl sm:text-3xl">{value}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{detail}</p></Card>;
  return href ? <Link href={href} className="block min-w-0">{content}</Link> : content;
}

function SectionHeading({ eyebrow, title, href, linkLabel = "Open" }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-3 flex items-end justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p><h2 className="mt-1 font-display text-xl tracking-tight">{title}</h2></div>{href && <Link href={href} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">{linkLabel} <ArrowUpRight size={12} /></Link>}</div>;
}

function AttentionRow({ title, detail, href, tone = "amber", icon: Icon = CircleAlert }: { title: string; detail: string; href: string; tone?: "green" | "amber" | "gray"; icon?: ComponentType<{ size?: number }> }) {
  return <Link href={href} className="flex min-w-0 items-start gap-2.5 border-b border-foreground/10 py-3 last:border-0 hover:bg-foreground/[0.025]"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone === "amber" ? "bg-amber-100 text-amber-700" : tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-foreground/[0.06] text-muted-foreground"}`}><Icon size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{title}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail}</span></span><ArrowUpRight size={13} className="mt-1 shrink-0 text-muted-foreground" /></Link>;
}

function CapabilityCard({ title, detail, value, href, icon: Icon }: { title: string; detail: string; value: string; href: string; icon: ComponentType<{ size?: number }> }) {
  return <Link href={href} className="group block min-w-0"><div className="flex h-full min-w-0 gap-3 border border-foreground/10 bg-background p-3.5 transition-[border-color,transform] group-hover:-translate-y-px group-hover:border-foreground/30"><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/10 text-muted-foreground"><Icon size={15} /></span><span className="min-w-0"><span className="flex items-center gap-2 text-xs font-medium">{title}<ArrowUpRight size={12} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></span><span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{detail}</span><span className="mt-2 block font-mono text-[10px] text-foreground/70">{value}</span></span></div></Link>;
}

function ActivityRow({ title, detail, status, href }: { title: string; detail: string; status: string; href: string }) {
  const tone: "green" | "amber" | "gray" = ["failed", "blocked"].includes(status) ? "amber" : ["completed", "success", "cancelled"].includes(status) ? "green" : "gray";
  return <Link href={href} className="flex min-w-0 items-start justify-between gap-3 border-b border-foreground/10 py-3 last:border-0 hover:bg-foreground/[0.025]"><span className="min-w-0"><span className="block truncate text-xs font-medium">{title}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{detail}</span></span><Status tone={tone}>{status}</Status></Link>;
}

function ThreadRows({ threads }: { threads: Thread[] }) {
  if (!threads.length) return <p className="text-xs text-muted-foreground">No conversations yet. Start one from Chat.</p>;
  return <div className="divide-y divide-foreground/10">{threads.slice(0, 5).map((thread) => <Link href={`/app/chat?thread=${encodeURIComponent(thread.id)}`} key={thread.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5 hover:text-foreground"><span className="min-w-0"><span className="block truncate text-xs font-medium">{String(thread.metadata.title || thread.metadata.prompt || "Untitled conversation")}</span><span className="mt-1 block text-[10px] text-muted-foreground">Updated {formatDate(thread.updatedAt)}</span></span><ArrowUpRight size={13} className="shrink-0 text-muted-foreground" /></Link>)}</div>;
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewData>();
  const [degradedSources, setDegradedSources] = useState<string[]>([]);
  const [offline, setOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>();

  const load = async () => {
    setOffline(false);
    try {
      const [usage, threads, health, account, workers, artifacts, channels, deliveries, activity, autonomy, missions, apps, mcp, tools] = await Promise.all([
        chuskyApi.usage.get(),
        chuskyApi.threads.list({ limit: 5 }),
        chuskyApi.health.get(),
        chuskyApi.account.get(),
        optional("workers", chuskyApi.workers.list(), { data: [] as Worker[] }),
        optional("artifacts", chuskyApi.artifacts.list({ limit: 8 }), { data: [] as Artifact[] }),
        optional("channels", chuskyApi.channels.list(), { data: [] as ChannelConnection[] }),
        optional("deliveries", chuskyApi.deliveries.list(), { data: [] as Delivery[] }),
        optional("activity", chuskyApi.activity.get(), emptyActivity),
        optional("attention pulse", chuskyApi.account.autonomy.queue(), emptyAutonomy),
        optional("missions", chuskyApi.missions.list(), { data: [] as Mission[] }),
        optional("connected apps", chuskyApi.apps.connections(), { data: [] as ConnectedAccount[] }),
        optional("MCP connections", chuskyApi.mcp.connections(), { data: [] as McpConnection[] }),
        optional("tools", chuskyApi.tools.list(), { data: [] as Tool[] }),
      ]);
      const optionalResults = [workers, artifacts, channels, deliveries, activity, autonomy, missions, apps, mcp, tools];
      setData({ usage, threads, health, account, workers: workers.value.data, artifacts: artifacts.value.data, channels: channels.value.data, deliveries: deliveries.value.data, activity: activity.value, autonomy: autonomy.value, missions: missions.value.data, connectedAccounts: apps.value.data, mcpConnections: mcp.value.data, tools: tools.value.data });
      setDegradedSources(optionalResults.flatMap((result) => result.failed ? [result.failed] : []));
      setLastUpdated(Date.now());
    } catch {
      setOffline(true);
    }
  };

  useEffect(() => { void load(); }, []);
  useLiveData(load, DASHBOARD_REFRESH_INTERVAL_MS);

  if (offline) return <><PageHeading eyebrow="Workspace overview" title="Your agent at a glance." description="A live view of what Chusky can do, what it is doing, and what needs you." action={<Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button>} /><OfflineState onRetry={() => void load()} /></>;
  if (!data) return <><PageHeading eyebrow="Workspace overview" title="Your agent at a glance." description="A live view of what Chusky can do, what it is doing, and what needs you." /><LoadingState /></>;

  const pendingApprovals = data.account.approvals.filter((item) => item.status === "pending");
  const failedDeliveries = data.deliveries.filter((item) => ["failed", "ambiguous"].includes(item.status));
  const blockedTasks = data.activity.tasks.filter((item) => ["blocked", "failed"].includes(item.status));
  const waitingMissions = data.missions.filter((item) => ["waiting", "paused", "blocked", "failed"].includes(item.status));
  const attentionItems = [
    ...pendingApprovals.slice(0, 2).map((item) => ({ title: "Approval waiting", detail: item.request || item.toolSlug, href: "/app/approvals", tone: "amber" as const, icon: ShieldCheck })),
    ...failedDeliveries.slice(0, 2).map((item) => ({ title: `${item.provider} delivery needs review`, detail: item.lastError || `${item.status} · ${item.kind}`, href: "/app/delivery", tone: "amber" as const, icon: TriangleAlert })),
    ...blockedTasks.slice(0, 2).map((item) => ({ title: item.title, detail: item.nextAction || item.error || item.status, href: "/app/tasks", tone: "amber" as const, icon: CircleAlert })),
    ...waitingMissions.slice(0, 2).map((item) => ({ title: item.title, detail: item.nextAction || item.checkpoint || item.status, href: "/app/missions", tone: "amber" as const, icon: Workflow })),
    ...data.autonomy.queue.slice(0, 2).map((item) => ({ title: item.title, detail: item.nextAction || item.blockedReason || `${item.source} · priority ${item.priority}`, href: "/app/autonomy", tone: "gray" as const, icon: Radar })),
  ];
  const activeTasks = data.activity.tasks.filter((item) => ["queued", "running"].includes(item.status));
  const activeWorkers = data.workers.filter((item) => !["success", "completed", "cancelled", "failed"].includes(item.status));
  const activeMissions = data.missions.filter((item) => ["queued", "running"].includes(item.status));
  const activityItems = [
    ...activeTasks.slice(0, 3).map((item) => ({ title: item.title, detail: item.checkpoint || "Durable task in progress", status: item.status, href: "/app/tasks" })),
    ...activeWorkers.slice(0, 3).map((item) => ({ title: `Worker · ${item.worker}`, detail: item.objective, status: item.status, href: "/app/workers" })),
    ...activeMissions.slice(0, 3).map((item) => ({ title: item.title, detail: item.nextAction || `${item.steps.length} planned steps`, status: item.status, href: "/app/missions" })),
  ];
  const liveCount = data.usage.runs.active + activeTasks.length + activeWorkers.length + activeMissions.length;

  return <>
    <PageHeading eyebrow="Workspace overview" title="Your agent at a glance." description="A live view of what Chusky can do, what it is doing, and what needs you." action={<div className="flex gap-1.5"><Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button><Button onClick={() => { window.location.assign(`/app/chat?new=1&nonce=${Date.now()}`); }}>New chat</Button></div>} />
    <div className="space-y-4 sm:space-y-5">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${data.health.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}><Activity size={16} /></span><div className="min-w-0"><p className="text-xs font-medium">Chusky is {data.health.ok ? "ready" : "degraded"}</p><p className="mt-1 text-[10px] text-muted-foreground">{data.health.persistence === "redis" ? "Durable workspace storage" : "Development storage"} · refreshes every 10 seconds{lastUpdated ? ` · checked ${formatDate(lastUpdated)}` : ""}</p></div></div><div className="flex flex-wrap items-center gap-2"><Status tone={data.health.ok ? "green" : "amber"}>{data.health.status}</Status><Link href="/app/operations" className="text-[10px] text-muted-foreground hover:text-foreground">Runtime details <ArrowUpRight size={12} className="inline" /></Link></div></Card>
      {degradedSources.length > 0 && <div className="flex items-start gap-2 border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-[10px] leading-relaxed text-amber-950/80"><TriangleAlert size={13} className="mt-0.5 shrink-0" /><span>Some live sections could not refresh: {degradedSources.join(", ")}. The rest of this overview is current.</span></div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><SummaryMetric label="Needs attention" value={String(attentionItems.length)} detail={attentionItems.length ? "Open approvals, blockers, or delivery gaps" : "Nothing is waiting on you"} icon={<CircleAlert size={14} />} href={attentionItems.length ? "/app/autonomy" : undefined} /><SummaryMetric label="Live now" value={String(liveCount)} detail={`${data.usage.runs.active} active agent run${data.usage.runs.active === 1 ? "" : "s"}`} icon={<Zap size={14} />} href="/app/tasks" /><SummaryMetric label="Reachable through" value={String(data.channels.length)} detail={`${data.connectedAccounts.length} connected app account${data.connectedAccounts.length === 1 ? "" : "s"}`} icon={<Link2 size={14} />} href="/app/channels" /><SummaryMetric label="Automations" value={String(data.account.triggers.length + data.autonomy.watches.length + data.activity.jobs.length)} detail={`${data.account.triggers.length} triggers · ${data.autonomy.watches.length} watches`} icon={<Radar size={14} />} href="/app/triggers" /><SummaryMetric label="Outputs" value={String(data.artifacts.length)} detail="Owner-scoped files ready to inspect or download" icon={<FileOutput size={14} />} href="/app/workspace" /></div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4"><SectionHeading eyebrow="Your next decisions" title="Needs your attention" href="/app/autonomy" linkLabel="Open attention" />{attentionItems.length ? <div>{attentionItems.slice(0, 6).map((item, index) => <AttentionRow key={`${item.title}-${index}`} {...item} />)}</div> : <div className="flex items-center gap-3 py-4"><CheckCircle2 size={19} className="text-emerald-600" /><div><p className="text-xs font-medium">Nothing is waiting on you</p><p className="mt-1 text-[10px] text-muted-foreground">Chusky will surface approvals, blockers, delivery uncertainty, and meaningful Pulse findings here.</p></div></div>}</Card>
        <Card className="p-4"><SectionHeading eyebrow="In motion" title="What Chusky is doing" href="/app/tasks" linkLabel="View work" />{activityItems.length ? <div>{activityItems.slice(0, 6).map((item, index) => <ActivityRow key={`${item.title}-${index}`} {...item} />)}</div> : <div className="py-4"><p className="text-xs font-medium">No active work right now</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Start a conversation, mission, trigger, or recurring job and its durable progress will appear here.</p></div>}</Card>
      </div>

      <section><SectionHeading eyebrow="Learn by seeing the real system" title="What Chusky can do" href="/app/capabilities" linkLabel="Browse capabilities" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><CapabilityCard title="Work and follow through" detail="Tasks, missions, workers, and verified outcomes." value={`${data.activity.tasks.length} tasks · ${data.missions.length} missions`} href="/app/missions" icon={Workflow} /><CapabilityCard title="Stay aware" detail="Attention Pulse, triggers, reminders, jobs, and watches." value={`${data.autonomy.watches.length} watches · ${data.activity.jobs.length} jobs`} href="/app/autonomy" icon={Radar} /><CapabilityCard title="Use connected apps" detail="Email, calendar, Slack, CRM, documents, and more." value={`${data.connectedAccounts.length} connected accounts`} href="/app/apps" icon={Boxes} /><CapabilityCard title="Reach you anywhere" detail="Linked channels for proactive updates and delivery." value={`${data.channels.length} linked channels`} href="/app/channels" icon={MessageSquare} /><CapabilityCard title="Research and extend" detail="Native tools, MCP servers, skills, and live research." value={`${data.tools.length} tools · ${data.mcpConnections.length} MCP connections`} href="/app/mcp" icon={Wrench} /><CapabilityCard title="Create useful outputs" detail="Reports, documents, spreadsheets, presentations, and media." value={`${data.artifacts.length} available artifacts`} href="/app/workspace" icon={FileOutput} /></div></section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-4"><SectionHeading eyebrow="Where Chusky can reach you" title="Connected channels" href="/app/channels" linkLabel="Manage channels" />{data.channels.length ? <div className="divide-y divide-foreground/10">{data.channels.slice(0, 6).map((channel) => <div key={channel.id} className="flex items-center justify-between gap-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Link2 size={13} /></span><span className="min-w-0"><span className="block truncate text-xs font-medium">{channel.displayName || channel.provider}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{channel.provider} · {channel.proactiveOptIn ? "proactive updates on" : "reply only"}</span></span></div><Status tone="green">linked</Status></div>)}</div> : <div className="py-4"><p className="text-xs font-medium">No channels linked yet</p><p className="mt-1 text-[10px] text-muted-foreground">Link Telegram, Slack, WhatsApp, iMessage, SMS, or X to receive work outside this dashboard.</p><Link href="/app/channels" className="mt-3 inline-flex text-[10px] font-medium hover:underline">Connect a channel <ArrowUpRight size={12} className="ml-1" /></Link></div>}</Card>
        <Card className="p-4"><SectionHeading eyebrow="Recent results" title="Files and conversations" href="/app/conversations" linkLabel="View conversations" /><div className="grid gap-4 md:grid-cols-2"><div><div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium"><FileOutput size={13} className="text-muted-foreground" /> Latest files</div>{data.artifacts.length ? <div className="space-y-2">{data.artifacts.slice(0, 4).map((artifact) => <a key={artifact.id} href={artifact.downloadUrl || chuskyApi.artifacts.downloadHref(artifact.id)} className="flex min-w-0 items-center justify-between gap-2 text-[10px] hover:underline"><span className="min-w-0 truncate">{artifact.name}</span><ArrowUpRight size={12} className="shrink-0 text-muted-foreground" /></a>)}</div> : <p className="text-[10px] text-muted-foreground">No generated files yet.</p>}</div><div><div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium"><MessageSquare size={13} className="text-muted-foreground" /> Recent conversations</div><ThreadRows threads={data.threads.data} /></div></div></Card>
      </div>

      <Card className="p-4"><SectionHeading eyebrow="Start with an outcome" title="Ask Chusky to take the next step" href="/app/chat?new=1" linkLabel="Open chat" /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Link href="/app/chat?new=1" className="border border-foreground/10 p-3 text-[10px] leading-relaxed transition-colors hover:border-foreground/30">Review what needs my attention.</Link><Link href="/app/chat?new=1" className="border border-foreground/10 p-3 text-[10px] leading-relaxed transition-colors hover:border-foreground/30">Research this topic and create a cited report.</Link><Link href="/app/chat?new=1" className="border border-foreground/10 p-3 text-[10px] leading-relaxed transition-colors hover:border-foreground/30">Prepare me for my next meeting.</Link><Link href="/app/chat?new=1" className="border border-foreground/10 p-3 text-[10px] leading-relaxed transition-colors hover:border-foreground/30">Create a professional document from these files.</Link></div><div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck size={13} className="text-emerald-600" /> The overview shows authenticated workspace data only. Private tool inputs, secrets, and raw provider payloads stay hidden.</div></Card>
    </div>
  </>;
}

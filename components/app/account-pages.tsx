"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Clock3, Copy, ExternalLink, Laptop, Link2, LoaderCircle, MessageSquare, RefreshCw, RotateCcw, ShieldCheck, Trash2, Webhook, Zap } from "lucide-react";
import { chuskyApi, type AccountOverview, type TelegramLinkCode } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

type PageKind = "approvals" | "apps" | "reminders" | "jobs" | "memory" | "scratchpad" | "triggers" | "workspace" | "devices" | "settings";

const copy: Record<PageKind, { eyebrow: string; title: string; description: string }> = {
  approvals: { eyebrow: "Safety center", title: "Approvals", description: "Review externally visible actions before Chusky executes them." },
  apps: { eyebrow: "Channel connections", title: "Connected apps", description: "See the channels currently verified for your Chusky account." },
  reminders: { eyebrow: "One-time automation", title: "Reminders", description: "Durable reminders delivered when they are due." },
  jobs: { eyebrow: "Scheduled automation", title: "Recurring jobs", description: "Recurring schedules currently stored for your account." },
  memory: { eyebrow: "Long-term context", title: "Memory", description: "Facts and preferences you explicitly asked Chusky to remember." },
  scratchpad: { eyebrow: "Private working notes", title: "Scratchpad", description: "Temporary notes saved in your private Chusky session." },
  triggers: { eyebrow: "Real-time events", title: "Triggers", description: "Event trigger IDs owned by this account." },
  workspace: { eyebrow: "Daytona workspace", title: "Workspace", description: "The isolated computer workspace attached to your account." },
  devices: { eyebrow: "CLI access", title: "Devices", description: "Terminals currently linked to your Chusky account." },
  settings: { eyebrow: "Account configuration", title: "Settings", description: "Live account defaults and runtime preferences." },
};

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function Empty({ children }: { children: ReactNode }) { return <p className="p-6 text-sm text-muted-foreground">{children}</p>; }
function Offline({ retry }: { retry: () => void }) { return <Card className="flex flex-col items-start gap-4 p-6"><Status tone="amber">Backend unavailable</Status><p className="text-sm text-muted-foreground">This page needs the authenticated Chusky API to load your private data.</p><Button secondary onClick={retry}><RefreshCw size={14} /> Retry</Button></Card>; }

export function AccountDataPage({ kind }: { kind: PageKind }) {
  const [data, setData] = useState<AccountOverview>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string>();
  const load = async () => { setOffline(false); try { setData(await chuskyApi.account.get()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  const decide = async (id: string, decision: "approve" | "deny") => { setBusy(id); try { await chuskyApi.approvals.decide(id, decision); await load(); } finally { setBusy(undefined); } };
  const heading = copy[kind];
  return <><PageHeading eyebrow={heading.eyebrow} title={heading.title} description={heading.description} action={<Button secondary onClick={() => void load()}><RefreshCw size={14} /> Refresh</Button>} />{offline ? <Offline retry={() => void load()} /> : !data ? <Card className="flex items-center gap-3 p-8 text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin" /> Loading your saved data…</Card> : <Content kind={kind} data={data} decide={decide} busy={busy} />}</>;
}

function Content({ kind, data, decide, busy }: { kind: PageKind; data: AccountOverview; decide: (id: string, decision: "approve" | "deny") => Promise<void>; busy?: string }) {
  if (kind === "approvals") return <Card>{data.approvals.length ? data.approvals.map((item) => <div key={item.id} className="border-b border-foreground/10 p-5 last:border-0"><div className="flex flex-col gap-4 md:flex-row md:items-start"><ShieldCheck className="mt-1 text-amber-600" size={18} /><div className="flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-medium">{item.toolSlug}</h2><Status tone="amber">Expires {date(item.expiresAt)}</Status></div><p className="mt-2 text-sm text-muted-foreground">{item.request}</p><p className="mt-3 font-mono text-[10px] text-muted-foreground">{item.id}{item.channelProvider ? ` · ${item.channelProvider}` : ""}</p></div><div className="flex gap-2"><Button secondary onClick={() => void decide(item.id, "deny")}><Trash2 size={13} /> Deny</Button><Button onClick={() => void decide(item.id, "approve")}><Check size={13} /> {busy === item.id ? "Working" : "Approve"}</Button></div></div></div>) : <Empty>No pending approvals. Chusky will show risky actions here before execution.</Empty>}</Card>;
  if (kind === "apps") return <div className="space-y-4"><Card>{data.channels.length ? data.channels.map((item) => <Row key={`${item.provider}-${item.externalUserId}`} icon={<MessageSquare size={15} />} title={item.displayName || item.provider} detail={`${item.externalUserId}${item.workspaceId ? ` · ${item.workspaceId}` : ""}`} meta={`Verified ${date(item.verifiedAt)}`} status={item.proactiveOptIn ? "Proactive delivery on" : "Replies only"} />) : <Empty>No verified external channels yet. Link Slack, WhatsApp, or Sendblue from Telegram.</Empty>}</Card><Card className="p-5 text-xs text-muted-foreground">Composio app OAuth connections are intentionally not guessed here; this view reflects channel identities persisted by Chusky.</Card></div>;
  if (kind === "reminders") return <Card>{data.reminders.length ? data.reminders.map((item) => <Row key={item.id} icon={<Clock3 size={15} />} title={item.text} detail={`Runs ${date(item.runAt)}`} meta={`Created ${date(item.createdAt)}`} status={item.status} />) : <Empty>No reminders saved yet.</Empty>}</Card>;
  if (kind === "jobs") return <Card>{data.jobs.length ? data.jobs.map((item) => <Row key={item.id} icon={<RotateCcw size={15} />} title={item.text} detail={item.cron} meta={`Created ${date(item.createdAt)}`} status={item.status} />) : <Empty>No recurring jobs saved yet.</Empty>}</Card>;
  if (kind === "memory") return <Card>{data.memory.length ? data.memory.map((item) => <Row key={item.id} icon={<Zap size={15} />} title={item.key} detail={item.value} meta={`${item.category} · ${Math.round(item.confidence * 100)}% confidence · ${date(item.updatedAt)}`} />) : <Empty>No explicit memories saved yet.</Empty>}</Card>;
  if (kind === "scratchpad") return <Card>{data.scratchpad.length ? data.scratchpad.map((item) => <Row key={item.key} icon={<ExternalLink size={15} />} title={item.key} detail={item.content} meta={`Updated ${date(item.updatedAt)}`} />) : <Empty>Your scratchpad is empty.</Empty>}</Card>;
  if (kind === "triggers") return <Card>{data.triggers.length ? data.triggers.map((id) => <Row key={id} icon={<Webhook size={15} />} title={id} detail="Owned Composio trigger" />) : <Empty>No trigger IDs are currently saved for this account.</Empty>}</Card>;
  if (kind === "devices") return <Card>{data.devices.length ? data.devices.map((item) => <Row key={item.name} icon={<Laptop size={15} />} title={item.name} detail={`Last seen ${date(item.lastSeenAt)}`} meta={`Linked ${date(item.createdAt)}`} status="Active" />) : <Empty>No CLI devices are linked.</Empty>}</Card>;
  if (kind === "workspace") return <Card className="p-6">{data.workspace ? <div className="space-y-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center border border-foreground/10"><Laptop size={18} /></span><div><h2 className="text-sm font-medium">{data.workspace.name}</h2><p className="mt-1 text-xs text-muted-foreground">{data.workspace.sandboxId}</p></div><Status tone={data.workspace.lastKnownState === "running" ? "green" : "amber"}>{data.workspace.lastKnownState || "available"}</Status></div><div className="grid gap-3 text-xs sm:grid-cols-3"><Info label="PTY sessions" value={String(data.workspace.ptySessions)} /><Info label="Updated" value={date(data.workspace.updatedAt)} /><Info label="Browser" value={data.workspace.lastUrl || "No page saved"} /></div></div> : <Empty>No Daytona workspace has been created for this account.</Empty>}</Card>;
  return <div className="grid gap-6 lg:grid-cols-2"><Card className="p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Runtime preferences</p><div className="mt-5 space-y-4"><Info label="Selected model" value={data.model} /><Info label="Voice replies" value={data.voiceReplies ? "Enabled" : "Disabled"} /><Info label="Connected channels" value={String(data.channels.length)} /></div></Card><TelegramLink linked={data.telegramLink.linked} /><Card className="p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Developer webhooks</p>{data.webhooks.length ? data.webhooks.map((item) => <Row key={item.id} icon={<Webhook size={15} />} title={item.url} detail={item.id} meta={`Created ${date(item.createdAt)}`} />) : <Empty>No developer webhooks configured.</Empty>}</Card></div>;
}

function TelegramLink({ linked }: { linked: boolean }) {
  const [link, setLink] = useState<TelegramLinkCode>();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();
  const create = async () => {
    setBusy(true); setError(undefined); setCopied(false);
    try { setLink(await chuskyApi.account.createTelegramLink()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a Telegram link code."); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(`/link ${link.code}`); setCopied(true); }
    catch { setError("Copy the command manually, then send it in Telegram."); }
  };
  return <Card className="p-6"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10"><Link2 size={16} /></span><div className="min-w-0 flex-1"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Telegram workspace</p><h2 className="mt-2 text-sm font-medium">{linked ? "Linked to Telegram" : "Link your Telegram workspace"}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{linked ? "This dashboard now reads and controls the same private Chusky workspace as your Telegram account." : "Generate a one-time code, then send it from the Telegram account that already uses Chusky."}</p>{!linked && <div className="mt-4 space-y-3">{link ? <div className="rounded-lg border border-foreground/10 bg-muted/30 p-3"><div className="flex items-center justify-between gap-3"><code className="min-w-0 break-all text-xs">/link {link.code}</code><Button secondary aria-label="Copy Telegram link command" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}</Button></div><p className="mt-2 text-[10px] text-muted-foreground">Send this command in Telegram before {date(link.expiresAt)}. It works once.</p></div> : <Button onClick={() => void create()} disabled={busy}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}{busy ? "Creating code" : "Create link code"}</Button>}{error && <p className="text-xs text-amber-700">{error}</p>}</div>}</div></div></Card>;
}

function Row({ icon, title, detail, meta, status }: { icon: ReactNode; title: string; detail?: string; meta?: string; status?: string }) { return <div className="flex items-start gap-3 border-b border-foreground/10 px-5 py-4 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/10 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{title}</p>{detail && <p className="mt-1 break-words text-xs text-muted-foreground">{detail}</p>}{meta && <p className="mt-2 text-[10px] text-muted-foreground">{meta}</p>}</div>{status && <Status tone={status === "failed" ? "amber" : status === "cancelled" ? "gray" : "green"}>{status}</Status>}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-foreground/10 pb-3 text-xs last:border-0"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] break-words text-right">{value}</span></div>; }

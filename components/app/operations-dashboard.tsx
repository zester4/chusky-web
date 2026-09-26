"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Activity, Clock3, Database, ExternalLink, Gauge, Radio, RefreshCw, Server, ShieldCheck, TriangleAlert, Wifi } from "lucide-react";
import { chuskyApi, type AccountOverview, type HealthSnapshot, type ReliabilityHealth, type OperatorTraceEvent, type Compensation } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";

const labels: Record<string, string> = { redis: "Redis persistence", qstash: "QStash workflows", vector: "Semantic memory search", composioTriggers: "Composio triggers", sendblue: "Sendblue iMessage", twilio: "Twilio voice", twilioSms: "Twilio SMS", xchat: "X Chat", telegram: "Telegram bot" };
const channelLabels: Record<string, string> = { telegram: "Telegram", cli: "CLI", slack: "Slack", whatsapp: "WhatsApp", sendblue: "Sendblue", sms: "SMS", xchat: "X Chat" };

function tone(value: string): "green" | "amber" | "gray" { return value === "ok" || value === "configured" ? "green" : value === "disabled" ? "gray" : "amber"; }
function formatTime(value?: string) { return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "No failures recorded"; }

function HealthCard({ name, value, icon }: { name: string; value: string; icon: ReactNode }) {
  return <div className="flex items-center justify-between border-b border-foreground/10 py-4 last:border-0"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center border border-foreground/10 text-muted-foreground">{icon}</span><span className="text-sm">{name}</span></div><Status tone={tone(value)}>{value}</Status></div>;
}

function Loading() { return <Card className="flex items-center gap-3 p-4 text-xs text-muted-foreground sm:p-5"><RefreshCw size={16} className="animate-spin" /> Reading live service health…</Card>; }
function Offline({ retry }: { retry: () => void }) { return <Card className="flex flex-col items-start gap-3 border-amber-300/70 bg-amber-50 p-4"><Status tone="amber">Dashboard API unavailable</Status><p className="max-w-xl text-xs leading-relaxed text-amber-950/70">The UI is authenticated, but Chusky’s operations endpoint could not be reached. Check the backend URL and service health, then try again.</p><Button secondary onClick={retry}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Retry</Button></Card>; }

export function OperationsDashboard({ deliveryOnly = false }: { deliveryOnly?: boolean }) {
  const [health, setHealth] = useState<HealthSnapshot>();
  const [account, setAccount] = useState<AccountOverview>();
  const [reliability, setReliability] = useState<ReliabilityHealth>();
  const [trace, setTrace] = useState<OperatorTraceEvent[]>([]);
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [offline, setOffline] = useState(false);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string>();
  const [deliveryActionError, setDeliveryActionError] = useState<string>();
  const load = async () => { setOffline(false); try { const [nextHealth, nextAccount, nextReliability, nextTrace, nextCompensations] = await Promise.all([chuskyApi.health.get(), chuskyApi.account.get(), chuskyApi.operator.reliability("agent"), chuskyApi.operator.trace(undefined, 120), chuskyApi.operator.compensations()]); setHealth(nextHealth); setAccount(nextAccount); setReliability(nextReliability.data); setTrace(nextTrace.data); setCompensations(nextCompensations.data); } catch { setOffline(true); } };
  const confirmDelivered = async (id: string) => {
    setConfirmingDeliveryId(id);
    setDeliveryActionError(undefined);
    try {
      await chuskyApi.deliveries.confirmDelivered(id);
      await load();
    } catch {
      setDeliveryActionError("Could not confirm this delivery. Refresh the page and check its current status.");
    } finally {
      setConfirmingDeliveryId(undefined);
    }
  };
  useEffect(() => { void load(); }, []);
  useLiveData(load, 30_000);

  return <>
    <PageHeading eyebrow={deliveryOnly ? "Delivery control" : "Operations center"} title={deliveryOnly ? "Delivery you can trust." : "Everything is in view."} description={deliveryOnly ? "Watch the channels and failure signals that move work from Chusky to your people." : "A live read on Chusky’s runtime, connected channels, and durable delivery path."} action={<Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Refresh</Button>} />
    {offline ? <Offline retry={() => void load()} /> : !health ? <Loading /> : <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground/10 bg-background px-4 py-3"><div className="flex items-center gap-2.5"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${health.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}><Activity size={16} /></span><div><p className="text-xs font-medium">System {health.status}</p><p className="mt-1 text-[11px] text-muted-foreground">Auto-refreshes every 30 seconds · Last checked just now</p></div></div><Status tone={health.ok ? "green" : "amber"}>{health.persistence === "redis" ? "Durable storage" : "Development storage"}</Status></div>
      {!deliveryOnly && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Delivery failures" value={String(health.monitoring.counters.delivery_failure ?? 0)} detail="Since this process started" icon={<TriangleAlert size={14} />} /><Metric label="Workflow failures" value={String(health.monitoring.counters.workflow_failure ?? 0)} detail="Durable runs needing review" icon={<Clock3 size={14} />} /><Metric label="Provider failures" value={String(health.monitoring.counters.provider_failure ?? 0)} detail="API or connectivity errors" icon={<Radio size={14} />} /><Metric label="Redis failures" value={String(health.monitoring.counters.redis_failure ?? 0)} detail="Persistence incidents" icon={<Database size={14} />} /></div>}
      {!deliveryOnly && <div className="grid gap-3 sm:grid-cols-3"><Metric label="Measured reliability" value={reliability ? `${Math.round(reliability.successRate * 100)}%` : "—"} detail={reliability ? `${reliability.sampleCount} samples · ${reliability.state}` : "No samples yet"} icon={<Gauge size={14} />} /><Metric label="Uncertain outcomes" value={reliability ? `${Math.round(reliability.uncertaintyRate * 100)}%` : "—"} detail="Provider results requiring reconciliation" icon={<TriangleAlert size={14} />} /><Metric label="Compensation queue" value={String(compensations.filter((item) => ["pending", "running", "failed", "blocked"].includes(item.status)).length)} detail="Provider undo actions awaiting review" icon={<RefreshCw size={14} />} /></div>}
      <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr] sm:gap-4">
        <Card className="p-4"><div className="mb-1 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Runtime checks</p><h2 className="mt-1.5 font-display text-xl">The foundation</h2></div><Server size={17} className="text-muted-foreground" /></div>{Object.entries(health.checks).map(([key, value]) => <HealthCard key={key} name={labels[key] ?? key} value={value} icon={key === "redis" ? <Database size={14} /> : key === "qstash" ? <Clock3 size={14} /> : key === "sendblue" ? <Radio size={14} /> : <Wifi size={14} />} />)}</Card>
        <Card className="p-4"><div className="mb-1 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Connected channels</p><h2 className="mt-1.5 font-display text-xl">Where Chusky can reach you</h2></div><Gauge size={17} className="text-muted-foreground" /></div>{Object.entries(health.channels).map(([key, enabled]) => <div key={key} className="flex items-center justify-between border-b border-foreground/10 py-3 last:border-0"><div className="flex items-center gap-2.5"><span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-foreground/20"}`} /><span className="text-xs">{channelLabels[key] ?? key}</span></div><span className="text-[11px] text-muted-foreground">{enabled ? "Enabled" : "Not enabled"}</span></div>)}</Card>
      </div>
      <Card className="p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Latest incident</p><h2 className="mt-1.5 font-display text-xl">{health.monitoring.lastFailure ? "Needs a closer look" : "Quiet by design"}</h2><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{health.monitoring.lastFailure ? `${health.monitoring.lastFailure.type ?? "Failure"} · ${health.monitoring.lastFailure.message ?? "See service logs for details."}` : "No runtime failures have been recorded by this process. Durable provider retries remain visible in the service logs."}</p></div><div className="shrink-0 text-left md:text-right"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Last event</p><p className="mt-1.5 text-[11px]">{formatTime(health.monitoring.lastFailure?.at)}</p></div></div></Card>
      {!deliveryOnly && <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]"><Card className="p-4"><div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Unified trace</p><h2 className="mt-1.5 font-display text-xl">What the supervisor knows</h2></div><Activity size={16} className="text-muted-foreground" /></div>{trace.length ? <div className="max-h-64 divide-y divide-foreground/10 overflow-y-auto">{trace.slice(-20).reverse().map((item) => <div key={item.id} className="py-2.5 text-[11px]"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[9px] uppercase text-muted-foreground">{item.kind}</span><Status tone={item.status === "failed" || item.status === "uncertain" ? "amber" : "gray"}>{item.status ?? item.type}</Status><span className="ml-auto text-[9px] text-muted-foreground">{formatTime(new Date(item.at).toISOString())}</span></div><p className="mt-1 break-words">{item.summary}</p></div>)}</div> : <p className="text-xs text-muted-foreground">No persisted trace events have been recorded yet.</p>}</Card><Card className="p-4"><div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Compensation</p><h2 className="mt-1.5 font-display text-xl">Recovery queue</h2></div><ShieldCheck size={16} className="text-muted-foreground" /></div>{compensations.length ? <div className="space-y-2">{compensations.slice(-8).reverse().map((item) => <div key={item.id} className="border-b border-foreground/10 pb-2 text-[11px] last:border-0"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.provider}</span><Status tone={item.status === "succeeded" ? "green" : item.status === "blocked" || item.status === "failed" ? "amber" : "gray"}>{item.status}</Status></div><p className="mt-1 break-words text-muted-foreground">{item.objective}</p>{item.executionToolSlug && <p className="mt-1 break-all font-mono text-[10px]">{item.executionToolSlug}{item.externalReceiptId ? ` · receipt ${item.externalReceiptId}` : " · receipt pending"}{item.verificationId ? ` · read-back ${item.verificationId}` : " · read-back pending"}</p>}{item.error && <p className="mt-1 break-words text-amber-900/80">{item.error}</p>}</div>)}</div> : <p className="text-xs text-muted-foreground">No compensation records. Ambiguous provider actions will appear here.</p>}</Card></div>}
      {deliveryOnly && <Card className="p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Recent deliveries</p><h2 className="mt-1.5 font-display text-xl">What actually left Chusky</h2></div><ExternalLink size={16} className="text-muted-foreground" /></div>
        {deliveryActionError && <p role="alert" className="mb-3 border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-950">{deliveryActionError}</p>}
        {account?.deliveries.length ? <div className="divide-y divide-foreground/10">{account.deliveries.map((item) => <div key={item.id} className="flex flex-col gap-2 py-3 text-[11px] sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.provider} · {item.kind}</p><Status tone={item.status === "delivered" ? "green" : item.status === "failed" || item.status === "ambiguous" ? "amber" : "gray"}>{item.status === "delivered" && item.providerStatus === "owner_confirmed_delivered" ? "confirmed by you" : item.status}</Status></div>
            <p className="mt-1 text-muted-foreground">{formatTime(item.deliveredAt || item.updatedAt)} · {item.attempts} attempt{item.attempts === 1 ? "" : "s"}{item.durationMs !== undefined ? ` · delivered in ${formatLatency(item.durationMs)}` : item.status === "ambiguous" ? " · outcome uncertain" : ""}</p>
            {item.lastError && <p className="mt-1 max-w-2xl break-words text-amber-900/80">{item.lastError}</p>}
            {item.status === "ambiguous" && <p className="mt-2 max-w-xl text-muted-foreground">Check the destination first. Confirming records your verification; it does not send or retry the message.</p>}
          </div>
          {item.status === "ambiguous" && <Button secondary disabled={confirmingDeliveryId === item.id} onClick={() => void confirmDelivered(item.id)}>{confirmingDeliveryId === item.id ? "Confirming…" : "I checked — mark delivered"}</Button>}
        </div>)}</div> : <p className="text-xs text-muted-foreground">No outbound deliveries have been recorded for this account yet.</p>}
      </Card>}
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground"><ShieldCheck size={13} className="text-emerald-600" /> Secrets are never returned to the dashboard. <span className="mx-1">·</span> <ExternalLink size={12} /> Failure counters reset when the process restarts; durable workflow state remains in Redis.</div>
    </div>}
  </>;
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) { return <Card className="p-4"><div className="flex items-center justify-between text-muted-foreground"><p className="font-mono text-[9px] uppercase tracking-[0.16em]">{label}</p>{icon}</div><p className="mt-3 font-display text-3xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></Card>; }
function formatLatency(value: number) { return value < 1_000 ? `${Math.round(value)} ms` : value < 60_000 ? `${(value / 1_000).toFixed(1)} s` : `${(value / 60_000).toFixed(1)} min`; }

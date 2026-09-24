"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ChevronDown, RefreshCw } from "lucide-react";
import { chuskyApi, type AutonomySnapshot, type DeveloperProject } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { useLiveData } from "@/lib/live-sync";

function date(value?: number): string {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

function queueTone(status: string, blocked: boolean): "green" | "amber" | "gray" {
  if (blocked || ["blocked", "failed", "awaiting_approval", "waiting"].includes(status.toLowerCase())) return "amber";
  if (["completed", "active", "running", "queued", "scheduled"].includes(status.toLowerCase())) return status === "completed" ? "green" : "gray";
  return "gray";
}

export function AutonomyPage() {
  const [mode, setMode] = useState<"personal" | "business">("personal");
  const [snapshot, setSnapshot] = useState<AutonomySnapshot>();
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [projectId, setProjectId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [visibleCount, setVisibleCount] = useState(40);

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setSnapshot(mode === "business" && projectId ? await chuskyApi.account.autonomy.businessQueue(projectId) : await chuskyApi.account.autonomy.queue(mode)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Autonomy state could not be loaded."); }
    finally { setLoading(false); }
  }, [mode, projectId]);
  useEffect(() => { void load(); }, [load]);
  useLiveData(load);
  useEffect(() => {
    if (mode !== "business") return;
    void chuskyApi.account.projects.list().then((page) => {
      const companyProjects = page.data.filter((project) => Boolean(project.organizationId));
      setProjects(companyProjects);
      setProjectId((current) => current && companyProjects.some((project) => project.id === current) ? current : companyProjects[0]?.id);
    }).catch(() => setProjects([]));
  }, [mode]);

  const reconcile = async () => {
    setRunning(true); setError(undefined); setMessage(undefined);
    try {
      const result = mode === "business" && projectId ? await chuskyApi.account.autonomy.businessReconcile(projectId, 8) : await chuskyApi.account.autonomy.reconcile(mode, 8);
      setMessage(`Reconciliation checked ${result.data?.length ?? 0} due watch${result.data?.length === 1 ? "" : "es"}. This is a check result, not a claim that an underlying task completed.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reconciliation could not be completed."); }
    finally { setRunning(false); }
  };

  const visibleQueue = snapshot?.queue.slice(0, visibleCount) ?? [];
  const hasMore = Boolean(snapshot && visibleQueue.length < snapshot.queue.length);

  return <div className="min-w-0">
    <PageHeading eyebrow="Autonomy" title="Know what needs attention" description="A read-only view of durable work, owner decisions, and standing-watch state. Reads may run automatically; external writes still follow their approval policy." action={<Button onClick={() => void reconcile()} disabled={running || loading}><RefreshCw size={13} className={running ? "animate-spin" : undefined} />{running ? "Checking…" : "Reconcile now"}</Button>} />
    <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2" role="group" aria-label="Autonomy scope">
      {(["personal", "business"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className={`min-h-9 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:min-h-8 ${mode === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}>{item === "personal" ? "Personal" : "Business"}</button>)}
      {mode === "business" && <select value={projectId ?? ""} onChange={(event) => setProjectId(event.target.value || undefined)} className="ml-auto min-h-9 min-w-0 max-w-full rounded-md border border-foreground/15 bg-background px-2 text-[10px] text-foreground sm:min-h-8" aria-label="Business project"><option value="">All business activity</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}
    </div>
    {error && <div role="alert"><Card className="mb-4 border-red-500/20 p-3 text-[11px] text-red-700">{error} <button className="ml-2 underline underline-offset-2" onClick={() => void load()}>Retry</button></Card></div>}
    {message && <div role="status"><Card className="mb-4 border-emerald-500/20 p-3 text-[11px] text-emerald-700">{message}</Card></div>}
    {loading && !snapshot ? <div role="status"><Card className="p-5 text-[11px] text-muted-foreground">Loading durable autonomy state…</Card></div> : snapshot && <>
      {loading && <p className="mb-2 text-right text-[10px] text-muted-foreground" role="status">Refreshing live state…</p>}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3">
        <Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Autonomy profile</p><p className="mt-1 text-sm font-medium">{snapshot.profile.enabled ? "Enabled" : "Observe only"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">Authority: {snapshot.profile.defaultAuthority}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Delivery preference: {snapshot.profile.notifyOn}</p></Card>
        <Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Open queue</p><p className="mt-1 text-sm font-medium">{snapshot.queue.length}</p><p className="mt-1 text-[10px] text-muted-foreground">{snapshot.counts.overdue ?? 0} overdue checks</p></Card>
        <Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Blocked</p><p className="mt-1 text-sm font-medium">{snapshot.counts.blocked ?? 0}</p><p className="mt-1 text-[10px] text-muted-foreground">Items with a recorded blocker</p></Card>
        <Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Standing watches</p><p className="mt-1 text-sm font-medium">{snapshot.watches.length}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Check allowance: {snapshot.profile.maxChecksPerDay}/day · action allowance: {snapshot.profile.maxAutonomousActionsPerDay}/day</p></Card>
      </div>

      <Card className="mb-3 sm:mb-4"><div className="flex items-start gap-2.5 border-b border-foreground/10 px-3 py-3 sm:px-4"><Activity size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><h2 className="text-[11px] font-medium">Pulse and watch policy</h2><p className="mt-1 text-[10px] leading-4 text-muted-foreground">This snapshot shows the current owner-scoped autonomy policy and watch state. It does not include a historical pulse activity ledger, so a check is never presented as completed work.</p></div></div>
        {snapshot.watches.length ? <ul className="divide-y divide-foreground/10">{snapshot.watches.map((watch) => <li key={watch.id} className="grid min-w-0 gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4"><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{watch.name}</p><Status tone={watch.status.toLowerCase() === "active" ? "green" : watch.status.toLowerCase() === "blocked" || watch.status.toLowerCase() === "failed" ? "amber" : "gray"}>{watch.status}</Status></div><p className="mt-1 text-[10px] text-muted-foreground">{watch.domain} · next check {date(watch.nextCheckAt)}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{watch.objective}</p>{watch.lastError && <p className="mt-1 text-[10px] leading-4 text-amber-700 [overflow-wrap:anywhere]">Last recorded issue: {watch.lastError}</p>}</div><p className="self-start text-[9px] text-muted-foreground">Snapshot {date(snapshot.generatedAt)}</p></li>)}</ul> : <p className="px-3 py-4 text-[10px] text-muted-foreground sm:px-4">No standing watches are present in this snapshot.</p>}
      </Card>

      <Card><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-foreground/10 px-3 py-3 sm:px-4"><div><h2 className="text-xs font-medium">Work queue</h2><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Read-only status from durable records. Open an item’s owning surface to take action; this list does not execute or resume work.</p></div><span className="font-mono text-[9px] text-muted-foreground">Updated {date(snapshot.generatedAt)}</span></div>
        <div className="divide-y divide-foreground/10">{snapshot.queue.length ? visibleQueue.map((item) => <details key={`${item.kind}:${item.id}`} className="group min-w-0 px-3 py-3 sm:px-4"><summary className="grid min-w-0 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{item.title}</p><span className="rounded-sm border border-foreground/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-muted-foreground">{item.kind}</span></div><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{item.nextAction || item.source}</p>{item.blockedReason && <p className="mt-1 text-[10px] leading-4 text-amber-700 [overflow-wrap:anywhere]">Blocked: {item.blockedReason}</p>}</div><span className="flex items-center gap-2"><Status tone={queueTone(item.status, Boolean(item.blockedReason))}>{item.status}</Status><ChevronDown size={13} className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></span></summary>
          <div className="mt-3 grid gap-x-4 gap-y-2 border-l border-foreground/15 pl-3 text-[10px] sm:grid-cols-3"><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Source</p><p className="mt-0.5 [overflow-wrap:anywhere]">{item.source}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Next check</p><p className="mt-0.5">{date(item.nextCheckAt)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Last updated</p><p className="mt-0.5">{date(item.updatedAt)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Priority</p><p className="mt-0.5">{item.priority}</p></div></div>
        </details>) : <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">No open durable work is in this snapshot.</p>}</div>
        {hasMore && <div className="border-t border-foreground/10 px-3 py-3 sm:px-4"><Button secondary onClick={() => setVisibleCount((count) => count + 40)}>Show more ({snapshot.queue.length - visibleQueue.length} remaining)</Button></div>}
      </Card>
    </>}
  </div>;
}

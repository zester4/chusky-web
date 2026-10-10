"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, BellRing, CheckCircle2, ChevronDown, Pause, Play, RefreshCw } from "lucide-react";
import { chuskyApi, type AccountOverview, type AttentionPulsePreferences, type AutonomyReconcileResult, type AutonomySnapshot, type DeveloperProject, type JobOccurrence } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { TriggerLogo } from "./trigger-logo";
import { attentionCandidateChatHref } from "./attention-candidate";
import { useLiveData } from "@/lib/live-sync";

function date(value?: number | string): string {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

function queueTone(status: string, blocked: boolean): "green" | "amber" | "gray" {
  if (blocked || ["blocked", "failed", "awaiting_approval", "waiting"].includes(status.toLowerCase())) return "amber";
  if (["completed", "active", "running", "queued", "scheduled"].includes(status.toLowerCase())) return status === "completed" ? "green" : "gray";
  return "gray";
}

function watchHealth(watch: AutonomySnapshot["watches"][number], now: number): "current" | "scheduled" | "stale" | "failed" | "not_checked" {
  if (watch.lastError) return "failed";
  if (!watch.lastCheckedAt) return watch.nextCheckAt && watch.nextCheckAt > now ? "scheduled" : "not_checked";
  return now - watch.lastCheckedAt > (watch.freshnessMs ?? 24 * 60 * 60_000) ? "stale" : "current";
}

function resultTone(status: AutonomyReconcileResult["status"]): "green" | "amber" | "gray" {
  return status === "completed" ? "green" : status === "failed" ? "amber" : "gray";
}

function pulseOccurrenceLabel(occurrence?: JobOccurrence): string {
  if (!occurrence) return "Never run";
  if (occurrence.status === "completed") return `Completed ${date(occurrence.completedAt ?? occurrence.updatedAt)}`;
  if (occurrence.status === "failed" || occurrence.status === "blocked") return `${occurrence.status} ${date(occurrence.updatedAt)}`;
  return `${occurrence.status} ${date(occurrence.startedAt ?? occurrence.updatedAt)}`;
}

function pulseHealthTone(status?: AttentionPulsePreferences["health"]["status"]): "green" | "amber" | "gray" {
  if (status === "healthy" || status === "running") return "green";
  if (status === "waiting_for_connection" || status === "waiting_for_setup" || status === "watch_attention" || status === "stale" || status === "failed") return "amber";
  return "gray";
}

function pulseHealthLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function pulseEvidenceSummary(evidence: NonNullable<JobOccurrence["pulseEvidence"]>): string {
  const reports = evidence.watchReports ?? [];
  const checked = reports.filter((watch) => watch.status === "checked").length;
  const failed = reports.filter((watch) => watch.status === "failed").length;
  const notChecked = reports.filter((watch) => watch.status === "not_checked" || watch.status === "scheduled").length;
  const checks = reports.length > 0
    ? `${checked}/${reports.length} provider check${reports.length === 1 ? "" : "s"} completed${notChecked ? ` · ${notChecked} not checked` : ""}${failed ? ` · ${failed} failed` : ""}`
    : "No provider watch was due";
  const signals = `${evidence.pendingObservations} observation${evidence.pendingObservations === 1 ? "" : "s"} · ${evidence.pendingCandidates} candidate${evidence.pendingCandidates === 1 ? "" : "s"}`;
  const outcome = evidence.approvalRequired
    ? "waiting for approval"
    : evidence.handled
      ? "handled an authorized step"
      : evidence.delegated > 0
        ? `delegated ${evidence.delegated} step${evidence.delegated === 1 ? "" : "s"}`
        : evidence.state === "skipped" ? "unchanged work was suppressed" : "reviewed the bounded state";
  return `${checks} · ${signals} · ${outcome}.`;
}

function pulseRunKindLabel(kind?: NonNullable<JobOccurrence["pulseEvidence"]>["runKind"]): string {
  return kind === "first_run" ? "first run" : kind === "manual" ? "manual run" : "scheduled run";
}

function PulseTab({ pulse, snapshot, overview, occurrence, running, saving, message, error, onRun, onToggle }: {
  pulse?: AttentionPulsePreferences;
  snapshot?: AutonomySnapshot;
  overview?: AccountOverview;
  occurrence?: JobOccurrence;
  running: boolean;
  saving: boolean;
  message?: string;
  error?: string;
  onRun: () => void;
  onToggle: () => void;
}) {
  const watches = snapshot?.watches ?? [];
  const events = overview?.triggerEvents.slice(0, 5) ?? [];
  const candidates = overview?.attentionCandidates.slice(0, 3) ?? [];
  const pulseJob = overview?.jobs.find((job) => job.id.startsWith("pulse_"));
  const health = pulse?.health;

  return <div className="space-y-4">
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${pulse?.enabled ? "bg-emerald-100 text-emerald-700" : "bg-foreground/[0.06] text-muted-foreground"}`}><BellRing size={16} aria-hidden="true" /></span><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Attention Pulse</p><h2 className="mt-1 text-sm font-medium">Elena’s operating heartbeat</h2><p className="mt-1 max-w-2xl text-[10px] leading-4 text-muted-foreground">A bounded check of the watches and durable work you configured. It reports what changed and waits when your decision is required.</p></div></div>
        <Status tone={pulse?.enabled ? "green" : "gray"}>{pulse?.enabled ? "Enabled" : "Off"}</Status>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Schedule</p><p className="mt-1 text-xs font-medium">{pulse?.cadence?.replaceAll("_", " ") ?? "Not configured"}</p><p className={`mt-1 text-[10px] ${pulseJob?.scheduleError ? "text-amber-700" : "text-muted-foreground"}`}>{pulseJob?.scheduleError ? "Schedule recovery needed" : pulseJob?.status === "active" ? "Durable job active" : "No active pulse job"}</p></div>
        <div className="border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Authority</p><p className="mt-1 text-xs font-medium">{pulse?.authority?.replaceAll("_", " ") ?? "Not configured"}</p><p className="mt-1 text-[10px] text-muted-foreground">Approval gates remain active</p></div>
        <div className="border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Last run</p><p className="mt-1 text-xs font-medium">{pulseOccurrenceLabel(occurrence)}</p><p className="mt-1 text-[10px] text-muted-foreground">{pulse?.deliveryTargets.filter((target) => target.enabled).map((target) => target.provider).join(", ") || "No delivery target"}</p></div>
      </div>
      {occurrence?.pulseEvidence && <div className="mt-3 border border-foreground/10 bg-foreground/[0.018] px-3 py-2.5"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Run receipt · {pulseRunKindLabel(occurrence.pulseEvidence.runKind)}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{pulseEvidenceSummary(occurrence.pulseEvidence)}</p><p className="mt-1 text-[9px] text-muted-foreground">Delivery: {occurrence.pulseEvidence.delivery} · receipt state: {occurrence.pulseEvidence.state}{occurrence.pulseEvidence.deliveryReason ? ` · ${occurrence.pulseEvidence.deliveryReason}` : ""}</p>{occurrence.result && <details className="mt-2"><summary className="cursor-pointer text-[10px] font-medium text-foreground/80">Open Elena’s report</summary><p className="mt-2 whitespace-pre-wrap text-[10px] leading-4 text-muted-foreground">{occurrence.result}</p></details>}{occurrence.pulseEvidence.watchReports?.length ? <details className="mt-2"><summary className="cursor-pointer text-[10px] font-medium text-foreground/80">See provider checks ({occurrence.pulseEvidence.watchReports.length})</summary><ul className="mt-2 space-y-2">{occurrence.pulseEvidence.watchReports.map((watch) => <li key={watch.id} className="border-l border-foreground/15 pl-2 text-[10px] leading-4"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-foreground/80">{watch.name}</span><Status tone={watch.status === "checked" ? "green" : watch.status === "failed" || watch.status === "not_checked" ? "amber" : "gray"}>{watch.status.replaceAll("_", " ")}</Status></div>{watch.summary && <p className="mt-0.5 text-muted-foreground">{watch.summary}</p>}{watch.error && <p className="mt-0.5 text-amber-700">{watch.error}</p>}<p className="mt-0.5 text-[9px] text-muted-foreground">Last checked {date(watch.lastCheckedAt)} · next {date(watch.nextCheckAt)}</p></li>)}</ul></details> : null}{occurrence.pulseEvidence.nextCheckAt && <p className="mt-2 text-[9px] text-muted-foreground">Next provider check {date(occurrence.pulseEvidence.nextCheckAt)}</p>}</div>}
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button onClick={onRun} disabled={running || saving || !pulse?.enabled}><Play size={12} />{running ? "Running…" : "Run now"}</Button><Button secondary onClick={onToggle} disabled={saving || !pulse}>{pulse?.enabled ? <><Pause size={12} />Pause pulse</> : <><Play size={12} />Enable pulse</>}</Button><span className="text-[10px] text-muted-foreground">Up to {pulse?.maxPerDay ?? 4} delivered updates per day</span></div>
      {message && <p role="status" className="mt-3 text-[10px] text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-[10px] text-amber-800">{error}</p>}
    </Card>

    {health && <Card className="border-foreground/15"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 px-3 py-3 sm:px-4"><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Operating status</p><h2 className="mt-1 text-[12px] font-medium">{health.title}</h2><p className="mt-1 max-w-2xl text-[10px] leading-4 text-muted-foreground">{health.summary}</p></div><Status tone={pulseHealthTone(health.status)}>{pulseHealthLabel(health.status)}</Status></div><div className="grid gap-2 px-3 py-3 sm:grid-cols-3 sm:px-4"><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Last activity</p><p className="mt-1 text-[10px] font-medium">{occurrence?.completedAt || occurrence?.startedAt || occurrence?.updatedAt || health.lastRunAt ? date(occurrence?.completedAt ?? occurrence?.startedAt ?? occurrence?.updatedAt ?? health.lastRunAt) : "No recorded run"}</p></div><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Coverage</p><p className="mt-1 text-[10px] font-medium">{health.currentWatches}/{health.activeWatches} current</p><p className="mt-0.5 text-[9px] text-muted-foreground">{health.staleWatches + health.failedWatches + health.neverCheckedWatches} need attention</p></div><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Suggestions</p><p className="mt-1 text-[10px] font-medium">{health.pendingSuggestions} pending</p><p className="mt-0.5 text-[9px] text-muted-foreground">Connection gaps stay actionable</p></div></div><div className="flex flex-wrap items-center gap-2 border-t border-foreground/10 bg-foreground/[0.02] px-3 py-3 sm:px-4">{health.recoveryAction === "connect_app" && <Link href="/app/apps" className="app-button inline-flex min-h-8 items-center rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground shadow-sm hover:bg-primary/90">Connect an app <ArrowUpRight size={12} className="ml-1" /></Link>}{health.recoveryAction === "run_now" && <Button onClick={onRun} disabled={running || saving}><Play size={12} />Run first check</Button>}{health.recoveryAction === "inspect" && <Link href="/app/approvals" className="inline-flex min-h-8 items-center rounded-md border border-foreground/12 bg-background px-2.5 py-1.5 text-[10px] font-medium shadow-sm hover:border-foreground/30">Open recovery <ArrowUpRight size={12} className="ml-1" /></Link>}{health.recoveryAction === "none" && <span className="text-[10px] text-muted-foreground">No recovery action is needed.</span>}<span className="text-[9px] text-muted-foreground">Status is derived from durable Pulse and watch records.</span></div></Card>}

    <Card><div className="flex items-start gap-2.5 border-b border-foreground/10 px-3 py-3 sm:px-4"><Activity size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><h2 className="text-[11px] font-medium">Watch coverage</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Only explicitly configured, read-only watches are included.</p></div></div>{watches.length ? <ul className="divide-y divide-foreground/10">{watches.map((watch) => { const health = watchHealth(watch, snapshot?.generatedAt ?? 0); return <li key={watch.id} className="flex min-w-0 items-start gap-2.5 px-3 py-3 sm:px-4"><TriggerLogo slug={watch.domain} size={28} /><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{watch.name}</p><Status tone={health === "current" ? "green" : health === "failed" || health === "stale" || health === "not_checked" ? "amber" : "gray"}>{health.replaceAll("_", " ")}</Status></div><p className="mt-1 text-[10px] text-muted-foreground">{watch.domain} · last check {date(watch.lastCheckedAt)} · next check {date(watch.nextCheckAt)}</p>{watch.lastError && <p className="mt-1 text-[10px] leading-4 text-amber-700 [overflow-wrap:anywhere]">{watch.lastError}</p>}</div></li>; })}</ul> : <div className="flex items-start gap-2.5 px-3 py-4 text-[10px] leading-4 text-muted-foreground sm:px-4"><BellRing size={14} className="mt-0.5 shrink-0" />No provider watch is active yet. Elena can still surface connection suggestions and durable work here; connect an app to add bounded watch coverage.</div>}</Card>

    <Card><div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-foreground/10 px-3 py-3 sm:px-4"><div><h2 className="text-[11px] font-medium">Recent attention</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Suggestions, trigger outcomes, and decisions that may need follow-up.</p></div><Link href="/app/approvals" className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline">Open approvals <ArrowUpRight size={12} /></Link></div>{candidates.length > 0 && <ul className="divide-y divide-foreground/10">{candidates.map((candidate) => <li key={candidate.id} className="flex min-w-0 items-start gap-2.5 px-3 py-3 sm:px-4"><TriggerLogo slug={candidate.providerSlug || "chusky"} size={28} /><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">Elena’s next suggestion</p><Status tone="amber">actionable</Status></div><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{candidate.reason}</p><div className="mt-1.5 flex flex-wrap gap-1.5">{(candidate.suggestedActions ?? []).slice(0, 3).map((action) => <Link key={action.id} href={attentionCandidateChatHref(candidate.id, action.id)} className="rounded-sm border border-foreground/10 px-1.5 py-0.5 text-[9px] text-foreground/70 hover:border-foreground/30">{action.label}</Link>)}</div></div><Link href={attentionCandidateChatHref(candidate.id)} className="shrink-0 text-[9px] font-medium hover:underline">Open chat</Link></li>)}</ul>}{events.length ? <ul className="divide-y divide-foreground/10">{events.map((event) => <li key={event.id} className="flex min-w-0 items-start gap-2.5 px-3 py-3 sm:px-4"><TriggerLogo slug={event.slug} size={28} /><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 truncate text-[11px] font-medium">{event.summary}</p><Status tone={event.notificationStatus === "delivered" ? "green" : event.notificationStatus === "failed" || event.notificationStatus === "unavailable" ? "amber" : "gray"}>{event.notificationStatus}</Status></div><p className="mt-1 text-[10px] text-muted-foreground">{event.slug} · {date(event.updatedAt)}</p></div></li>)}</ul> : !candidates.length && <div className="flex items-center gap-2.5 px-3 py-5 text-[10px] text-muted-foreground sm:px-4"><CheckCircle2 size={15} className="shrink-0 text-emerald-600" />No recent attention is waiting.</div>}</Card>

  </div>;
}

export function AutonomyPage() {
  const [tab, setTab] = useState<"pulse" | "autonomy">("pulse");
  const [mode, setMode] = useState<"personal" | "business">("personal");
  const [snapshot, setSnapshot] = useState<AutonomySnapshot>();
  const [pulse, setPulse] = useState<AttentionPulsePreferences>();
  const [overview, setOverview] = useState<AccountOverview>();
  const [occurrence, setOccurrence] = useState<JobOccurrence>();
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [projectId, setProjectId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [pulseError, setPulseError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [reconcileResults, setReconcileResults] = useState<AutonomyReconcileResult[]>();
  const [visibleCount, setVisibleCount] = useState(40);
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true); setError(undefined); setPulseError(undefined);
    try {
      const [next, pulseResult, overviewResult] = await Promise.all([mode === "business" && projectId ? chuskyApi.account.autonomy.businessQueue(projectId) : chuskyApi.account.autonomy.queue(mode), chuskyApi.attentionPulse.get().catch(() => undefined), chuskyApi.account.get().catch(() => undefined)]);
      if (sequence !== requestSequence.current) return;
      setSnapshot(next); setPulse(pulseResult); setOverview(overviewResult);
      if (!pulseResult) setPulseError("Pulse settings could not be loaded. The autonomy queue is still available.");
      const pulseJob = overviewResult?.jobs.find((job) => job.id.startsWith("pulse_"));
      if (pulseJob) {
        const occurrences = await chuskyApi.jobs.occurrences(pulseJob.id, 1).catch(() => undefined);
        if (sequence === requestSequence.current) setOccurrence(occurrences?.data[0] ?? pulseResult?.health.lastOccurrence);
      } else setOccurrence(pulseResult?.health.lastOccurrence);
    } catch (cause) {
      if (sequence === requestSequence.current) setError(cause instanceof Error ? cause.message : "Autonomy state could not be loaded.");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [mode, projectId]);
  useEffect(() => { void load(); }, [load]);
  useLiveData(load);
  useEffect(() => {
    if (mode !== "business") return;
    void chuskyApi.account.projects.list().then((page) => { const companyProjects = page.data.filter((project) => Boolean(project.organizationId)); setProjects(companyProjects); setProjectId((current) => current && companyProjects.some((project) => project.id === current) ? current : companyProjects[0]?.id); }).catch(() => setProjects([]));
  }, [mode]);

  const reconcile = async () => {
    setRunning(true); setError(undefined); setMessage(undefined); setReconcileResults(undefined);
    try {
      const result = mode === "business" && projectId ? await chuskyApi.account.autonomy.businessReconcile(projectId, 8) : await chuskyApi.account.autonomy.reconcile(mode, 8);
      setReconcileResults(result.data);
      const completed = result.data.filter((item) => item.status === "completed").length; const skipped = result.data.filter((item) => item.status === "skipped").length; const failed = result.data.filter((item) => item.status === "failed").length;
      setMessage(result.data.length === 0 ? "No active watches were due, so no provider checks ran." : `Reconciliation finished: ${completed} completed, ${skipped} skipped, ${failed} failed. A completed check is not a claim that an underlying task completed.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reconciliation could not be completed."); }
    finally { setRunning(false); }
  };

  const togglePulse = async () => {
    if (!pulse) return;
    setSaving(true); setPulseError(undefined); setMessage(undefined);
    try {
      const result = await chuskyApi.attentionPulse.update({ enabled: !pulse.enabled, cadence: pulse.cadence, authority: pulse.authority, maxPerDay: pulse.maxPerDay, monitoredDomains: pulse.monitoredDomains, deliveryTargets: pulse.deliveryTargets.map((target) => ({ provider: target.provider, ...(target.conversationId ? { conversationId: target.conversationId } : {}) })), quietHoursUtc: pulse.quietHoursUtc ?? null });
      setPulse(result.data); setMessage(result.data.enabled ? "Attention Pulse enabled. Elena will check the configured watches on schedule." : "Attention Pulse paused. Existing records remain available.");
      await load();
    } catch (cause) { setPulseError(cause instanceof Error ? cause.message : "Attention Pulse could not be updated."); }
    finally { setSaving(false); }
  };

  const runPulse = async () => {
    setRunning(true); setPulseError(undefined); setMessage(undefined);
    try {
      const jobs = await chuskyApi.jobs.list(); const pulseJob = jobs.data.find((job) => job.id.startsWith("pulse_") && job.status === "active");
      if (!pulseJob) throw new Error("Enable Attention Pulse before running it.");
      await chuskyApi.jobs.runNow(pulseJob.id); setMessage("Pulse run queued. Refreshing its result shortly."); await load();
    } catch (cause) { setPulseError(cause instanceof Error ? cause.message : "Pulse could not be started."); }
    finally { setRunning(false); }
  };

  const visibleQueue = snapshot?.queue.slice(0, visibleCount) ?? [];
  const hasMore = Boolean(snapshot && visibleQueue.length < snapshot.queue.length);
  const resultNames = new Map((snapshot?.watches ?? []).map((watch) => [watch.id, watch.name]));
  const watchHealthCounts = snapshot?.watches.reduce((counts, watch) => { const status = watchHealth(watch, snapshot.generatedAt); counts[status] += 1; return counts; }, { current: 0, scheduled: 0, stale: 0, failed: 0, not_checked: 0 }) ?? { current: 0, scheduled: 0, stale: 0, failed: 0, not_checked: 0 };

  return <div className="min-w-0">
    <PageHeading eyebrow="Autonomy" title="Know what needs attention" description="Run Elena’s pulse, inspect monitoring coverage, and review the durable work waiting on you." action={<div className="flex flex-wrap gap-2"><Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Refresh</Button>{tab === "autonomy" && <Button onClick={() => void reconcile()} disabled={running || loading}><RefreshCw size={13} className={running ? "animate-spin" : undefined} />{running ? "Checking…" : "Reconcile now"}</Button>}</div>} />
    <div className="mb-4 flex items-center gap-1 border-b border-foreground/10 pb-2" role="tablist" aria-label="Autonomy views">
      <button type="button" role="tab" aria-selected={tab === "pulse"} onClick={() => setTab("pulse")} className={`min-h-9 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:min-h-8 ${tab === "pulse" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}><BellRing size={12} className="mr-1.5 inline" />Pulse</button>
      <button type="button" role="tab" aria-selected={tab === "autonomy"} onClick={() => setTab("autonomy")} className={`min-h-9 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:min-h-8 ${tab === "autonomy" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}>Autonomy</button>
      {tab === "autonomy" && <div className="ml-auto flex items-center gap-1">{(["personal", "business"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium ${mode === item ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:bg-foreground/5"}`}>{item === "personal" ? "Personal" : "Business"}</button>)}{mode === "business" && <select value={projectId ?? ""} onChange={(event) => setProjectId(event.target.value || undefined)} className="min-h-8 max-w-[12rem] rounded-md border border-foreground/15 bg-background px-2 text-[10px] text-foreground" aria-label="Business project"><option value="">All business activity</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}</div>}
    </div>
    {error && <div role="alert"><Card className="mb-4 border-red-500/20 p-3 text-[11px] text-red-700">{error} <button className="ml-2 underline underline-offset-2" onClick={() => void load()}>Retry</button></Card></div>}
    {loading && !snapshot ? <div role="status"><Card className="p-5 text-[11px] text-muted-foreground">Loading durable autonomy state…</Card></div> : tab === "pulse" ? <PulseTab pulse={pulse} snapshot={snapshot} overview={overview} occurrence={occurrence} running={running} saving={saving} message={message} error={pulseError} onRun={() => void runPulse()} onToggle={() => void togglePulse()} /> : snapshot && <>
      {message && <div role="status" aria-live="polite"><Card className={`mb-4 p-3 text-[11px] ${reconcileResults?.some((item) => item.status === "failed") ? "border-amber-500/20 text-amber-800" : "border-emerald-500/20 text-emerald-700"}`}>{message}</Card></div>}
      {reconcileResults && reconcileResults.length > 0 && <Card className="mb-3 sm:mb-4"><div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-3 sm:px-4"><Activity size={14} className="text-muted-foreground" aria-hidden="true" /><div><h2 className="text-[11px] font-medium">Latest reconciliation</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Per-watch result from this run. Failed and skipped checks are not counted as completed.</p></div></div><ul className="divide-y divide-foreground/10">{reconcileResults.map((result) => <li key={result.watchId} className="grid min-w-0 gap-1.5 px-3 py-3 sm:px-4"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{resultNames.get(result.watchId) ?? "Configured watch"}</p><Status tone={resultTone(result.status)}>{result.status}</Status>{result.changed && <span className="rounded-sm bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] text-muted-foreground">Change detected</span>}</div><p className="text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{result.summary}</p>{result.gaps > 0 && <p className="text-[10px] text-amber-800">{result.gaps} follow-up item{result.gaps === 1 ? "" : "s"} recorded in the work queue.</p>}{result.error && <p className="text-[10px] leading-4 text-amber-800 [overflow-wrap:anywhere]">{result.error}</p>}{result.nextCheckAt && <p className="text-[9px] text-muted-foreground">Next check {date(result.nextCheckAt)}</p>}</li>)}</ul></Card>}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3"><Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Autonomy profile</p><p className="mt-1 text-sm font-medium">{snapshot.profile.enabled ? "Enabled" : "Observe only"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">Authority: {snapshot.profile.defaultAuthority}</p><p className="mt-1 text-[10px] text-muted-foreground">Delivery preference: {snapshot.profile.notifyOn}</p></Card><Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Open queue</p><p className="mt-1 text-sm font-medium">{snapshot.queue.length}</p><p className="mt-1 text-[10px] text-muted-foreground">{snapshot.counts.overdue ?? 0} overdue checks</p></Card><Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Blocked</p><p className="mt-1 text-sm font-medium">{snapshot.counts.blocked ?? 0}</p><p className="mt-1 text-[10px] text-muted-foreground">Items with a recorded blocker</p></Card><Card className="min-w-0 p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Standing watches</p><p className="mt-1 text-sm font-medium">{snapshot.watches.length}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Check allowance: {snapshot.profile.maxChecksPerDay}/day · action allowance: {snapshot.profile.maxAutonomousActionsPerDay}/day</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{snapshot.watches.length ? `${watchHealthCounts.current} current · ${watchHealthCounts.stale + watchHealthCounts.failed + watchHealthCounts.not_checked} need attention` : "No owner-configured watches yet."}</p></Card></div>
      <Card className="mb-3 sm:mb-4"><div className="flex items-start gap-2.5 border-b border-foreground/10 px-3 py-3 sm:px-4"><Activity size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><h2 className="text-[11px] font-medium">Pulse and watch policy</h2><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Watch health is based on each owner-configured watch’s persisted check time and freshness target. Checks are read-only; they do not mean the underlying work was completed.</p></div></div>{snapshot.watches.length ? <ul className="divide-y divide-foreground/10">{snapshot.watches.map((watch) => { const health = watchHealth(watch, snapshot.generatedAt); return <li key={watch.id} className="grid min-w-0 gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4"><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{watch.name}</p><Status tone={health === "current" ? "green" : health === "failed" || health === "stale" || health === "not_checked" ? "amber" : "gray"}>{health.replaceAll("_", " ")}</Status></div><p className="mt-1 text-[10px] text-muted-foreground">{watch.domain} · last check {date(watch.lastCheckedAt)} · next check {date(watch.nextCheckAt)}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{watch.objective}</p>{watch.lastResult && <p className="mt-1 text-[10px] text-foreground/80 [overflow-wrap:anywhere]">Last result: {watch.lastResult}</p>}{watch.lastError && <p className="mt-1 text-[10px] text-amber-700 [overflow-wrap:anywhere]">Last recorded issue: {watch.lastError}</p>}{(watch.consecutiveFailures ?? 0) > 1 && <p className="mt-1 text-[10px] text-amber-700">{watch.consecutiveFailures} consecutive failures</p>}</div><p className="self-start text-[9px] text-muted-foreground">Snapshot {date(snapshot.generatedAt)}</p></li>; })}</ul> : <p className="px-3 py-4 text-[10px] text-muted-foreground sm:px-4">No standing watches are present in this snapshot.</p>}</Card>
      <Card><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-foreground/10 px-3 py-3 sm:px-4"><div><h2 className="text-xs font-medium">Work queue</h2><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Read-only status from durable records. Open an item’s owning surface to take action; this list does not execute or resume work.</p></div><span className="font-mono text-[9px] text-muted-foreground">Updated {date(snapshot.generatedAt)}</span></div><div className="divide-y divide-foreground/10">{snapshot.queue.length ? visibleQueue.map((item) => <details key={`${item.kind}:${item.id}`} className="group min-w-0 px-3 py-3 sm:px-4"><summary className="grid min-w-0 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><p className="min-w-0 text-[11px] font-medium [overflow-wrap:anywhere]">{item.title}</p><span className="rounded-sm border border-foreground/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-muted-foreground">{item.kind}</span></div><p className="mt-1 text-[10px] text-muted-foreground [overflow-wrap:anywhere]">{item.nextAction || item.source}</p>{item.blockedReason && <p className="mt-1 text-[10px] text-amber-700 [overflow-wrap:anywhere]">Blocked: {item.blockedReason}</p>}</div><span className="flex items-center gap-2"><Status tone={queueTone(item.status, Boolean(item.blockedReason))}>{item.status}</Status><ChevronDown size={13} className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></span></summary><div className="mt-3 grid gap-x-4 gap-y-2 border-l border-foreground/15 pl-3 text-[10px] sm:grid-cols-3"><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Source</p><p className="mt-0.5 [overflow-wrap:anywhere]">{item.source}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Next check</p><p className="mt-0.5">{date(item.nextCheckAt)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Last updated</p><p className="mt-0.5">{date(item.updatedAt)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Priority</p><p className="mt-0.5">{item.priority}</p></div></div></details>) : <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">No open durable work is in this snapshot.</p>}</div>{hasMore && <div className="border-t border-foreground/10 px-3 py-3 sm:px-4"><Button secondary onClick={() => setVisibleCount((count) => count + 40)}>Show more ({snapshot.queue.length - visibleQueue.length} remaining)</Button></div>}</Card>
    </>}
  </div>;
}

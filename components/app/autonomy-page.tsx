"use client";

import { useCallback, useEffect, useState } from "react";
import { chuskyApi, type AutonomySnapshot, type DeveloperProject } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

function date(value?: number): string {
  return value ? new Date(value).toLocaleString() : "not scheduled";
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

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setSnapshot(mode === "business" && projectId ? await chuskyApi.account.autonomy.businessQueue(projectId) : await chuskyApi.account.autonomy.queue(mode)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Autonomy state could not be loaded."); }
    finally { setLoading(false); }
  }, [mode, projectId]);
  useEffect(() => { void load(); }, [load]);
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
      setMessage(`Checked ${result.data?.length ?? 0} due watch${result.data?.length === 1 ? "" : "es"}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reconciliation could not be completed."); }
    finally { setRunning(false); }
  };

  return <div>
    <PageHeading eyebrow="Autonomy" title="Know what needs attention" description="A durable, owner-scoped queue across tasks, meetings, reminders, connected apps, and standing watches. Reads are automatic; external writes remain approval-gated." action={<Button onClick={() => void reconcile()} disabled={running || loading}>{running ? "Checking…" : "Reconcile now"}</Button>} />
    <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2">
      {(["personal", "business"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-medium ${mode === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}>{item === "personal" ? "Personal" : "Business"}</button>)}
      {mode === "business" && <select value={projectId ?? ""} onChange={(event) => setProjectId(event.target.value || undefined)} className="ml-auto min-h-7 min-w-0 max-w-full rounded-md border border-foreground/15 bg-background px-2 text-[10px] text-foreground" aria-label="Business project"><option value="">All business activity</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}
    </div>
    {error && <Card className="mb-4 border-red-500/20 p-3 text-[11px] text-red-700">{error} <button className="ml-2 underline" onClick={() => void load()}>Retry</button></Card>}
    {message && <Card className="mb-4 border-emerald-500/20 p-3 text-[11px] text-emerald-700">{message}</Card>}
    {loading && !snapshot ? <Card className="p-5 text-[11px] text-muted-foreground">Loading durable autonomy state…</Card> : snapshot && <>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Card className="p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Profile</p><p className="mt-1 text-sm font-medium">{snapshot.profile.enabled ? "Enabled" : "Observe only"}</p><p className="text-[10px] text-muted-foreground">{snapshot.profile.defaultAuthority}</p></Card>
        <Card className="p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Queue</p><p className="mt-1 text-sm font-medium">{snapshot.queue.length}</p><p className="text-[10px] text-muted-foreground">{snapshot.counts.overdue ?? 0} overdue</p></Card>
        <Card className="p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Blockers</p><p className="mt-1 text-sm font-medium">{snapshot.counts.blocked ?? 0}</p><p className="text-[10px] text-muted-foreground">Requires attention</p></Card>
        <Card className="p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Watches</p><p className="mt-1 text-sm font-medium">{snapshot.watches.length}</p><p className="text-[10px] text-muted-foreground">Checks capped at {snapshot.profile.maxChecksPerDay}/day</p></Card>
      </div>
      <Card><div className="border-b border-foreground/10 px-4 py-3"><h2 className="text-xs font-medium">Next actions</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Only durable items and verified checkpoints appear here.</p></div><div className="divide-y divide-foreground/10">{snapshot.queue.length ? snapshot.queue.slice(0, 40).map((item) => <div key={`${item.kind}:${item.id}`} className="flex min-w-0 items-start justify-between gap-3 px-3 py-3 sm:px-4"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{item.title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.nextAction || item.source} · next check {date(item.nextCheckAt)}</p>{item.blockedReason && <p className="mt-1 text-[10px] text-amber-700">{item.blockedReason}</p>}</div><Status tone={item.blockedReason ? "amber" : "green"}>{item.status}</Status></div>) : <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">Nothing is waiting for attention.</p>}</div></Card>
    </>}
  </div>;
}

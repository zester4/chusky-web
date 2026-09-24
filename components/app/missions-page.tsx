"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, GitBranch, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { chuskyApi, type Mission, type MissionProof, type OutcomePackage } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { useLiveData } from "@/lib/live-sync";
import { MarkdownMessage } from "./markdown-message";

const tone = (status: Mission["status"]): "green" | "amber" | "gray" => status === "completed" ? "green" : ["blocked", "failed", "paused", "waiting"].includes(status) ? "amber" : "gray";
const date = (value: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const short = (value: string, max = 180) => value.length > max ? `${value.slice(0, max - 1)}…` : value;
type MissionDetail = { mission: Mission; proof?: MissionProof; events: Mission["events"] };

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selected, setSelected] = useState<MissionDetail>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [detailBusy, setDetailBusy] = useState<string>();
  const [detailError, setDetailError] = useState<string>();
  const [outcomes, setOutcomes] = useState<OutcomePackage[]>([]);

  const load = async () => {
    setOffline(false);
    try { setMissions((await chuskyApi.missions.list()).data); }
    catch { setOffline(true); }
  };

  const loadDetail = async (mission: Mission) => {
    setDetailBusy(mission.id);
    setDetailError(undefined);
    try {
      const [fresh, proof, events] = await Promise.all([
        chuskyApi.missions.get(mission.id),
        chuskyApi.missions.proof(mission.id).catch(() => undefined),
        chuskyApi.missions.events(mission.id).catch(() => ({ data: mission.events })),
      ]);
      setMissions((current) => current.map((item) => item.id === fresh.id ? fresh : item));
      setSelected({ mission: fresh, proof, events: events.data });
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "Mission details could not be loaded.");
    } finally { setDetailBusy(undefined); }
  };

  useEffect(() => { void load(); void chuskyApi.outcomes.list().then((result) => setOutcomes(result.data)).catch(() => setOutcomes([])); }, []);
  useLiveData(async () => {
    await load();
    if (selected) await loadDetail(selected.mission);
  });

  const act = async (mission: Mission, action: "pause" | "resume" | "cancel" | "repair") => {
    setBusy(mission.id);
    try {
      const next = action === "repair"
        ? await chuskyApi.missions.repair(mission.id, { reason: "Operator requested mission recovery from the dashboard." })
        : await chuskyApi.missions[action](mission.id);
      setMissions((current) => current.map((item) => item.id === next.id ? next : item));
      await loadDetail(next);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "The mission action could not be completed.");
    } finally { setBusy(undefined); }
  };

  const active = missions.filter((mission) => ["queued", "running"].includes(mission.status));
  const needsAttention = missions.filter((mission) => ["waiting", "blocked", "paused", "failed"].includes(mission.status));
  const closed = missions.filter((mission) => ["completed", "cancelled"].includes(mission.status));

  const renderMission = (mission: Mission) => {
    const isSelected = selected?.mission.id === mission.id;
    const proof = isSelected ? selected.proof : undefined;
    const eventList = isSelected ? selected.events : [];
    const stepNames = new Map(mission.steps.map((step) => [step.id, step.title]));
    return <div key={mission.id} className="min-w-0 border-b border-foreground/10 p-3 last:border-0 sm:p-4">
      <button type="button" className="min-h-11 w-full min-w-0 text-left" onClick={() => void loadDetail(mission)} disabled={detailBusy === mission.id} aria-expanded={isSelected}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><div className="min-w-0"><p className="text-xs font-medium leading-4">{mission.title}</p><p className="mt-1 font-mono text-[9px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{mission.id} · updated {date(mission.updatedAt)}</p></div><span className="flex items-center gap-2"><Status tone={tone(mission.status)}>{mission.status}</Status><ChevronDown size={13} className={`mt-1 shrink-0 text-muted-foreground transition-transform ${isSelected ? "rotate-180" : ""}`} aria-hidden="true" /></span></div>
        <p className="mt-2 text-[11px] leading-[1.45rem] text-muted-foreground [overflow-wrap:anywhere]">{mission.nextAction || mission.checkpoint || short(mission.objective, 180)}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground"><span>{mission.consumedSteps} slices</span><span>{mission.toolCalls} tool calls</span><span>${mission.cost.toFixed(4)}</span><span>{mission.steps.length} steps</span>{mission.activeStepIds?.length ? <span>{mission.activeStepIds.length} active branches</span> : null}</div>
      </button>
      {isSelected && <div className="mt-3 min-w-0 space-y-3 border-t border-foreground/10 pt-3 text-[11px] text-muted-foreground sm:mt-4 sm:space-y-4 sm:pt-4">
        <details className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><summary className="cursor-pointer text-[10px] font-medium text-foreground">Objective and definition of done</summary><div className="mt-3 min-w-0 space-y-3"><div><p className="mb-1 text-[10px] font-medium text-foreground">Objective</p><MarkdownMessage content={mission.objective} /></div><div><p className="mb-1 text-[10px] font-medium text-foreground">Definition of done</p><MarkdownMessage content={mission.definitionOfDone} /></div></div></details>
        {mission.waiting && <div className="flex min-w-0 items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 sm:p-3"><Timer size={14} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" /><p className="min-w-0 [overflow-wrap:anywhere]">Waiting for {mission.waiting.kind}{mission.waiting.provider ? ` from ${mission.waiting.provider}` : ""}{mission.waiting.providerEventId ? ` · ${mission.waiting.providerEventId}` : ""}</p></div>}
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Verification</p><p className="mt-1 flex items-center gap-1.5 text-foreground">{mission.verification?.verified ? <CheckCircle2 size={13} aria-hidden="true" /> : <CircleAlert size={13} aria-hidden="true" />}{mission.verification?.verified ? "Verified" : "Not verified"}</p><p className="mt-1 text-[10px]">{mission.verification?.mode === "strict" ? "Strict evidence gate" : "Legacy completion mode"}</p>{mission.verification?.reason && <p className="mt-1 [overflow-wrap:anywhere]">{mission.verification.reason}</p>}</div>
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Budget</p><p className="mt-1 text-foreground">{mission.consumedSteps}/{mission.budget.maxSteps} slices</p><p className="mt-1 text-[10px] [overflow-wrap:anywhere]">{mission.toolCalls}/{mission.budget.maxToolCalls} tools · ${mission.cost.toFixed(4)} / ${mission.budget.maxCost.toFixed(4)}</p></div>
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Proof</p><p className="mt-1 flex items-center gap-1.5 text-foreground"><ShieldCheck size={13} aria-hidden="true" />{(proof?.evidence ?? mission.evidence ?? []).length} evidence records</p><p className="mt-1 text-[10px]">{eventList.length} durable events</p></div>
        </div>
        <section className="min-w-0 space-y-2" aria-label="Mission steps and dependencies"><div className="flex items-center gap-2 text-foreground"><GitBranch size={13} aria-hidden="true" /><span className="font-medium">Step map</span><span className="text-[10px] text-muted-foreground">{mission.steps.length} steps · dependencies and active branches</span></div>
          {mission.steps.length ? <ol className="space-y-2">{mission.steps.map((step, index) => {
            const isActive = step.id === mission.currentStepId || mission.activeStepIds?.includes(step.id);
            return <li key={step.id} className={`min-w-0 rounded-md border p-2.5 sm:p-3 ${isActive ? "border-foreground/25 bg-foreground/[0.025]" : "border-foreground/10"}`}>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><span className="min-w-0 leading-4 text-foreground [overflow-wrap:anywhere]"><span className="mr-1.5 font-mono text-[9px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{step.title}{isActive && <span className="ml-2 text-[9px] font-medium text-foreground">Current</span>}</span><Status tone={step.status === "completed" ? "green" : ["blocked", "failed"].includes(step.status) ? "amber" : "gray"}>{step.status}</Status></div>
              <div className="mt-1 min-w-0"><MarkdownMessage content={short(step.objective, 240)} /></div>
              {step.dependsOn.length > 0 && <p className="mt-2 text-[10px] leading-4 [overflow-wrap:anywhere]">After: {step.dependsOn.map((id) => stepNames.get(id) ?? id).join(" · ")}</p>}
              {step.parallelGroup && <p className="mt-1 text-[10px]">Parallel group: {step.parallelGroup}</p>}
              {step.evidence?.length ? <p className="mt-1 text-[10px] text-green-700">{step.evidence.length} evidence record{step.evidence.length === 1 ? "" : "s"}</p> : null}
              {step.result && <details className="mt-2"><summary className="cursor-pointer text-[10px] text-foreground">Step result</summary><div className="mt-1"><MarkdownMessage content={short(step.result, 500)} /></div></details>}
            </li>;
          })}</ol> : <p className="rounded-md border border-dashed border-foreground/15 p-3 text-[10px]">This mission has no dependency steps; progress is tracked through its checkpoint and events.</p>}
        </section>
        {(proof?.evidence ?? mission.evidence ?? []).length > 0 && <details className="min-w-0 rounded-md border border-foreground/10 p-2.5"><summary className="cursor-pointer font-medium text-foreground">Evidence records ({(proof?.evidence ?? mission.evidence ?? []).length})</summary><ul className="mt-2 space-y-2">{(proof?.evidence ?? mission.evidence ?? []).map((item) => <li key={item.id} className="min-w-0 border-l border-foreground/15 pl-2.5"><p className="text-foreground">{item.summary}</p><p className="mt-0.5 text-[10px]">{item.kind} · {item.verified ? `verified by ${item.verifiedBy ?? "system"}` : "not verified"}{item.createdAt ? ` · ${date(item.createdAt)}` : ""}</p></li>)}</ul></details>}
        {eventList.length > 0 && <div className="min-w-0"><p className="mb-2 font-medium text-foreground">Recent activity</p><div className="space-y-2">{eventList.slice(-5).reverse().map((event) => <div key={event.id} className="grid min-w-0 gap-1 border-l border-foreground/15 pl-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-2"><time className="whitespace-nowrap font-mono text-[9px] leading-4 text-muted-foreground" dateTime={new Date(event.at).toISOString()}>{date(event.at)}</time><div className="min-w-0"><MarkdownMessage content={event.message || event.type} /></div></div>)}</div></div>}
        <div className="flex flex-wrap gap-2 border-t border-foreground/10 pt-3">{["running", "waiting"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "pause")}>Pause</Button>}{["paused", "blocked", "failed"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "resume")}>Resume</Button>}{["blocked", "failed"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "repair")}>Repair and resume</Button>}{!["completed", "cancelled"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "cancel")}>Cancel</Button>}</div>
      </div>}
    </div>;
  };

  const renderGroup = (title: string, description: string, items: Mission[], empty: string) => <section className="min-w-0" aria-label={title}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 pb-2 pt-3 sm:px-4"><div><h2 className="text-[11px] font-medium">{title}</h2><p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p></div><span className="font-mono text-[10px] text-muted-foreground">{items.length}</span></div>
    {items.length ? items.map(renderMission) : <p className="px-3 pb-4 text-[10px] text-muted-foreground sm:px-4">{empty}</p>}
  </section>;

  return <div className="min-w-0">
    <PageHeading eyebrow="Autonomous work" title="Missions" description="See what is moving, what needs a decision, and the evidence behind each result." action={<Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button>} />
    {detailError && <div role="alert"><Card className="mb-3 border-amber-500/20 p-3 text-[11px] text-amber-800">{detailError}</Card></div>}
    {offline ? <Card className="p-5 text-xs text-muted-foreground">Missions could not be loaded. Check the backend connection and retry.</Card> : <>
      <Card className="mb-3 sm:mb-4">
        <div className="grid gap-3 border-b border-foreground/10 p-3 sm:grid-cols-3 sm:p-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">In progress</p><p className="mt-1 text-lg font-medium">{active.length}</p><p className="text-[10px] text-muted-foreground">Queued or running</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Needs a decision</p><p className="mt-1 text-lg font-medium">{needsAttention.length}</p><p className="text-[10px] text-muted-foreground">Waiting, blocked, paused, or failed</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Closed</p><p className="mt-1 text-lg font-medium">{closed.length}</p><p className="text-[10px] text-muted-foreground">Completed or cancelled</p></div></div>
        {missions.length ? <>{renderGroup("Active work", "Current execution and scheduled work", active, "No missions are queued or running.")}{renderGroup("Needs attention", "Waiting states and recoverable or paused work", needsAttention, "No mission currently needs a decision.")}{closed.length > 0 && <details className="border-t border-foreground/10"><summary className="cursor-pointer px-3 py-3 text-[10px] font-medium sm:px-4">Recently closed ({closed.length})</summary>{closed.map(renderMission)}</details>}</> : <p className="p-5 text-xs text-muted-foreground">No autonomous missions yet. Start one from Chat or the API when work should continue beyond one turn.</p>}
      </Card>
      {outcomes.length > 0 && <details className="mb-4 rounded-lg border border-foreground/10 bg-background"><summary className="cursor-pointer px-3 py-3 text-[11px] font-medium sm:px-4">Outcome templates <span className="ml-1 font-normal text-muted-foreground">{outcomes.length} governed packages · planning starts in Chat</span></summary><div className="grid gap-2 border-t border-foreground/10 p-3 md:grid-cols-2 xl:grid-cols-3 sm:p-4">{outcomes.map((outcome) => <article key={outcome.slug} className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-xs font-medium">{outcome.name}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{short(outcome.description, 130)}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-muted-foreground"><span className="rounded-sm border border-foreground/10 px-1.5 py-0.5">{outcome.department}</span><span className="rounded-sm border border-foreground/10 px-1.5 py-0.5">{outcome.evidenceRequired.length} evidence rules</span><span className="rounded-sm border border-foreground/10 px-1.5 py-0.5">{outcome.approvalPolicy}</span></div></article>)}</div></details>}
    </>}
  </div>;
}

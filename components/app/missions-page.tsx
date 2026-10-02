"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, GitBranch, HeartPulse, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { chuskyApi, type Mission, type MissionDoctor, type MissionProof, type MissionWorkSchedule, type OutcomePackage } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { useLiveData } from "@/lib/live-sync";
import { MarkdownMessage } from "./markdown-message";

const tone = (status: Mission["status"]): "green" | "amber" | "gray" => status === "completed" ? "green" : ["blocked", "failed", "paused", "waiting"].includes(status) ? "amber" : "gray";
const date = (value: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const short = (value: string, max = 180) => value.length > max ? `${value.slice(0, max - 1)}…` : value;
const label = (value: string) => value.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (character) => character.toUpperCase());
type MissionDetail = { mission: Mission; proof?: MissionProof; doctor?: MissionDoctor; events: Mission["events"] };

function EvidenceStatus({ verified, verifiedBy }: { verified: boolean; verifiedBy?: string }) {
  return <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[9px] font-medium ${verified ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-200"}`}>
    <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${verified ? "bg-emerald-500" : "bg-amber-500"}`} />
    {verified ? "Verified" : "Not verified"}{verified && verifiedBy ? ` · ${label(verifiedBy)}` : ""}
  </span>;
}

function EvidenceRecord({ item }: { item: MissionProof["evidence"][number] }) {
  const hasFullSummary = item.summary.length > 320;
  const hasMetadata = Boolean(item.source || item.ref || item.hash);
  return <li className="min-w-0 rounded-md border border-foreground/10 bg-background/60 p-3 sm:p-3.5">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="break-words font-mono text-[10px] font-medium text-foreground">{label(item.kind)}</p>
        {item.createdAt ? <time className="mt-1 block text-[9px] text-muted-foreground" dateTime={new Date(item.createdAt).toISOString()}>{date(item.createdAt)}</time> : null}
      </div>
      <EvidenceStatus verified={item.verified} verifiedBy={item.verifiedBy} />
    </div>
    <p className="mt-2 break-words text-[11px] leading-5 text-foreground">{short(item.summary, 320)}</p>
    {hasFullSummary && <details className="mt-2 min-w-0 border-t border-foreground/10 pt-2">
      <summary className="cursor-pointer text-[10px] font-medium text-foreground">View full record</summary>
      <div className="mission-markdown-panel mt-2 min-w-0 rounded-md bg-foreground/[0.025] p-2.5"><MarkdownMessage className="mission-markdown" content={item.summary} /></div>
    </details>}
    {hasMetadata && <details className="mt-2 min-w-0 border-t border-foreground/10 pt-2">
      <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground">Record metadata</summary>
      <dl className="mt-2 grid min-w-0 gap-1.5 text-[10px] sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
        {item.source ? <><dt className="font-medium text-muted-foreground">Source</dt><dd className="break-all font-mono text-foreground">{item.source}</dd></> : null}
        {item.ref ? <><dt className="font-medium text-muted-foreground">Reference</dt><dd className="break-all font-mono text-foreground">{item.ref}</dd></> : null}
        {item.hash ? <><dt className="font-medium text-muted-foreground">Hash</dt><dd className="break-all font-mono text-foreground">{item.hash}</dd></> : null}
      </dl>
    </details>}
  </li>;
}

function ActivityRecord({ event }: { event: Mission["events"][number] }) {
  const hasFullMessage = event.message.length > 360;
  return <article className="grid min-w-0 gap-2 border-l-2 border-foreground/15 pl-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3 sm:pl-3">
    <time className="whitespace-nowrap pt-0.5 font-mono text-[9px] leading-4 text-muted-foreground" dateTime={new Date(event.at).toISOString()}>{date(event.at)}</time>
    <div className="min-w-0 rounded-md border border-foreground/10 bg-background/60 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label(event.type)}</p>
      {hasFullMessage ? <>
        <p className="mt-2 break-words text-[11px] leading-5 text-foreground">{short(event.message, 360)}</p>
        <details className="mt-2 border-t border-foreground/10 pt-2">
          <summary className="cursor-pointer text-[10px] font-medium text-foreground">View full activity</summary>
          <div className="mission-markdown-panel mt-2 min-w-0 rounded-md bg-foreground/[0.025] p-2.5"><MarkdownMessage className="mission-markdown" content={event.message} /></div>
        </details>
      </> : <div className="mt-1.5 min-w-0"><MarkdownMessage content={event.message || event.type} /></div>}
    </div>
  </article>;
}

const seconds = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  if (value < 3600) return `${Math.floor(value / 60)}m`;
  if (value < 86400) return `${(value / 3600).toFixed(1)}h`;
  return `${(value / 86400).toFixed(1)}d`;
};

function MissionDoctorPanel({ doctor }: { doctor?: MissionDoctor }) {
  if (!doctor) return <div className="rounded-md border border-dashed border-foreground/15 p-3 text-[10px] text-muted-foreground">Diagnosis is unavailable. Refresh to ask the server again.</div>;
  const toneName = doctor.health === "healthy" ? "text-emerald-700" : doctor.health === "waiting" ? "text-amber-700" : "text-red-700";
  return <section className="min-w-0 rounded-md border border-foreground/10 bg-foreground/[0.015] p-3" aria-label="Mission diagnosis">
    <div className="flex min-w-0 items-start gap-2"><HeartPulse size={14} className={`mt-0.5 shrink-0 ${toneName}`} aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium text-foreground">Runtime diagnosis</p><span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${toneName}`}>{doctor.health}</span></div><p className="mt-1 break-words text-[10px] leading-4">{doctor.summary}</p></div></div>
    {doctor.reasons.length > 0 && <p className="mt-2 break-words text-[10px] text-muted-foreground">Signals: {doctor.reasons.join(" · ")}</p>}
    {doctor.nextActions.length > 0 && <div className="mt-2 border-t border-foreground/10 pt-2"><p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Next actions</p><ul className="mt-1 space-y-1 text-[10px] text-foreground">{doctor.nextActions.slice(0, 4).map((action) => <li key={action} className="break-words">{action}</li>)}</ul></div>}
  </section>;
}

function MissionControlForm({ mission, onSave, disabled }: { mission: Mission; onSave: (input: { budget?: Record<string, number>; workSchedule?: MissionWorkSchedule }) => Promise<void>; disabled: boolean }) {
  const schedule = mission.workSchedule;
  const [values, setValues] = useState({
    maxDurationSeconds: String(Math.round(mission.budget.maxDurationSeconds)),
    maxSteps: String(mission.budget.maxSteps),
    maxSlices: String(mission.budget.maxSlices ?? ""),
    maxToolCalls: String(mission.budget.maxToolCalls),
    maxCost: String(mission.budget.maxCost),
    timezone: schedule?.timezone ?? "UTC",
    windowStart: schedule?.windowStart ?? "09:00",
    windowEnd: schedule?.windowEnd ?? "17:00",
    dailyBudgetSeconds: String(schedule?.dailyBudgetSeconds ?? 3 * 3600),
    cadenceSeconds: String(schedule?.cadenceSeconds ?? 900),
  });
  const [includeSchedule, setIncludeSchedule] = useState(Boolean(schedule));
  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const budget: Record<string, number> = {};
    for (const key of ["maxDurationSeconds", "maxSteps", "maxSlices", "maxToolCalls", "maxCost"] as const) {
      const value = Number(values[key]);
      if (values[key] !== "" && Number.isFinite(value)) budget[key] = value;
    }
    const workSchedule = includeSchedule ? { timezone: values.timezone.trim(), windowStart: values.windowStart, windowEnd: values.windowEnd, dailyBudgetSeconds: Number(values.dailyBudgetSeconds), cadenceSeconds: Number(values.cadenceSeconds) } : undefined;
    await onSave({ budget, workSchedule });
  };
  const field = (key: keyof typeof values, labelText: string, type = "number") => <label className="grid gap-1 text-[10px] text-muted-foreground"><span>{labelText}</span><input value={values[key]} onChange={(event) => update(key, event.target.value)} type={type} min={type === "number" ? 0 : undefined} className="min-h-8 rounded-md border border-foreground/15 bg-background px-2 text-[11px] text-foreground outline-none focus:border-foreground/40" /></label>;
  return <details className="min-w-0 rounded-md border border-foreground/10 p-3"><summary className="cursor-pointer text-[10px] font-medium text-foreground">Execution policy and work window</summary><form onSubmit={(event) => void submit(event)} className="mt-3 grid gap-3">
    <p className="text-[10px] leading-4 text-muted-foreground">Changes are validated against the owner-approved ceilings. Reducing a budget may deliberately block an already-over-budget mission; it never resets consumed work.</p>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{field("maxDurationSeconds", "Max duration (seconds)")}{field("maxSteps", "Plan steps")}{field("maxSlices", "Execution slices")}{field("maxToolCalls", "Tool calls")}{field("maxCost", "Max cost (USD)")}</div>
    <label className="flex min-h-8 items-center gap-2 text-[10px] text-foreground"><input type="checkbox" checked={includeSchedule} onChange={(event) => setIncludeSchedule(event.target.checked)} /> Use a daily work window</label>
    {includeSchedule && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{field("timezone", "Timezone", "text")}{field("windowStart", "Window starts", "time")}{field("windowEnd", "Window ends", "time")}{field("dailyBudgetSeconds", "Daily budget (seconds)")}{field("cadenceSeconds", "Cadence (seconds)")}</div>}
    <Button disabled={disabled}>{disabled ? "Saving…" : "Save execution policy"}</Button>
  </form></details>;
}

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selected, setSelected] = useState<MissionDetail>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [detailBusy, setDetailBusy] = useState<string>();
  const [detailError, setDetailError] = useState<string>();
  const [outcomes, setOutcomes] = useState<OutcomePackage[]>([]);
  const selectedMissionRef = useRef<string | undefined>(undefined);
  const detailRequestRef = useRef(0);

  const load = async () => {
    setOffline(false);
    try { setMissions((await chuskyApi.missions.list()).data); }
    catch { setOffline(true); }
  };

  const loadDetail = async (mission: Mission) => {
    const requestId = ++detailRequestRef.current;
    selectedMissionRef.current = mission.id;
    setDetailBusy(mission.id);
    setDetailError(undefined);
    try {
      const [fresh, proof, doctor, events] = await Promise.all([
        chuskyApi.missions.get(mission.id),
        chuskyApi.missions.proof(mission.id).catch(() => undefined),
        chuskyApi.missions.doctor(mission.id).catch(() => undefined),
        chuskyApi.missions.events(mission.id, 5000).catch(() => ({ data: mission.events })),
      ]);
      if (requestId !== detailRequestRef.current || selectedMissionRef.current !== mission.id) return;
      setMissions((current) => current.map((item) => item.id === fresh.id ? fresh : item));
      setSelected({ mission: fresh, proof, doctor, events: events.data });
    } catch (cause) {
      if (requestId !== detailRequestRef.current || selectedMissionRef.current !== mission.id) return;
      setDetailError(cause instanceof Error ? cause.message : "Mission details could not be loaded.");
    } finally {
      if (requestId === detailRequestRef.current) setDetailBusy(undefined);
    }
  };

  const toggleDetail = (mission: Mission, isSelected: boolean) => {
    if (isSelected) {
      detailRequestRef.current += 1;
      selectedMissionRef.current = undefined;
      setSelected(undefined);
      setDetailBusy(undefined);
      setDetailError(undefined);
      return;
    }
    void loadDetail(mission);
  };

  useEffect(() => { void load(); void chuskyApi.outcomes.list().then((result) => setOutcomes(result.data)).catch(() => setOutcomes([])); }, []);
  useLiveData(async () => {
    await load();
    if (selected && selectedMissionRef.current === selected.mission.id) await loadDetail(selected.mission);
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

  const saveControl = async (mission: Mission, input: { budget?: Record<string, number>; workSchedule?: MissionWorkSchedule }) => {
    setBusy(mission.id);
    setDetailError(undefined);
    try {
      const next = await chuskyApi.missions.control(mission.id, input);
      setMissions((current) => current.map((item) => item.id === next.id ? next : item));
      await loadDetail(next);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "The mission execution policy could not be saved.");
    } finally { setBusy(undefined); }
  };

  const active = missions.filter((mission) => ["queued", "running"].includes(mission.status));
  const needsAttention = missions.filter((mission) => ["waiting", "blocked", "paused", "failed"].includes(mission.status));
  const closed = missions.filter((mission) => ["completed", "cancelled"].includes(mission.status));

  const renderMission = (mission: Mission) => {
    const isSelected = selected?.mission.id === mission.id;
    const proof = isSelected ? selected.proof : undefined;
    const doctor = isSelected ? selected.doctor : undefined;
    const eventList = isSelected ? selected.events : [];
    const stepNames = new Map(mission.steps.map((step) => [step.id, step.title]));
    const detailId = `mission-details-${mission.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    return <div key={mission.id} className="min-w-0 border-b border-foreground/10 p-3 last:border-0 sm:p-4">
      <button type="button" className="min-h-11 w-full min-w-0 text-left" onClick={() => toggleDetail(mission, isSelected)} disabled={detailBusy === mission.id && !isSelected} aria-expanded={isSelected} aria-controls={detailId}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><div className="min-w-0"><p className="text-xs font-medium leading-4">{mission.title}</p><p className="mt-1 font-mono text-[9px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">{mission.id} · updated {date(mission.updatedAt)}</p></div><span className="flex items-center gap-2"><Status tone={tone(mission.status)}>{mission.status}</Status><ChevronDown size={13} className={`mt-1 shrink-0 text-muted-foreground transition-transform ${isSelected ? "rotate-180" : ""}`} aria-hidden="true" /></span></div>
        <p className="mt-2 text-[11px] leading-[1.45rem] text-muted-foreground [overflow-wrap:anywhere]">{mission.nextAction || mission.checkpoint || short(mission.objective, 180)}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground"><span>{mission.consumedSteps} slices</span><span>{mission.toolCalls} tool calls</span><span>${mission.cost.toFixed(4)}</span><span>{mission.steps.length} steps</span>{mission.activeStepIds?.length ? <span>{mission.activeStepIds.length} active branches</span> : null}</div>
      </button>
      {isSelected && <div id={detailId} className="mission-detail-panel mt-3 min-w-0 space-y-3 border-t border-foreground/10 pt-3 text-[11px] text-muted-foreground sm:mt-4 sm:space-y-4 sm:pt-4">
        <details className="mission-disclosure group min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-medium text-foreground [&::-webkit-details-marker]:hidden"><span>Objective and definition of done</span><ChevronDown size={13} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><div className="mission-markdown-panel mt-3 min-w-0 space-y-3"><div><p className="mb-1 text-[10px] font-medium text-foreground">Objective</p><MarkdownMessage className="mission-markdown" content={mission.objective} /></div><div><p className="mb-1 text-[10px] font-medium text-foreground">Definition of done</p><MarkdownMessage className="mission-markdown" content={mission.definitionOfDone} /></div></div></details>
        <MissionDoctorPanel doctor={doctor} />
        {mission.waiting && <div className="flex min-w-0 items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 sm:p-3"><Timer size={14} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" /><p className="min-w-0 [overflow-wrap:anywhere]">Waiting for {mission.waiting.kind}{mission.waiting.provider ? ` from ${mission.waiting.provider}` : ""}{mission.waiting.providerEventId ? ` · ${mission.waiting.providerEventId}` : ""}</p></div>}
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Verification</p><p className="mt-1 flex items-center gap-1.5 text-foreground">{mission.verification?.verified ? <CheckCircle2 size={13} aria-hidden="true" /> : <CircleAlert size={13} aria-hidden="true" />}{mission.verification?.verified ? "Verified" : "Not verified"}</p><p className="mt-1 text-[10px]">{mission.verification?.mode === "strict" ? "Strict evidence gate" : "Legacy completion mode"}</p>{mission.verification?.reason && <p className="mt-1 [overflow-wrap:anywhere]">{mission.verification.reason}</p>}</div>
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Budget</p><p className="mt-1 text-foreground">{mission.consumedSteps}/{mission.budget.maxSteps} plan steps</p><p className="mt-1 text-[10px] [overflow-wrap:anywhere]">{mission.consumedSlices ?? 0}/{mission.budget.maxSlices ?? "∞"} slices · {mission.toolCalls}/{mission.budget.maxToolCalls} tools</p><p className="mt-1 text-[10px] [overflow-wrap:anywhere]">${mission.cost.toFixed(4)} / ${mission.budget.maxCost.toFixed(4)}</p></div>
          <div className="min-w-0 rounded-md border border-foreground/10 p-2.5 sm:p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Timing and proof</p><p className="mt-1 text-foreground">{mission.timing ? `${seconds(mission.timing.activeMs / 1000)} active` : "Timing unavailable"} · {mission.budget.durationMode ?? "wall_clock"}</p><p className="mt-1 flex items-center gap-1.5 text-foreground"><ShieldCheck size={13} aria-hidden="true" />{(proof?.evidence ?? mission.evidence ?? []).length} evidence records</p><p className="mt-1 text-[10px]">{eventList.length} durable events</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-md border border-foreground/10 p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Work window</p>{mission.workSchedule ? <><p className="mt-1 text-foreground">{mission.workSchedule.windowStart}–{mission.workSchedule.windowEnd} · {mission.workSchedule.timezone}</p><p className="mt-1 text-[10px]">{seconds(mission.workSchedule.dailyBudgetSeconds)} per day · wakes every {seconds(mission.workSchedule.cadenceSeconds)}</p></> : <p className="mt-1 text-[10px]">No daily window configured; the worker follows the mission’s durable timers and waits.</p>}</div>
          <div className="min-w-0 rounded-md border border-foreground/10 p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Continuation</p><p className="mt-1 break-words text-foreground">{mission.nextAction || "Continue from the saved checkpoint."}</p>{mission.budgetCeiling && <p className="mt-1 text-[10px]">Owner ceilings are active; policy changes remain bounded.</p>}</div>
        </div>
        <MissionControlForm mission={mission} disabled={busy === mission.id} onSave={(input) => saveControl(mission, input)} />
        <section className="min-w-0 space-y-2" aria-label="Mission steps and dependencies"><div className="flex items-center gap-2 text-foreground"><GitBranch size={13} aria-hidden="true" /><span className="font-medium">Step map</span><span className="text-[10px] text-muted-foreground">{mission.steps.length} steps · dependencies and active branches</span></div>
          {mission.steps.length ? <ol className="space-y-2">{mission.steps.map((step, index) => {
            const isActive = step.id === mission.currentStepId || mission.activeStepIds?.includes(step.id);
            return <li key={step.id} className={`min-w-0 rounded-md border p-2.5 sm:p-3 ${isActive ? "border-foreground/25 bg-foreground/[0.025]" : "border-foreground/10"}`}>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><span className="min-w-0 leading-4 text-foreground [overflow-wrap:anywhere]"><span className="mr-1.5 font-mono text-[9px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{step.title}{isActive && <span className="ml-2 text-[9px] font-medium text-foreground">Current</span>}</span><Status tone={step.status === "completed" ? "green" : ["blocked", "failed"].includes(step.status) ? "amber" : "gray"}>{step.status}</Status></div>
              <div className="mission-markdown-panel mt-1 min-w-0"><MarkdownMessage className="mission-markdown" content={short(step.objective, 240)} /></div>
              {step.dependsOn.length > 0 && <p className="mt-2 text-[10px] leading-4 [overflow-wrap:anywhere]">After: {step.dependsOn.map((id) => stepNames.get(id) ?? id).join(" · ")}</p>}
              {step.parallelGroup && <p className="mt-1 text-[10px]">Parallel group: {step.parallelGroup}</p>}
              {step.evidence?.length ? <p className="mt-1 text-[10px] text-green-700">{step.evidence.length} evidence record{step.evidence.length === 1 ? "" : "s"}</p> : null}
              {step.result && <details className="mission-disclosure group mt-2"><summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] text-foreground [&::-webkit-details-marker]:hidden"><ChevronDown size={12} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />Step result</summary><div className="mission-markdown-panel mt-1"><MarkdownMessage className="mission-markdown" content={step.result} /></div></details>}
            </li>;
          })}</ol> : <p className="rounded-md border border-dashed border-foreground/15 p-3 text-[10px]">This mission has no dependency steps; progress is tracked through its checkpoint and events.</p>}
        </section>
        {(proof?.evidence ?? mission.evidence ?? []).length > 0 && <details className="mission-disclosure group min-w-0 rounded-md border border-foreground/10 bg-foreground/[0.015] p-2.5 sm:p-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-foreground [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-1.5"><ChevronDown size={13} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />Evidence records</span><span className="rounded-full bg-foreground/[0.06] px-2 py-1 font-mono text-[9px] text-muted-foreground">{(proof?.evidence ?? mission.evidence ?? []).length}</span></summary><ul className="mt-3 space-y-2">{(proof?.evidence ?? mission.evidence ?? []).map((item) => <EvidenceRecord key={item.id} item={item} />)}</ul></details>}
        {eventList.length > 0 && <section className="min-w-0" aria-label="Recent activity"><div className="mb-2 flex items-baseline justify-between gap-2"><p className="font-medium text-foreground">Recent activity</p><span className="font-mono text-[9px] text-muted-foreground">{Math.min(eventList.length, 5)} shown</span></div><div className="space-y-2.5">{eventList.slice(-5).reverse().map((event) => <ActivityRecord key={event.id} event={event} />)}</div></section>}
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

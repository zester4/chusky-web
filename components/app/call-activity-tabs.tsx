"use client";

import { ClipboardCheck, FileText, List, ListChecks, LoaderCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { CallControl, CallRecord, Task } from "@/lib/chusky-api";
import { Button, Status } from "./app-shell";
import { resolveProviderBrand } from "./trigger-logo";
import { ToolkitLogo } from "./toolkit-logo";

type CallTab = "logs" | "transcript" | "outcome" | "tasks";

const tabs: Array<{ id: CallTab; label: string; icon: LucideIcon }> = [
  { id: "logs", label: "Logs", icon: List },
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "outcome", label: "Outcome", icon: ClipboardCheck },
  { id: "tasks", label: "Tasks", icon: ListChecks },
];

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function eventLabel(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function statusTone(call: CallRecord): "green" | "amber" | "gray" {
  return call.terminalReason === "provider_accepted_reconciliation_pending" || call.runtimeState === "degraded" || call.runtimeState === "reconnecting" || call.status === "failed" || ["busy", "no-answer", "failed", "canceled", "unknown"].includes(call.providerStatus ?? "")
    ? "amber"
    : call.status === "active" || call.status === "ended" || call.runtimeState === "ended" || ["answered", "in-progress", "completed", "machine"].includes(call.providerStatus ?? "") ? "green" : "gray";
}

function statusLabel(call: CallRecord) {
  if (call.terminalReason === "provider_accepted_reconciliation_pending") return "Reconciliation pending — do not retry";
  if (call.runtimeState === "reconnecting") return "Reconnecting";
  if (call.runtimeState === "degraded") return "Degraded";
  if (call.runtimeState === "ended") return "Ended";
  if (call.providerStatus === "in-progress") return "Answered";
  if (call.providerStatus === "no-answer") return "No answer";
  if (call.providerStatus === "canceled") return "Cancelled";
  if (call.providerStatus === "machine") return "Voicemail";
  if (call.providerStatus) return call.providerStatus.replaceAll("-", " ").replace(/\b\w/g, (value) => value.toUpperCase());
  return call.status;
}

function taskTone(status: Task["status"]): "green" | "amber" | "gray" {
  return status === "completed" ? "green" : status === "failed" || status === "blocked" ? "amber" : "gray";
}

function taskLabel(status: Task["status"]) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function EmptyPanel({ children }: { children: string }) {
  return <div className="border border-dashed border-foreground/15 px-3 py-5 text-xs leading-5 text-muted-foreground">{children}</div>;
}

function LogsPanel({ call }: { call: CallRecord }) {
  const events = call.timeline ?? [];
  if (!events.length) return <EmptyPanel>No call events have been recorded yet.</EmptyPanel>;

  return <ol className="space-y-3">
    {events.map((event) => <li key={event.id} className="relative border-l border-foreground/15 pl-3.5">
      <span className="absolute -left-[3px] top-1 h-1.5 w-1.5 rounded-full bg-foreground/35" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-medium">{eventLabel(event.type)}</p>
        <time className="text-[10px] text-muted-foreground">{date(event.at)}</time>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{event.summary}</p>
      {(event.toolSlug || event.receiptId || event.durationMs !== undefined) && <p className="mt-1 font-mono text-[9px] leading-4 text-muted-foreground/80">
        {[event.toolSlug, event.receiptId ? `Receipt ${event.receiptId}` : undefined, event.durationMs !== undefined ? `${event.durationMs} ms` : undefined].filter(Boolean).join(" · ")}
      </p>}
    </li>)}
  </ol>;
}

function TranscriptPanel({ call }: { call: CallRecord }) {
  const transcript = call.transcript;
  if (!transcript?.turns.length) return <EmptyPanel>The transcript is not available for this call yet.</EmptyPanel>;

  return <div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
      <span>Deepgram transcript · {transcript.turns.length} turns</span>
      {transcript.truncated && <Status tone="amber">Truncated</Status>}
    </div>
    <div className="space-y-3">
      {transcript.turns.map((turn) => <article key={turn.id} className="rounded-md border border-foreground/10 bg-foreground/[0.02] p-3">
        <time className="text-[9px] text-muted-foreground">{date(turn.at)}</time>
        {turn.caller && <p className="mt-2 text-[11px] leading-5"><span className="font-medium">Contact:</span> {turn.caller}</p>}
        {turn.assistant && <p className="mt-1.5 text-[11px] leading-5"><span className="font-medium">Chusky:</span> {turn.assistant}</p>}
      </article>)}
    </div>
    {transcript.updatedAt && <p className="mt-3 text-[10px] text-muted-foreground">Updated {date(transcript.updatedAt)}</p>}
  </div>;
}

function OutcomePanel({ call }: { call: CallRecord }) {
  const outcome = call.outcome;
  return <div className="space-y-4">
    {outcome ? <>
      <div>
        <p className="text-sm font-medium">{outcome.title}</p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{outcome.summary}</p>
      </div>
      {outcome.decisions.length > 0 && <section><p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Decisions</p><ul className="mt-2 space-y-1.5 text-xs leading-5">{outcome.decisions.map((item) => <li key={item} className="border-l border-foreground/15 pl-2.5">{item}</li>)}</ul></section>}
      {outcome.actionItems.length > 0 && <section><p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Action items</p><div className="mt-2 space-y-2">{outcome.actionItems.map((item, index) => <div key={`${item.task}-${index}`} className="border border-foreground/10 p-2.5 text-xs"><p>{item.task}</p><p className="mt-1 text-[10px] text-muted-foreground">Owner: {item.owner}{item.dueDate ? ` · Due ${item.dueDate}` : ""}</p></div>)}</div></section>}
      {outcome.openQuestions.length > 0 && <section><p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Open questions</p><ul className="mt-2 space-y-1.5 text-xs leading-5">{outcome.openQuestions.map((item) => <li key={item} className="border-l border-foreground/15 pl-2.5">{item}</li>)}</ul></section>}
    </> : call.summary ? <div><p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Summary</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{call.summary}</p></div> : <EmptyPanel>No structured outcome has been recorded yet.</EmptyPanel>}
    {call.outcomeStatus === "pending" && <p className="text-[10px] text-amber-700">Outcome processing is still in progress.</p>}
    {call.outcomeStatus === "failed" && <p className="text-[10px] text-amber-700">Outcome processing needs attention. Refresh after the call worker retries.</p>}
    {call.qa && <div className="border-t border-foreground/10 pt-3 text-[10px] text-muted-foreground">QA score: <span className="font-medium text-foreground">{call.qa.score}/100</span> · {call.qa.passed ? "passed" : "needs review"}</div>}
  </div>;
}

function TasksPanel({ call, tasks, tasksLoading, tasksError }: { call: CallRecord; tasks?: Task[]; tasksLoading: boolean; tasksError?: string }) {
  const taskIds = call.followUpTaskIds ?? [];
  const linkedTasks = tasks?.filter((task) => taskIds.includes(task.id)) ?? [];

  if (!taskIds.length) {
    if (call.followUpStatus === "failed") return <EmptyPanel>Follow-up task creation needs attention. No task was confirmed for this call.</EmptyPanel>;
    return <EmptyPanel>No follow-up tasks were created for this call.</EmptyPanel>;
  }
  if (tasksLoading || tasks === undefined) return <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading linked tasks…</div>;
  if (tasksError) return <EmptyPanel>{tasksError}</EmptyPanel>;
  if (!linkedTasks.length) return <EmptyPanel>The call has linked follow-up work, but its task details are not available yet.</EmptyPanel>;

  return <div className="space-y-2.5">
    {call.followUpStatus && <p className="text-[10px] text-muted-foreground">Follow-up status: <span className="font-medium text-foreground">{call.followUpStatus}</span></p>}
    {linkedTasks.map((task) => <article key={task.id} className="border border-foreground/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-xs font-medium">{task.title}</p><Status tone={taskTone(task.status)}>{taskLabel(task.status)}</Status></div>
      <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{task.objective}</p>
      {task.nextAction && <p className="mt-2 text-[10px]"><span className="font-medium">Next:</span> {task.nextAction}</p>}
      {task.checkpoint && <p className="mt-1 text-[10px] text-muted-foreground"><span className="font-medium text-foreground">Checkpoint:</span> {task.checkpoint}</p>}
      {task.result && <p className="mt-1 text-[10px] text-muted-foreground"><span className="font-medium text-foreground">Result:</span> {task.result}</p>}
      {task.error && <p className="mt-1 text-[10px] text-amber-700">{task.error}</p>}
      <p className="mt-2 font-mono text-[9px] text-muted-foreground">Updated {date(task.updatedAt)}</p>
    </article>)}
  </div>;
}

export function CallActivityTabs({ call, tasks, tasksLoading, tasksError, busy, onControl }: { call: CallRecord; tasks?: Task[]; tasksLoading: boolean; tasksError?: string; busy?: string; onControl: (input: CallControl) => void }) {
  const [activeTab, setActiveTab] = useState<CallTab>("logs");
  const active = ["starting", "bridging", "active"].includes(call.status);
  const taskCount = call.followUpTaskIds?.length ?? 0;
  const counts: Record<CallTab, number> = { logs: call.timeline?.length ?? 0, transcript: call.transcript?.turns.length ?? 0, outcome: call.outcome || call.summary ? 1 : 0, tasks: taskCount };
  const actionBusy = (name: string) => busy === `${call.id}:${name}`;

  return <div className="border-b border-foreground/10 p-4 last:border-0">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/10"><Phone size={14} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{call.direction === "inbound" ? "Incoming call" : "Outgoing call"} · {call.phoneNumber}</p><Status tone={statusTone(call)}>{statusLabel(call)}</Status></div>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{call.purpose}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
          {call.toolPolicy?.enabled && <span className="flex flex-wrap items-center gap-1.5 rounded border border-foreground/10 px-1.5 py-1">{call.toolPolicy.allowedToolkits.length ? call.toolPolicy.allowedToolkits.map((toolkit) => { const brand = resolveProviderBrand({ toolkitSlug: toolkit }); return <span key={toolkit} className="inline-flex items-center gap-1"><ToolkitLogo name={brand.name} logo={brand.logo} size={16} /><span>{brand.name}</span></span>; }) : "Purpose-routed apps"}{call.toolPolicy.allowExternalWrites ? " · actions enabled" : " · read-only"}</span>}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{call.providerStatus ? `Call status: ${call.providerStatus.replaceAll("-", " ")}` : "Call status pending"}{call.callLengthSeconds !== undefined ? ` · ${Math.floor(call.callLengthSeconds / 60)}m ${call.callLengthSeconds % 60}s` : ""}{call.terminalReason ? ` · ${call.terminalReason.replaceAll("_", " ")}` : ""}</p>
        {call.error && <p className="mt-1 text-[11px] text-amber-700">{call.error}</p>}
      </div>
      <p className="shrink-0 text-[10px] text-muted-foreground">{date(call.updatedAt)}</p>
    </div>

    <div role="tablist" aria-label={`Activity for ${call.phoneNumber}`} className="mt-4 flex overflow-x-auto border-y border-foreground/10">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={`flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[10px] font-medium transition-colors ${activeTab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Icon size={12} />{label}<span className="font-mono text-[9px] opacity-70">{counts[id]}</span></button>)}
    </div>

    <div role="tabpanel" className="mt-4 min-h-20">
      {activeTab === "logs" && <LogsPanel call={call} />}
      {activeTab === "transcript" && <TranscriptPanel call={call} />}
      {activeTab === "outcome" && <OutcomePanel call={call} />}
      {activeTab === "tasks" && <TasksPanel call={call} tasks={tasks} tasksLoading={tasksLoading} tasksError={tasksError} />}
    </div>

    {active && <div className="mt-4 flex flex-wrap gap-2"><Button secondary disabled={Boolean(busy)} onClick={() => onControl({ action: "hangup" })}>{actionBusy("hangup") ? <LoaderCircle size={12} className="animate-spin" /> : null} Hang up</Button><Button secondary disabled={Boolean(busy)} onClick={() => { const digits = window.prompt("DTMF digits to send"); if (digits) onControl({ action: "send_dtmf", digits }); }}>Send DTMF</Button><Button secondary disabled={Boolean(busy)} onClick={() => { const number = window.prompt("Transfer to E.164 number"); if (number) onControl({ action: "transfer", phoneNumber: number.replace(/[\s().-]/g, "") }); }}>Transfer</Button></div>}
  </div>;
}

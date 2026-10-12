"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown, Circle, FileCheck2, LoaderCircle, Search, ShieldCheck, Sparkles, Timer } from "lucide-react";
import type { RunEvidence, RunProgress, RunProgressPhase } from "@/lib/chusky-api";
import { TriggerLogoGroup, triggerProviderBrand } from "./trigger-logo";

const phases: Array<{ id: RunProgressPhase; label: string }> = [
  { id: "planning", label: "Plan" },
  { id: "researching", label: "Research" },
  { id: "acting", label: "Act" },
  { id: "waiting", label: "Review" },
  { id: "completed", label: "Done" },
];

const phaseIndex = (phase: RunProgressPhase) => phases.findIndex((item) => item.id === phase);

function EvidenceIcon({ kind }: { kind?: RunEvidence["kind"] }) {
  if (kind === "source") return <Search size={12} aria-hidden="true" />;
  if (kind === "artifact") return <FileCheck2 size={12} aria-hidden="true" />;
  if (kind === "step") return <Check size={12} aria-hidden="true" />;
  return <Circle size={8} fill="currentColor" aria-hidden="true" />;
}

function safeEvidenceHref(href?: string) {
  return href && /^(?:https?:|artifact:|sandbox:)/i.test(href) ? href : undefined;
}

export function AgentProgressCard({
  progress,
  details,
  openDetails = false,
  className = "",
}: {
  progress: RunProgress;
  details?: ReactNode;
  openDetails?: boolean;
  className?: string;
}) {
  const currentIndex = phaseIndex(progress.phase);
  const provider = progress.provider ? triggerProviderBrand(progress.provider) : undefined;
  const percent = typeof progress.progress === "number" && Number.isFinite(progress.progress)
    ? Math.round(Math.max(0, Math.min(1, progress.progress)) * 100)
    : undefined;
  const evidence = progress.evidence?.slice(0, 4) ?? [];
  const live = progress.phase !== "completed";

  return <article className={`agent-progress-card ${className}`} aria-label="Agent progress" aria-busy={live}>
    <div className="agent-progress-header">
      <div className="agent-progress-icon" aria-hidden="true">
        <TriggerLogoGroup text={provider?.name} slugs={[progress.provider || "chusky"]} size={34} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="agent-progress-eyebrow">Agent progress</span>
          {provider ? <span className="agent-progress-provider">{provider.name}</span> : null}
          {progress.requiresApproval ? <span className="agent-progress-approval"><ShieldCheck size={11} aria-hidden="true" /> Approval needed</span> : null}
        </div>
        <h3 className="agent-progress-title">{progress.title}</h3>
        {progress.detail ? <p className="agent-progress-detail">{progress.detail}</p> : null}
      </div>
      <span className={`agent-progress-state ${progress.phase === "completed" ? "is-complete" : progress.requiresApproval ? "is-waiting" : ""}`}>
        {progress.phase === "completed" ? <Check size={13} aria-hidden="true" /> : progress.requiresApproval ? <ShieldCheck size={13} aria-hidden="true" /> : <LoaderCircle size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        <span className="sr-only">{progress.phase === "completed" ? "Completed" : progress.requiresApproval ? "Waiting for approval" : "In progress"}</span>
      </span>
    </div>

    <div className="agent-progress-phases" aria-label={`Current phase: ${phases[currentIndex]?.label || progress.phase}`}>
      {phases.map((item, index) => {
        const reached = currentIndex >= 0 && index <= currentIndex;
        const active = item.id === progress.phase;
        return <div key={item.id} className={`agent-progress-phase ${reached ? "is-reached" : ""} ${active ? "is-active" : ""}`}>
          <span className="agent-progress-phase-dot">{item.id === "completed" && reached ? <Check size={10} aria-hidden="true" /> : index === currentIndex && live ? <Sparkles size={10} aria-hidden="true" /> : index < currentIndex ? <Check size={10} aria-hidden="true" /> : <span>{index + 1}</span>}</span>
          <span>{item.label}</span>
        </div>;
      })}
    </div>

    <div className="agent-progress-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} {...(percent === undefined ? {} : { "aria-valuenow": percent })} aria-label={percent === undefined ? "Agent work in progress" : `${percent}% complete`}>
      <span className={percent === undefined ? "is-indeterminate" : ""} style={percent === undefined ? undefined : { width: `${percent}%` }} />
    </div>
    <div className="agent-progress-meter-meta"><span>{progress.phase === "completed" ? "Completed" : progress.requiresApproval ? "Paused safely" : "Working"}</span>{percent !== undefined ? <span>{percent}%</span> : <span className="inline-flex items-center gap-1"><Timer size={11} aria-hidden="true" /> Live</span>}</div>

    {evidence.length ? <div className="agent-evidence" aria-label="Evidence from this run">
      <span className="agent-evidence-label">Evidence</span>
      <div className="agent-evidence-list">
        {evidence.map((item, index) => {
          const href = safeEvidenceHref(item.href);
          const content = <><span className="agent-evidence-icon"><EvidenceIcon kind={item.kind} /></span><span className="min-w-0 truncate">{item.label}</span></>;
          return href ? <a key={item.id || `${item.label}-${index}`} href={href} target="_blank" rel="noopener noreferrer" className="agent-evidence-item" title={item.detail || item.label}>{content}</a> : <span key={item.id || `${item.label}-${index}`} className="agent-evidence-item" title={item.detail || item.label}>{content}</span>;
        })}
      </div>
    </div> : null}

    {details ? <details className="agent-progress-details" open={openDetails}>
      <summary><span className="inline-flex items-center gap-1.5"><span>Execution details</span><span className="font-normal text-muted-foreground">· inspect the work trail</span></span><ChevronDown size={14} aria-hidden="true" /></summary>
      {details}
    </details> : null}
  </article>;
}

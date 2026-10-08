"use client";

import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  CheckCircle2,
  CircleCheckBig,
  Check,
  Clock4,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  PlugZap,
  FileText,
  FileImage,
  LoaderCircle,
  MoreHorizontal,
  Mic,
  Plus,
  RotateCcw,
  ShieldCheck,
  Square,
  ThumbsUp,
  Share2,
    X,
} from "lucide-react";
import { chuskyApi, type AccountOverview, type Artifact, type Model, type PrivateRunLink, type Run, type RunImage, type RunStreamEvent, type RunSubagentActivity, type RunToolActivity, type Thread, type Toolkit } from "@/lib/chusky-api";
import { authClient } from "@/lib/auth-client";
import { approvalRecoveryState } from "@/lib/approval-recovery";
import { consumeOnboardingActivationDraft } from "@/lib/onboarding";
import { actionTokenForActivity, activityDetailSummary, coalesceSubagentActivities, coalesceToolActivities, presentToolActivities, toolkitSlugForActivity, upsertSubagentActivity, upsertToolActivity, type PresentedToolActivity, type SubagentActivity } from "@/lib/run-activity";
import { notifyChuskyDataChanged, useLiveData } from "@/lib/live-sync";
import { AppShellContext } from "./app-shell";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MarkdownMessage } from "./markdown-message";
import { ToolkitLogo } from "./toolkit-logo";

type ChatArtifact = Pick<Artifact, "id" | "name" | "type" | "contentType" | "size">;

type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  pending?: boolean;
  runId?: string;
  historyCommitted?: boolean;
  historyContent?: string;
  statusText?: string;
  tool?: string;
  activities?: RunToolActivity[];
  subagentActivities?: RunSubagentActivity[];
  attachments?: Array<{ id: string; name: string; contentType: string; size: number; downloadUrl?: string; previewUrl?: string }>;
  artifacts?: ChatArtifact[];
  images?: Array<RunImage & { downloadUrl?: string }>;
  privateLinks?: PrivateRunLink[];
  approval?: { id: string; toolSlug: string; expiresAt: string; deciding?: boolean };
  failure?: { code?: string; message?: string };
};

const formatToolLabel = (tool?: string) => tool ? tool.replace(/^(CHUCK|COMPOSIO)_/i, "").replaceAll("_", " ").toLowerCase() : "working";
const formatToolDuration = (durationMs?: number) => {
  if (durationMs === undefined || !Number.isFinite(durationMs)) return "";
  return durationMs < 1000 ? `${Math.round(durationMs)} ms` : `${(durationMs / 1000).toFixed(1)} s`;
};

const runActivities = (run: Run): RunToolActivity[] => coalesceToolActivities((run.events ?? []).flatMap((event): RunToolActivity[] => {
  if (event.type !== "run.tool_activity" || !event.toolSlug || !event.message || !event.status) return [];
  const batchActions = Array.isArray(event.batchActions) ? event.batchActions.flatMap((action) => action && typeof action.id === "string" && typeof action.toolSlug === "string" && ["started", "completed", "failed", "unknown", "approval_required", "cancelled"].includes(action.status ?? "") ? [{ id: action.id, toolSlug: action.toolSlug, status: action.status as NonNullable<RunToolActivity["batchActions"]>[number]["status"], ...(action.actionLabel ? { actionLabel: action.actionLabel } : {}), ...(action.toolkitSlug ? { toolkitSlug: action.toolkitSlug } : {}), ...(action.toolkitName ? { toolkitName: action.toolkitName } : {}), ...(action.toolkitLogo ? { toolkitLogo: action.toolkitLogo } : {}), ...(action.summary ? { summary: action.summary } : {}) }] : []) : undefined;
  return [{ id: event.id, type: "run.tool_activity", at: event.at, toolSlug: event.toolSlug, ...(event.callId ? { callId: event.callId } : {}), message: event.message, status: event.status as RunToolActivity["status"], ...(event.actionLabel ? { actionLabel: event.actionLabel } : {}), ...(event.toolkitSlug ? { toolkitSlug: event.toolkitSlug } : {}), ...(event.toolkitName ? { toolkitName: event.toolkitName } : {}), ...(event.toolkitLogo ? { toolkitLogo: event.toolkitLogo } : {}), ...(batchActions?.length ? { batchActions } : {}), ...(event.summary ? { summary: event.summary } : {}), ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}) }];
}));
const runSubagentActivities = (run: Run): RunSubagentActivity[] => coalesceSubagentActivities((run.events ?? []).flatMap((event): RunSubagentActivity[] => {
  if (event.type !== "run.subagent_activity" || !event.activityId || !event.parentToolCallId || !event.handoffId || !event.worker || !event.objective || !event.kind || !event.message || !event.status || event.status === "unknown") return [];
  return [{ id: event.id, type: "run.subagent_activity", at: event.at, activityId: event.activityId, parentToolCallId: event.parentToolCallId, handoffId: event.handoffId, worker: event.worker, objective: event.objective, kind: event.kind, message: event.message, status: event.status, ...(event.toolCallId ? { toolCallId: event.toolCallId } : {}), ...(event.toolSlug ? { toolSlug: event.toolSlug } : {}), ...(event.actionLabel ? { actionLabel: event.actionLabel } : {}), ...(event.toolkitSlug ? { toolkitSlug: event.toolkitSlug } : {}), ...(event.toolkitName ? { toolkitName: event.toolkitName } : {}), ...(event.toolkitLogo ? { toolkitLogo: event.toolkitLogo } : {}), ...(event.summary ? { summary: event.summary } : {}), ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}) }];
})).map((activity) => ({ ...activity, type: "run.subagent_activity" as const }));
const runDeltaText = (run: Run) => (run.events ?? []).filter((event) => event.type === "run.delta" && typeof event.text === "string").map((event) => event.text).join("");
const runProgressText = (run: Run) => [...(run.events ?? [])].reverse().find((event) => event.type === "run.status" && typeof event.text === "string" && event.text.trim())?.text;
const reconcileStreamedText = (current: string, snapshot: string) => {
  if (!snapshot || !current) return snapshot || current;
  if (snapshot.startsWith(current)) return snapshot;
  if (current.startsWith(snapshot)) return current;
  return current;
};
const runFailureCopy = (failure?: Message["failure"]) => {
  const detail = failure?.message || "";
  if (/429|rate limit|quota|too many requests/i.test(detail)) return {
    message: "The selected model is busy right now. Choose another model or try again in a moment.",
    detail: "The model request was rate limited before a final reply was saved.",
  };
  if (/502|503|504|openrouter|provider returned|gateway|upstream|temporar/i.test(detail)) return {
    message: "Sorry — I hit a temporary snag while replying. Your message is still here; please try again in a moment.",
    detail: "The model service did not return a final reply.",
  };
  return {
    message: "Sorry — I couldn’t complete that reply. Your message is still here; please try again in a moment.",
    detail: "The run ended before a final reply was saved.",
  };
};
const runStatusText = (run: Run) => {
  if (run.status === "requires_approval") return "Chusky needs your approval to continue with this action.";
  if (run.status === "failed") return "";
  if (run.status === "cancelled") return [...(run.events ?? [])].reverse().find((event) => event.type === "run.cancelled")?.text || "Run cancelled. The completed steps are shown above.";
  return run.output ?? "";
};
const specialistName = (worker: string) => worker.slice(0, 1).toUpperCase() + worker.slice(1);
const activityStatusText = (activity: SubagentActivity, isLive: boolean) => activity.status === "started" ? isLive ? "In progress" : "No final result was recorded" : activity.status === "completed" ? `Completed${formatToolDuration(activity.durationMs) ? ` · ${formatToolDuration(activity.durationMs)}` : ""}${activity.summary ? ` · ${activity.summary}` : ""}` : activity.status === "approval_required" ? "Waiting for approval" : activity.status === "waiting" ? "Waiting for Chusky" : activity.status === "cancelled" ? "Cancelled" : "Couldn’t complete this step";

function ActivityBrand({ toolSlug, toolkitSlug, toolkitName, toolkitLogo, size = 16 }: { toolSlug?: string; toolkitSlug?: string; toolkitName?: string; toolkitLogo?: string; size?: number }) {
  const isTreg = [toolkitSlug, toolkitName, toolSlug].some((value) => value?.split(/[_\s-]+/).some((part) => part.toLowerCase() === "treg"));
  if (isTreg) return <ToolkitLogo name="Treg" logo="/logos/treg.svg" size={size} />;
  if (toolSlug?.startsWith("CHUCK_")) return <img src="/brand/chusky-logo.png" alt="" aria-hidden="true" className="shrink-0 object-contain" style={{ width: size, height: size }} />;
  if (toolkitName || toolkitLogo) return <ToolkitLogo name={toolkitName || "Connected app"} logo={toolkitLogo} size={size} />;
  return <PlugZap size={size - 2} aria-hidden="true" className="shrink-0 text-muted-foreground" />;
}

function ActivityState({ activity, current }: { activity: PresentedToolActivity; current: boolean }) {
  const label = activity.status === "started" ? current ? "In progress" : "No final result was recorded"
    : activity.status === "completed" ? "Success"
      : activity.status === "approval_required" ? "Waiting for approval"
        : activity.status === "cancelled" ? "Cancelled"
          : activity.status === "unknown" ? "Outcome unknown" : "Failed";
  const icon = current || activity.status === "started" ? <Clock4 size={13} className={current ? "animate-pulse" : undefined} />
    : activity.status === "completed" ? <CircleCheckBig size={13} />
      : activity.status === "approval_required" ? <ShieldCheck size={13} />
        : activity.status === "cancelled" ? <Square size={11} />
          : activity.status === "unknown" ? <Clock4 size={13} />
              : <X size={13} />;
  const tone = activity.status === "completed" ? "bg-emerald-500/10 text-emerald-700" : activity.status === "approval_required" || activity.status === "unknown" ? "bg-amber-500/10 text-amber-700" : activity.status === "failed" ? "bg-rose-500/10 text-rose-700" : "bg-foreground/5 text-muted-foreground";
  return <span className={`inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] leading-4 ${tone}`}><span aria-hidden="true" className="shrink-0">{icon}</span>{label}</span>;
}

function ActivityMarker({ status, current, className = "" }: { status: PresentedToolActivity["status"] | RunSubagentActivity["status"]; current: boolean; className?: string }) {
  const icon = current || status === "started" ? <Clock4 size={14} className={current ? "animate-pulse" : undefined} />
    : status === "completed" ? <CircleCheckBig size={15} />
      : status === "approval_required" || status === "waiting" ? <ShieldCheck size={14} />
        : status === "cancelled" ? <Square size={11} />
          : <X size={14} />;
  const tone = current || status === "started" ? "text-chusky-amber" : status === "completed" ? "text-emerald-600" : status === "approval_required" || status === "waiting" ? "text-amber-600" : status === "failed" ? "text-rose-600" : "text-muted-foreground";
  return <span className={`chat-activity-marker ${className} ${tone}`} aria-hidden="true">{icon}</span>;
}

function RunFailureCard({ failure, onRetry }: { failure: Message["failure"]; onRetry: () => void }) {
  const copy = runFailureCopy(failure);
  return <div className="mt-2 max-w-xl rounded-lg border border-chusky-amber/25 bg-chusky-amber/5 p-3 text-[11px] leading-5 text-foreground">
    <p className="font-medium">Reply couldn’t be completed</p>
    <p className="mt-1 text-muted-foreground">{copy.message}</p>
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <button type="button" onClick={onRetry} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <RotateCcw size={12} aria-hidden="true" /> Try again
      </button>
      <details className="text-[10px] text-muted-foreground">
        <summary className="min-h-8 cursor-pointer list-none py-1 underline decoration-foreground/20 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">Technical details</summary>
        <p className="mt-1 max-w-sm leading-4">{copy.detail}{failure?.code ? ` Reference: ${failure.code}.` : ""}</p>
      </details>
    </div>
  </div>;
}

const lookupActivityToolkit = (activity: PresentedToolActivity, catalogue: Record<string, Toolkit>) => {
  const slug = toolkitSlugForActivity(activity);
  const toolkit = slug ? catalogue[slug] : undefined;
  return {
    slug: toolkit?.slug || activity.toolkitSlug || slug,
    name: toolkit?.name || activity.toolkitName || slug,
    logo: toolkit?.logo || activity.toolkitLogo,
  };
};

function SubagentTree({ activities, parentToolCallId, live }: { activities: RunSubagentActivity[]; parentToolCallId: string; live: boolean }) {
  const related = activities.filter((activity) => activity.parentToolCallId === parentToolCallId);
  const workers = [...new Map(related.filter((activity) => activity.kind === "worker").map((activity) => [activity.handoffId, activity])).values()];
  if (!workers.length) return null;
  return <details className="chat-subagent-tree mt-2 rounded-lg border border-foreground/10 bg-foreground/[0.018] p-2.5 shadow-sm" open>
    <summary className="cursor-pointer list-none text-[11px] font-medium leading-5 text-muted-foreground [&::-webkit-details-marker]:hidden">Coordinating {workers.length} {workers.length === 1 ? "specialist" : "specialists"}</summary>
    <ol className="chat-subagent-list mt-2 space-y-1.5 border-l border-foreground/15 pl-3">
      {workers.map((worker) => {
        const steps = related.filter((activity) => activity.handoffId === worker.handoffId && activity.kind === "tool");
        return <li key={worker.handoffId} className="chat-subagent-item relative min-w-0">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-1 shrink-0" aria-hidden="true"><ActivityMarker status={worker.status} current={live && worker.status === "started" && steps.every((step) => step.status !== "started")} /></span>
            <div className="min-w-0 flex-1"><p className="text-[11px] font-medium leading-4">{specialistName(worker.worker)} <span className="font-normal text-muted-foreground">· {worker.objective}</span></p><p className="text-[10px] leading-4 text-muted-foreground">{activityStatusText(worker, live)}</p></div>
          </div>
          {steps.length ? <ol className="chat-subagent-steps ml-2 mt-1 space-y-1 border-l border-foreground/10 pl-3">
            {steps.map((step) => <li key={step.activityId} className="chat-subagent-step relative flex min-w-0 items-start gap-2">
              <ActivityMarker status={step.status} current={live && step.status === "started"} className="chat-subagent-marker" />
              <ActivityBrand toolSlug={step.toolSlug} toolkitSlug={step.toolkitSlug} toolkitName={step.toolkitName} toolkitLogo={step.toolkitLogo} size={14} />
              <div className="min-w-0 flex-1"><p className="text-[11px] leading-4">{step.actionLabel || step.message}</p><div className="text-[10px] leading-4 text-muted-foreground">{step.toolkitName || step.toolkitSlug || (step.toolSlug ? formatToolLabel(step.toolSlug) : "Chusky tool")} · {activityStatusText(step, live)}</div>{step.toolCallId && activities.some((child) => child.parentToolCallId === step.toolCallId && child.kind === "worker") ? <SubagentTree activities={activities} parentToolCallId={step.toolCallId} live={live} /> : null}</div>
            </li>)}
          </ol> : null}
        </li>;
      })}
    </ol>
  </details>;
}
const formatArtifactSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, bytes || 0)} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
};
const normalizeArtifactText = (value: string) => {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Keep malformed provider paths comparable. */ }
  return decoded.toLowerCase().replace(/\.[a-z0-9]{2,8}$/i, "").replace(/[^a-z0-9]+/g, " ").trim();
};
const isArtifactLink = (href: string) => /^(sandbox:|file:|artifact:)|\/(?:mnt\/data|v1\/artifacts|artifacts)\//i.test(href);
const artifactLinksInText = (content: string, artifacts: ChatArtifact[]) => {
  const matches: ChatArtifact[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const label = normalizeArtifactText(match[1]);
    const href = match[2];
    const artifact = artifacts.find((candidate) => {
      const name = normalizeArtifactText(candidate.name);
      const id = candidate.id.toLowerCase();
      let decodedHref = href;
      try { decodedHref = decodeURIComponent(href); } catch { /* Keep malformed provider paths comparable. */ }
      const hrefText = decodedHref.toLowerCase();
      const normalizedHref = normalizeArtifactText(href);
      return (isArtifactLink(href) || hrefText.includes(id) || normalizedHref.includes(name)) &&
        (label.includes(name) || name.includes(label) || hrefText.includes(id) || normalizedHref.includes(name));
    });
    if (artifact && !matches.some((candidate) => candidate.id === artifact.id)) matches.push(artifact);
  }
  return matches;
};
const artifactReferencesInText = (content: string, artifacts: ChatArtifact[]) => {
  const matches = artifactLinksInText(content, artifacts);
  const normalizedContent = normalizeArtifactText(content);
  for (const artifact of artifacts) {
    const normalizedName = normalizeArtifactText(artifact.name);
    if (normalizedName && normalizedContent.includes(normalizedName) && !matches.some((candidate) => candidate.id === artifact.id)) matches.push(artifact);
  }
  return matches;
};
const stripArtifactLinks = (content: string, artifacts: ChatArtifact[]) => {
  if (!artifacts.length) return content;
  return content.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (full, label) => artifactLinksInText(full, artifacts).length ? label : full);
};
const containsVisualBlock = (content: string) => /(?:```|~~~)/.test(content);

function ArtifactCard({ artifact }: { artifact: ChatArtifact }) {
  const href = chuskyApi.artifacts.downloadHref(artifact.id);
  const isImage = artifact.contentType.startsWith("image/") || artifact.type === "image";
  const isVideo = artifact.contentType.startsWith("video/") || artifact.type === "video";
  const isAudio = artifact.contentType.startsWith("audio/");
  if (isImage) return <figure className="mt-2 max-w-xl overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.025]">
    <img src={href} alt={artifact.name} loading="lazy" decoding="async" className="max-h-[32rem] w-auto max-w-full object-contain" />
    <figcaption className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground"><span className="truncate">{artifact.name} · {formatArtifactSize(artifact.size)}</span><a href={href} download={artifact.name} className="shrink-0 underline underline-offset-2">Download</a></figcaption>
  </figure>;
  if (isVideo) return <figure className="mt-2 max-w-2xl overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.025]">
    <video controls playsInline preload="metadata" className="max-h-[32rem] w-full bg-black object-contain" aria-label={artifact.name}><source src={href} type={artifact.contentType || undefined} />Your browser cannot play this video.</video>
    <figcaption className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground"><span className="truncate">{artifact.name} · {formatArtifactSize(artifact.size)}</span><a href={href} download={artifact.name} className="shrink-0 underline underline-offset-2">Download</a></figcaption>
  </figure>;
  if (isAudio) return <figure className="mt-2 max-w-2xl rounded-md border border-foreground/10 bg-foreground/[0.025] p-3">
    <div className="mb-2 flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-muted-foreground" /><span className="min-w-0 truncate text-[11px] font-medium" title={artifact.name}>{artifact.name}</span></div>
    <audio controls preload="metadata" className="w-full" aria-label={artifact.name}><source src={href} type={artifact.contentType || undefined} />Your browser cannot play this audio.</audio>
    <figcaption className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground"><span>{formatArtifactSize(artifact.size)}</span><a href={href} download={artifact.name} className="shrink-0 underline underline-offset-2">Download</a></figcaption>
  </figure>;
  return <div className="mt-2 flex max-w-full items-center gap-3 rounded-md border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-foreground/10 bg-background text-muted-foreground"><FileText size={15} /></div>
    <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium" title={artifact.name}>{artifact.name}</p><p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{artifact.type} · {formatArtifactSize(artifact.size)}</p></div>
    <a href={href} download={artifact.name} className="inline-flex shrink-0 items-center gap-1.5 rounded border border-foreground/15 px-2.5 py-1.5 text-[10px] font-medium hover:bg-foreground/5" aria-label={`Download ${artifact.name}`}><Download size={12} />Download</a>
  </div>;
}

function GeneratedImageCard({ image, className = "" }: { image: RunImage & { downloadUrl?: string }; className?: string }) {
  if (!image.downloadUrl) return <div className={`generated-image-card rounded-md border border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground ${className}`}>{image.name} · preview unavailable</div>;
  return <figure className={`generated-image-card mt-2 w-full max-w-2xl overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.025] shadow-sm ${className}`}>
    {/* Signed, short-lived R2 URLs are account-authorized and bypass Next's image optimizer. */}
    <img src={image.downloadUrl} alt={image.name || "Image generated by Chusky"} loading="lazy" decoding="async" className="max-h-[32rem] w-auto max-w-full object-contain" />
    <figcaption className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground"><span className="truncate">{image.name} · {formatArtifactSize(image.size)}</span><a href={image.downloadUrl} download={image.name} className="shrink-0 underline underline-offset-2">Download</a></figcaption>
  </figure>;
}

function GeneratedImageGallery({ images }: { images: Array<RunImage & { downloadUrl?: string }> }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.86, 260), behavior: "smooth" });
  };
  return <section className="generated-image-gallery mt-2" aria-label={`${images.length} generated images`}>
    <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Generated images · {images.length}</p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => scrollRail(-1)} className="generated-image-nav" aria-label="Show previous generated image" title="Previous image"><ChevronLeft size={14} /></button>
        <button type="button" onClick={() => scrollRail(1)} className="generated-image-nav" aria-label="Show next generated image" title="Next image"><ChevronRight size={14} /></button>
      </div>
    </div>
    <div ref={railRef} className="generated-image-rail" tabIndex={0} aria-label="Generated image carousel">
      {images.map((image) => <div key={image.id} className="generated-image-slide"><GeneratedImageCard image={image} /></div>)}
    </div>
  </section>;
}

async function hydrateRunImages(images?: RunImage[]): Promise<Array<RunImage & { downloadUrl?: string }> | undefined> {
  if (!images?.length) return undefined;
  return Promise.all(images.map(async (image) => {
    try { const current = await chuskyApi.images.get(image.id); return { ...image, downloadUrl: current.downloadUrl }; }
    catch { return image; }
  }));
}

type PendingAttachment = { localId: string; file?: File; id?: string; name: string; contentType: string; size: number; progress: number; phase?: "queued" | "uploading" | "verifying"; status: "uploading" | "ready" | "error"; error?: string; previewUrl?: string; downloadUrl?: string };
type SendAttachment = { id: string; name: string; contentType: string; size: number; previewUrl?: string; downloadUrl?: string };
type QueuedMessage = { text: string; attachments: SendAttachment[] };
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/markdown", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "video/mp4", "video/webm"]);
const TYPE_BY_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf", txt: "text/plain", md: "text/markdown", zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", mp3: "audio/mpeg", ogg: "audio/ogg", oga: "audio/ogg", wav: "audio/wav", m4a: "audio/mp4", mp4: "video/mp4", webm: "video/webm" };
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const attachmentContentType = (file: File) => {
  const browserType = file.type.trim().toLowerCase().split(";")[0];
  if (ACCEPTED_TYPES.has(browserType)) return browserType;
  if (!browserType || browserType === "application/octet-stream" || browserType === "binary/octet-stream") {
    const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    return extension ? TYPE_BY_EXTENSION[extension] : undefined;
  }
  return undefined;
};

export function ChatPage() {
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const requestedThreadId = searchParams.get("thread");
  const requestedNew = searchParams.get("new") === "1";
  const newConversationNonce = searchParams.get("nonce");
  const requestedDraft = searchParams.get("draft");
  const requestedOnboarding = searchParams.get("onboarding") === "1";
  const [thread, setThread] = useState<Thread>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [queuedMessage, setQueuedMessage] = useState<QueuedMessage>();
  const [queuedMenuOpen, setQueuedMenuOpen] = useState(false);
  const [account, setAccount] = useState<AccountOverview>();
  const [models, setModels] = useState<Model[]>([]);
  const [runModel, setRunModel] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [controller, setController] = useState<AbortController>();
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>();
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number>();
  const [likedMessageIndex, setLikedMessageIndex] = useState<number>();
  const [editingMessageIndex, setEditingMessageIndex] = useState<number>();
  const [notice, setNotice] = useState<{ kind: "error" | "info"; message: string }>();
  const [globalApprovalBusy, setGlobalApprovalBusy] = useState<string>();
  const [artifactCatalog, setArtifactCatalog] = useState<Artifact[]>([]);
  const [toolkitCatalogue, setToolkitCatalogue] = useState<Record<string, Toolkit>>({});
  const [listening, setListening] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceMimeTypeRef = useRef<string>("audio/webm");
  const voiceCancelledRef = useRef(false);
  const voiceStreamRef = useRef<MediaStream | undefined>(undefined);
  const voiceAudioContextRef = useRef<AudioContext | undefined>(undefined);
  const voiceAnalyserRef = useRef<AnalyserNode | undefined>(undefined);
  const voiceAnimationFrameRef = useRef<number | undefined>(undefined);
  const voiceBarsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const activeRunIdRef = useRef<string | undefined>(undefined);
  const [activeRunId, setActiveRunId] = useState<string>();
  const messagesRef = useRef<Message[]>(messages);
  const queuedMessageRef = useRef<QueuedMessage | undefined>(undefined);
  const queuedFlushRef = useRef(false);
  const sendRef = useRef<((inputOverride?: string, attachmentOverride?: SendAttachment[]) => Promise<void>) | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const uploadAbortControllersRef = useRef(new Map<string, AbortController>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const toolkitLookupsRef = useRef(new Set<string>());
  const { setChatHeader } = useContext(AppShellContext);

  const syncActiveRunId = (runId: string | undefined) => {
    activeRunIdRef.current = runId;
    setActiveRunId(runId);
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    queuedMessageRef.current = queuedMessage;
  }, [queuedMessage]);

  // Runs created before toolkit metadata was made durable still deserve the
  // same verified app branding as Connected Apps. Resolve only distinct,
  // bounded provider candidates and accept a result only on an exact slug.
  useEffect(() => {
    const candidates = [...new Set(messages.flatMap((message) => (message.activities?.length ? presentToolActivities(message.activities) : [])
      .map(toolkitSlugForActivity)
      .filter((slug): slug is string => Boolean(slug && !toolkitCatalogue[slug] && !toolkitLookupsRef.current.has(slug)))))]
      .slice(0, 12);
    if (!candidates.length) return;
    for (const slug of candidates) toolkitLookupsRef.current.add(slug);
    let active = true;
    void Promise.all(candidates.map(async (slug) => {
      try {
        const page = await chuskyApi.apps.list({ search: slug, limit: 50 });
        const match = page.data.find((item) => item.slug.toLowerCase() === slug);
        return match ? [slug, match] as const : undefined;
      } catch {
        return undefined;
      }
    })).then((matches) => {
      if (!active) return;
      const resolved = matches.filter((match): match is readonly [string, Toolkit] => Boolean(match));
      if (resolved.length) setToolkitCatalogue((current) => ({ ...current, ...Object.fromEntries(resolved) }));
    });
    return () => { active = false; };
  }, [messages, toolkitCatalogue]);

  useLiveData(() => chuskyApi.account.get().then((next) => {
    setAccount(next);
    if (!runModel) setRunModel(next.model);
  }).catch(() => undefined), 10_000);

  useEffect(() => {
    setChatHeader({ title: thread ? String(thread.metadata.title || "New conversation") : "Connecting to Chusky", status });
    return () => setChatHeader(undefined);
  }, [setChatHeader, status, thread]);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setThread(undefined);
    setMessages([]);
    setQueuedMessage(undefined);
    setQueuedMenuOpen(false);
    syncActiveRunId(undefined);
    (async () => {
      try {
        const page = await chuskyApi.threads.list({ limit: 50, includeArchived: true });
        // A fresh-chat request is authoritative even if a stale thread query
        // parameter survives a client-side navigation or copied URL.
        const current = requestedNew
          ? await chuskyApi.threads.create({ source: "web-dashboard" })
          : requestedThreadId ? await chuskyApi.threads.get(requestedThreadId) : page.data[0] || await chuskyApi.threads.create({ source: "web-dashboard" });
        if (active) {
          setThread(current);
          setStatus("ready");
          if (requestedNew) {
            const canonicalUrl = new URL(window.location.href);
            canonicalUrl.searchParams.delete("new");
            canonicalUrl.searchParams.delete("nonce");
            canonicalUrl.searchParams.set("thread", current.id);
            window.history.replaceState(window.history.state, "", `${canonicalUrl.pathname}${canonicalUrl.search}${canonicalUrl.hash}`);
          }
        }
        const [runs, artifactPage] = await Promise.all([
          chuskyApi.threads.runs(current.id, { limit: 50 }),
          chuskyApi.artifacts.list({ limit: 100 }).catch(() => ({ data: [] as Artifact[] })),
        ]);
        if (active) {
          setArtifactCatalog(artifactPage.data);
          const threadMessages: Message[] = [];
          for (const run of [...runs.data].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))) {
            const userHistoryContent = `${run.input || "Attached file(s)"}${run.attachments?.length ? `\n[Attachments: ${run.attachments.map((file) => file.name).join(", ")}]` : ""}`;
            if (run.input || run.attachments?.length) threadMessages.push({ role: "user", text: run.input || "Attached file(s)", time: new Date(run.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), attachments: run.attachments, historyCommitted: run.status === "completed", historyContent: userHistoryContent });
            const approval = run.status === "requires_approval" && run.approvalId
              ? await chuskyApi.approvals.get(run.approvalId).catch(() => undefined)
              : undefined;
            const activities = runActivities(run);
            const subagentActivities = runSubagentActivities(run);
            const active = run.status === "queued" || run.status === "running";
            const output = run.status === "running" ? runDeltaText(run) : runStatusText(run);
            if (active) syncActiveRunId(run.id);
            threadMessages.push({ role: "assistant", runId: run.id, text: output, activities, subagentActivities, artifacts: run.artifacts?.length ? run.artifacts : artifactReferencesInText(output, artifactPage.data), images: await hydrateRunImages(run.images), time: new Date(run.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), pending: active, statusText: active ? runProgressText(run) : undefined, approval, failure: run.status === "failed" ? (run.error || {}) : undefined, historyCommitted: run.status === "completed", historyContent: run.output ?? output });
          }
          setMessages(threadMessages);
        }
        void chuskyApi.account.get().then((next) => { if (active) { setAccount(next); setRunModel(next.model); } }).catch(() => undefined);
        void chuskyApi.account.models().then((next) => { if (active) setModels(next.data); }).catch(() => undefined);
      } catch {
        if (active) setStatus("offline");
      }
    })();
    return () => { active = false; };
  }, [requestedThreadId, requestedNew, newConversationNonce]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (requestedDraft) setInput(requestedDraft);
    if (requestedOnboarding && !requestedDraft) {
      const draft = consumeOnboardingActivationDraft(session?.user?.id);
      if (draft) {
        setInput(draft);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [newConversationNonce, requestedDraft, requestedOnboarding, session?.user?.id]);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    const activePreviewUrls = new Set([
      ...attachments.map((item) => item.previewUrl),
      ...messages.flatMap((message) => message.attachments?.map((item) => item.previewUrl) ?? []),
    ].filter((url): url is string => Boolean(url)));
    for (const url of previewUrlsRef.current) {
      if (!activePreviewUrls.has(url)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(url);
      }
    }
  }, [attachments, messages]);

  useEffect(() => () => {
    for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
    previewUrlsRef.current.clear();
    for (const controller of uploadAbortControllersRef.current.values()) controller.abort();
    uploadAbortControllersRef.current.clear();
    voiceCancelledRef.current = true;
    if (voiceRecorderRef.current?.state === "recording") voiceRecorderRef.current.stop();
    voiceRecorderRef.current = undefined;
    if (voiceAnimationFrameRef.current !== undefined) window.cancelAnimationFrame(voiceAnimationFrameRef.current);
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = undefined;
    const audioContext = voiceAudioContextRef.current;
    voiceAudioContextRef.current = undefined;
    voiceAnalyserRef.current = undefined;
    if (audioContext) void audioContext.close().catch(() => undefined);
  }, []);

  const showNotice = (message: string, kind: "error" | "info" = "error") => {
    setNotice({ kind, message });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(undefined), 5000);
  };

  const updateLastAssistant = (update: Partial<Message>) => {
    setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, ...update } : item));
  };
  const applyRunSnapshot = async (run: Run) => {
    const approval = run.status === "requires_approval" && run.approvalId
      ? await chuskyApi.approvals.get(run.approvalId).catch(() => undefined)
      : undefined;
    const snapshotActivities = runActivities(run);
    const snapshotSubagentActivities = runSubagentActivities(run);
    const images = await hydrateRunImages(run.images);
    const active = run.status === "queued" || run.status === "running";
    if (!active && activeRunIdRef.current === run.id) syncActiveRunId(undefined);
    setMessages((current) => current.map((item) => {
      if (item.role !== "assistant" || item.runId !== run.id) return item;
      const streamedOutput = runDeltaText(run);
      const text = run.status === "running" ? reconcileStreamedText(item.text, streamedOutput) : runStatusText(run) || (run.status === "completed" ? "Done." : "");
      const artifacts = run.artifacts?.length ? run.artifacts : run.status === "completed" ? item.artifacts : undefined;
      return {
        ...item,
        text,
        activities: snapshotActivities.length ? snapshotActivities : item.activities,
        subagentActivities: snapshotSubagentActivities.length ? snapshotSubagentActivities : item.subagentActivities,
        artifacts,
        images: images?.length ? images : item.images,
        pending: active,
        statusText: active ? runProgressText(run) : undefined,
        approval,
        failure: run.status === "failed" ? (run.error || {}) : undefined,
      };
    }));
  };
  const applyRunSnapshotRef = useRef(applyRunSnapshot);
  useEffect(() => {
    applyRunSnapshotRef.current = applyRunSnapshot;
  }, [applyRunSnapshot]);

  useEffect(() => {
    if (!thread?.id) return;
    let active = true;
    let timer: number | undefined;
    const poll = async () => {
      const runIds = [...new Set(messagesRef.current.filter((item) => item.role === "assistant" && item.pending && item.runId).map((item) => item.runId!))];
      await Promise.all(runIds.map(async (runId) => {
        try { await applyRunSnapshotRef.current(await chuskyApi.runs.get(thread.id, runId)); }
        catch { /* A transient network error must not erase the saved timeline; retry shortly. */ }
      }));
      if (active) timer = window.setTimeout(() => void poll(), 1200);
    };
    timer = window.setTimeout(() => void poll(), 1200);
    return () => { active = false; if (timer !== undefined) window.clearTimeout(timer); };
  }, [thread?.id]);

  const cancelActiveRun = async () => {
    const runId = activeRunIdRef.current;
    if (!thread || !runId) return;
    try { await applyRunSnapshot(await chuskyApi.runs.cancel(thread.id, runId)); }
    catch { showNotice("Chusky could not confirm cancellation. The run’s saved progress is still available; refresh and check its status."); }
  };

  const retryFailedMessage = (assistantIndex: number) => {
    const original = messagesRef.current[assistantIndex];
    if (!original?.failure) return;
    const userMessage = [...messagesRef.current.slice(0, assistantIndex)].reverse().find((item) => item.role === "user");
    if (!userMessage || !userMessage.text || userMessage.text === "Attached file(s)") {
      showNotice("This reply included an attachment. Attach the file again, then try sending it.", "info");
      return;
    }
    setInput(userMessage.text);
    window.setTimeout(() => inputRef.current?.focus(), 0);
    showNotice("Your message is ready to send again.", "info");
  };

  const copyMessage = async (index: number, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      window.setTimeout(() => setCopiedMessageIndex((current) => current === index ? undefined : current), 1600);
    } catch {
      // Clipboard access can be unavailable in an embedded or insecure context.
    }
  };

  const stopVoiceInput = () => {
    const recorder = voiceRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    setListening(false);
    recorder.stop();
  };

  const cancelVoiceInput = () => {
    voiceCancelledRef.current = true;
    const recorder = voiceRecorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    else {
      voiceRecorderRef.current = undefined;
      voiceChunksRef.current = [];
      stopVoiceVisualizer();
      setListening(false);
      setVoiceStarting(false);
    }
  };

  const stopVoiceVisualizer = () => {
    if (voiceAnimationFrameRef.current !== undefined) window.cancelAnimationFrame(voiceAnimationFrameRef.current);
    voiceAnimationFrameRef.current = undefined;
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = undefined;
    voiceAnalyserRef.current = undefined;
    const audioContext = voiceAudioContextRef.current;
    voiceAudioContextRef.current = undefined;
    if (audioContext) void audioContext.close().catch(() => undefined);
    voiceBarsRef.current.forEach((bar) => {
      if (!bar) return;
      bar.style.height = "4px";
      bar.style.opacity = "0.45";
    });
  };

  const startVoiceVisualizer = (stream: MediaStream) => {
    voiceStreamRef.current = stream;
    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return;
    try {
      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.65;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      voiceAudioContextRef.current = audioContext;
      voiceAnalyserRef.current = analyser;
      const draw = () => {
        if (voiceAnalyserRef.current !== analyser) return;
        analyser.getByteTimeDomainData(data);
        const bars = voiceBarsRef.current;
        const samplesPerBar = Math.max(1, Math.floor(data.length / Math.max(1, bars.length)));
        bars.forEach((bar, barIndex) => {
          if (!bar) return;
          const start = barIndex * samplesPerBar;
          const end = Math.min(data.length, start + samplesPerBar);
          let total = 0;
          let peak = 0;
          for (let index = start; index < end; index += 1) {
            const amplitude = Math.abs(data[index] - 128) / 128;
            total += amplitude;
            peak = Math.max(peak, amplitude);
          }
          const average = end > start ? total / (end - start) : 0;
          const level = Math.min(1, Math.max(average * 7, peak * 1.8));
          bar.style.height = `${Math.round(4 + level * 26)}px`;
          bar.style.opacity = `${0.4 + level * 0.6}`;
        });
        voiceAnimationFrameRef.current = window.requestAnimationFrame(draw);
      };
      draw();
      if (audioContext.state === "suspended") void audioContext.resume().catch(() => undefined);
    } catch {
      // Speech recognition can continue if the optional visualizer is unavailable.
    }
  };

  const microphoneErrorMessage = (name?: string) => {
    if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Microphone access is blocked. Allow microphone access for this site in your browser settings, then try again.";
    if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No microphone was found. Connect a microphone and try again.";
    if (name === "NotReadableError" || name === "TrackStartError") return "Your microphone is already in use by another app. Close that app and try again.";
    if (name === "SecurityError") return "Microphone access requires HTTPS or localhost.";
    if (name === "no-speech") return "No speech was detected. Speak closer to the microphone and try again.";
    if (name === "network" || name === "service-not-allowed") return "The browser speech service is unavailable. Try Chrome or Edge, then check your network connection.";
    return "Chusky could not access your microphone. Check the browser and system microphone permissions, then try again.";
  };

  const requestMicrophoneAccess = async () => {
    const hostname = window.location.hostname;
    if (!window.isSecureContext && hostname !== "localhost" && hostname !== "127.0.0.1") {
      showNotice("Voice input requires a secure HTTPS connection (or localhost).", "info");
      return undefined;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showNotice("This browser does not provide microphone access. Try the latest Chrome, Edge, or Safari.", "info");
      return undefined;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (cause) {
      showNotice(microphoneErrorMessage(cause instanceof Error ? cause.name : undefined), "info");
      return undefined;
    }
  };

  const toggleVoiceInput = async () => {
    if (listening) { stopVoiceInput(); return; }
    if (voiceStarting || voiceProcessing) return;
    if (typeof MediaRecorder === "undefined") { showNotice("Voice recording is not supported in this browser. Try the latest Chrome, Edge, or Safari.", "info"); return; }
    setVoiceStarting(true);
    const microphoneStream = await requestMicrophoneAccess();
    if (!microphoneStream) {
      setListening(false);
      setVoiceStarting(false);
      return;
    }
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
    try {
      const recorder = new MediaRecorder(microphoneStream, mimeType ? { mimeType } : undefined);
      voiceRecorderRef.current = recorder;
      voiceChunksRef.current = [];
      voiceMimeTypeRef.current = mimeType || recorder.mimeType || "audio/webm";
      voiceCancelledRef.current = false;
      startVoiceVisualizer(microphoneStream);
      recorder.ondataavailable = (event) => { if (event.data.size > 0) voiceChunksRef.current.push(event.data); };
      recorder.onerror = () => {
        voiceRecorderRef.current = undefined;
        voiceChunksRef.current = [];
        stopVoiceVisualizer();
        setListening(false);
        setVoiceStarting(false);
        showNotice("Voice recording failed. Check microphone permissions and try again.", "info");
      };
      recorder.onstop = async () => {
        voiceRecorderRef.current = undefined;
        const chunks = voiceChunksRef.current;
        voiceChunksRef.current = [];
        const cancelled = voiceCancelledRef.current;
        voiceCancelledRef.current = false;
        const contentType = voiceMimeTypeRef.current.split(";")[0] || "audio/webm";
        stopVoiceVisualizer();
        setListening(false);
        setVoiceStarting(false);
        if (cancelled) return;
        if (!chunks.length) { showNotice("No audio was captured. Speak after the microphone indicator appears and try again.", "info"); return; }
        const extension = contentType === "audio/mp4" ? "m4a" : contentType === "audio/ogg" ? "ogg" : "webm";
        const file = new File(chunks, `voice-message-${Date.now()}.${extension}`, { type: contentType });
        setVoiceProcessing(true);
        showNotice("Transcribing your voice message and sending it to Chusky…", "info");
        try {
          const uploaded = await chuskyApi.files.upload(file, { contentType });
          await send("", [{ id: uploaded.id, name: uploaded.name, contentType: uploaded.contentType, size: uploaded.size, downloadUrl: uploaded.downloadUrl }]);
        } catch (error) {
          showNotice(error instanceof Error ? `Voice message could not be sent: ${error.message}` : "Voice message could not be sent. Try again.");
        } finally {
          setVoiceProcessing(false);
        }
      };
      recorder.start();
      setListening(true);
      setVoiceStarting(false);
    } catch (error) {
      microphoneStream.getTracks().forEach((track) => track.stop());
      setVoiceStarting(false);
      showNotice(error instanceof Error ? "This browser could not start voice recording. Try Chrome, Edge, or Safari." : "Voice recording could not start. Try again.", "info");
    }
  };

  const editMessage = (index: number, text: string) => {
    setInput(text);
    setEditingMessageIndex(index);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const shareMessage = async (index: number, text: string) => {
    try {
      if (navigator.share) await navigator.share({ title: "Chusky message", text });
      else await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      window.setTimeout(() => setCopiedMessageIndex((current) => current === index ? undefined : current), 1600);
    } catch {
      // Sharing can be cancelled by the user or unavailable in an embedded context.
    }
  };

  const decideApproval = async (approvalId: string, decision: "approve" | "deny") => {
    const original = [...messagesRef.current].reverse().find((item) => item.role === "assistant" && item.approval?.id === approvalId);
    if (!original?.approval || original.approval.deciding) return;
    const currentRunId = original.runId;
    const updateApprovalMessage = (update: Partial<Message>) => setMessages((current) => current.map((item) => item === original || (currentRunId && item.runId === currentRunId) || item.approval?.id === approvalId ? { ...item, ...update } : item));
    if (decision === "approve" && currentRunId) syncActiveRunId(currentRunId);
    updateApprovalMessage({ pending: decision === "approve", approval: { ...original.approval, deciding: true } });
    try {
      const run = await chuskyApi.approvals.decide(approvalId, decision);
      if ("threadId" in run) await applyRunSnapshot(run);
      else {
        if ("run" in run && run.run) {
          await applyRunSnapshot(run.run);
          if (currentRunId) syncActiveRunId(undefined);
          return;
        }
        if (currentRunId) syncActiveRunId(undefined);
        if (currentRunId && thread && decision === "deny") {
          await applyRunSnapshot(await chuskyApi.runs.get(thread.id, currentRunId));
          return;
        }
        const output = "text" in run && run.text ? run.text : undefined;
        updateApprovalMessage({ text: decision === "approve" ? (output || "Approval accepted. Check the saved action status for its execution result.") : "Action denied; no action was taken.", approval: undefined, pending: false });
      }
    } catch (error) {
      // A lost HTTP response is not evidence that execution failed. Reconcile
      // persisted state before allowing a retry or removing the approval.
      const [savedApproval, savedRun] = await Promise.all([
        chuskyApi.approvals.get(approvalId).catch(() => undefined),
        currentRunId && thread ? chuskyApi.runs.get(thread.id, currentRunId).catch(() => undefined) : Promise.resolve(undefined),
      ]);
      if (savedRun) await applyRunSnapshot(savedRun);
      const recovery = approvalRecoveryState(savedApproval?.status, savedRun?.status);
      if (recovery === "retry" && savedApproval) {
        updateApprovalMessage({ approval: { ...savedApproval, deciding: false }, pending: false });
        showNotice(error instanceof Error ? error.message : "Approval is still pending. Please retry.");
      } else if (recovery !== "run") {
        updateApprovalMessage({ approval: undefined, pending: false, text: recovery === "accepted" ? "Approval was accepted. Execution is not yet confirmed; check the saved run before retrying." : recovery === "denied" ? "Action denied; no action was taken." : "Could not confirm the approval state. Refresh before trying again." });
      }
    }
  };

  const decideGlobalApproval = async (approvalId: string, decision: "approve" | "deny") => {
    if (globalApprovalBusy) return;
    setGlobalApprovalBusy(approvalId);
    try {
      await chuskyApi.approvals.decide(approvalId, decision);
      const next = await chuskyApi.account.get();
      setAccount(next);
      notifyChuskyDataChanged();
      showNotice(decision === "approve" ? "Approval accepted. Chusky is resuming the saved mission." : "Approval denied; no action was taken.", "info");
    } catch (error) {
      const saved = await chuskyApi.approvals.get(approvalId).catch(() => undefined);
      if (saved?.status === "pending") showNotice(error instanceof Error ? error.message : "Approval is still pending. Refresh and try again.");
      else {
        const next = await chuskyApi.account.get().catch(() => undefined);
        if (next) setAccount(next);
        showNotice(saved?.status === "approved" || saved?.status === "consumed" ? "Approval was accepted. Refresh to see the saved mission status." : "The approval state changed. Refresh before trying again.");
      }
    } finally {
      setGlobalApprovalBusy(undefined);
    }
  };

  const uploadAttachment = async (localId: string, file: File, contentType: string) => {
    if (uploadAbortControllersRef.current.has(localId)) return;
    const controller = new AbortController();
    uploadAbortControllersRef.current.set(localId, controller);
    setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, file, contentType, progress: 0, phase: "uploading", status: "uploading", error: undefined } : item));
    try {
      const uploaded = await chuskyApi.files.upload(file, {
        contentType,
        signal: controller.signal,
        onProgress: (progress, phase) => setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, progress, phase } : item)),
      });
      setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, file: undefined, id: uploaded.id, downloadUrl: uploaded.downloadUrl, progress: 100, phase: undefined, status: "ready", error: undefined } : item));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The upload could not be completed. Retry it or choose the file again.";
      setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, phase: undefined, status: "error", error: message } : item));
    } finally {
      if (uploadAbortControllersRef.current.get(localId) === controller) uploadAbortControllersRef.current.delete(localId);
    }
  };

  const selectFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const remaining = Math.max(0, 5 - attachments.length);
    const candidates = files.slice(0, remaining);
    if (files.length > candidates.length) showNotice("A message can include up to five files. Remove one before adding more.");
    const entries = candidates.map((file) => {
      const contentType = attachmentContentType(file);
      const error = file.size < 1 ? "This file is empty. Choose a file with content."
        : file.size > MAX_FILE_BYTES ? "This file is over the 25 MB attachment limit."
          : !contentType ? "This file type is not supported. Try JPEG, PNG, WebP, GIF, PDF, DOCX, PPTX, XLSX, TXT, ZIP, MP3, OGG, WAV, MP4, or WebM."
            : undefined;
      const previewUrl = !error && contentType?.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      if (previewUrl) previewUrlsRef.current.add(previewUrl);
      return { file, contentType, error, previewUrl };
    });
    const pending: PendingAttachment[] = entries.map(({ file, contentType, error, previewUrl }) => ({
      localId: crypto.randomUUID(), name: file.name, contentType: contentType ?? file.type ?? "unknown", size: file.size, progress: 0,
      ...(error ? { status: "error" as const, error } : { file, phase: "queued" as const, status: "uploading" as const }),
      ...(previewUrl ? { previewUrl } : {}),
    }));
    setAttachments((current) => [...current, ...pending]);
    // Bound parallel transfer pressure on mobile connections and storage.
    const uploads = pending.map((item, index) => ({ item, entry: entries[index] })).filter(({ item, entry }) => item.status === "uploading" && entry.contentType);
    for (let index = 0; index < uploads.length; index += 2) {
      await Promise.all(uploads.slice(index, index + 2).map(({ item, entry }) => uploadAttachment(item.localId, entry.file, entry.contentType!)));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const retryAttachment = (item: PendingAttachment) => {
    if (!item.file || !ACCEPTED_TYPES.has(item.contentType)) {
      showNotice("Choose this file again to retry it.");
      return;
    }
    void uploadAttachment(item.localId, item.file, item.contentType);
  };

  const removeAttachment = async (item: PendingAttachment) => {
    uploadAbortControllersRef.current.get(item.localId)?.abort();
    uploadAbortControllersRef.current.delete(item.localId);
    setAttachments((current) => current.filter((candidate) => candidate.localId !== item.localId));
    if (item.id) await chuskyApi.files.remove(item.id).catch(() => undefined);
  };

  const send = async (inputOverride?: string, attachmentOverride?: SendAttachment[]) => {
    const text = (inputOverride ?? input).trim();
    const readyAttachments = attachmentOverride ?? attachments.filter((item) => item.status === "ready" && item.id).map((item) => ({ id: item.id!, name: item.name, contentType: item.contentType, size: item.size, previewUrl: item.previewUrl, downloadUrl: item.downloadUrl }));
    if ((!text && !readyAttachments.length) || !thread || controller || messagesRef.current.some((item) => item.role === "assistant" && item.pending && item.runId) || (!attachmentOverride && attachments.some((item) => item.status === "uploading" || item.status === "error"))) return;
    const abort = new AbortController();
    const artifactIdsBefore = new Set(artifactCatalog.map((artifact) => artifact.id));
    setController(abort);
    setInput("");
    setAttachments([]);
    const outgoing: Message = { role: "user", text: text || (attachmentOverride ? "Voice message" : "Attached file(s)"), time: "Now", attachments: readyAttachments.map(({ id, name, contentType, size, previewUrl, downloadUrl }) => ({ id, name, contentType, size, previewUrl, downloadUrl })) };
    setMessages((current) => editingMessageIndex === undefined ? [...current, outgoing, { role: "assistant", text: "", pending: true }] : [...current.slice(0, editingMessageIndex), outgoing, { role: "assistant", text: "", pending: true }]);
    setEditingMessageIndex(undefined);
    const shouldTitle = Boolean(text && !thread.metadata.title);
    try {
      for await (const event of chuskyApi.runs.stream(thread.id, text, readyAttachments.map((item) => item.id), abort.signal, { model: runModel || undefined })) {
        const typed = event as RunStreamEvent;
        if (typed.type === "run.started" || typed.type === "run.queued") {
          syncActiveRunId(typed.run.id);
          updateLastAssistant({ runId: typed.run.id, pending: true });
        } else if (typed.type === "run.status") {
          updateLastAssistant({ pending: true, statusText: typed.text, tool: undefined });
        } else if (typed.type === "run.delta") {
          setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, text: item.text + typed.text, pending: true } : item));
        } else if (typed.type === "run.tool_started") {
          updateLastAssistant({ pending: true, statusText: undefined, tool: typed.toolSlug });
        } else if (typed.type === "run.tool_activity") {
          const activity: RunToolActivity = { id: typed.id, type: "run.tool_activity", at: typed.at, toolSlug: typed.toolSlug, ...(typed.callId ? { callId: typed.callId } : {}), message: typed.message, status: typed.status, ...(typed.actionLabel ? { actionLabel: typed.actionLabel } : {}), ...(typed.toolkitSlug ? { toolkitSlug: typed.toolkitSlug } : {}), ...(typed.toolkitName ? { toolkitName: typed.toolkitName } : {}), ...(typed.toolkitLogo ? { toolkitLogo: typed.toolkitLogo } : {}), ...(typed.batchActions?.length ? { batchActions: typed.batchActions } : {}), ...(typed.summary ? { summary: typed.summary } : {}), ...(typed.durationMs !== undefined ? { durationMs: typed.durationMs } : {}) };
          setMessages((current) => current.map((item, index) => index === current.length - 1 && item.role === "assistant"
            ? { ...item, runId: typed.runId, activities: upsertToolActivity(item.activities ?? [], activity), pending: true, statusText: undefined, tool: activity.toolSlug }
            : item));
        } else if (typed.type === "run.subagent_activity") {
          const activity: RunSubagentActivity = { id: typed.id, type: "run.subagent_activity", at: typed.at, activityId: typed.activityId, parentToolCallId: typed.parentToolCallId, handoffId: typed.handoffId, worker: typed.worker, objective: typed.objective, kind: typed.kind, status: typed.status, message: typed.message, ...(typed.toolCallId ? { toolCallId: typed.toolCallId } : {}), ...(typed.toolSlug ? { toolSlug: typed.toolSlug } : {}), ...(typed.actionLabel ? { actionLabel: typed.actionLabel } : {}), ...(typed.toolkitSlug ? { toolkitSlug: typed.toolkitSlug } : {}), ...(typed.toolkitName ? { toolkitName: typed.toolkitName } : {}), ...(typed.toolkitLogo ? { toolkitLogo: typed.toolkitLogo } : {}), ...(typed.summary ? { summary: typed.summary } : {}), ...(typed.durationMs !== undefined ? { durationMs: typed.durationMs } : {}) };
          setMessages((current) => current.map((item, index) => index === current.length - 1 && item.role === "assistant"
            ? { ...item, runId: typed.runId, subagentActivities: upsertSubagentActivity(item.subagentActivities ?? [], activity).map((step) => ({ ...step, type: "run.subagent_activity" as const })), pending: true, statusText: undefined }
            : item));
        } else if (typed.type === "run.completed") {
          // A run can change memory, approvals, calls, meetings, channels, or
          // artifacts through native/Composio tools. Refresh every open surface
          // from the backend instead of leaving sibling pages stale.
          notifyChuskyDataChanged();
          const output = typed.run.output || "Done.";
          let latestArtifacts = artifactCatalog;
          try {
            const page = await chuskyApi.artifacts.list({ limit: 100 });
            latestArtifacts = page.data;
            setArtifactCatalog(latestArtifacts);
          } catch {
            // The run is complete even if the artifact catalogue is temporarily unavailable.
          }
          const createdArtifacts = latestArtifacts.filter((artifact) => !artifactIdsBefore.has(artifact.id));
          const linkedArtifacts = artifactReferencesInText(output, latestArtifacts);
          const runArtifacts = typed.run.artifacts ?? [];
          const runImages = await hydrateRunImages(typed.run.images);
          syncActiveRunId(undefined);
          const userHistoryContent = `${typed.run.input || "Attached file(s)"}${typed.run.attachments?.length ? `\n[Attachments: ${typed.run.attachments.map((file) => file.name).join(", ")}]` : ""}`;
          setMessages((current) => current.map((item, index) => {
            if (index === current.length - 2 && item.role === "user") return { ...item, historyCommitted: true, historyContent: userHistoryContent };
            if (index === current.length - 1 && item.role === "assistant") return { ...item, text: output, artifacts: runArtifacts.length ? runArtifacts : linkedArtifacts.length ? linkedArtifacts : createdArtifacts, images: runImages, privateLinks: (typed.run as Run & { privateLinks?: PrivateRunLink[] }).privateLinks, pending: false, statusText: undefined, tool: undefined, failure: undefined, historyCommitted: true, historyContent: output };
            return item;
          }));
        } else if (typed.type === "run.approval_required") {
          notifyChuskyDataChanged();
          syncActiveRunId(undefined);
          updateLastAssistant({ text: "Chusky needs your approval to continue with this action.", pending: false, statusText: undefined, tool: undefined, failure: undefined, approval: typed.approval });
        } else if (typed.type === "run.failed") {
          syncActiveRunId(undefined);
          const detail = typed.error?.message || "";
          showNotice(/429|rate limit|quota|too many requests/i.test(detail)
            ? "The selected model is rate limited. Choose another model or try again in a moment."
            : "Chusky could not complete that run. Please try again.");
          updateLastAssistant({ text: "", failure: typed.error, pending: false, statusText: undefined, tool: undefined });
        } else if (typed.type === "run.cancelled") {
          activeRunIdRef.current = undefined;
          updateLastAssistant({ text: "Run cancelled. The completed steps are shown above.", failure: undefined, pending: false, statusText: undefined, tool: undefined });
        }
      }
    } catch (error) {
      const runId = activeRunIdRef.current;
      if ((error as Error).name === "AbortError") {
        if (runId) updateLastAssistant({ runId, pending: true, statusText: "Connection interrupted; reconnecting to this run…" });
      } else {
        const detail = error instanceof Error ? error.message : "";
        showNotice(/429|rate limit|quota|too many requests/i.test(detail)
          ? "The selected model is rate limited. Choose another model or try again in a moment."
          : "The live connection was interrupted. Chusky’s saved run will keep updating here.");
        if (runId) updateLastAssistant({ runId, pending: true, statusText: "Connection interrupted; checking saved run progress…" });
        else updateLastAssistant({ pending: false, text: "", failure: { message: detail }, statusText: undefined });
      }
    } finally {
      if (shouldTitle) {
        try {
          const updated = await chuskyApi.threads.update(thread.id, { title: text.slice(0, 80) });
          setThread(updated);
        } catch {
          // The run is already persisted; a title failure must not hide the conversation.
        }
      }
      setController(undefined);
    }
  };

  const isWorking = Boolean(controller) || messages.some((item) => item.role === "assistant" && item.pending && Boolean(item.runId));

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const queueCurrentMessage = () => {
    const text = input.trim();
    const readyAttachments = attachments.filter((item) => item.status === "ready" && item.id).map((item) => ({
      id: item.id!, name: item.name, contentType: item.contentType, size: item.size, downloadUrl: item.downloadUrl,
    }));
    if ((!text && !readyAttachments.length) || !thread) return;
    if (attachments.some((item) => item.status === "uploading" || item.status === "error")) {
      showNotice("Wait for attachments to finish uploading, or remove the failed files before queuing this message.", "info");
      return;
    }
    const next: QueuedMessage = { text, attachments: readyAttachments };
    queuedMessageRef.current = next;
    setQueuedMessage(next);
    setQueuedMenuOpen(false);
    setInput("");
    setAttachments([]);
    setEditingMessageIndex(undefined);
    showNotice("Queued for after this reply.", "info");
  };

  const editQueuedMessage = () => {
    const queued = queuedMessageRef.current;
    if (!queued) return;
    setInput(queued.text);
    setAttachments(queued.attachments.map((item, index) => ({
      localId: `queued-${item.id}-${index}`,
      id: item.id,
      name: item.name,
      contentType: item.contentType,
      size: item.size,
      progress: 100,
      status: "ready" as const,
      downloadUrl: item.downloadUrl,
    })));
    queuedMessageRef.current = undefined;
    setQueuedMessage(undefined);
    setQueuedMenuOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const clearQueuedMessage = () => {
    queuedMessageRef.current = undefined;
    setQueuedMessage(undefined);
    setQueuedMenuOpen(false);
  };

  useEffect(() => {
    const awaitingApproval = messages.some((item) => item.role === "assistant" && item.approval && !item.approval.deciding);
    if (!thread || !queuedMessage || isWorking || awaitingApproval || queuedFlushRef.current) return;
    const next = queuedMessageRef.current;
    if (!next) return;
    queuedFlushRef.current = true;
    queuedMessageRef.current = undefined;
    setQueuedMessage(undefined);
    setQueuedMenuOpen(false);
    void sendRef.current?.(next.text, next.attachments).finally(() => {
      queuedFlushRef.current = false;
    });
  }, [thread?.id, queuedMessage, isWorking, messages]);

  const handleComposerSend = () => {
    if (isWorking) queueCurrentMessage();
    else void send();
  };

  return (
    <div className="-mx-2.5 -my-4 flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] min-h-0 min-w-0 flex-col overflow-hidden overscroll-none bg-background sm:-mx-4 sm:-my-6 sm:h-[calc(100svh-3.5rem)] sm:max-h-[calc(100svh-3.5rem)] lg:-mx-7 lg:-my-8">
      {notice && <div className={`fixed left-1/2 top-16 z-50 flex w-[min(calc(100%-1rem),32rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-md border px-3 py-2 text-[11px] shadow-lg ${notice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role="alert"><span>{notice.message}</span><button type="button" onClick={() => setNotice(undefined)} className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss notification"><X size={13} /></button></div>}

      <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col px-1.5 py-2 sm:px-5 sm:py-6 lg:px-8">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 pb-2">
            <div className="space-y-3.5 sm:space-y-4">
              {account?.approvals?.filter((approval) => !messages.some((message) => message.approval?.id === approval.id)).map((approval) => <div key={approval.id} className="mx-auto flex w-full max-w-2xl items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50/80 px-3 py-3 text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-100" role="alert">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Approval required to continue</p>
                  <p className="mt-1 break-words text-[11px] leading-5 text-amber-900/80 dark:text-amber-100/80">{approval.request || `Chusky is waiting to run ${approval.toolSlug}.`}</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-amber-900/65 dark:text-amber-100/65">{approval.toolSlug}{approval.missionId ? ` · mission ${approval.missionId}` : ""}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(globalApprovalBusy)} onClick={() => void decideGlobalApproval(approval.id, "approve")} className="rounded-full bg-amber-900 px-3 py-1.5 text-[11px] font-medium text-amber-50 disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950">{globalApprovalBusy === approval.id ? "Updating…" : "Approve"}</button>
                    <button type="button" disabled={Boolean(globalApprovalBusy)} onClick={() => void decideGlobalApproval(approval.id, "deny")} className="rounded-full border border-amber-900/20 px-3 py-1.5 text-[11px] font-medium disabled:opacity-50 dark:border-amber-100/20">Deny</button>
                  </div>
                </div>
              </div>)}
              {!messages.length && status === "ready" && <div className="mx-auto mt-10 max-w-sm text-center"><p className="text-xs font-medium">Start a new conversation</p><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Ask Chusky to research, write, plan, or act. Your chat will be saved automatically so you can return to it later.</p><button type="button" onClick={() => inputRef.current?.focus()} className="mt-3 text-[11px] font-medium underline underline-offset-4">Write the first message</button></div>}
              {messages.map((item, index) => {
                const visibleActivities = item.activities?.length ? presentToolActivities(item.activities) : [];
                const headlineActivity = visibleActivities.find((activity) => item.pending && activity.status === "started") || visibleActivities[0];
                return <div key={`${item.role}-${index}`} className={item.role === "user" ? "group relative ml-auto w-fit max-w-[min(94%,42rem)]" : containsVisualBlock(item.text) ? "group relative w-full max-w-3xl" : "group relative w-fit max-w-full"} onClick={() => setActiveMessageIndex(index)}>
                  <div className={item.role === "user" ? "relative w-fit max-w-full min-w-0 break-words rounded-md border border-foreground/15 bg-foreground px-2.5 py-1.5 text-[12px] leading-5 text-background [overflow-wrap:anywhere]" : containsVisualBlock(item.text) ? "relative w-fit max-w-full min-w-0 break-words bg-transparent p-0 [overflow-wrap:anywhere]" : "relative w-fit max-w-full min-w-0 break-words rounded-md border border-foreground/10 bg-background px-2.5 py-1.5 [overflow-wrap:anywhere]"}>
                    {item.role === "assistant" && <div className="mb-1 flex items-baseline gap-2"><p className="text-xs font-medium">Chusky</p><span className="font-mono text-[9px] text-muted-foreground">{item.time || "Now"}</span></div>}
                    {item.pending && <div className="mb-1.5 inline-flex max-w-full min-w-0 items-center gap-1.5 text-[10px] italic text-muted-foreground" aria-live="polite"><LoaderCircle size={11} className="shrink-0 animate-spin text-chusky-amber motion-reduce:animate-none" /><Shimmer className="min-w-0 truncate">{item.statusText || "Working…"}</Shimmer></div>}
                    {headlineActivity ? <details className="chat-activity-timeline group/timeline my-2 w-full min-w-0 max-w-2xl overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.018] shadow-sm">
                      <summary className="chat-activity-summary flex min-h-10 min-w-0 cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 text-[11px] leading-5 text-muted-foreground transition-colors hover:bg-foreground/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 sm:text-xs [&::-webkit-details-marker]:hidden">
                        <ActivityBrand toolSlug="CHUCK_ACTIVITY" size={16} />
                        <span className="min-w-0 flex-1 truncate md:overflow-visible md:whitespace-normal md:break-words">{headlineActivity.actionLabel || headlineActivity.message}{visibleActivities.length > 1 ? <span className="text-muted-foreground"> · {visibleActivities.length - 1} other {visibleActivities.length === 2 ? "task" : "tasks"}</span> : null}</span>
                        {item.pending && visibleActivities.some((activity) => activity.status === "started") ? <LoaderCircle size={12} aria-label="Tool activity in progress" className="shrink-0 animate-spin motion-reduce:animate-none" /> : null}
                        <span aria-hidden="true" className="mr-1 size-1.5 shrink-0 -rotate-45 border-b border-l border-current transition-transform group-open/timeline:-rotate-[225deg] motion-reduce:transition-none" />
                      </summary>
                      <ol aria-label="Tool activity" className="chat-activity-list ml-3 border-l border-foreground/15 pb-1 pl-2">
                        {visibleActivities.map((activity, activityIndex) => {
                          const isCurrent = item.pending && activity.status === "started" && (activity.parallelBatch || activityIndex === visibleActivities.length - 1);
                          const toolkit = lookupActivityToolkit(activity, toolkitCatalogue);
                          const detail = activityDetailSummary(activity.summary);
                          const attention = activity.status === "failed" || activity.status === "approval_required" || activity.status === "cancelled" || activity.status === "unknown";
                          return <li key={activity.id} className={`chat-activity-item chat-activity-${activity.status} relative min-w-0 py-2 pl-4 sm:pl-5`}>
                            <ActivityMarker status={activity.status} current={Boolean(isCurrent)} />
                            <p className="mb-1.5 break-words text-[11px] leading-5 text-muted-foreground sm:text-xs">{activity.actionLabel || activity.message}</p>
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                              <ActivityBrand toolSlug={activity.toolSlug} toolkitSlug={toolkit.slug} toolkitName={toolkit.name} toolkitLogo={toolkit.logo} size={14} />
                              <span className="text-[10px] text-muted-foreground">{toolkit.name || (activity.toolSlug.startsWith("CHUCK_") ? "Chusky" : "Connected app")}</span>
                              <code className="min-w-0 break-all text-[10px] leading-4 text-foreground/80">{actionTokenForActivity(activity)}</code>
                              <ActivityState activity={activity} current={Boolean(isCurrent)} />
                            </div>
                            {attention ? <p className={`mt-1.5 text-[10px] leading-4 ${activity.status === "failed" ? "text-rose-700" : "text-amber-800"}`}>{activity.status === "approval_required" ? "Waiting for your approval to continue." : activity.status === "cancelled" ? "This action was cancelled before its outcome was confirmed." : activity.status === "unknown" ? "The batch response did not include a status for this action. Check the connected app before retrying." : activity.summary || "This step could not be completed."}</p> : detail ? <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{detail}</p> : null}
                            {activity.callId && item.subagentActivities?.length ? <SubagentTree activities={item.subagentActivities} parentToolCallId={activity.callId} live={Boolean(item.pending)} /> : null}
                          </li>;
                        })}
                      </ol>
                    </details> : null}
                    {item.text && !item.failure ? item.role === "assistant" ? <MarkdownMessage content={stripArtifactLinks(item.text, item.artifacts || [])} streaming={item.pending} /> : <p className="whitespace-pre-wrap text-xs leading-5">{item.text}</p> : null}
                    {item.failure ? <RunFailureCard failure={item.failure} onRetry={() => retryFailedMessage(index)} /> : null}
                    {item.role === "assistant" && item.artifacts?.length ? <div className="mt-2 space-y-2">{item.artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} />)}</div> : null}
                    {item.role === "assistant" && item.images?.length ? item.images.length > 1 ? <GeneratedImageGallery images={item.images} /> : <GeneratedImageCard image={item.images[0]} /> : null}
                    {item.role === "assistant" && item.privateLinks?.length ? <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-xs font-medium">Action needed in the private browser</p>{item.privateLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-foreground px-3 py-2 text-[11px] text-background">{link.label}</a>)}<p className="text-[10px] leading-4 text-muted-foreground">Complete the website step, then return here and say “continue”. This link expires soon.</p></div> : null}
                    {item.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{item.attachments.map((file) => <span key={file.id} title={file.name} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-background/25 bg-background/10 px-2 py-1 text-[10px] text-background">{file.previewUrl || file.downloadUrl ? <img src={file.previewUrl || file.downloadUrl} alt={`Attached image: ${file.name}`} className="size-8 rounded object-cover" /> : <FileText size={12} />} <span className="max-w-48 truncate">{file.name}</span></span>)}</div> : null}
                    {item.approval && <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "approve")} className="rounded-full bg-foreground px-3 py-1.5 text-[11px] text-background disabled:opacity-50">Approve</button><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "deny")} className="rounded-full border border-foreground/15 px-3 py-1.5 text-[11px] disabled:opacity-50">Deny</button></div>}
                    {item.text ? <div className={`absolute -bottom-3 right-1 z-10 flex items-center gap-0.5 rounded-md bg-background p-0.5 text-muted-foreground shadow-sm transition-opacity ${activeMessageIndex === index ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100"}`} onClick={(event) => event.stopPropagation()}>
                      {item.role === "user" ? <>
                        <button type="button" onClick={() => void copyMessage(index, item.text)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-foreground/5 hover:text-foreground" aria-label={copiedMessageIndex === index ? "Message copied" : "Copy message"} title={copiedMessageIndex === index ? "Copied" : "Copy"}>{copiedMessageIndex === index ? <Check size={11} /> : <Copy size={11} />}</button>
                        <button type="button" onClick={() => editMessage(index, item.text)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-foreground/5 hover:text-foreground" aria-label="Edit message" title="Edit"><Pencil size={11} /></button>
                      </> : <>
                        <button type="button" onClick={() => setLikedMessageIndex((current) => current === index ? undefined : index)} className={`flex h-6 w-6 items-center justify-center rounded hover:bg-foreground/5 hover:text-foreground ${likedMessageIndex === index ? "text-emerald-600" : ""}`} aria-label={likedMessageIndex === index ? "Unlike message" : "Like message"} aria-pressed={likedMessageIndex === index} title="Like"><ThumbsUp size={11} fill={likedMessageIndex === index ? "currentColor" : "none"} /></button>
                        <button type="button" onClick={() => void copyMessage(index, item.text)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-foreground/5 hover:text-foreground" aria-label={copiedMessageIndex === index ? "Message copied" : "Copy message"} title={copiedMessageIndex === index ? "Copied" : "Copy"}>{copiedMessageIndex === index ? <Check size={11} /> : <Copy size={11} />}</button>
                        <button type="button" onClick={() => void shareMessage(index, item.text)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-foreground/5 hover:text-foreground" aria-label="Share message" title="Share"><Share2 size={11} /></button>
                      </>}
                    </div> : null}
                  </div>
                </div>;
              })}
              <div ref={endRef} />
            </div>
            </div>

            <div className="shrink-0 pt-2 pb-[env(safe-area-inset-bottom)] sm:pt-4 sm:pb-0">
              <div data-chat-composer className="chat-composer rounded-2xl border border-foreground/10 bg-background">
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/mpeg,audio/ogg,audio/wav,audio/mp4,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.md,.zip,.docx,.pptx,.xlsx,.mp3,.ogg,.oga,.wav,.m4a,.mp4,.webm" className="hidden" onChange={(event) => void selectFiles(event.target.files)} />
                {attachments.length ? <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2" aria-live="polite">{attachments.map((item) => <div key={item.localId} className={`w-[min(24rem,calc(100vw-3rem))] shrink-0 rounded-lg bg-foreground/[0.035] p-2.5 ${item.status === "error" ? "ring-1 ring-amber-600/25" : ""}`}>
                  <div className="flex min-w-0 items-start gap-3">
                    {item.previewUrl ? <img src={item.previewUrl} alt={`Preview of ${item.name}`} className="size-14 shrink-0 rounded-md object-cover" /> : <div className={`flex size-14 shrink-0 items-center justify-center rounded-md ${item.status === "error" ? "bg-amber-500/10 text-amber-700" : "bg-background text-muted-foreground"}`}>{item.contentType.startsWith("image/") ? <FileImage size={19} /> : <FileText size={19} />}</div>}
                    <div className="min-w-0 flex-1"><div className="flex min-w-0 items-start gap-1"><p className="min-w-0 flex-1 truncate pt-1 text-xs font-medium" title={item.name}>{item.name}</p>
                      {item.status === "error" && item.file && ACCEPTED_TYPES.has(item.contentType) ? <button type="button" onClick={() => retryAttachment(item)} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label={`Retry uploading ${item.name}`} title="Retry upload"><RotateCcw size={14} /></button> : null}
                      <button type="button" onClick={() => void removeAttachment(item)} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label={`Remove ${item.name}`} title="Remove attachment"><X size={14} /></button>
                    </div><p className={`mt-0.5 text-[10px] ${item.status === "error" ? "text-amber-700" : "text-muted-foreground"}`}>{item.status === "ready" ? `Ready · ${formatArtifactSize(item.size)}` : item.status === "error" ? "Upload failed" : item.phase === "queued" ? "Waiting to upload…" : item.phase === "verifying" ? "Verifying file…" : `Uploading · ${item.progress}%`}</p>
                      {item.status === "uploading" ? <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10"><div className={`h-full rounded-full bg-foreground/60 transition-[width] ${item.phase === "verifying" ? "animate-pulse" : ""}`} style={{ width: `${Math.max(4, item.progress)}%` }} /></div> : null}
                    </div>
                  </div>
                  {item.error ? <p className="mt-2 break-words text-[11px] leading-4 text-amber-800" role="alert">{item.error}</p> : null}
                </div>)}</div> : null}
                {attachments.some((item) => item.status === "error") ? <p className="px-3 pb-1 text-[10px] text-amber-800" role="status">Retry or remove failed files before sending, so Chusky won’t miss an attachment.</p> : null}
                {queuedMessage ? <div className="relative mx-2 mb-1 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.055] px-2.5 py-2" role="status" aria-live="polite">
                  <Clock4 size={13} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-primary"><span>Queued follow-up</span><span className="font-normal text-muted-foreground">· sent after this reply</span></div>
                    <p className="mt-0.5 truncate text-[11px] leading-4 text-foreground/80" title={queuedMessage.text || "Attached file(s)"}>{queuedMessage.text || `${queuedMessage.attachments.length} attachment${queuedMessage.attachments.length === 1 ? "" : "s"}`}</p>
                  </div>
                  <div className="relative shrink-0">
                    <button type="button" onClick={() => setQueuedMenuOpen((open) => !open)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" aria-label="Queued message options" aria-expanded={queuedMenuOpen} title="Queued message options"><MoreHorizontal size={14} /></button>
                    {queuedMenuOpen ? <div className="absolute right-0 top-7 z-20 min-w-40 rounded-lg border border-foreground/10 bg-background p-1 shadow-lg">
                      <button type="button" onClick={editQueuedMessage} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] text-foreground transition-colors hover:bg-foreground/5"><Pencil size={12} /> Edit queued message</button>
                      <button type="button" onClick={clearQueuedMessage} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"><X size={12} /> Clear queued message</button>
                    </div> : null}
                  </div>
                </div> : null}
                {voiceProcessing ? <div className="flex min-h-16 items-center gap-2 px-3 py-3 text-[11px] text-muted-foreground" role="status" aria-live="polite"><LoaderCircle size={14} className="animate-spin" /> Transcribing and sending your voice message…</div> : listening ? <div className="chat-voice-recording" role="status" aria-live="polite">
                  <button type="button" onClick={cancelVoiceInput} className="chat-voice-control chat-voice-cancel" aria-label="Cancel voice input" title="Cancel voice input"><X size={14} strokeWidth={2} /></button>
                  <span className="sr-only">Recording voice input. Press stop to transcribe and send.</span>
                  <div className="chat-voice-wave" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} ref={(element) => { voiceBarsRef.current[index] = element; }} />)}</div>
                  <button type="button" onClick={stopVoiceInput} className="chat-voice-control chat-voice-stop" aria-label="Stop, transcribe, and send voice input" title="Stop, transcribe, and send voice input"><Square size={10} fill="currentColor" /></button>
                </div> : <>
                  <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(min-width: 640px)").matches) { event.preventDefault(); handleComposerSend(); } }} placeholder={status === "offline" ? "Connect the Chusky backend to start chatting…" : isWorking ? "Queue a follow-up…" : attachments.some((item) => item.status === "uploading") ? "Uploading attachment…" : editingMessageIndex !== undefined ? "Edit your message…" : "Ask Chusky anything…"} rows={3} disabled={!thread || voiceStarting || voiceProcessing} className="chat-composer-input w-full resize-none bg-transparent px-3 pt-2.5 text-xs leading-5 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed" />
                  <div className="chat-composer-controls flex flex-wrap items-center justify-between gap-2 px-2 pb-2 pt-1">
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!thread || attachments.length >= 5 || attachments.some((item) => item.status === "uploading")} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach a file"><Plus size={15} strokeWidth={1.8} aria-hidden="true" /></button>
                      <label className="sr-only" htmlFor="chat-model">Run model</label>
                      <div className="relative min-w-0 max-w-28 sm:max-w-44">
                        <select id="chat-model" aria-label="Run model" value={runModel || account?.model || ""} onChange={(event) => setRunModel(event.target.value)} className="chat-composer-model w-full min-w-0 max-w-full truncate text-[10px] font-medium"><option value="">Agent model</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select>
                        <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      <span className="hidden font-mono text-[9px] text-muted-foreground sm:inline">Enter to send · Shift+Enter for newline</span>
                      <button type="button" onClick={() => void toggleVoiceInput()} disabled={!thread || isWorking || voiceStarting || voiceProcessing} className="chat-composer-action flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label={voiceStarting ? "Starting voice input" : "Record voice message"} title={voiceStarting ? "Starting voice input" : "Record voice message"}>{voiceStarting ? <LoaderCircle size={13} className="animate-spin" /> : <Mic size={13} />}</button>
                      {isWorking && !input.trim() && !attachments.some((item) => item.status === "ready") ? <button type="button" onClick={() => void cancelActiveRun()} disabled={!activeRunId} className="chat-composer-action flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground disabled:opacity-50" aria-label="Stop response" title="Stop response"><Square size={11} fill="currentColor" /></button> : <button type="button" onClick={handleComposerSend} className="chat-composer-action flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40" disabled={(!input.trim() && !attachments.some((item) => item.status === "ready")) || !thread || attachments.some((item) => item.status === "uploading" || item.status === "error")} aria-label={isWorking ? "Queue message" : editingMessageIndex !== undefined ? "Resend edited message" : "Send message"} title={isWorking ? "Queue message for after this reply" : editingMessageIndex !== undefined ? "Resend edited message" : "Send message"}><ArrowUp size={13} /></button>}
                    </div>
                  </div>
                </>}
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-foreground/10 bg-background xl:block"><div className="border-b border-foreground/10 px-4 py-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Context</p><button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Context options"><MoreHorizontal size={14} /></button></div><h2 className="mt-3 font-display text-xl">Tools, close at hand.</h2><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Authenticated session and server-side run API.</p></div><div className="space-y-5 p-4"><div><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Verified channels</p><div className="space-y-1.5">{account?.channels.length ? account.channels.map((channel) => <div key={`${channel.provider}-${channel.externalUserId}`} className="flex items-center justify-between border border-foreground/10 px-2.5 py-2 text-[11px]"><span className="flex min-w-0 items-center gap-2"><FileText size={12} /><span className="truncate">{channel.displayName || channel.provider}</span></span><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /></div>) : <p className="border border-dashed border-foreground/15 px-2.5 py-2.5 text-[11px] leading-5 text-muted-foreground">No verified channels yet. Chusky can still work in this private web conversation.</p>}</div></div><div className="border-t border-foreground/10 pt-4"><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Safety</p><div className="space-y-2.5 text-[11px] leading-5 text-muted-foreground"><p className="flex gap-2"><ShieldCheck size={13} className="shrink-0 text-emerald-600" /> Approvals stay one-time and server-bound</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> R2 uploads are verified before the agent can read them</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> Stream can be stopped per run</p></div></div></div></aside>
      </div>
  </div>
);
}

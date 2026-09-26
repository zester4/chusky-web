"use client";

import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  CheckCircle2,
  Check,
  Copy,
  Download,
  Pencil,
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
import { chuskyApi, type AccountOverview, type Artifact, type Model, type Run, type RunImage, type RunStreamEvent, type RunToolActivity, type Thread } from "@/lib/chusky-api";
import { coalesceToolActivities, upsertToolActivity } from "@/lib/run-activity";
import { notifyChuskyDataChanged, useLiveData } from "@/lib/live-sync";
import { AppShellContext } from "./app-shell";
import { MarkdownMessage } from "./markdown-message";

type ChatArtifact = Pick<Artifact, "id" | "name" | "type" | "contentType" | "size">;

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  pending?: boolean;
  runId?: string;
  statusText?: string;
  tool?: string;
  activities?: RunToolActivity[];
  attachments?: Array<{ id: string; name: string; contentType: string; size: number; downloadUrl?: string; previewUrl?: string }>;
  artifacts?: ChatArtifact[];
  images?: Array<RunImage & { downloadUrl?: string }>;
  approval?: { id: string; toolSlug: string; expiresAt: string; deciding?: boolean };
};

const formatToolLabel = (tool?: string) => tool ? tool.replace(/^(CHUCK|COMPOSIO)_/i, "").replaceAll("_", " ").toLowerCase() : "working";
const formatToolDuration = (durationMs?: number) => {
  if (durationMs === undefined || !Number.isFinite(durationMs)) return "";
  return durationMs < 1000 ? `${Math.round(durationMs)} ms` : `${(durationMs / 1000).toFixed(1)} s`;
};

const runActivities = (run: Run): RunToolActivity[] => coalesceToolActivities((run.events ?? []).flatMap((event): RunToolActivity[] => {
  if (event.type !== "run.tool_activity" || !event.toolSlug || !event.message || !event.status) return [];
  return [{ id: event.id, type: "run.tool_activity", at: event.at, toolSlug: event.toolSlug, message: event.message, status: event.status, ...(event.summary ? { summary: event.summary } : {}), ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}) }];
}));
const hasCurrentToolActivity = (activities: RunToolActivity[] | undefined) => activities?.[activities.length - 1]?.status === "started";
const runDeltaText = (run: Run) => (run.events ?? []).filter((event) => event.type === "run.delta" && typeof event.text === "string").map((event) => event.text).join("");
const runStatusText = (run: Run) => {
  if (run.status === "requires_approval") return "Chusky needs your approval to continue with this action.";
  if (run.status === "failed") return "I couldn’t complete this run. The recorded steps remain above.";
  if (run.status === "cancelled") return [...(run.events ?? [])].reverse().find((event) => event.type === "run.cancelled")?.text || "Run cancelled. The completed steps are shown above.";
  return run.output ?? "";
};
const isDelegation = (tool?: string) => Boolean(tool && /(sub.?agent|delegate|worker|handoff)/i.test(tool));
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
const containsVisualBlock = (content: string) => /(?:```|~~~)\s*(?:mermaid|flowchart|chart|charts)\b/i.test(content);

function ArtifactCard({ artifact }: { artifact: ChatArtifact }) {
  return <div className="mt-2 flex max-w-full items-center gap-3 rounded-md border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-foreground/10 bg-background text-muted-foreground"><FileText size={15} /></div>
    <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium" title={artifact.name}>{artifact.name}</p><p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{artifact.type} · {formatArtifactSize(artifact.size)}</p></div>
    <a href={chuskyApi.artifacts.downloadHref(artifact.id)} download={artifact.name} className="inline-flex shrink-0 items-center gap-1.5 rounded border border-foreground/15 px-2.5 py-1.5 text-[10px] font-medium hover:bg-foreground/5" aria-label={`Download ${artifact.name}`}><Download size={12} />Download</a>
  </div>;
}

function GeneratedImageCard({ image }: { image: RunImage & { downloadUrl?: string } }) {
  if (!image.downloadUrl) return <div className="mt-2 rounded-md border border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground">{image.name} · preview unavailable</div>;
  return <figure className="mt-2 max-w-xl overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.025]">
    {/* Signed, short-lived R2 URLs are account-authorized and bypass Next's image optimizer. */}
    <img src={image.downloadUrl} alt="Image generated by Chusky" loading="lazy" decoding="async" className="max-h-[28rem] w-auto max-w-full object-contain" />
    <figcaption className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground"><span className="truncate">{image.name} · {formatArtifactSize(image.size)}</span><a href={image.downloadUrl} download={image.name} className="shrink-0 underline underline-offset-2">Download</a></figcaption>
  </figure>;
}

async function hydrateRunImages(images?: RunImage[]): Promise<Array<RunImage & { downloadUrl?: string }> | undefined> {
  if (!images?.length) return undefined;
  return Promise.all(images.map(async (image) => {
    try { const current = await chuskyApi.images.get(image.id); return { ...image, downloadUrl: current.downloadUrl }; }
    catch { return image; }
  }));
}

type PendingAttachment = { localId: string; file?: File; id?: string; name: string; contentType: string; size: number; progress: number; phase?: "queued" | "uploading" | "verifying"; status: "uploading" | "ready" | "error"; error?: string; previewUrl?: string; downloadUrl?: string };
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/markdown", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "audio/mpeg", "audio/ogg", "audio/wav", "video/mp4", "video/webm"]);
const TYPE_BY_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf", txt: "text/plain", md: "text/markdown", zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", mp3: "audio/mpeg", ogg: "audio/ogg", oga: "audio/ogg", wav: "audio/wav", mp4: "video/mp4", webm: "video/webm" };
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
  const requestedThreadId = searchParams.get("thread");
  const requestedNew = searchParams.get("new") === "1";
  const newConversationNonce = searchParams.get("nonce");
  const requestedDraft = searchParams.get("draft");
  const [thread, setThread] = useState<Thread>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
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
  const [artifactCatalog, setArtifactCatalog] = useState<Artifact[]>([]);
  const [listening, setListening] = useState(false);
  const activeRunIdRef = useRef<string | undefined>(undefined);
  const [activeRunId, setActiveRunId] = useState<string>();
  const messagesRef = useRef<Message[]>(messages);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const uploadAbortControllersRef = useRef(new Map<string, AbortController>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const { setChatHeader } = useContext(AppShellContext);

  const syncActiveRunId = (runId: string | undefined) => {
    activeRunIdRef.current = runId;
    setActiveRunId(runId);
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
        }
        const [runs, artifactPage] = await Promise.all([
          chuskyApi.threads.runs(current.id, { limit: 50 }),
          chuskyApi.artifacts.list({ limit: 100 }).catch(() => ({ data: [] as Artifact[] })),
        ]);
        if (active) {
          setArtifactCatalog(artifactPage.data);
          const threadMessages: Message[] = [];
          for (const run of [...runs.data].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))) {
            if (run.input || run.attachments?.length) threadMessages.push({ role: "user", text: run.input || "Attached file(s)", time: new Date(run.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), attachments: run.attachments });
            const approval = run.status === "requires_approval" && run.approvalId
              ? await chuskyApi.approvals.get(run.approvalId).catch(() => undefined)
              : undefined;
            const activities = runActivities(run);
            const active = run.status === "queued" || run.status === "running";
            const output = run.status === "running" ? runDeltaText(run) : runStatusText(run);
            if (active) syncActiveRunId(run.id);
            threadMessages.push({ role: "assistant", runId: run.id, text: output, activities, artifacts: run.artifacts?.length ? run.artifacts : artifactReferencesInText(output, artifactPage.data), images: await hydrateRunImages(run.images), time: new Date(run.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), pending: active, statusText: active && !hasCurrentToolActivity(activities) ? "Reconnecting to this run…" : undefined, approval });
          }
          // The account history is private model context, not a second UI
          // transcript. Each saved dashboard thread must render only its own
          // runs; the backend merges account history into the next run when a
          // linked private-channel workspace needs shared context.
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
  }, [requestedDraft, newConversationNonce]);

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
    const activities = runActivities(run);
    const images = await hydrateRunImages(run.images);
    const active = run.status === "queued" || run.status === "running";
    if (!active && activeRunIdRef.current === run.id) syncActiveRunId(undefined);
    setMessages((current) => current.map((item) => {
      if (item.role !== "assistant" || item.runId !== run.id) return item;
      const streamedOutput = runDeltaText(run);
      const text = run.status === "running" ? streamedOutput || item.text : runStatusText(run) || (run.status === "completed" ? "Done." : "");
      const artifacts = run.artifacts?.length ? run.artifacts : run.status === "completed" ? item.artifacts : undefined;
      return { ...item, text, activities, artifacts, images: images?.length ? images : item.images, pending: active, statusText: active && !hasCurrentToolActivity(activities) ? "Chusky is continuing this run…" : undefined, approval };
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

  const toggleVoiceInput = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { showNotice("Voice input is not supported in this browser.", "info"); return; }
    if (listening) { setListening(false); return; }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => setInput((current) => `${current}${current ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
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
    const currentRunId = [...messagesRef.current].reverse().find((item) => item.role === "assistant" && item.approval?.id === approvalId)?.runId;
    if (decision === "approve" && currentRunId) syncActiveRunId(currentRunId);
    updateLastAssistant({ pending: decision === "approve", approval: { id: approvalId, toolSlug: "", expiresAt: "", deciding: true } });
    try {
      const run = await chuskyApi.approvals.decide(approvalId, decision);
      if ("threadId" in run) await applyRunSnapshot(run);
      else {
        if (currentRunId) syncActiveRunId(undefined);
        const output = "text" in run && run.text ? run.text : undefined;
        updateLastAssistant({ text: decision === "approve" ? (output || "Approved and completed.") : "Action denied; no action was taken.", approval: undefined, pending: false });
      }
    } catch {
      showNotice("That approval could not be completed. It may have expired or already been decided.");
      updateLastAssistant({ approval: undefined, pending: false, text: "Approval could not be completed. Your recorded steps are preserved above." });
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

  const send = async () => {
    const text = input.trim();
    const readyAttachments = attachments.filter((item) => item.status === "ready" && item.id) as Array<PendingAttachment & { id: string }>;
    if ((!text && !readyAttachments.length) || !thread || controller || messagesRef.current.some((item) => item.role === "assistant" && item.pending && item.runId) || attachments.some((item) => item.status === "uploading" || item.status === "error")) return;
    const abort = new AbortController();
    const artifactIdsBefore = new Set(artifactCatalog.map((artifact) => artifact.id));
    setController(abort);
    setInput("");
    setAttachments([]);
    const outgoing: Message = { role: "user", text: text || "Attached file(s)", time: "Now", attachments: readyAttachments.map(({ id, name, contentType, size, previewUrl, downloadUrl }) => ({ id, name, contentType, size, previewUrl, downloadUrl })) };
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
          const activity: RunToolActivity = { id: typed.id, type: "run.tool_activity", at: typed.at, toolSlug: typed.toolSlug, message: typed.message, status: typed.status, ...(typed.summary ? { summary: typed.summary } : {}), ...(typed.durationMs !== undefined ? { durationMs: typed.durationMs } : {}) };
          setMessages((current) => current.map((item, index) => index === current.length - 1 && item.role === "assistant"
            ? { ...item, runId: typed.runId, activities: upsertToolActivity(item.activities ?? [], activity), pending: true, statusText: undefined, tool: activity.toolSlug }
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
          updateLastAssistant({ text: output, artifacts: runArtifacts.length ? runArtifacts : linkedArtifacts.length ? linkedArtifacts : createdArtifacts, images: runImages, pending: false, statusText: undefined, tool: undefined });
        } else if (typed.type === "run.approval_required") {
          notifyChuskyDataChanged();
          syncActiveRunId(undefined);
          updateLastAssistant({ text: "Chusky needs your approval to continue with this action.", pending: false, statusText: undefined, tool: undefined, approval: typed.approval });
        } else if (typed.type === "run.failed") {
          syncActiveRunId(undefined);
          const detail = typed.error?.message || "";
          showNotice(/429|rate limit|quota|too many requests/i.test(detail)
            ? "The selected model is rate limited. Choose another model or try again in a moment."
            : "Chusky could not complete that run. Please try again.");
          updateLastAssistant({ text: "I couldn’t complete this run. The activity above shows which steps succeeded or need attention.", pending: false, statusText: undefined, tool: undefined });
        } else if (typed.type === "run.cancelled") {
          activeRunIdRef.current = undefined;
          updateLastAssistant({ text: "Run cancelled. The completed steps are shown above.", pending: false, statusText: undefined, tool: undefined });
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
        else updateLastAssistant({ pending: false, text: "The connection ended before run tracking was available. Refresh the conversation to check whether Chusky saved the run." });
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

  return (
    <div className="-mx-2.5 -my-4 flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] min-h-0 min-w-0 flex-col overflow-hidden overscroll-none bg-[#f7f7f4] sm:-mx-4 sm:-my-6 sm:h-[calc(100svh-3.5rem)] sm:max-h-[calc(100svh-3.5rem)] lg:-mx-7 lg:-my-8">
      {notice && <div className={`fixed left-1/2 top-16 z-50 flex w-[min(calc(100%-1rem),32rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-md border px-3 py-2 text-[11px] shadow-lg ${notice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role="alert"><span>{notice.message}</span><button type="button" onClick={() => setNotice(undefined)} className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss notification"><X size={13} /></button></div>}

      <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col px-1.5 py-2 sm:px-5 sm:py-6 lg:px-8">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 pb-2">
            <div className="space-y-3.5 sm:space-y-4">
              {!messages.length && status === "ready" && <div className="mx-auto mt-10 max-w-sm text-center"><p className="text-xs font-medium">Start a new conversation</p><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Ask Chusky to research, write, plan, or act. Your chat will be saved automatically so you can return to it later.</p><button type="button" onClick={() => inputRef.current?.focus()} className="mt-3 text-[11px] font-medium underline underline-offset-4">Write the first message</button></div>}
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={item.role === "user" ? "group relative ml-auto w-fit max-w-[min(94%,42rem)]" : "group relative w-fit max-w-full"} onClick={() => setActiveMessageIndex(index)}>
                  <div className={item.role === "user" ? "relative w-fit max-w-full min-w-0 break-words rounded-md border border-foreground/15 bg-foreground px-2.5 py-1.5 text-[12px] leading-5 text-background [overflow-wrap:anywhere]" : containsVisualBlock(item.text) ? "relative w-fit max-w-full min-w-0 break-words bg-transparent p-0 [overflow-wrap:anywhere]" : "relative w-fit max-w-full min-w-0 break-words rounded-md border border-foreground/10 bg-background px-2.5 py-1.5 [overflow-wrap:anywhere]"}>
                    {item.role === "assistant" && <div className="mb-1 flex items-baseline gap-2"><p className="text-xs font-medium">Chusky</p><span className="font-mono text-[9px] text-muted-foreground">{item.time || "Now"}</span></div>}
                    {item.pending && !hasCurrentToolActivity(item.activities) && <div className="mb-1.5 inline-flex max-w-full items-center gap-1.5 text-[10px] text-muted-foreground"><LoaderCircle size={11} className="shrink-0 animate-spin" /><span className="truncate">{item.statusText || (isDelegation(item.tool) ? "🤖 I’m delegating to a domain specialist…" : item.tool ? `Using ${formatToolLabel(item.tool)}` : "I’m working through that…")}</span></div>}
                    {item.activities?.length ? <section aria-label="Tool activity" className="my-2 w-full min-w-0 max-w-2xl">
                      <div className="mb-1.5 flex items-center justify-between gap-2"><p className="text-[10px] font-medium">Activity</p><span className="text-[9px] text-muted-foreground">{item.activities.length} {item.activities.length === 1 ? "step" : "steps"}</span></div>
                      <ol className="space-y-2">
                        {item.activities.map((activity, activityIndex) => {
                          const isCurrent = item.pending && activity.status === "started" && activityIndex === item.activities!.length - 1;
                          return <li key={activity.id} className="flex min-w-0 gap-2.5">
                            <span className="mt-0.5 shrink-0" aria-hidden="true">{isCurrent ? <LoaderCircle size={12} className="animate-spin text-muted-foreground" /> : activity.status === "started" ? <span className="mt-1 block size-1.5 rounded-full bg-muted-foreground/45" /> : activity.status === "completed" ? <CheckCircle2 size={12} className="text-emerald-700" /> : activity.status === "approval_required" ? <ShieldCheck size={12} className="text-amber-700" /> : activity.status === "cancelled" ? <Square size={10} className="text-muted-foreground" /> : <X size={12} className="text-rose-700" />}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] leading-4">{activity.message}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] leading-4 text-muted-foreground">
                                <span className="font-mono">{formatToolLabel(activity.toolSlug)}</span>
                                <span>{activity.status === "started" ? isCurrent ? "In progress" : "No final result was recorded" : activity.status === "completed" ? `Completed${formatToolDuration(activity.durationMs) ? ` · ${formatToolDuration(activity.durationMs)}` : ""}${activity.summary ? ` · ${activity.summary}` : ""}` : activity.status === "approval_required" ? "Waiting for your approval" : activity.status === "cancelled" ? "Cancelled" : "Couldn’t complete this step"}</span>
                              </div>
                            </div>
                            <span className="sr-only">Step {activityIndex + 1}</span>
                          </li>;
                        })}
                      </ol>
                      <p className="mt-2 text-[9px] leading-4 text-muted-foreground">Private tool inputs and raw connected-app data are not shown here.</p>
                    </section> : null}
                    {item.text ? item.role === "assistant" ? <MarkdownMessage content={stripArtifactLinks(item.text, item.artifacts || [])} /> : <p className="whitespace-pre-wrap text-xs leading-5">{item.text}</p> : null}
                    {item.role === "assistant" && item.artifacts?.length ? <div className="mt-2 space-y-2">{item.artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} />)}</div> : null}
                    {item.role === "assistant" && item.images?.length ? <div className="mt-2 space-y-2">{item.images.map((image) => <GeneratedImageCard key={image.id} image={image} />)}</div> : null}
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
                </div>
              ))}
              <div ref={endRef} />
            </div>
            </div>

            <div className="shrink-0 pt-2 pb-[env(safe-area-inset-bottom)] sm:pt-4 sm:pb-0">
              <div className="rounded-lg border border-foreground/10 bg-background transition-colors focus-within:border-foreground/25">
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.md,.zip,.docx,.pptx,.xlsx,.mp3,.ogg,.oga,.wav,.mp4,.webm" className="hidden" onChange={(event) => void selectFiles(event.target.files)} />
                {attachments.length ? <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2" aria-live="polite">{attachments.map((item) => <div key={item.localId} className={`relative flex w-56 min-w-56 items-center gap-2.5 rounded-lg bg-foreground/[0.035] p-2 ${item.status === "error" ? "ring-1 ring-amber-600/25" : ""}`}>
                  {item.previewUrl ? <img src={item.previewUrl} alt={`Preview of ${item.name}`} className="size-11 shrink-0 rounded-md object-cover" /> : <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${item.status === "error" ? "bg-amber-500/10 text-amber-700" : "bg-background text-muted-foreground"}`}>{item.contentType.startsWith("image/") ? <FileImage size={17} /> : <FileText size={17} />}</div>}
                  <div className="min-w-0 flex-1 pr-1"><p className="truncate text-[10px] font-medium" title={item.name}>{item.name}</p><p className={`mt-0.5 text-[9px] ${item.status === "error" ? "text-amber-700" : "text-muted-foreground"}`}>{item.status === "ready" ? `Ready · ${formatArtifactSize(item.size)}` : item.status === "error" ? "Upload failed" : item.phase === "queued" ? "Waiting to upload…" : item.phase === "verifying" ? "Verifying file…" : `Uploading · ${item.progress}%`}</p>
                    {item.status === "uploading" ? <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10"><div className={`h-full rounded-full bg-foreground/60 transition-[width] ${item.phase === "verifying" ? "animate-pulse" : ""}`} style={{ width: `${Math.max(4, item.progress)}%` }} /></div> : null}
                    {item.error ? <p className="mt-1 text-[9px] leading-4 text-amber-800" role="alert">{item.error}</p> : null}
                  </div>
                  {item.status === "error" && item.file && ACCEPTED_TYPES.has(item.contentType) ? <button type="button" onClick={() => retryAttachment(item)} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label={`Retry uploading ${item.name}`} title="Retry upload"><RotateCcw size={13} /></button> : null}
                  <button type="button" onClick={() => void removeAttachment(item)} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label={`Remove ${item.name}`} title="Remove attachment"><X size={13} /></button>
                </div>)}</div> : null}
                {attachments.some((item) => item.status === "error") ? <p className="px-3 pb-1 text-[10px] text-amber-800" role="status">Retry or remove failed files before sending, so Chusky won’t miss an attachment.</p> : null}
                <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(min-width: 640px)").matches) { event.preventDefault(); void send(); } }} placeholder={status === "offline" ? "Connect the Chusky backend to start chatting…" : isWorking ? "Chusky is continuing this run…" : attachments.some((item) => item.status === "uploading") ? "Uploading attachment…" : editingMessageIndex !== undefined ? "Edit your message…" : "Ask Chusky anything…"} rows={3} disabled={!thread || isWorking} className="w-full resize-none bg-transparent px-3 pt-2.5 text-xs leading-5 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed" />
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 pt-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!thread || isWorking || attachments.length >= 5 || attachments.some((item) => item.status === "uploading")} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach a file"><Plus size={15} strokeWidth={1.8} aria-hidden="true" /></button>
                    <label className="sr-only" htmlFor="chat-model">Run model</label>
                    <select id="chat-model" aria-label="Run model" value={runModel || account?.model || ""} onChange={(event) => setRunModel(event.target.value)} className="min-w-0 max-w-28 truncate rounded-md bg-background px-1.5 py-1.5 text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 sm:max-w-44"><option value="">Agent model</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <span className="hidden font-mono text-[9px] text-muted-foreground sm:inline">Enter to send · Shift+Enter for newline</span>
                    <button type="button" onClick={toggleVoiceInput} disabled={!thread || isWorking} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-foreground/15 ${listening ? "bg-rose-50 text-rose-700" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`} aria-label={listening ? "Stop voice input" : "Start voice input"} title={listening ? "Stop voice input" : "Start voice input"}><Mic size={13} /></button>
                    {isWorking ? <button type="button" onClick={() => void cancelActiveRun()} disabled={!activeRunId} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50" aria-label="Stop response" title="Stop response"><Square size={11} fill="currentColor" /></button> : <button type="button" onClick={() => void send()} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-40" disabled={(!input.trim() && !attachments.some((item) => item.status === "ready")) || !thread || attachments.some((item) => item.status === "uploading" || item.status === "error")} aria-label={editingMessageIndex !== undefined ? "Resend edited message" : "Send message"}><ArrowUp size={13} /></button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-foreground/10 bg-background xl:block"><div className="border-b border-foreground/10 px-4 py-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Context</p><button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Context options"><MoreHorizontal size={14} /></button></div><h2 className="mt-3 font-display text-xl">Tools, close at hand.</h2><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Authenticated session and server-side run API.</p></div><div className="space-y-5 p-4"><div><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Verified channels</p><div className="space-y-1.5">{account?.channels.length ? account.channels.map((channel) => <div key={`${channel.provider}-${channel.externalUserId}`} className="flex items-center justify-between border border-foreground/10 px-2.5 py-2 text-[11px]"><span className="flex min-w-0 items-center gap-2"><FileText size={12} /><span className="truncate">{channel.displayName || channel.provider}</span></span><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /></div>) : <p className="border border-dashed border-foreground/15 px-2.5 py-2.5 text-[11px] leading-5 text-muted-foreground">No verified channels yet. Chusky can still work in this private web conversation.</p>}</div></div><div className="border-t border-foreground/10 pt-4"><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Safety</p><div className="space-y-2.5 text-[11px] leading-5 text-muted-foreground"><p className="flex gap-2"><ShieldCheck size={13} className="shrink-0 text-emerald-600" /> Approvals stay one-time and server-bound</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> R2 uploads are verified before the agent can read them</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> Stream can be stopped per run</p></div></div></div></aside>
      </div>
  </div>
);
}

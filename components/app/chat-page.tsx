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
  LoaderCircle,
  MoreHorizontal,
  Mic,
  Paperclip,
  ShieldCheck,
  Square,
  ThumbsUp,
  Share2,
    X,
} from "lucide-react";
import { chuskyApi, type AccountOverview, type Artifact, type DurationBudget, type Model, type RunStreamEvent, type Thread } from "@/lib/chusky-api";
import { AppShellContext } from "./app-shell";
import { MarkdownMessage } from "./markdown-message";

type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  pending?: boolean;
  tool?: string;
  attachments?: Array<{ id: string; name: string; contentType: string; size: number; downloadUrl?: string }>;
  artifacts?: Artifact[];
  approval?: { id: string; toolSlug: string; expiresAt: string; deciding?: boolean };
};

const formatToolLabel = (tool?: string) => tool ? tool.replaceAll("_", " ").toLowerCase() : "working";
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
const artifactLinksInText = (content: string, artifacts: Artifact[]) => {
  const matches: Artifact[] = [];
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
const stripArtifactLinks = (content: string, artifacts: Artifact[]) => {
  if (!artifacts.length) return content;
  return content.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (full, label) => artifactLinksInText(full, artifacts).length ? label : full);
};

function ArtifactCard({ artifact, busy, onDownload }: { artifact: Artifact; busy: boolean; onDownload: (artifact: Artifact) => void }) {
  return <div className="mt-2 flex max-w-full items-center gap-3 rounded-md border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-foreground/10 bg-background text-muted-foreground"><FileText size={15} /></div>
    <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium" title={artifact.name}>{artifact.name}</p><p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{artifact.type} · {formatArtifactSize(artifact.size)}</p></div>
    <button type="button" onClick={() => onDownload(artifact)} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded border border-foreground/15 px-2.5 py-1.5 text-[10px] font-medium hover:bg-foreground/5 disabled:cursor-wait disabled:opacity-60" aria-label={`Download ${artifact.name}`}><Download size={12} />{busy ? "Preparing…" : "Download"}</button>
  </div>;
}

type PendingAttachment = { localId: string; id?: string; name: string; contentType: string; size: number; progress: number; status: "uploading" | "ready" | "error"; error?: string };
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/markdown", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "audio/mpeg", "audio/ogg", "audio/wav", "video/mp4", "video/webm"]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

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
  const [runDuration, setRunDuration] = useState<DurationBudget>("30m");
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [controller, setController] = useState<AbortController>();
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>();
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number>();
  const [likedMessageIndex, setLikedMessageIndex] = useState<number>();
  const [editingMessageIndex, setEditingMessageIndex] = useState<number>();
  const [notice, setNotice] = useState<{ kind: "error" | "info"; message: string }>();
  const [artifactCatalog, setArtifactCatalog] = useState<Artifact[]>([]);
  const [downloadingArtifactId, setDownloadingArtifactId] = useState<string>();
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const { setChatHeader } = useContext(AppShellContext);

  useEffect(() => {
    setChatHeader({ title: thread ? String(thread.metadata.title || "New conversation") : "Connecting to Chusky", status });
    return () => setChatHeader(undefined);
  }, [setChatHeader, status, thread]);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setThread(undefined);
    setMessages([]);
    (async () => {
      try {
        const page = await chuskyApi.threads.list({ limit: 50, includeArchived: true });
        const current = requestedThreadId
          ? await chuskyApi.threads.get(requestedThreadId)
          : requestedNew ? await chuskyApi.threads.create({ source: "web-dashboard" }) : page.data[0] || await chuskyApi.threads.create({ source: "web-dashboard" });
        if (active) {
          setThread(current);
          setStatus("ready");
        }
        const runs = await chuskyApi.threads.runs(current.id, { limit: 50 });
        const artifactPage = await chuskyApi.artifacts.list().catch(() => ({ data: [] as Artifact[] }));
        if (active) {
          setArtifactCatalog(artifactPage.data);
          const restored: Message[] = [];
          for (const run of [...runs.data].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))) {
            if (run.input || run.attachments?.length) restored.push({ role: "user", text: run.input || "Attached file(s)", time: new Date(run.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), attachments: run.attachments });
            if (run.output || run.status === "requires_approval") {
              const approval = run.status === "requires_approval" && run.approvalId
                ? await chuskyApi.approvals.get(run.approvalId).catch(() => undefined)
                : undefined;
              const output = run.output || "This run is awaiting approval.";
              restored.push({ role: "assistant", text: output, artifacts: artifactLinksInText(output, artifactPage.data), time: new Date(run.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), pending: false, approval });
            }
          }
          setMessages(restored);
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

  const showNotice = (message: string, kind: "error" | "info" = "error") => {
    setNotice({ kind, message });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(undefined), 5000);
  };

  const updateLastAssistant = (update: Partial<Message>) => {
    setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, ...update } : item));
  };
  const removeActiveAssistant = () => {
    setMessages((current) => current[current.length - 1]?.role === "assistant" ? current.slice(0, -1) : current);
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
    const Recognition = (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!Recognition) { showNotice("Voice input is not supported in this browser.", "info"); return; }
    if (listening) { setListening(false); return; }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setInput((current) => `${current}${current ? " " : ""}${event.results[0][0].transcript}`);
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
    updateLastAssistant({ approval: { id: approvalId, toolSlug: "", expiresAt: "", deciding: true } });
    try {
      const run = await chuskyApi.approvals.decide(approvalId, decision);
      const output = "output" in run && run.output ? run.output : "text" in run && run.text ? run.text : undefined;
      updateLastAssistant({ text: decision === "approve" ? (output || "Approved and completed.") : "Action denied.", approval: undefined, pending: false });
    } catch {
      showNotice("That approval could not be completed. It may have expired or already been decided.");
      updateLastAssistant({ approval: undefined, pending: false });
    }
  };

  const selectFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const remaining = Math.max(0, 5 - attachments.length);
    const candidates = files.slice(0, remaining);
    const rejected = candidates.filter((file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES || file.size < 1);
    const valid = candidates.filter((file) => !rejected.includes(file));
    const uploadEntries = valid.map((file) => ({ localId: crypto.randomUUID(), name: file.name, contentType: file.type, size: file.size, progress: 0, status: "uploading" as const }));
    setAttachments((current) => [...current, ...rejected.map((file) => ({ localId: crypto.randomUUID(), name: file.name, contentType: file.type || "unknown", size: file.size, progress: 0, status: "error" as const, error: "Use a supported image, document, archive, audio, or video up to 25 MB." })), ...uploadEntries]);
    await Promise.all(valid.map(async (file, index) => {
      const localId = uploadEntries[index].localId;
      try {
        const uploaded = await chuskyApi.files.upload(file, (progress) => setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, progress } : item)));
        setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, id: uploaded.id, progress: 100, status: "ready" } : item));
      } catch (error) {
        setAttachments((current) => current.map((item) => item.localId === localId ? { ...item, status: "error", error: error instanceof Error ? error.message : "Upload failed." } : item));
      }
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (item: PendingAttachment) => {
    setAttachments((current) => current.filter((candidate) => candidate.localId !== item.localId));
    if (item.id) await chuskyApi.files.remove(item.id).catch(() => undefined);
  };

  const downloadArtifact = async (artifact: Artifact) => {
    setDownloadingArtifactId(artifact.id);
    try {
      const blob = await chuskyApi.artifacts.download(artifact.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = artifact.name;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      window.setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 60_000);
    } catch {
      showNotice(`Could not download ${artifact.name}. Please try again.`);
    } finally {
      setDownloadingArtifactId(undefined);
    }
  };

  const send = async () => {
    const text = input.trim();
    const readyAttachments = attachments.filter((item) => item.status === "ready" && item.id) as Array<PendingAttachment & { id: string }>;
    if ((!text && !readyAttachments.length) || !thread || controller || attachments.some((item) => item.status === "uploading")) return;
    const abort = new AbortController();
    const artifactIdsBefore = new Set(artifactCatalog.map((artifact) => artifact.id));
    setController(abort);
    setInput("");
    setAttachments([]);
    const outgoing: Message = { role: "user", text: text || "Attached file(s)", time: "Now", attachments: readyAttachments.map(({ id, name, contentType, size }) => ({ id, name, contentType, size })) };
    setMessages((current) => editingMessageIndex === undefined ? [...current, outgoing, { role: "assistant", text: "", pending: true }] : [...current.slice(0, editingMessageIndex), outgoing, { role: "assistant", text: "", pending: true }]);
    setEditingMessageIndex(undefined);
    const shouldTitle = Boolean(text && !thread.metadata.title);
    try {
      for await (const event of chuskyApi.runs.stream(thread.id, text, readyAttachments.map((item) => item.id), abort.signal, { model: runModel || undefined, budget: { duration: runDuration } })) {
        const typed = event as RunStreamEvent;
        if (typed.type === "run.started" || typed.type === "run.queued") {
          updateLastAssistant({ pending: true });
        } else if (typed.type === "run.delta") {
          setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, text: item.text + typed.text, pending: false } : item));
        } else if (typed.type === "run.tool_started") {
          updateLastAssistant({ pending: true, tool: typed.toolSlug });
        } else if (typed.type === "run.completed") {
          const output = typed.run.output || "Done.";
          let latestArtifacts = artifactCatalog;
          try {
            const page = await chuskyApi.artifacts.list();
            latestArtifacts = page.data;
            setArtifactCatalog(latestArtifacts);
          } catch {
            // The run is complete even if the artifact catalogue is temporarily unavailable.
          }
          const createdArtifacts = latestArtifacts.filter((artifact) => !artifactIdsBefore.has(artifact.id));
          const linkedArtifacts = artifactLinksInText(output, latestArtifacts);
          updateLastAssistant({ text: output, artifacts: linkedArtifacts.length ? linkedArtifacts : createdArtifacts, pending: false, tool: undefined });
        } else if (typed.type === "run.approval_required") {
          updateLastAssistant({ text: `Chusky needs your approval to use ${(typed.approval?.toolSlug || "this action").replaceAll("_", " ").toLowerCase()}.`, pending: false, tool: undefined, approval: typed.approval });
        } else if (typed.type === "run.failed") {
          const detail = typed.error?.message || "";
          showNotice(/429|rate limit|quota|too many requests/i.test(detail)
            ? "The selected model is rate limited. Choose another model or try again in a moment."
            : "Chusky could not complete that run. Please try again.");
          removeActiveAssistant();
        } else if (typed.type === "run.cancelled") {
          updateLastAssistant({ text: "Run cancelled.", pending: false, tool: undefined });
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        const detail = error instanceof Error ? error.message : "";
        showNotice(/429|rate limit|quota|too many requests/i.test(detail)
          ? "The selected model is rate limited. Choose another model or try again in a moment."
          : "Chusky is temporarily unavailable. Please try again.");
        removeActiveAssistant();
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
                <div key={`${item.role}-${index}`} className={item.role === "user" ? "group relative ml-auto w-fit max-w-[min(86%,42rem)]" : "group relative w-fit max-w-[min(100%,54rem)]"} onClick={() => setActiveMessageIndex(index)}>
                  <div className={item.role === "user" ? "relative w-fit max-w-full min-w-0 rounded-md border border-foreground/15 bg-foreground px-2 py-1.5 text-[12px] leading-5 text-background" : "relative w-fit max-w-full min-w-0 rounded-md border border-foreground/10 bg-background px-2 py-1.5"}>
                    {item.role === "assistant" && <div className="mb-1 flex items-baseline gap-2"><p className="text-xs font-medium">Chusky</p><span className="font-mono text-[9px] text-muted-foreground">{item.time || "Now"}</span></div>}
                    {item.pending && <div className="mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-1 text-[10px] text-muted-foreground"><LoaderCircle size={11} className="shrink-0 animate-spin" /><span className="truncate">{isDelegation(item.tool) ? "Sub-agent working" : item.tool ? `Using ${formatToolLabel(item.tool)}` : "Chusky is working"}</span></div>}
                    {item.text ? item.role === "assistant" ? <MarkdownMessage content={stripArtifactLinks(item.text, item.artifacts || [])} /> : <p className="whitespace-pre-wrap text-xs leading-5">{item.text}</p> : null}
                    {item.role === "assistant" && item.artifacts?.length ? <div className="mt-2 space-y-2">{item.artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} busy={downloadingArtifactId === artifact.id} onDownload={(candidate) => void downloadArtifact(candidate)} />)}</div> : null}
                    {item.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{item.attachments.map((file) => <span key={file.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-background/25 bg-background/10 px-2 py-1 text-[10px] text-background"><FileText size={12} /> <span className="truncate">{file.name}</span></span>)}</div> : null}
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

            <div className="shrink-0 pt-2 sm:pt-4"><div className="rounded-md border border-foreground/10 bg-background transition-colors focus-within:border-foreground/25"><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm" className="hidden" onChange={(event) => void selectFiles(event.target.files)} />{attachments.length ? <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">{attachments.map((item) => <div key={item.localId} className="flex max-w-full items-center gap-1.5 rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-1 text-[9px]"><FileText size={11} className={item.status === "error" ? "text-amber-600" : "text-muted-foreground"} /><span className="max-w-40 truncate">{item.name}</span><span className="text-muted-foreground">{item.status === "uploading" ? `${item.progress}%` : item.status === "ready" ? "ready" : "failed"}</span><button type="button" onClick={() => void removeAttachment(item)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${item.name}`}><X size={11} /></button>{item.error ? <span className="hidden text-amber-700 sm:inline">{item.error}</span> : null}</div>)}</div> : null}<textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(min-width: 640px)").matches) { event.preventDefault(); void send(); } }} placeholder={status === "offline" ? "Connect the Chusky backend to start chatting…" : attachments.some((item) => item.status === "uploading") ? "Uploading attachment…" : editingMessageIndex !== undefined ? "Edit your message…" : "Ask Chusky anything…"} rows={3} disabled={!thread || Boolean(controller)} className="w-full resize-none bg-transparent px-3 pt-2.5 text-xs leading-5 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed" /><div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1"><div className="flex min-w-0 items-center gap-1"><button type="button" onClick={() => fileInputRef.current?.click()} disabled={!thread || Boolean(controller) || attachments.length >= 5} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach a file"><Paperclip size={14} /></button><label className="sr-only" htmlFor="chat-model">Run model</label><select id="chat-model" aria-label="Run model" value={runModel || account?.model || ""} onChange={(event) => setRunModel(event.target.value)} className="min-w-0 max-w-28 truncate rounded-md border border-foreground/10 bg-background px-1.5 py-1.5 text-[10px] outline-none hover:border-foreground/25 focus:border-foreground/40 sm:max-w-44"><option value="">Agent model</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select><label className="sr-only" htmlFor="chat-duration">Run duration</label><select id="chat-duration" aria-label="Run duration" value={runDuration} onChange={(event) => setRunDuration(event.target.value as DurationBudget)} className="w-14 shrink-0 rounded-md border border-foreground/10 bg-background px-1.5 py-1.5 text-[10px] outline-none hover:border-foreground/25 focus:border-foreground/40">{["5m", "30m", "1h", "3h", "6h", "3d", "1w"].map((duration) => <option key={duration} value={duration}>{duration}</option>)}</select></div><div className="flex shrink-0 items-center gap-2"><span className="hidden font-mono text-[9px] text-muted-foreground sm:inline">Enter to send · Shift+Enter for newline</span><button type="button" onClick={toggleVoiceInput} disabled={!thread || Boolean(controller)} className={`flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${listening ? "border-rose-300 bg-rose-50 text-rose-700" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`} aria-label={listening ? "Stop voice input" : "Start voice input"} title={listening ? "Stop voice input" : "Start voice input"}><Mic size={13} /></button>{controller ? <button type="button" onClick={() => controller.abort()} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background" aria-label="Stop response"><Square size={11} fill="currentColor" /></button> : <button type="button" onClick={() => void send()} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-40" disabled={(!input.trim() && !attachments.some((item) => item.status === "ready")) || !thread || attachments.some((item) => item.status === "uploading")} aria-label={editingMessageIndex !== undefined ? "Resend edited message" : "Send message"}><ArrowUp size={13} /></button>}</div></div></div></div>
          </div>
        </div>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-foreground/10 bg-background xl:block"><div className="border-b border-foreground/10 px-4 py-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Context</p><button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Context options"><MoreHorizontal size={14} /></button></div><h2 className="mt-3 font-display text-xl">Tools, close at hand.</h2><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Authenticated session and server-side run API.</p></div><div className="space-y-5 p-4"><div><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Verified channels</p><div className="space-y-1.5">{account?.channels.length ? account.channels.map((channel) => <div key={`${channel.provider}-${channel.externalUserId}`} className="flex items-center justify-between border border-foreground/10 px-2.5 py-2 text-[11px]"><span className="flex min-w-0 items-center gap-2"><FileText size={12} /><span className="truncate">{channel.displayName || channel.provider}</span></span><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /></div>) : <p className="border border-dashed border-foreground/15 px-2.5 py-2.5 text-[11px] leading-5 text-muted-foreground">No verified channels yet. Chusky can still work in this private web conversation.</p>}</div></div><div className="border-t border-foreground/10 pt-4"><p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Safety</p><div className="space-y-2.5 text-[11px] leading-5 text-muted-foreground"><p className="flex gap-2"><ShieldCheck size={13} className="shrink-0 text-emerald-600" /> Approvals stay one-time and server-bound</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> R2 uploads are verified before the agent can read them</p><p className="flex gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> Stream can be stopped per run</p></div></div></div></aside>
      </div>
  </div>
);
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Check,
  Copy,
  FileText,
  History,
  LoaderCircle,
  MoreHorizontal,
  Paperclip,
  PanelRight,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { chuskyApi, type AccountOverview, type RunStreamEvent, type Thread } from "@/lib/chusky-api";
import { MarkdownMessage } from "./markdown-message";

type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  pending?: boolean;
  tool?: string;
  attachments?: Array<{ id: string; name: string; contentType: string; size: number }>;
  approval?: { id: string; toolSlug: string; expiresAt: string; deciding?: boolean };
};

type PendingAttachment = { localId: string; id?: string; name: string; contentType: string; size: number; progress: number; status: "uploading" | "ready" | "error"; error?: string };
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "audio/mpeg", "audio/ogg", "audio/wav", "video/mp4"]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const suggestions = [
  "Summarize my unread emails",
  "Plan my priorities for today",
  "Review open GitHub issues",
];

export function ChatPage() {
  const [thread, setThread] = useState<Thread>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [account, setAccount] = useState<AccountOverview>();
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [showContext, setShowContext] = useState(true);
  const [controller, setController] = useState<AbortController>();
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>();
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number>();
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const page = await chuskyApi.threads.list();
        const current = page.data[0] || await chuskyApi.threads.create({ source: "web-dashboard" });
        if (active) {
          setThread(current);
          setStatus("ready");
        }
        void chuskyApi.account.get().then((next) => { if (active) setAccount(next); }).catch(() => undefined);
      } catch {
        if (active) setStatus("offline");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateLastAssistant = (update: Partial<Message>) => {
    setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, ...update } : item));
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

  const decideApproval = async (approvalId: string, decision: "approve" | "deny") => {
    updateLastAssistant({ approval: { id: approvalId, toolSlug: "", expiresAt: "", deciding: true } });
    try {
      const run = await chuskyApi.approvals.decide(approvalId, decision);
      updateLastAssistant({ text: decision === "approve" ? (run.output || "Approved and completed.") : "Action denied.", approval: undefined, pending: false });
    } catch {
      updateLastAssistant({ text: "That approval could not be completed. It may have expired or already been decided.", approval: undefined, pending: false });
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
    setAttachments((current) => [...current, ...rejected.map((file) => ({ localId: crypto.randomUUID(), name: file.name, contentType: file.type || "unknown", size: file.size, progress: 0, status: "error" as const, error: "Use an image, PDF, text, audio, or MP4 file up to 25 MB." })), ...uploadEntries]);
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

  const send = async () => {
    const text = input.trim();
    const readyAttachments = attachments.filter((item) => item.status === "ready" && item.id) as Array<PendingAttachment & { id: string }>;
    if ((!text && !readyAttachments.length) || !thread || controller || attachments.some((item) => item.status === "uploading")) return;
    const abort = new AbortController();
    setController(abort);
    setInput("");
    setAttachments([]);
    setMessages((current) => [...current, { role: "user", text: text || "Attached file(s)", time: "Now", attachments: readyAttachments.map(({ id, name, contentType, size }) => ({ id, name, contentType, size })) }, { role: "assistant", text: "", pending: true }]);
    try {
      for await (const event of chuskyApi.runs.stream(thread.id, text, readyAttachments.map((item) => item.id), abort.signal)) {
        const typed = event as RunStreamEvent;
        if (typed.type === "run.delta") {
          setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, text: item.text + typed.text, pending: false } : item));
        } else if (typed.type === "run.tool_started") {
          updateLastAssistant({ pending: true, tool: typed.toolSlug });
        } else if (typed.type === "run.completed") {
          updateLastAssistant({ text: typed.run.output || "Done.", pending: false, tool: undefined });
        } else if (typed.type === "run.approval_required") {
          updateLastAssistant({ text: `Chusky needs your approval to use ${typed.approval.toolSlug.replaceAll("_", " ").toLowerCase()}.`, pending: false, tool: undefined, approval: typed.approval });
        } else if (typed.type === "run.failed") {
          updateLastAssistant({ text: "I couldn’t complete that request. Please try again.", pending: false, tool: undefined });
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") updateLastAssistant({ text: "The Chusky service is unavailable right now. Check the backend and try again.", pending: false, tool: undefined });
    } finally {
      setController(undefined);
    }
  };

  return (
    <div className="-mx-3 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#f7f7f4] sm:-mx-5 sm:-my-7 lg:-mx-7 lg:-my-8">
      <header className="flex min-h-12 items-center justify-between border-b border-foreground/10 bg-background px-3 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Bot size={14} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h1 className="truncate text-xs font-medium">{thread ? "New conversation" : "Connecting to Chusky"}</h1><span className={status === "ready" ? "rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-emerald-800" : "rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-800"}>{status === "ready" ? "Live" : status === "offline" ? "Offline" : "Connecting"}</span></div>
            <p className="truncate text-[10px] text-muted-foreground">Private workspace · backed by your Chusky session</p>
          </div>
        </div>
        <div className="flex items-center gap-1"><button type="button" className="hidden items-center gap-1.5 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground sm:flex"><History size={12} /> History</button><button type="button" onClick={() => setShowContext((value) => !value)} className="flex items-center gap-1.5 border border-foreground/10 px-2 py-1.5 text-[10px] text-muted-foreground hover:border-foreground/30 hover:text-foreground"><PanelRight size={12} /><span className="hidden sm:inline">Context</span></button><button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Chat settings"><SlidersHorizontal size={14} /></button></div>
      </header>

      <div className={showContext ? "grid flex-1 xl:grid-cols-[minmax(0,1fr)_280px]" : "flex-1"}>
        <div className="flex min-w-0 flex-col">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-6 sm:px-6 sm:py-7 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Agent workspace</p><p className="mt-1.5 text-[11px] text-muted-foreground">Ask naturally. Chusky streams progress and keeps durable run state.</p></div><span className="flex max-w-52 items-center gap-2 truncate rounded-full border border-foreground/10 bg-background px-2.5 py-1.5 text-[11px]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> <span className="truncate">{account?.model || "Agent model"}</span></span></div>

            <div className="space-y-6">
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={item.role === "user" ? "group relative ml-auto max-w-[90%] sm:max-w-2xl" : "group relative flex gap-2.5 sm:gap-4"} onClick={() => setActiveMessageIndex(index)}>
                  {item.role === "assistant" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] text-background">C</div>}
                  <div className={item.role === "user" ? "relative min-w-0 rounded-xl border border-foreground/20 bg-foreground px-3 py-2.5 text-xs leading-5 text-background shadow-sm" : "relative min-w-0 rounded-xl border border-foreground/10 bg-background px-3 py-2.5 shadow-sm"}>
                    {item.role === "assistant" && <div className="mb-1.5 flex items-baseline gap-2.5"><p className="text-xs font-medium">Chusky</p><span className="font-mono text-[9px] text-muted-foreground">{item.time || "Now"}</span></div>}
                    {item.pending && !item.text ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> {item.tool ? `Using ${item.tool.replaceAll("_", " ").toLowerCase()}…` : "Thinking through your request…"}</p> : item.role === "assistant" ? <MarkdownMessage content={item.text} /> : <p className="whitespace-pre-wrap text-xs leading-5">{item.text}</p>}
                    {item.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{item.attachments.map((file) => <span key={file.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-background/25 bg-background/10 px-2 py-1 text-[10px] text-background"><FileText size={12} /> <span className="truncate">{file.name}</span></span>)}</div> : null}
                    {item.tool && <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><Zap size={12} /> {item.tool.replaceAll("_", " ").toLowerCase()}</p>}
                    {item.approval && <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "approve")} className="rounded-full bg-foreground px-3 py-1.5 text-[11px] text-background disabled:opacity-50">Approve</button><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "deny")} className="rounded-full border border-foreground/15 px-3 py-1.5 text-[11px] disabled:opacity-50">Deny</button></div>}
                    {item.text ? <div className={`absolute -bottom-4 right-2 z-10 flex items-center gap-1 rounded-md border border-foreground/10 bg-background p-0.5 text-muted-foreground shadow-sm transition-opacity ${activeMessageIndex === index ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100"}`} onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void copyMessage(index, item.text)} className="flex min-h-11 min-w-11 items-center justify-center rounded px-2 hover:bg-foreground/5 hover:text-foreground" aria-label={copiedMessageIndex === index ? "Message copied" : "Copy message"} title={copiedMessageIndex === index ? "Copied" : "Copy"}>
                        {copiedMessageIndex === index ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div> : null}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="mt-auto pt-8"><div className="mb-2 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2 py-1 text-[9px] text-muted-foreground"><Paperclip size={10} /> Verified R2 uploads</span><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2 py-1 text-[9px] text-muted-foreground"><Zap size={10} /> Use connected apps</span><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2 py-1 text-[9px] text-muted-foreground"><Terminal size={10} /> Run in workspace</span></div><div className="rounded-xl border border-foreground/15 bg-background shadow-sm transition-colors focus-within:border-foreground/40"><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,audio/mpeg,audio/ogg,audio/wav,video/mp4" className="hidden" onChange={(event) => void selectFiles(event.target.files)} /><div className="flex flex-wrap gap-1.5 px-3 pt-3">{attachments.map((item) => <div key={item.localId} className="flex max-w-full items-center gap-1.5 rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-1 text-[9px]"><FileText size={11} className={item.status === "error" ? "text-amber-600" : "text-muted-foreground"} /><span className="max-w-40 truncate">{item.name}</span><span className="text-muted-foreground">{item.status === "uploading" ? `${item.progress}%` : item.status === "ready" ? "ready" : "failed"}</span><button type="button" onClick={() => void removeAttachment(item)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${item.name}`}><X size={11} /></button>{item.error ? <span className="hidden text-amber-700 sm:inline">{item.error}</span> : null}</div>)}{!messages.some((item) => item.role === "user") && !attachments.length && suggestions.map((item) => <button key={item} type="button" onClick={() => setInput(item)} className="rounded-md border border-foreground/10 px-2.5 py-1.5 text-left text-[11px] text-muted-foreground hover:border-foreground/35 hover:text-foreground">{item}<ArrowUpRight size={11} className="ml-1.5 inline" /></button>)}</div><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void send(); } }} placeholder={status === "offline" ? "Connect the Chusky backend to start chatting…" : attachments.some((item) => item.status === "uploading") ? "Uploading attachment…" : "Ask Chusky anything…"} rows={3} disabled={!thread || Boolean(controller)} className="w-full resize-none bg-transparent px-3 pt-3 text-xs leading-5 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed" /><div className="flex items-center justify-between px-2.5 pb-2.5 pt-1.5"><div className="flex items-center gap-1"><button type="button" onClick={() => fileInputRef.current?.click()} disabled={!thread || Boolean(controller) || attachments.length >= 5} className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach a file"><Paperclip size={15} /></button><span className="ml-1 hidden text-[9px] text-muted-foreground sm:inline">Images, PDFs, text, audio, and MP4 · 25 MB each</span></div><div className="flex items-center gap-2"><span className="hidden font-mono text-[9px] text-muted-foreground sm:inline">⌘ ↵ to send</span>{controller ? <button type="button" onClick={() => controller.abort()} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background" aria-label="Stop response"><Square size={12} fill="currentColor" /></button> : <button type="button" onClick={() => void send()} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-40" disabled={(!input.trim() && !attachments.some((item) => item.status === "ready")) || !thread || attachments.some((item) => item.status === "uploading")} aria-label="Send message"><ArrowUp size={15} /></button>}</div></div></div></div>
          </div>
        </div>

        {showContext && <aside className="hidden border-l border-foreground/10 bg-background xl:block"><div className="border-b border-foreground/10 px-5 py-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Context</p><button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Context options"><MoreHorizontal size={16} /></button></div><h2 className="mt-4 font-display text-2xl">Your tools, close at hand.</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">This workspace uses the authenticated Chusky session and server-side run API.</p></div><div className="space-y-6 p-5"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Verified channels</p><div className="space-y-2">{account?.channels.length ? account.channels.map((channel) => <div key={`${channel.provider}-${channel.externalUserId}`} className="flex items-center justify-between border border-foreground/10 px-3 py-2.5 text-xs"><span className="flex min-w-0 items-center gap-2"><FileText size={14} /><span className="truncate">{channel.displayName || channel.provider}</span></span><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /></div>) : <p className="border border-dashed border-foreground/15 px-3 py-3 text-xs leading-relaxed text-muted-foreground">No verified channels yet. Chusky can still work in this private web conversation.</p>}</div></div><div className="border-t border-foreground/10 pt-5"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Safety</p><div className="space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><ShieldCheck size={14} className="shrink-0 text-emerald-600" /> Approvals stay one-time and server-bound</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> R2 uploads are verified before the agent can read them</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Stream can be stopped per run</p></div></div></div></aside>}
      </div>
    </div>
  );
}

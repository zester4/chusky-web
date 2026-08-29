"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Github,
  History,
  LoaderCircle,
  Mail,
  Mic,
  MoreHorizontal,
  Paperclip,
  PanelRight,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  Zap,
} from "lucide-react";
import { chuskyApi, type RunStreamEvent, type Thread } from "@/lib/chusky-api";

type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  pending?: boolean;
  tool?: string;
  approval?: { id: string; toolSlug: string; expiresAt: string; deciding?: boolean };
};

const suggestions = [
  "Summarize my unread emails",
  "Plan my priorities for today",
  "Review open GitHub issues",
];

export function ChatPage() {
  const [thread, setThread] = useState<Thread>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi Morgan. I’m ready to help you connect your tools, investigate a question, or move a task forward. What are we working on?",
      time: "Now",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [showContext, setShowContext] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [controller, setController] = useState<AbortController>();
  const endRef = useRef<HTMLDivElement>(null);

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

  const decideApproval = async (approvalId: string, decision: "approve" | "deny") => {
    updateLastAssistant({ approval: { id: approvalId, toolSlug: "", expiresAt: "", deciding: true } });
    try {
      const run = await chuskyApi.approvals.decide(approvalId, decision);
      updateLastAssistant({ text: decision === "approve" ? (run.output || "Approved and completed.") : "Action denied.", approval: undefined, pending: false });
    } catch {
      updateLastAssistant({ text: "That approval could not be completed. It may have expired or already been decided.", approval: undefined, pending: false });
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !thread || controller) return;
    const abort = new AbortController();
    setController(abort);
    setInput("");
    setMessages((current) => [...current, { role: "user", text, time: "Now" }, { role: "assistant", text: "", pending: true }]);
    try {
      for await (const event of chuskyApi.runs.stream(thread.id, text, abort.signal)) {
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
    <div className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)] flex-col bg-[#f7f7f4] sm:-mx-6 lg:-mx-10 lg:-my-10">
      <header className="flex min-h-14 items-center justify-between border-b border-foreground/10 bg-background px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Bot size={16} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h1 className="truncate text-sm font-medium">{thread ? "New conversation" : "Connecting to Chusky"}</h1><span className={status === "ready" ? "rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-800" : "rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-800"}>{status === "ready" ? "Live" : status === "offline" ? "Offline" : "Connecting"}</span></div>
            <p className="truncate text-[11px] text-muted-foreground">Private workspace · backed by your Chusky session</p>
          </div>
        </div>
        <div className="flex items-center gap-1"><button type="button" className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground sm:flex"><History size={13} /> History</button><button type="button" onClick={() => setShowContext((value) => !value)} className="flex items-center gap-1.5 border border-foreground/10 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-foreground/30 hover:text-foreground"><PanelRight size={13} /><span className="hidden sm:inline">Context</span></button><button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Chat settings"><SlidersHorizontal size={15} /></button></div>
      </header>

      <div className={showContext ? "grid flex-1 xl:grid-cols-[minmax(0,1fr)_280px]" : "flex-1"}>
        <div className="flex min-w-0 flex-col">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
            <div className="mb-8 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Agent workspace</p><p className="mt-2 text-xs text-muted-foreground">Ask naturally. Chusky streams progress and keeps durable run state.</p></div><div className="relative"><button type="button" onClick={() => setModelOpen((value) => !value)} className="flex items-center gap-2 border border-foreground/10 bg-background px-3 py-2 text-xs hover:border-foreground/30"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> DeepSeek V4 <ChevronDown size={13} /></button>{modelOpen && <div className="absolute right-0 top-11 z-10 w-44 border border-foreground/10 bg-background p-1 text-xs shadow-lg"><button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-foreground/5">DeepSeek V4 <Check size={13} /></button><button type="button" className="w-full px-3 py-2 text-left text-muted-foreground hover:bg-foreground/5">GPT-5.6 Luna</button></div>}</div></div>

            <div className="space-y-8">
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={item.role === "user" ? "ml-auto max-w-2xl" : "flex gap-4"}>
                  {item.role === "assistant" && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">C</div>}
                  <div className={item.role === "user" ? "bg-foreground px-4 py-3 text-sm leading-6 text-background" : "min-w-0"}>
                    {item.role === "assistant" && <div className="mb-2 flex items-baseline gap-3"><p className="text-sm font-medium">Chusky</p><span className="font-mono text-[10px] text-muted-foreground">{item.time || "Now"}</span></div>}
                    {item.pending && !item.text ? <p className="flex items-center gap-2 border border-foreground/10 bg-background px-4 py-3 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> {item.tool ? `Using ${item.tool.replaceAll("_", " ").toLowerCase()}…` : "Thinking through your request…"}</p> : <p className={item.role === "assistant" ? "max-w-2xl text-sm leading-7" : ""}>{item.text}</p>}
                    {item.tool && <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><Zap size={12} /> {item.tool.replaceAll("_", " ").toLowerCase()}</p>}
                    {item.approval && <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "approve")} className="rounded-full bg-foreground px-3 py-1.5 text-[11px] text-background disabled:opacity-50">Approve</button><button type="button" disabled={item.approval.deciding} onClick={() => void decideApproval(item.approval!.id, "deny")} className="rounded-full border border-foreground/15 px-3 py-1.5 text-[11px] disabled:opacity-50">Deny</button></div>}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="mt-auto pt-12"><div className="mb-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2.5 py-1.5 text-[10px] text-muted-foreground"><Paperclip size={11} /> Attach a file</span><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2.5 py-1.5 text-[10px] text-muted-foreground"><Zap size={11} /> Use connected apps</span><span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-2.5 py-1.5 text-[10px] text-muted-foreground"><Terminal size={11} /> Run in workspace</span></div><div className="border border-foreground/15 bg-background shadow-sm focus-within:border-foreground/40"><div className="flex flex-wrap gap-2 px-4 pt-4">{!messages.some((item) => item.role === "user") && suggestions.map((item) => <button key={item} type="button" onClick={() => setInput(item)} className="border border-foreground/10 px-3 py-2 text-left text-xs text-muted-foreground hover:border-foreground/35 hover:text-foreground">{item}<ArrowUpRight size={12} className="ml-2 inline" /></button>)}</div><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void send(); } }} placeholder={status === "offline" ? "Connect the Chusky backend to start chatting…" : "Ask Chusky anything…"} rows={3} disabled={!thread || Boolean(controller)} className="w-full resize-none bg-transparent px-4 pt-4 text-sm leading-6 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed" /><div className="flex items-center justify-between px-3 pb-3 pt-2"><div className="flex items-center gap-1"><button type="button" className="p-2 text-muted-foreground hover:text-foreground" aria-label="Attach file"><Paperclip size={16} /></button><button type="button" className="p-2 text-muted-foreground hover:text-foreground" aria-label="Record voice message"><Mic size={16} /></button><span className="ml-2 hidden text-[10px] text-muted-foreground sm:inline">Chusky asks before risky actions</span></div><div className="flex items-center gap-3"><span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">⌘ ↵ to send</span>{controller ? <button type="button" onClick={() => controller.abort()} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background" aria-label="Stop response"><Square size={13} fill="currentColor" /></button> : <button type="button" onClick={() => void send()} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-40" disabled={!input.trim() || !thread} aria-label="Send message"><Send size={15} /></button>}</div></div></div></div>
          </div>
        </div>

        {showContext && <aside className="hidden border-l border-foreground/10 bg-background xl:block"><div className="border-b border-foreground/10 px-5 py-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Context</p><button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Context options"><MoreHorizontal size={16} /></button></div><h2 className="mt-4 font-display text-2xl">Your tools, close at hand.</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">This workspace uses the authenticated Chusky session and server-side run API.</p></div><div className="space-y-6 p-5"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Connected apps</p><div className="space-y-2"><div className="flex items-center justify-between border border-foreground/10 px-3 py-2.5 text-xs"><span className="flex items-center gap-2"><Github size={14} /> GitHub</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></div><div className="flex items-center justify-between border border-foreground/10 px-3 py-2.5 text-xs"><span className="flex items-center gap-2"><Mail size={14} /> Gmail</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></div><div className="flex items-center justify-between border border-foreground/10 px-3 py-2.5 text-xs"><span className="flex items-center gap-2"><FileText size={14} /> Notion</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></div></div></div><div className="border-t border-foreground/10 pt-5"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Safety</p><div className="space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><ShieldCheck size={14} className="shrink-0 text-emerald-600" /> Approvals stay one-time and server-bound</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Stream can be stopped per run</p></div></div></div></aside>}
      </div>
    </div>
  );
}

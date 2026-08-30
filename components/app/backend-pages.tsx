"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, LoaderCircle, RefreshCw } from "lucide-react";
import { chuskyApi } from "@/lib/chusky-api";
import type { Page, Task, Thread, Usage } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { InputDialog } from "./input-dialog";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function LoadingState({ label = "Loading your workspace…" }: { label?: string }) {
  return <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground"><LoaderCircle size={15} className="animate-spin" /> {label}</div>;
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
  return <Card className="flex flex-col items-start gap-3 p-4"><Status tone="amber">Backend unavailable</Status><p className="max-w-xl text-xs leading-relaxed text-muted-foreground">The dashboard is ready for the Chusky API, but the local service did not respond. Start the backend and retry.</p><Button secondary onClick={onRetry}><RefreshCw size={13} /> Retry</Button></Card>;
}

function ThreadRows({ threads }: { threads: Thread[] }) {
  if (!threads.length) return <p className="p-4 text-xs text-muted-foreground sm:p-5">No conversations yet. Start one from Chat.</p>;
  return <div>{threads.map((thread) => <a href={`/app/chat?thread=${encodeURIComponent(thread.id)}`} key={thread.id} className="flex min-w-0 items-center justify-between gap-2.5 border-b border-foreground/10 px-3.5 py-2.5 last:border-0 hover:bg-foreground/[0.03] sm:px-4 sm:py-3"><div className="min-w-0"><p className="truncate text-xs font-medium">{String(thread.metadata.title || thread.metadata.prompt || "Untitled conversation")}</p><p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">Updated {formatDate(thread.updatedAt)}</p></div><ArrowUpRight size={13} className="shrink-0 text-muted-foreground" /></a>)}</div>;
}

export function BackendDashboardPage() {
  const [data, setData] = useState<{ usage: Usage; threads: Page<Thread> }>();
  const [offline, setOffline] = useState(false);
  const load = async () => { setOffline(false); try { const [usage, threads] = await Promise.all([chuskyApi.usage.get(), chuskyApi.threads.list()]); setData({ usage, threads }); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  return <><PageHeading eyebrow="Workspace overview" title="Your agent at a glance." description="Live activity and usage from your authenticated Chusky workspace." action={<Button onClick={() => { window.location.href = "/app/chat"; }}>New conversation</Button>} />{offline ? <OfflineState onRetry={() => void load()} /> : !data ? <LoadingState /> : <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Messages" value={data.usage.messages.toLocaleString()} detail="This billing period" /><Metric label="Active runs" value={data.usage.runs.active.toLocaleString()} detail={`${data.usage.runs.count.toLocaleString()} total runs`} /><Metric label="Tasks" value={data.usage.tasks.count.toLocaleString()} detail="Tracked by Chusky" /><Metric label="File storage" value={`${data.usage.files.available.toLocaleString()} bytes`} detail={`${data.usage.files.count} uploaded files`} /></div><Card className="mt-6"><div className="border-b border-foreground/10 p-4"><h2 className="font-display text-xl">Recent conversations</h2><p className="mt-1 text-[11px] text-muted-foreground">Synced from the Chusky Developer API</p></div><ThreadRows threads={data.threads.data.slice(0, 5)} /></Card></>}</>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <Card className="p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></Card>; }

export function BackendConversationsPage() {
  const [page, setPage] = useState<Page<Thread>>(); const [offline, setOffline] = useState(false); const [busy, setBusy] = useState<string>(); const [deleteThread, setDeleteThread] = useState<Thread>(); const [renameThread, setRenameThread] = useState<Thread>();
  const load = async () => { setOffline(false); try { setPage(await chuskyApi.threads.list()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  const rename = async (thread: Thread, title: string) => { setBusy(thread.id); try { const next = await chuskyApi.threads.update(thread.id, { title }); setPage((current) => current && { ...current, data: current.data.map((item) => item.id === next.id ? next : item) }); } finally { setBusy(undefined); } };
  const archive = async (thread: Thread) => { setBusy(thread.id); try { await chuskyApi.threads.update(thread.id, { archived: true }); setPage((current) => current && { ...current, data: current.data.filter((item) => item.id !== thread.id) }); } finally { setBusy(undefined); } };
  const remove = async (thread: Thread) => { setBusy(thread.id); try { await chuskyApi.threads.remove(thread.id); setPage((current) => current && { ...current, data: current.data.filter((item) => item.id !== thread.id) }); } finally { setBusy(undefined); } };
  return <><PageHeading eyebrow="Your work" title="Conversations" description="Every request, result, and tool run in one searchable place." />{offline ? <OfflineState onRetry={() => void load()} /> : !page ? <LoadingState /> : <Card>{page.data.length ? page.data.map((thread) => <div key={thread.id} className="flex min-w-0 flex-col gap-2.5 border-b border-foreground/10 px-3.5 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-3 sm:px-4"><div className="min-w-0 flex-1"><a href={`/app/chat?thread=${encodeURIComponent(thread.id)}`} className="block hover:underline"><p className="truncate text-xs font-medium">{String(thread.metadata.title || thread.metadata.prompt || "Untitled conversation")}</p><p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">Updated {formatDate(thread.updatedAt)}</p></a></div><div className="flex flex-wrap gap-x-3 gap-y-1.5"><button type="button" disabled={busy === thread.id} onClick={() => setRenameThread(thread)} className="text-[10px] text-muted-foreground hover:text-foreground">Rename</button><button type="button" disabled={busy === thread.id} onClick={() => void archive(thread)} className="text-[10px] text-muted-foreground hover:text-foreground">Archive</button><button type="button" disabled={busy === thread.id} onClick={() => setDeleteThread(thread)} className="text-[10px] text-amber-700 hover:text-amber-900">Delete</button></div></div>) : <p className="p-4 text-xs text-muted-foreground">No conversations yet.</p>}</Card>}{renameThread && <InputDialog open={Boolean(renameThread)} onOpenChange={(open) => !open && setRenameThread(undefined)} title="Rename conversation" description="Give this conversation a short, recognizable name." label="Conversation title" defaultValue={String(renameThread.metadata.title || "")} placeholder="Project kickoff" submitLabel="Save name" onSubmit={(title) => { const thread = renameThread; setRenameThread(undefined); return rename(thread, title); }} />}{deleteThread && <ConfirmDialog open={Boolean(deleteThread)} onOpenChange={(open) => !open && setDeleteThread(undefined)} title={`Delete ${String(deleteThread.metadata.title || "this conversation")}?`} description="This conversation and its stored runs will be permanently removed." confirmLabel="Delete conversation" destructive onConfirm={() => { const thread = deleteThread; setDeleteThread(undefined); return remove(thread); }} />}</>;
}

export function BackendTasksPage() {
  const [page, setPage] = useState<Page<Task>>(); const [offline, setOffline] = useState(false); const [selected, setSelected] = useState<Task>(); const [busy, setBusy] = useState<string>();
  const load = async () => { setOffline(false); try { setPage(await chuskyApi.tasks.list()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  const act = async (task: Task, action: "retry" | "cancel") => { setBusy(task.id); try { const next = action === "retry" ? await chuskyApi.tasks.retry(task.id) : await chuskyApi.tasks.cancel(task.id); setPage((current) => current && { ...current, data: current.data.map((item) => item.id === next.id ? next : item) }); setSelected(next); } finally { setBusy(undefined); } };
  return <><PageHeading eyebrow="Execution" title="Tasks" description="Long-running work managed by Chusky." />{offline ? <OfflineState onRetry={() => void load()} /> : !page ? <LoadingState /> : <Card>{page.data.length ? page.data.map((task) => <div key={task.id} className="border-b border-foreground/10 px-3.5 py-3 last:border-0 sm:px-4"><button type="button" onClick={() => void chuskyApi.tasks.get(task.id).then(setSelected)} className="w-full min-w-0 text-left"><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium">{task.title}</p><p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">Updated {formatDate(task.updatedAt)}</p></div><Status tone={task.status === "failed" ? "amber" : task.status === "completed" ? "green" : "gray"}>{task.status}</Status></div>{task.checkpoint && <p className="mt-2 break-words text-[11px] text-muted-foreground">{task.checkpoint}</p>}</button>{selected?.id === task.id && <div className="mt-3 border-t border-foreground/10 pt-3 text-[11px] text-muted-foreground"><p className="break-words">{task.objective}</p>{task.nextAction && <p className="mt-2 break-words"><span className="font-medium text-foreground">Next:</span> {task.nextAction}</p>}{task.error && <p className="mt-2 break-words text-amber-700">{task.error}</p>}<div className="mt-3 flex flex-wrap gap-2">{["failed", "blocked", "cancelled"].includes(task.status) && <Button secondary disabled={busy === task.id} onClick={() => void act(task, "retry")}>{busy === task.id ? "Working…" : "Retry"}</Button>}{!["completed", "cancelled"].includes(task.status) && <Button secondary disabled={busy === task.id} onClick={() => void act(task, "cancel")}>Cancel</Button>}</div></div>}</div>) : <p className="p-4 text-xs text-muted-foreground">No tasks yet.</p>}</Card>}</>;
}

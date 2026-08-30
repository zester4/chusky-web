"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, LoaderCircle, RefreshCw } from "lucide-react";
import { chuskyApi } from "@/lib/chusky-api";
import type { Page, Task, Thread, Usage } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

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
  if (!threads.length) return <p className="p-5 text-sm text-muted-foreground">No conversations yet. Start one from Chat.</p>;
  return <div>{threads.map((thread) => <div key={thread.id} className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-medium">{String(thread.metadata.title || thread.metadata.prompt || "Untitled conversation")}</p><p className="mt-1 text-[11px] text-muted-foreground">Updated {formatDate(thread.updatedAt)}</p></div><ArrowUpRight size={13} className="shrink-0 text-muted-foreground" /></div>)}</div>;
}

export function BackendDashboardPage() {
  const [data, setData] = useState<{ usage: Usage; threads: Page<Thread> }>();
  const [offline, setOffline] = useState(false);
  const load = async () => { setOffline(false); try { const [usage, threads] = await Promise.all([chuskyApi.usage.get(), chuskyApi.threads.list()]); setData({ usage, threads }); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  return <><PageHeading eyebrow="Workspace overview" title="Your agent at a glance." description="Live activity and usage from your authenticated Chusky workspace." action={<Button onClick={() => { window.location.href = "/app/chat"; }}>New conversation</Button>} />{offline ? <OfflineState onRetry={() => void load()} /> : !data ? <LoadingState /> : <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Messages" value={data.usage.messages.toLocaleString()} detail="This billing period" /><Metric label="Active runs" value={data.usage.runs.active.toLocaleString()} detail={`${data.usage.runs.count.toLocaleString()} total runs`} /><Metric label="Tasks" value={data.usage.tasks.count.toLocaleString()} detail="Tracked by Chusky" /><Metric label="File storage" value={`${data.usage.files.available.toLocaleString()} bytes`} detail={`${data.usage.files.count} uploaded files`} /></div><Card className="mt-6"><div className="border-b border-foreground/10 p-4"><h2 className="font-display text-xl">Recent conversations</h2><p className="mt-1 text-[11px] text-muted-foreground">Synced from the Chusky Developer API</p></div><ThreadRows threads={data.threads.data.slice(0, 5)} /></Card></>}
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <Card className="p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></Card>; }

export function BackendConversationsPage() {
  const [page, setPage] = useState<Page<Thread>>(); const [offline, setOffline] = useState(false);
  const load = async () => { setOffline(false); try { setPage(await chuskyApi.threads.list()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  return <><PageHeading eyebrow="Your work" title="Conversations" description="Every request, result, and tool run in one searchable place." />{offline ? <OfflineState onRetry={() => void load()} /> : !page ? <LoadingState /> : <Card><ThreadRows threads={page.data} /></Card>}</>;
}

export function BackendTasksPage() {
  const [page, setPage] = useState<Page<Task>>(); const [offline, setOffline] = useState(false);
  const load = async () => { setOffline(false); try { setPage(await chuskyApi.tasks.list()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  return <><PageHeading eyebrow="Execution" title="Tasks" description="Long-running work managed by Chusky." />{offline ? <OfflineState onRetry={() => void load()} /> : !page ? <LoadingState /> : <Card>{page.data.length ? page.data.map((task) => <div key={task.id} className="border-b border-foreground/10 px-4 py-3 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium">{task.title}</p><p className="mt-1 text-[11px] text-muted-foreground">Updated {formatDate(task.updatedAt)}</p></div><Status tone={task.status === "failed" ? "amber" : task.status === "completed" ? "green" : "gray"}>{task.status}</Status></div>{task.checkpoint && <p className="mt-2 text-[11px] text-muted-foreground">{task.checkpoint}</p>}</div>) : <p className="p-4 text-xs text-muted-foreground">No tasks yet.</p>}</Card>}</>;
}

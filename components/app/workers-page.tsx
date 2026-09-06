"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Square, Users } from "lucide-react";
import { chuskyApi, type Worker } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

const activeStatuses = new Set(["queued", "running", "requires_approval", "requires_tool_request"]);
const tone = (status: string): "green" | "amber" | "gray" => ["success", "completed"].includes(status) ? "green" : ["failed", "blocked", "requires_approval", "requires_tool_request"].includes(status) ? "amber" : "gray";
const date = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function WorkersPage() {
  const [items, setItems] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<Worker>();
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const load = async () => { setLoading(true); setError(undefined); try { setItems((await chuskyApi.workers.list(filter === "all" ? undefined : filter)).data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load workers."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [filter]);
  useEffect(() => { const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [filter]);
  const cancel = async (item: Worker) => { setBusy(item.id); try { const updated = await chuskyApi.workers.cancel(item.id); setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate)); setSelected(updated); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not cancel worker."); } finally { setBusy(undefined); } };
  return <>
    <PageHeading eyebrow="Delegation" title="Workers" description="See every specialist Chusky has delegated to, the objective it received, its budget, and its current state." action={<Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button>} />
    <div className="mb-4 flex flex-wrap gap-1.5">{["all", "queued", "running", "requires_approval", "success", "failed", "cancelled"].map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-2.5 py-1.5 text-[10px] ${filter === value ? "border-foreground bg-foreground text-background" : "border-foreground/15 text-muted-foreground hover:border-foreground/40"}`}>{value.replaceAll("_", " ")}</button>)}</div>
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">{error}</Card>}
    <Card>{loading && !items.length ? <div className="flex items-center gap-2 p-5 text-xs text-muted-foreground"><LoaderCircle size={15} className="animate-spin" /> Loading durable workers…</div> : items.length ? items.map((item) => <div key={item.id} className="border-b border-foreground/10 p-4 last:border-0"><div role="button" tabIndex={0} onClick={() => setSelected(selected?.id === item.id ? undefined : item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(selected?.id === item.id ? undefined : item); } }} className="w-full cursor-pointer text-left"><div className="flex min-w-0 items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/10"><Users size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{item.worker}</p><Status tone={tone(item.status)}>{item.status.replaceAll("_", " ")}</Status></div><p className="mt-1.5 break-words text-xs text-muted-foreground">{item.objective}</p><p className="mt-1.5 font-mono text-[9px] text-muted-foreground">{item.id} · started {date(item.timestamp)}</p></div>{activeStatuses.has(item.status) && <Button secondary disabled={busy === item.id} onClick={() => void cancel(item)}>{busy === item.id ? <LoaderCircle size={12} className="animate-spin" /> : <Square size={12} />} Cancel</Button>}</div></div>{selected?.id === item.id && <div className="mt-4 grid gap-3 border-t border-foreground/10 pt-4 text-[11px] sm:grid-cols-2"><Detail label="Supervisor" value={item.from || "chusky"} /><Detail label="Expected output" value={item.expectedOutput || "Not specified"} /><Detail label="Task" value={item.taskId || "No linked task"} /><Detail label="Workflow" value={item.workflowRunId || "No workflow id"} /><div className="sm:col-span-2"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Delegation contract</p><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words border border-foreground/10 bg-foreground/[0.03] p-2.5 font-mono text-[10px] leading-5">{JSON.stringify(item.delegation || item.context || {}, null, 2)}</pre></div></div>}</div>) : <p className="p-5 text-xs text-muted-foreground">No workers match this filter yet.</p>}</Card>
  </>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="border-b border-foreground/10 pb-2.5"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-xs">{value}</p></div>; }

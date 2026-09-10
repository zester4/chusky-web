"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Download, FileArchive, FileText, LoaderCircle, Play, RefreshCw, Search, Square, Users, Video, Wrench, X } from "lucide-react";
import { chuskyApi, type Artifact, type ChannelConnection, type Delivery, type Skill, type SkillFile, type Tool, type VideoJob, type Webhook, type Worker } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

const durations = ["5m", "30m", "1h", "3h", "6h", "3d", "1w"] as const;
const capabilityTabs = [
  ["tools", "Tools"], ["skills", "Skills"], ["workers", "Workers"], ["artifacts", "Artifacts"],
  ["media", "Media"], ["channels", "Channels"], ["webhooks", "Webhooks"],
] as const;
type CapabilityTab = (typeof capabilityTabs)[number][0];
const date = (value?: string) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const tone = (status: string): "green" | "amber" | "gray" => ["completed", "success", "delivered", "active", "connected"].includes(status.toLowerCase()) ? "green" : ["failed", "blocked", "requires_approval"].includes(status.toLowerCase()) ? "amber" : "gray";

export function CapabilitiesPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState<{ item: Skill; files: SkillFile[]; selected?: SkillFile }>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [worker, setWorker] = useState("maya");
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState<(typeof durations)[number]>("30m");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDestination, setVideoDestination] = useState<VideoJob["destination"]>("telegram");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [activeTab, setActiveTab] = useState<CapabilityTab>("tools");

  const load = async (search = query) => {
    setError(undefined);
    const results = await Promise.allSettled([
      chuskyApi.tools.list(search), chuskyApi.skills.list(search), chuskyApi.artifacts.list(), chuskyApi.workers.list(),
      chuskyApi.videos.list(), chuskyApi.channels.list(), chuskyApi.deliveries.list(), chuskyApi.webhooks.list(),
    ]);
    const [toolsResult, skillsResult, artifactsResult, workersResult, videosResult, channelsResult, deliveriesResult, webhooksResult] = results;
    if (toolsResult.status === "fulfilled") setTools(toolsResult.value.data);
    if (skillsResult.status === "fulfilled") setSkills(skillsResult.value.data);
    if (artifactsResult.status === "fulfilled") setArtifacts(artifactsResult.value.data);
    if (workersResult.status === "fulfilled") setWorkers(workersResult.value.data);
    if (videosResult.status === "fulfilled") setVideos(videosResult.value.data);
    if (channelsResult.status === "fulfilled") setChannels(channelsResult.value.data);
    if (deliveriesResult.status === "fulfilled") setDeliveries(deliveriesResult.value.data);
    if (webhooksResult.status === "fulfilled") setWebhooks(webhooksResult.value.data);
    if (results.every((result) => result.status === "rejected")) setError("The capabilities API is unavailable. Start the backend and retry.");
  };
  useEffect(() => { void load(""); }, []);

  const openSkill = async (item: Skill) => {
    setBusy(`skill:${item.name}`); setError(undefined);
    try { const files = (await chuskyApi.skills.files(item.name)).data; setSkill({ item, files, selected: files.find((file) => file.path === "SKILL.md") }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this skill."); }
    finally { setBusy(undefined); }
  };
  const readSkillFile = async (file: SkillFile) => {
    if (!skill) return;
    setBusy(`file:${file.path}`);
    try { setSkill({ ...skill, selected: await chuskyApi.skills.read(skill.item.name, file.path) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this skill file."); }
    finally { setBusy(undefined); }
  };
  const createWorker = async () => {
    if (!objective.trim()) return;
    setBusy("worker:create"); setError(undefined);
    try { const created = await chuskyApi.workers.create({ worker, objective: objective.trim(), duration, approvalPolicy: "require_chusky_approval", maxToolCalls: 100 }); setWorkers((items) => [created, ...items]); setObjective(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start the worker."); }
    finally { setBusy(undefined); }
  };
  const cancelWorker = async (item: Worker) => { setBusy(`worker:${item.id}`); try { const updated = await chuskyApi.workers.cancel(item.id); setWorkers((items) => items.map((candidate) => candidate.id === updated.id ? updated : candidate)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not cancel the worker."); } finally { setBusy(undefined); } };
  const createVideo = async () => {
    if (!videoPrompt.trim()) return;
    setBusy("video:create"); setError(undefined);
    try { const created = await chuskyApi.videos.create({ prompt: videoPrompt.trim(), destination: videoDestination }); setVideos((items) => [created, ...items]); setVideoPrompt(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not queue video generation."); }
    finally { setBusy(undefined); }
  };
  const cancelVideo = async (item: VideoJob) => { setBusy(`video:${item.id}`); try { const updated = await chuskyApi.videos.cancel(item.id); setVideos((items) => items.map((candidate) => candidate.id === updated.id ? updated : candidate)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not cancel video generation."); } finally { setBusy(undefined); } };
  const createWebhook = async () => { if (!webhookUrl.trim()) return; setBusy("webhook:create"); setError(undefined); try { const created = await chuskyApi.webhooks.create(webhookUrl.trim()); setWebhooks((items) => [{ id: created.id, url: created.url, createdAt: created.createdAt }, ...items]); setWebhookUrl(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the webhook."); } finally { setBusy(undefined); } };
  const removeWebhook = async (item: Webhook) => { setBusy(`webhook:${item.id}`); try { await chuskyApi.webhooks.remove(item.id); setWebhooks((items) => items.filter((candidate) => candidate.id !== item.id)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove the webhook."); } finally { setBusy(undefined); } };
  const download = async (item: Artifact) => { setBusy(`artifact:${item.id}`); try { const blob = await chuskyApi.artifacts.download(item.id); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = item.name; anchor.style.display = "none"; document.body.appendChild(anchor); anchor.click(); window.setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1000); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download this artifact."); } finally { setBusy(undefined); } };

  return <>
    <PageHeading eyebrow="Agent control plane" title="Capabilities" description="Inspect the tools, skills, workers, media, artifacts, channels, and delivery state available to this account." action={<Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">{error}</Card>}
    <div className="mb-4 flex flex-col gap-2 sm:flex-row"><div className="flex min-h-9 flex-1 items-center gap-2 border border-foreground/15 bg-background px-2.5"><Search size={14} className="text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(query); }} placeholder="Search tools and skills" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button type="button" onClick={() => void load(query)} className="text-[10px] text-muted-foreground hover:text-foreground">Search</button></div></div>
    <div className="mb-4 flex min-w-0 gap-1 overflow-x-auto border-b border-foreground/10" role="tablist" aria-label="Capability categories">{capabilityTabs.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)} className={`shrink-0 border-b-2 px-3 py-2 text-[11px] transition-colors ${activeTab === value ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div>
    <style>{`[data-capabilities][data-active-tab="tools"] [data-capability-section]:not([data-capability-section="tools"]),[data-capabilities][data-active-tab="skills"] [data-capability-section]:not([data-capability-section="skills"]),[data-capabilities][data-active-tab="workers"] [data-capability-section]:not([data-capability-section="workers"]),[data-capabilities][data-active-tab="artifacts"] [data-capability-section]:not([data-capability-section="artifacts"]),[data-capabilities][data-active-tab="media"] [data-capability-section]:not([data-capability-section="media"]),[data-capabilities][data-active-tab="channels"] [data-capability-section]:not([data-capability-section="channels"]),[data-capabilities][data-active-tab="webhooks"] [data-capability-section]:not([data-capability-section="webhooks"]){display:none}`}</style>
    <div data-capabilities data-active-tab={activeTab} className="grid gap-4 xl:grid-cols-2">
      <Section icon={<Wrench size={15} />} title="Tools" detail={`${tools.length} available · native and Composio actions`}><div className="max-h-80 overflow-y-auto">{tools.length ? tools.map((item) => <div key={`${item.source}-${item.slug}`} className="flex min-w-0 items-start gap-2.5 border-b border-foreground/10 p-3 last:border-0"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><div className="min-w-0 flex-1"><p className="break-all font-mono text-[10px] font-medium">{item.slug}</p><p className="mt-1 break-words text-[11px] text-muted-foreground">{item.description}</p></div><span className="shrink-0 text-[9px] text-muted-foreground">{item.toolkit || item.source}</span></div>) : <Empty>Search to load connected Composio actions, or start the backend.</Empty>}</div></Section>
      <Section icon={<FileText size={15} />} title="Skills" detail={`${skills.length} installed · nested files are readable`}><div className="max-h-80 overflow-y-auto">{skills.length ? skills.map((item) => <button key={item.name} type="button" onClick={() => void openSkill(item)} className="flex w-full min-w-0 items-start gap-2.5 border-b border-foreground/10 p-3 text-left last:border-0 hover:bg-foreground/[0.03]"><FileText size={14} className="mt-0.5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block text-xs font-medium">{item.name}</span><span className="mt-1 block break-words text-[11px] text-muted-foreground">{item.description}</span></span><span className="shrink-0 text-[9px] text-muted-foreground">Read</span></button>) : <Empty>No installed skills matched.</Empty>}</div></Section>
      <Section icon={<Users size={15} />} title="Durable workers" detail="Supervisor-managed sub-agent runs with explicit budgets"><div className="border-b border-foreground/10 p-3"><div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]"><select value={worker} onChange={(event) => setWorker(event.target.value)} className="min-h-9 border border-foreground/15 bg-background px-2 text-xs"><option value="maya">Maya · research</option><option value="leo">Leo · creative</option><option value="lucas">Lucas · engineering</option><option value="sasha">Sasha · operations</option></select><input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="What should the worker complete?" className="min-h-9 min-w-0 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none" /><div className="flex gap-2"><select value={duration} onChange={(event) => setDuration(event.target.value as (typeof durations)[number])} className="min-h-9 border border-foreground/15 bg-background px-2 text-xs">{durations.map((item) => <option key={item}>{item}</option>)}</select><Button disabled={!objective.trim() || busy === "worker:create"} onClick={() => void createWorker()}>{busy === "worker:create" ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />} Start</Button></div></div></div><div className="max-h-72 overflow-y-auto">{workers.length ? workers.map((item) => <div key={item.id} className="border-b border-foreground/10 p-3 last:border-0"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{item.worker}</p><Status tone={tone(item.status)}>{item.status}</Status></div><p className="mt-1 break-words text-[11px] text-muted-foreground">{item.objective}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.id} · {date(item.timestamp)}</p></div>{!["success", "completed", "cancelled", "failed"].includes(item.status) && <Button secondary disabled={busy === `worker:${item.id}`} onClick={() => void cancelWorker(item)}>{busy === `worker:${item.id}` ? "…" : <Square size={12} />} Cancel</Button>}</div></div>) : <Empty>No durable workers yet.</Empty>}</div></Section>
      <Section icon={<FileArchive size={15} />} title="Artifacts" detail="Download generated PDF, DOCX, PPTX, sheets, images, video, and ZIP files"><div className="max-h-72 overflow-y-auto">{artifacts.length ? artifacts.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2.5 border-b border-foreground/10 p-3 last:border-0"><FileText size={14} className="shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.name}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.type} · {Math.ceil(item.size / 1024)} KB · {date(item.updatedAt)}</p></div><Button secondary disabled={busy === `artifact:${item.id}`} onClick={() => void download(item)}><Download size={12} /> Download</Button></div>) : <Empty>No generated artifacts are linked to this account.</Empty>}</div></Section>
      <Section icon={<Video size={15} />} title="Video generation" detail="Queue media for Telegram, Daytona, or both"><div className="border-b border-foreground/10 p-3"><div className="flex flex-col gap-2 sm:flex-row"><input value={videoPrompt} onChange={(event) => setVideoPrompt(event.target.value)} placeholder="Describe the video to generate" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none" /><select value={videoDestination} onChange={(event) => setVideoDestination(event.target.value as VideoJob["destination"])} className="min-h-9 border border-foreground/15 bg-background px-2 text-xs"><option value="telegram">Telegram</option><option value="daytona">Daytona</option><option value="both">Both</option></select><Button disabled={!videoPrompt.trim() || busy === "video:create"} onClick={() => void createVideo()}>{busy === "video:create" ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />} Queue</Button></div></div><div className="max-h-72 overflow-y-auto">{videos.length ? videos.map((item) => <div key={item.id} className="border-b border-foreground/10 p-3 last:border-0"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{item.prompt}</p><Status tone={tone(item.status)}>{item.status}</Status></div><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.destination} · {date(item.createdAt)}</p>{item.error && <p className="mt-1 text-[11px] text-amber-700">{item.error}</p>}</div>{["queued", "running"].includes(item.status) && <Button secondary disabled={busy === `video:${item.id}`} onClick={() => void cancelVideo(item)}><X size={12} /> Cancel</Button>}</div></div>) : <Empty>No video jobs yet.</Empty>}</div></Section>
      <Section icon={<RefreshCw size={15} />} title="Channels & delivery" detail={`${channels.length} verified channel${channels.length === 1 ? "" : "s"} · ${deliveries.length} recent deliveries`}><div className="grid gap-3 p-3 sm:grid-cols-2"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Verified channels</p>{channels.length ? channels.map((item) => <div key={`${item.provider}-${item.externalUserId}`} className="mb-1.5 flex items-center justify-between gap-2 border border-foreground/10 px-2.5 py-2 text-[11px]"><span className="truncate">{item.displayName || item.provider}</span><Status>Connected</Status></div>) : <p className="text-[11px] text-muted-foreground">No verified channels.</p>}</div><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Recent delivery</p>{deliveries.slice(0, 5).map((item) => <div key={item.id} className="mb-1.5 border border-foreground/10 px-2.5 py-2"><div className="flex justify-between gap-2 text-[11px]"><span>{item.provider} · {item.kind}</span><Status tone={tone(item.status)}>{item.status}</Status></div>{item.lastError && <p className="mt-1 truncate text-[10px] text-amber-700">{item.lastError}</p>}</div>)}{!deliveries.length && <p className="text-[11px] text-muted-foreground">No deliveries yet.</p>}</div></div></Section>
      <Section icon={<RefreshCw size={15} />} title="Webhooks" detail="Manage server callbacks for run and delivery events"><div className="flex flex-col gap-2 border-b border-foreground/10 p-3 sm:flex-row"><input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.com/chusky-events" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none" /><Button disabled={!webhookUrl.trim() || busy === "webhook:create"} onClick={() => void createWebhook()}>{busy === "webhook:create" ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />} Add webhook</Button></div><div className="max-h-56 overflow-y-auto">{webhooks.length ? webhooks.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2.5 border-b border-foreground/10 p-3 last:border-0"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.url}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.id} · {date(item.createdAt)}</p></div><Button secondary disabled={busy === `webhook:${item.id}`} onClick={() => void removeWebhook(item)}><X size={12} /> Remove</Button></div>) : <Empty>No webhooks configured.</Empty>}</div></Section>
    </div>
    {skill && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-5" role="dialog" aria-modal="true"><Card className="flex max-h-[90vh] w-full max-w-4xl min-w-0 flex-col overflow-hidden shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4"><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Skill files</p><h2 className="mt-1 truncate font-display text-xl">{skill.item.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">{skill.item.description}</p></div><button type="button" onClick={() => setSkill(undefined)} aria-label="Close skill viewer" className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button></div><div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]"><div className="overflow-y-auto border-b border-foreground/10 p-2 md:border-b-0 md:border-r">{skill.files.map((file) => <button key={file.path} type="button" onClick={() => void readSkillFile(file)} className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] hover:bg-foreground/5"><FileText size={12} className="shrink-0 text-muted-foreground" /><span className="truncate">{file.path}</span></button>)}</div><div className="min-h-0 overflow-auto p-4">{busy?.startsWith("file:") ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Reading file…</div> : skill.selected?.binary ? <p className="text-xs text-muted-foreground">This file is binary and cannot be previewed as text.</p> : <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5">{skill.selected?.content || "Select a file to read it."}</pre>}</div></div></Card></div>}
  </>;
}

function Section({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children: ReactNode }) { const sectionKey = title === "Durable workers" ? "workers" : title === "Video generation" ? "media" : title.startsWith("Channels") ? "channels" : title.toLowerCase(); return <Card data-capability-section={sectionKey} className="min-w-0 overflow-hidden"><div className="flex items-start gap-2.5 border-b border-foreground/10 p-3.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center border border-foreground/10 text-muted-foreground">{icon}</span><div className="min-w-0"><h2 className="text-sm font-medium">{title}</h2><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div></div>{children}</Card>; }
function Empty({ children }: { children: ReactNode }) { return <p className="p-3 text-[11px] text-muted-foreground">{children}</p>; }

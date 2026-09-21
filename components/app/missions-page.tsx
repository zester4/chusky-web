"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { chuskyApi, type Mission } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { useLiveData } from "@/lib/live-sync";

const tone = (status: Mission["status"]): "green" | "amber" | "gray" => status === "completed" ? "green" : ["blocked", "failed", "paused", "waiting"].includes(status) ? "amber" : "gray";
const date = (value: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selected, setSelected] = useState<Mission>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string>();
  const load = async () => { setOffline(false); try { setMissions((await chuskyApi.missions.list()).data); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  useLiveData(load);
  const act = async (mission: Mission, action: "pause" | "resume" | "cancel") => { setBusy(mission.id); try { const next = await chuskyApi.missions[action](mission.id); setMissions((current) => current.map((item) => item.id === next.id ? next : item)); setSelected(next); } finally { setBusy(undefined); } };
  return <><PageHeading eyebrow="Autonomous work" title="Missions" description="Durable work with checkpoints, budgets, waits, and explicit recovery controls." action={<Button secondary onClick={() => void load()}><RefreshCw size={13} /> Refresh</Button>} />{offline ? <Card className="p-5 text-xs text-muted-foreground">Missions could not be loaded. Check the backend connection and retry.</Card> : <Card>{missions.length ? missions.map((mission) => <div key={mission.id} className="border-b border-foreground/10 p-4 last:border-0"><button type="button" className="w-full text-left" onClick={() => void chuskyApi.missions.get(mission.id).then(setSelected)}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium">{mission.title}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{mission.id} · updated {date(mission.updatedAt)}</p></div><Status tone={tone(mission.status)}>{mission.status}</Status></div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{mission.nextAction || mission.checkpoint || mission.objective}</p><p className="mt-2 text-[10px] text-muted-foreground">{mission.consumedSteps} slices · {mission.toolCalls} tool calls · ${mission.cost.toFixed(4)} · {mission.steps.length} steps</p></button>{selected?.id === mission.id && <div className="mt-3 border-t border-foreground/10 pt-3 text-[11px] text-muted-foreground"><p className="leading-5">{mission.objective}</p><p className="mt-2"><span className="font-medium text-foreground">Definition of done:</span> {mission.definitionOfDone}</p>{mission.waiting && <p className="mt-2">Waiting: {mission.waiting.kind}{mission.waiting.providerEventId ? ` · ${mission.waiting.providerEventId}` : ""}</p>}<div className="mt-3 space-y-2">{mission.steps.map((step) => <div key={step.id} className="border border-foreground/10 px-2.5 py-2"><div className="flex justify-between gap-2"><span>{step.title}</span><span className="font-mono text-[9px]">{step.status}</span></div>{step.dependsOn.length > 0 && <p className="mt-1 text-[10px]">Depends on {step.dependsOn.join(", ")}</p>}</div>)}</div><div className="mt-3 flex flex-wrap gap-2">{["running", "waiting"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "pause")}>Pause</Button>}{["paused", "blocked", "failed"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "resume")}>Resume</Button>}{!["completed", "cancelled"].includes(mission.status) && <Button secondary disabled={busy === mission.id} onClick={() => void act(mission, "cancel")}>Cancel</Button>}</div></div>}</div>) : <p className="p-5 text-xs text-muted-foreground">No autonomous missions yet. Start one from Chat or the API when work should continue beyond one turn.</p>}</Card>}</>;
}

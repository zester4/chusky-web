"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, SlidersHorizontal } from "lucide-react";
import { chuskyApi, type LiveVoicePreferences, type VoiceOptions } from "@/lib/chusky-api";
import { Button, Card } from "./app-shell";

type Provider = "twilio" | "meetings" | "bland";

export function ProviderVoiceSettings({ provider, title, description }: { provider: Provider; title: string; description: string }) {
  const [preferences, setPreferences] = useState<LiveVoicePreferences>({});
  const [options, setOptions] = useState<VoiceOptions>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    void Promise.all([chuskyApi.account.preferences(), chuskyApi.account.voiceOptions()]).then(([current, catalogue]) => {
      if (!active) return;
      setPreferences(current.voicePreferences);
      setOptions(catalogue);
    }).catch(() => { if (active) setMessage("Voice catalogue is temporarily unavailable."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (voice: string | null | { id: string; name: string }) => {
    setBusy(true);
    setMessage(undefined);
    try {
      const next = await chuskyApi.account.updatePreferences({ liveVoice: provider === "bland" ? { provider, voice: voice ? voice as { id: string; name: string } : null } : { provider, voice: voice as string | null } });
      setPreferences(next.voicePreferences);
      setMessage("Voice preference saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the voice preference.");
    } finally {
      setBusy(false);
    }
  };

  const value = provider === "bland" ? preferences.bland?.id ?? "" : preferences[provider] ?? "";
  const flux = options?.fluxVoices ?? [];
  const bland = options?.blandVoices ?? [];

  return <Card className="p-4 sm:p-5"><div className="flex items-start gap-3"><SlidersHorizontal size={16} className="mt-0.5 text-muted-foreground" /><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p></div></div>{loading ? <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><LoaderCircle size={13} className="animate-spin" /> Loading voice options…</div> : provider === "bland" && !options?.blandAvailable ? <p className="mt-4 text-[11px] text-muted-foreground">Bland is not configured for this deployment.</p> : <div className="mt-4 flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-xs text-muted-foreground">Voice<select disabled={busy} value={value} onChange={(event) => { const selected = bland.find((item) => item.id === event.target.value); void save(provider === "bland" ? selected ?? null : event.target.value || null); }} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Provider default</option>{provider === "bland" ? bland.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : flux.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.accent}</option>)}</select></label><Button secondary disabled={busy || !value} onClick={() => void save(null)}>{busy ? <LoaderCircle size={12} className="animate-spin" /> : null} Reset</Button></div>}{message && <p role="status" className="mt-3 text-[11px] text-muted-foreground">{message}</p>}</Card>;
}

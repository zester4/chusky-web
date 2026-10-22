"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { chuskyApi, type VoiceCompliance } from "@/lib/chusky-api";
import { Button, Card, Status } from "./app-shell";

function tone(status: string): "green" | "amber" | "gray" {
  if (status === "verified" || status === "ready" || status === "complete") return "green";
  if (status === "rejected" || status === "blocked") return "amber";
  return "gray";
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function VoiceCompliancePanel() {
  const [compliance, setCompliance] = useState<VoiceCompliance>();
  const [countries, setCountries] = useState("");
  const [recordingConsentRequired, setRecordingConsentRequired] = useState(true);
  const [optOutEnabled, setOptOutEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState<1 | 7 | 30>(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = (await chuskyApi.account.calls.compliance.get()).data;
      setCompliance(next);
      setCountries(next.regulatoryCountries.join(", "));
      setRecordingConsentRequired(next.recordingConsentRequired);
      setOptOutEnabled(next.optOutEnabled);
      setRetentionDays(next.retentionDays);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Voice compliance could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    setSaving(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const result = await chuskyApi.account.calls.compliance.update({
        expectedVersion: compliance?.version ?? 0,
        regulatoryCountries: countries.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
        recordingConsentRequired,
        optOutEnabled,
        retentionDays,
      });
      setCompliance(result.data);
      setMessage("Saved. Twilio verification and regulatory approval still need to be completed before activation.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Voice compliance could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-4 sm:space-y-5">
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05]"><ShieldCheck size={16} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Regulatory setup</p><h2 className="mt-1 font-display text-2xl">Privacy and regulatory coverage</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Emergency and provider-required addresses are collected during number purchase, based on the selected number’s Twilio requirements. This section controls privacy and intended country coverage.</p></div></div>
        <div className="flex items-center gap-2"><Status tone={tone(compliance?.readiness ?? "not_configured")}>{label(compliance?.readiness ?? "loading")}</Status><Button secondary onClick={() => void load()} disabled={loading} aria-label="Refresh voice compliance">{loading ? <LoaderCircle size={12} className="animate-spin" /> : <RefreshCw size={12} />}</Button></div>
      </div>
      {error && <p role="alert" className="mt-4 border border-amber-300 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">{error}</p>}
      <fieldset className="mt-5 border-t border-foreground/10 pt-4"><legend className="text-xs font-medium">Regulatory countries</legend><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Enter two-letter country codes separated by commas. This records the intended coverage; it does not bypass country-specific registration.</p><input value={countries} onChange={(event) => setCountries(event.target.value)} placeholder="US, CA" className="mt-3 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs uppercase" /></fieldset>
      <fieldset className="mt-5 border-t border-foreground/10 pt-4"><legend className="text-xs font-medium">Privacy controls</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="flex items-start gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={recordingConsentRequired} onChange={(event) => setRecordingConsentRequired(event.target.checked)} className="mt-0.5 accent-foreground" /> Require consent before any recording is enabled</label><label className="flex items-start gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={optOutEnabled} onChange={(event) => setOptOutEnabled(event.target.checked)} className="mt-0.5 accent-foreground" /> Honor caller opt-out and do-not-contact requests</label><label className="block text-[11px] text-muted-foreground">Transcript retention<select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value) as typeof retentionDays)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value={1}>One day</option><option value={7}>Seven days</option><option value={30}>Thirty days</option></select></label></div></fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4"><Button onClick={() => void save()} disabled={saving || loading}>{saving ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save compliance settings</Button>{message && <p role="status" className="text-[11px] text-muted-foreground">{message}</p>}</div>
    </Card>
  </div>;
}

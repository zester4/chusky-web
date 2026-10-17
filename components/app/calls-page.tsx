"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { chuskyApi, type CallCapability, type CallMode, type CallRecord, type CallRepresentation, type CallTone } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { ProviderVoiceSettings } from "./provider-voice-settings";

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function normalizePhone(value: string) { return value.replace(/[\s().-]/g, ""); }
function statusTone(call: CallRecord): "green" | "amber" | "gray" { return call.runtimeState === "degraded" || call.runtimeState === "reconnecting" || call.status === "failed" ? "amber" : call.status === "active" || call.status === "ended" || call.runtimeState === "ended" ? "green" : "gray"; }
function statusLabel(call: CallRecord) { if (call.runtimeState === "reconnecting") return "Reconnecting"; if (call.runtimeState === "degraded") return "Degraded"; if (call.runtimeState === "ended") return "Ended"; return call.status; }
function eventLabel(type: string) { return type.replaceAll("_", " ").replace(/\b\w/g, (value) => value.toUpperCase()); }
export function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>();
  const [available, setAvailable] = useState(false);
  const [provider, setProvider] = useState<"twilio" | "bland" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [continuityFromCallId, setContinuityFromCallId] = useState("");
  const [identity, setIdentity] = useState("Chusky");
  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [callProfile, setCallProfile] = useState<CallRepresentation>("personal");
  const [mode, setMode] = useState<CallMode>("general");
  const [tone, setTone] = useState<CallTone>("professional");
  const [opening, setOpening] = useState("");
  const [facts, setFacts] = useState("");
  const [guardrails, setGuardrails] = useState("");
  const [capabilities, setCapabilities] = useState<CallCapability[]>(["memory_lookup", "scratchpad_lookup", "schedule_lookup", "task_lookup", "call_history"]);
  const [greetingMode, setGreetingMode] = useState<"dynamic" | "static" | "human_first">("dynamic");
  const [allowVoicemail, setAllowVoicemail] = useState(true);
  const [allowHumanHandoff, setAllowHumanHandoff] = useState(true);
  const [recording, setRecording] = useState<"disabled" | "announce" | "enabled">("disabled");
  const [retentionDays, setRetentionDays] = useState<1 | 7 | 30>(30);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietTimezone, setQuietTimezone] = useState("UTC");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const load = async () => {
    setError(undefined);
    try {
      const result = await chuskyApi.account.calls.list();
      setCalls(result.data); setAvailable(result.available); setProvider(result.provider);
    } catch (cause) { setCalls([]); setError(cause instanceof Error ? cause.message : "Could not load calls."); }
  };
  useEffect(() => { void load(); }, []);
  useLiveData(load);

  const requestCall = async () => {
    setBusy("request"); setError(undefined);
    try {
      await chuskyApi.account.calls.request({ phoneNumber: normalizePhone(phoneNumber.trim()), purpose: purpose.trim(), callProfile, ...(continuityFromCallId ? { continuityFromCallId } : {}), profile: { identity: identity.trim() || "Chusky", ...(organization.trim() ? { organization: organization.trim() } : {}), ...(contactName.trim() ? { contactName: contactName.trim() } : {}), mode, tone, ...(opening.trim() ? { opening: opening.trim() } : {}), facts: facts.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), guardrails: guardrails.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), capabilities, controls: { greetingMode, allowVoicemail, allowHumanHandoff, optOutEnabled: true, recording, retentionDays, ...(quietHoursEnabled ? { quietHours: { timezone: quietTimezone, start: quietStart, end: quietEnd } } : {}) } } });
      setPhoneNumber(""); setPurpose(""); setContinuityFromCallId(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not place a call."); }
    finally { setBusy(undefined); }
  };
  const control = async (call: CallRecord, input: Parameters<typeof chuskyApi.account.calls.control>[1]) => {
    setBusy(`${call.id}:${input.action}`); setError(undefined);
    try { await chuskyApi.account.calls.control(call.id, input); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not control the call."); }
    finally { setBusy(undefined); }
  };

  const setupRequired = error?.toLowerCase().includes("verify your web account") ?? false;
  const continuableCalls = calls?.filter((call) => call.status === "ended" && (call.outcome || call.summary)) ?? [];
  const visibleOutcomes = calls?.filter((call) => call.summary || call.outcome || call.outcomeStatus) ?? [];

  return <>
    <PageHeading eyebrow="Voice workspace" title="Calls, with you in control." description="Place an outbound Chusky call through the configured voice provider. The call starts after you confirm the destination and purpose." action={<Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Refresh</Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 sm:mb-5 sm:p-4"><div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><div><p>{error}</p>{setupRequired && <p className="mt-1.5 text-amber-900/70">Verify your web account in Settings before using voice calls.</p>}</div></div></Card>}
    {provider && <><p className="mb-3 text-[11px] text-muted-foreground">Active voice provider: <span className="font-medium text-foreground">{provider === "bland" ? "Bland" : "Twilio"}</span></p><div className="mb-4"><ProviderVoiceSettings provider={provider} title="Call voice" description="Choose the voice used for outbound calls from this Calls page." /></div></>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] sm:gap-5">
      <Card className="p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Outbound call</p>
        <h2 className="mt-1.5 font-display text-2xl">Place a call</h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Use an E.164 number. Formatting spaces and punctuation are normalized before submission.</p>
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-medium">Phone number
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+1 555 010 0123" inputMode="tel" maxLength={24} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 text-xs outline-none focus:border-foreground/50" />
          </label>
          <label className="block text-xs font-medium">Purpose
            <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Confirm tomorrow's appointment" maxLength={1000} rows={3} className="mt-1.5 w-full resize-none border border-foreground/15 bg-transparent px-2.5 py-2 text-xs leading-5 outline-none focus:border-foreground/50" />
          </label>
          {continuableCalls.length > 0 && <label className="block text-xs text-muted-foreground">Continue from a completed call
            <select value={continuityFromCallId} onChange={(event) => setContinuityFromCallId(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">
              <option value="">Start fresh</option>
              {continuableCalls.map((call) => <option key={call.id} value={call.id}>{call.purpose} · {date(call.updatedAt)}</option>)}
            </select>
          </label>}
          <details className="border-t border-foreground/10 pt-3">
            <summary className="cursor-pointer text-xs font-medium">Representative profile for this call</summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-muted-foreground">Representative
                  <input value={identity} onChange={(event) => setIdentity(event.target.value)} maxLength={180} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" />
                </label>
                <label className="block text-xs text-muted-foreground">Organization
                  <input value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={180} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" />
                </label>
                <label className="block text-xs text-muted-foreground">Contact name (optional)
                  <input value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={180} placeholder="Collins" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" />
                </label>
                <label className="block text-xs text-muted-foreground">Representation
                  <select value={callProfile} onChange={(event) => setCallProfile(event.target.value as CallRepresentation)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">
                    <option value="personal">Personal</option><option value="business">Business</option>
                  </select>
                </label>
                <label className="block text-xs text-muted-foreground">Conversation mode
                  <select value={mode} onChange={(event) => setMode(event.target.value as CallMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">
                    <option value="general">General</option><option value="sales">Sales</option><option value="onboarding">Onboarding</option><option value="support">Support</option><option value="scheduling">Scheduling</option>
                  </select>
                </label>
                <label className="block text-xs text-muted-foreground">Tone
                  <select value={tone} onChange={(event) => setTone(event.target.value as CallTone)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">
                    <option value="professional">Professional</option><option value="warm">Warm</option><option value="direct">Direct</option><option value="consultative">Consultative</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs text-muted-foreground">Optional opening
                <input value={opening} onChange={(event) => setOpening(event.target.value)} maxLength={500} placeholder="Leave empty for a natural introduction" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" />
              </label>
              <label className="block text-xs text-muted-foreground">Verified context, one fact per line
                <textarea value={facts} onChange={(event) => setFacts(event.target.value)} rows={2} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" />
              </label>
              <label className="block text-xs text-muted-foreground">Communication guidance, one item per line
                <textarea value={guardrails} onChange={(event) => setGuardrails(event.target.value)} rows={2} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" />
              </label>
              <fieldset>
                <legend className="text-xs text-muted-foreground">Read-only context Chusky may consult</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {([["memory_lookup", "Memory"], ["scratchpad_lookup", "Scratchpad"], ["schedule_lookup", "Reminders and schedules"], ["task_lookup", "Tasks"], ["call_history", "Call history"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={capabilities.includes(key)} onChange={(event) => setCapabilities((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))} className="accent-foreground" />{label}</label>)}
                </div>
              </fieldset>
              <fieldset className="border-t border-foreground/10 pt-3">
                <legend className="text-xs text-muted-foreground">Call controls</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] text-muted-foreground">Greeting mode<select value={greetingMode} onChange={(event) => setGreetingMode(event.target.value as typeof greetingMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="dynamic">Dynamic</option><option value="static">Static</option><option value="human_first">Human first</option></select></label>
                  <label className="block text-[11px] text-muted-foreground">Transcript retention<select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value) as typeof retentionDays)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value={1}>One day</option><option value={7}>Seven days</option><option value={30}>Thirty days</option></select></label>
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowVoicemail} onChange={(event) => setAllowVoicemail(event.target.checked)} className="accent-foreground" /> Allow voicemail</label>
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowHumanHandoff} onChange={(event) => setAllowHumanHandoff(event.target.checked)} className="accent-foreground" /> Allow human handoff</label>
                  <label className="block text-[11px] text-muted-foreground">Recording<select value={recording} onChange={(event) => setRecording(event.target.value as typeof recording)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="disabled">Disabled</option><option value="announce">Announce recording</option><option value="enabled">Enabled</option></select></label>
                </div>
                <label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={quietHoursEnabled} onChange={(event) => setQuietHoursEnabled(event.target.checked)} className="accent-foreground" /> Enforce outbound quiet hours</label>
                {quietHoursEnabled && <div className="mt-2 grid gap-3 sm:grid-cols-3"><label className="block text-[11px] text-muted-foreground">Timezone<input value={quietTimezone} onChange={(event) => setQuietTimezone(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">From<input type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">Until<input type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label></div>}
              </fieldset>
            </div>
          </details>
          <Button disabled={!available || !normalizePhone(phoneNumber.trim()) || !purpose.trim() || Boolean(busy)} onClick={() => setConfirm(true)}>{busy === "request" ? <LoaderCircle size={13} className="animate-spin" /> : <Phone size={13} />}{available ? "Place call" : "Voice unavailable"}</Button>
        </div>
      </Card>
      <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Outbound call</p><h2 className="mt-1.5 font-display text-2xl">Ready to dial</h2></div><ShieldCheck size={18} className="text-emerald-600" /></div><div className="mt-4 space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Your click starts this exact call after destination and purpose validation.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Chusky uses the representative profile and purpose you submit.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Provider credentials and audio never appear in this dashboard.</p></div></Card>
    </div>
    <Card className="mt-4 sm:mt-5"><div className="flex items-center justify-between border-b border-foreground/10 p-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call history</p><h2 className="mt-1 font-display text-2xl">Recent activity</h2></div><Status tone={available ? "green" : "gray"}>{available ? "Voice ready" : "Not configured"}</Status></div>{calls === undefined ? <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading calls…</div> : !calls.length ? <div className="p-5 text-xs leading-5 text-muted-foreground">No calls yet. Request a call when you need Chusky to reach someone by phone.</div> : <div>{calls.map((call) => { const active = ["starting", "bridging", "active"].includes(call.status) && call.provider === "twilio"; const actionBusy = (name: string) => busy === `${call.id}:${name}`; return <div key={call.id} className="border-b border-foreground/10 p-4 last:border-0"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/10"><Phone size={14} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{call.direction === "inbound" ? "Incoming call" : "Outgoing call"} · {call.phoneNumber}</p><Status tone={statusTone(call)}>{statusLabel(call)}</Status></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{call.purpose}</p>{call.error && <p className="mt-1 text-[11px] text-amber-700">{call.error}</p>}{call.transcript && <details className="mt-2"><summary className="cursor-pointer text-[10px] font-medium text-muted-foreground">Deepgram transcript ({call.transcript.turns.length} turns{call.transcript.truncated ? ", truncated" : ""})</summary><div className="mt-2 space-y-2 border-l border-foreground/10 pl-2.5">{call.transcript.turns.map((turn) => <div key={turn.id} className="space-y-1 text-[10px] leading-4"><p><span className="font-medium text-foreground">Contact:</span> {turn.caller}</p><p><span className="font-medium text-foreground">Chusky:</span> {turn.assistant}</p></div>)}</div></details>}{call.timeline && call.timeline.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-[10px] font-medium text-muted-foreground">Call timeline ({call.timeline.length})</summary><div className="mt-2 space-y-1 border-l border-foreground/10 pl-2.5">{call.timeline.slice(-12).map((event) => <p key={event.id} className="text-[10px] leading-4 text-muted-foreground"><span className="font-medium text-foreground">{eventLabel(event.type)}</span> · {event.summary} {event.receiptId ? <span className="font-mono opacity-70">· receipt {event.receiptId}</span> : null} <span className="opacity-70">{date(event.at)}</span></p>)}</div></details>}{call.qa && <p className="mt-2 text-[10px] text-muted-foreground">QA score: <span className="font-medium text-foreground">{call.qa.score}/100</span> · {call.qa.passed ? "passed" : "needs review"}</p>}</div><p className="shrink-0 text-[10px] text-muted-foreground">{date(call.updatedAt)}</p></div>{active && <div className="mt-3 flex flex-wrap gap-2 pl-11"><Button secondary disabled={Boolean(busy)} onClick={() => void control(call, { action: "hangup" })}>{actionBusy("hangup") ? <LoaderCircle size={12} className="animate-spin" /> : null} Hang up</Button><Button secondary disabled={Boolean(busy)} onClick={() => { const digits = window.prompt("DTMF digits to send"); if (digits) void control(call, { action: "send_dtmf", digits }); }}>Send DTMF</Button><Button secondary disabled={Boolean(busy)} onClick={() => { const number = window.prompt("Transfer to E.164 number"); if (number) void control(call, { action: "transfer", phoneNumber: normalizePhone(number) }); }}>Transfer</Button></div>}</div>; })}</div>}</Card>
    {visibleOutcomes.length > 0 && <Card className="mt-4 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call outcomes</p><div className="mt-2 divide-y divide-foreground/10">{visibleOutcomes.slice(0, 5).map((call) => <div key={call.id} className="py-3 first:pt-0 last:pb-0"><p className="text-[11px] font-medium">{call.provider} · {call.purpose}</p>{call.outcome ? <><p className="mt-1 text-xs font-medium">{call.outcome.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{call.outcome.summary}</p>{call.outcome.actionItems.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Next: {call.outcome.actionItems.map((item) => `${item.task} (${item.owner})`).join(" · ")}</p>}</> : call.summary ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{call.summary}</p> : null}{call.outcomeStatus === "pending" && <p className="mt-1 text-[10px] text-amber-700">Outcome processing is still in progress.</p>}{call.outcomeStatus === "failed" && <p className="mt-1 text-[10px] text-amber-700">Outcome processing needs a retry.</p>}</div>)}</div></Card>}
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Place this phone call?" description={`Chusky will dial ${phoneNumber || "this number"} now about: ${purpose || "the stated purpose"}.`} confirmLabel="Place call" onConfirm={() => { setConfirm(false); return requestCall(); }} />
  </>;
}

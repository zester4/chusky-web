"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { chuskyApi, type CallCapability, type CallConnectedAccount, type CallDisclosure, type CallInboundRoute, type CallMode, type CallRecord, type CallRepresentation, type CallTone, type Task } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { ProviderVoiceSettings } from "./provider-voice-settings";
import { CallActivityTabs } from "./call-activity-tabs";

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function normalizePhone(value: string) { return value.replace(/[\s().-]/g, ""); }
function safePreviewIdentity(value: string) { return /\b(?:dr\.?|doctor|nurse|rn|registered\s+nurse|physician|surgeon|pharmacist|therapist|psychologist|lawyer|attorney|accountant|licensed|ordained|human)\b/i.test(value) ? "Chusky" : value.trim() || "Chusky"; }
export function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>();
  const [tasks, setTasks] = useState<Task[]>();
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string>();
  const [inboundRoutes, setInboundRoutes] = useState<CallInboundRoute[]>([]);
  const [inboundRoutesError, setInboundRoutesError] = useState<string>();
  const [available, setAvailable] = useState(false);
  const [provider, setProvider] = useState<"twilio" | "bland" | null>(null);
  const [callAccounts, setCallAccounts] = useState<CallConnectedAccount[]>([]);
  const [callToolkits, setCallToolkits] = useState<string[]>([]);
  const [allowedToolkits, setAllowedToolkits] = useState<string[]>([]);
  const [allowedConnectionIds, setAllowedConnectionIds] = useState<string[]>([]);
  const [allowExternalWrites, setAllowExternalWrites] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [continuityFromCallId, setContinuityFromCallId] = useState("");
  const [identity, setIdentity] = useState("Chusky");
  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [callProfile, setCallProfile] = useState<CallRepresentation>("personal");
  const [disclosure, setDisclosure] = useState<CallDisclosure>("assistant");
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
  const [inboundProvider, setInboundProvider] = useState<"twilio" | "bland">("twilio");
  const [inboundPhoneNumber, setInboundPhoneNumber] = useState("");
  const [inboundPurpose, setInboundPurpose] = useState("Handle an inbound caller request");
  const [inboundCallProfile, setInboundCallProfile] = useState<CallRepresentation>("business");
  const [inboundAllowedCallers, setInboundAllowedCallers] = useState("");
  const [inboundVerifiedCallers, setInboundVerifiedCallers] = useState("");
  const [inboundBusy, setInboundBusy] = useState<string>();

  const load = async () => {
    setError(undefined);
    try {
      const result = await chuskyApi.account.calls.list();
      setCalls(result.data); setAvailable(result.available); setProvider(result.provider);
      try {
        const capabilities = await chuskyApi.account.calls.capabilities();
        setCallAccounts(capabilities.data);
        setCallToolkits(capabilities.toolkits);
      } catch {
        setCallAccounts([]); setCallToolkits([]);
      }
      const taskIds = [...new Set(result.data.flatMap((call) => call.followUpTaskIds ?? []))];
      setTasksError(undefined);
      if (taskIds.length) {
        setTasksLoading(true);
        try {
          const taskResult = await chuskyApi.tasks.list();
          setTasks(taskResult.data.filter((task) => taskIds.includes(task.id)));
        } catch (cause) {
          setTasks([]);
          setTasksError(cause instanceof Error ? cause.message : "Linked follow-up tasks could not be loaded.");
        } finally {
          setTasksLoading(false);
        }
      } else {
        setTasks([]);
        setTasksLoading(false);
      }
    } catch (cause) { setCalls([]); setTasks([]); setTasksLoading(false); setError(cause instanceof Error ? cause.message : "Could not load calls."); }
  };
  const loadInboundRoutes = async () => {
    try {
      const result = await chuskyApi.account.calls.inboundRoutes();
      setInboundRoutes(result.data);
      setInboundRoutesError(undefined);
    } catch (cause) {
      setInboundRoutes([]);
      setInboundRoutesError(cause instanceof Error ? cause.message : "Inbound lines could not be loaded.");
    }
  };
  useEffect(() => { void load(); void loadInboundRoutes(); }, []);
  useLiveData(() => { void load(); void loadInboundRoutes(); });

  const requestCall = async () => {
    setBusy("request"); setError(undefined);
    try {
      const validConnectionIds = allowedConnectionIds.filter((id) => {
        const account = callAccounts.find((candidate) => candidate.id === id);
        return Boolean(account && allowedToolkits.includes(account.toolkit));
      });
      await chuskyApi.account.calls.request({ phoneNumber: normalizePhone(phoneNumber.trim()), purpose: purpose.trim(), callProfile, ...(continuityFromCallId ? { continuityFromCallId } : {}), profile: { identity: identity.trim() || "Chusky", ...(organization.trim() ? { organization: organization.trim() } : {}), ...(contactName.trim() ? { contactName: contactName.trim() } : {}), mode, tone, disclosure, ...(opening.trim() ? { opening: opening.trim() } : {}), facts: facts.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), guardrails: guardrails.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), capabilities, toolPolicy: { enabled: true, allowedToolkits, allowedConnectionIds: validConnectionIds, allowExternalWrites, version: 1 }, controls: { greetingMode, allowVoicemail, allowHumanHandoff, optOutEnabled: true, recording, retentionDays, ...(quietHoursEnabled ? { quietHours: { timezone: quietTimezone, start: quietStart, end: quietEnd } } : {}) } } });
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
  const saveInboundRoute = async () => {
    setInboundBusy("save"); setError(undefined);
    try {
      const validConnectionIds = allowedConnectionIds.filter((id) => {
        const account = callAccounts.find((candidate) => candidate.id === id);
        return Boolean(account && allowedToolkits.includes(account.toolkit));
      });
      await chuskyApi.account.calls.saveInboundRoute({
        provider: inboundProvider,
        phoneNumber: normalizePhone(inboundPhoneNumber.trim()),
        callProfile: inboundCallProfile,
        purpose: inboundPurpose.trim(),
        allowedCallers: inboundAllowedCallers.split(/[,\n]/).map((item) => normalizePhone(item.trim())).filter(Boolean),
        verifiedCallers: inboundVerifiedCallers.split(/[,\n]/).map((item) => normalizePhone(item.trim())).filter(Boolean),
        voiceProfile: {
          identity: identity.trim() || "Chusky",
          ...(organization.trim() ? { organization: organization.trim() } : {}),
          mode, tone, disclosure,
          ...(opening.trim() ? { opening: opening.trim() } : {}),
          facts: facts.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          guardrails: guardrails.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          capabilities,
          toolPolicy: { enabled: true, allowedToolkits, allowedConnectionIds: validConnectionIds, allowExternalWrites, version: 1 },
          controls: { greetingMode, allowVoicemail, allowHumanHandoff, optOutEnabled: true, recording, retentionDays, ...(quietHoursEnabled ? { quietHours: { timezone: quietTimezone, start: quietStart, end: quietEnd } } : {}) },
        },
      });
      setInboundPhoneNumber("");
      await loadInboundRoutes();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inbound line could not be saved.");
    } finally { setInboundBusy(undefined); }
  };
  const deleteInboundRoute = async (route: CallInboundRoute) => {
    if (!window.confirm(`Remove inbound routing for ${route.phoneNumber}? New callers will no longer reach this workspace.`)) return;
    setInboundBusy(`${route.provider}:${route.phoneNumber}`); setError(undefined);
    try { await chuskyApi.account.calls.deleteInboundRoute(route.provider, route.phoneNumber); await loadInboundRoutes(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Inbound line could not be removed."); }
    finally { setInboundBusy(undefined); }
  };

  const setupRequired = error?.toLowerCase().includes("verify your web account") ?? false;
  const continuableCalls = calls?.filter((call) => call.status === "ended" && (call.outcome || call.summary)) ?? [];

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
                <label className="block text-xs text-muted-foreground">Introduction disclosure
                  <select value={disclosure} onChange={(event) => setDisclosure(event.target.value as CallDisclosure)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">
                    <option value="assistant">Configured assistant</option><option value="explicit_ai">Say AI assistant once</option>
                  </select>
                </label>
              </div>
              <div className="border border-foreground/10 bg-foreground/[0.02] p-3" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Caller-facing preview</p>
                <p className="mt-1.5 text-xs leading-5">Hello, this is {safePreviewIdentity(identity)}, {disclosure === "explicit_ai" ? "an AI assistant" : "an assistant"}{organization.trim() ? ` from ${organization.trim()}` : callProfile === "business" ? " for the business I represent" : " calling on behalf of the person who asked me to reach them"}.</p>
                <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">The server rejects regulated or professional titles and keeps the caller-facing role as an assistant. The disclosure is said once, not repeated on every turn.</p>
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
                <legend className="text-xs text-muted-foreground">Connected-app access for this call</legend>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Choose apps when this call needs business data or an action. Leave all apps unchecked to let the purpose router select from active connections. Exact action schemas load only when needed.</p>
                {callToolkits.length ? <div className="mt-2 grid gap-2 sm:grid-cols-2">{callToolkits.map((toolkit) => <label key={toolkit} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={allowedToolkits.includes(toolkit)} onChange={(event) => setAllowedToolkits((current) => event.target.checked ? [...current, toolkit] : current.filter((item) => item !== toolkit))} className="accent-foreground" />{toolkit}</label>)}</div> : <p className="mt-2 text-[11px] text-muted-foreground">No active Composio connections are available. Connect an app in Apps to enable call actions.</p>}
                {callAccounts.length > 0 && allowedToolkits.length > 0 && <div className="mt-3 border-t border-foreground/10 pt-3"><p className="text-[10px] text-muted-foreground">Optional account restriction</p><div className="mt-2 space-y-2">{callAccounts.filter((account) => allowedToolkits.includes(account.toolkit)).map((account) => <label key={account.id} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={allowedConnectionIds.includes(account.id)} onChange={(event) => setAllowedConnectionIds((current) => event.target.checked ? [...current, account.id] : current.filter((item) => item !== account.id))} className="accent-foreground" /><span>{account.alias || account.toolkit}</span><span className="text-muted-foreground">({account.status.toLowerCase()})</span></label>)}</div><p className="mt-2 text-[10px] text-muted-foreground">If one account is selected, Chusky pins provider actions to it. It will not switch accounts from caller instructions.</p></div>}
                <label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowExternalWrites} onChange={(event) => setAllowExternalWrites(event.target.checked)} className="accent-foreground" /> Allow approved external actions such as bookings, messages, and updates</label>
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
      <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Outbound call</p><h2 className="mt-1.5 font-display text-2xl">Ready to dial</h2></div><ShieldCheck size={18} className="text-emerald-600" /></div><div className="mt-4 space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Your click starts this exact call after destination and purpose validation.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Chusky uses the representative profile and purpose you submit.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> {allowedToolkits.length ? `This call is scoped to ${allowedToolkits.join(", ")}.` : "The purpose router will select from your active connected apps."}</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Provider credentials and audio never appear in this dashboard.</p></div></Card>
    </div>
    <Card className="mt-4 sm:mt-5">
      <div className="border-b border-foreground/10 p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Inbound business lines</p><h2 className="mt-1 font-display text-2xl">Let customers call you.</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Assign a provider number to this workspace. The webhook resolves the number durably at call time, so each business gets its own persona, verification boundary, and connected-app scope.</p></div>
      <div className="p-4 sm:p-5">
        {inboundRoutesError && <p className="mb-3 text-[11px] text-amber-700">{inboundRoutesError}</p>}
        {inboundRoutes.length > 0 && <div className="space-y-2.5">{inboundRoutes.map((route) => <article key={`${route.provider}:${route.phoneNumber}`} className="flex flex-wrap items-start justify-between gap-3 border border-foreground/10 p-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{route.phoneNumber}</p><Status tone="green">{route.provider}</Status><Status tone="gray">{route.callProfile === "business" ? "Public business line" : "Private personal line"}</Status></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{route.purpose} · {route.voiceProfile.organization || route.voiceProfile.identity}</p><p className="mt-1 text-[10px] text-muted-foreground">Updated {date(new Date(route.updatedAt).toISOString())}{route.callProfile === "personal" ? ` · ${route.allowedCallers.length} allowed caller${route.allowedCallers.length === 1 ? "" : "s"}` : " · public callers remain unverified until policy allows"}</p></div><Button secondary disabled={Boolean(inboundBusy)} onClick={() => void deleteInboundRoute(route)}>{inboundBusy === `${route.provider}:${route.phoneNumber}` ? <LoaderCircle size={12} className="animate-spin" /> : null} Remove</Button></article>)}</div>}
        <div className={`${inboundRoutes.length ? "mt-4 border-t border-foreground/10 pt-4" : ""}`}>
          <p className="text-xs font-medium">Add or update an inbound line</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-muted-foreground">Provider<select value={inboundProvider} onChange={(event) => setInboundProvider(event.target.value as typeof inboundProvider)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="twilio">Twilio</option><option value="bland">Bland</option></select></label>
            <label className="block text-[11px] text-muted-foreground">Provider phone number<input value={inboundPhoneNumber} onChange={(event) => setInboundPhoneNumber(event.target.value)} placeholder="+1 555 010 0123" inputMode="tel" maxLength={24} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label>
            <label className="block text-[11px] text-muted-foreground">Line type<select value={inboundCallProfile} onChange={(event) => setInboundCallProfile(event.target.value as CallRepresentation)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="business">Business — callers may reach the line</option><option value="personal">Personal — allowlisted callers only</option></select></label>
            <label className="block text-[11px] text-muted-foreground">Inbound purpose<input value={inboundPurpose} onChange={(event) => setInboundPurpose(event.target.value)} maxLength={2000} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label>
          </div>
          {inboundCallProfile === "personal" && <label className="mt-3 block text-[11px] text-muted-foreground">Allowed callers, comma or line separated<input value={inboundAllowedCallers} onChange={(event) => setInboundAllowedCallers(event.target.value)} placeholder="+15550100123" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /><span className="mt-1 block text-[10px]">Personal lines require at least one exact E.164 caller number.</span></label>}
          <label className="mt-3 block text-[11px] text-muted-foreground">Verified callers, optional<input value={inboundVerifiedCallers} onChange={(event) => setInboundVerifiedCallers(event.target.value)} placeholder="+15550100123" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /><span className="mt-1 block text-[10px]">Business callers are treated as public by default. Verification only expands access when the caller matches this list.</span></label>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">This route uses the representative profile, disclosure setting, call mode, tool policy, and guardrails configured above. Provider webhooks still need the global inbound endpoint enabled in deployment settings.</p>
          <div className="mt-3"><Button disabled={!normalizePhone(inboundPhoneNumber.trim()) || !inboundPurpose.trim() || inboundCallProfile === "personal" && !inboundAllowedCallers.trim() || Boolean(inboundBusy)} onClick={() => void saveInboundRoute()}>{inboundBusy === "save" ? <LoaderCircle size={13} className="animate-spin" /> : <Phone size={13} />} Save inbound route</Button></div>
        </div>
      </div>
    </Card>
    <Card className="mt-4 sm:mt-5"><div className="flex items-center justify-between border-b border-foreground/10 p-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call history</p><h2 className="mt-1 font-display text-2xl">Recent activity</h2></div><Status tone={available ? "green" : "gray"}>{available ? "Voice ready" : "Not configured"}</Status></div>{calls === undefined ? <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading calls…</div> : !calls.length ? <div className="p-5 text-xs leading-5 text-muted-foreground">No calls yet. Request a call when you need Chusky to reach someone by phone.</div> : <div>{calls.map((call) => <CallActivityTabs key={call.id} call={call} tasks={tasks} tasksLoading={tasksLoading} tasksError={tasksError} busy={busy} onControl={(input) => void control(call, input)} />)}</div>}</Card>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Place this phone call?" description={`Chusky will dial ${phoneNumber || "this number"} now about: ${purpose || "the stated purpose"}.`} confirmLabel="Place call" onConfirm={() => { setConfirm(false); return requestCall(); }} />
  </>;
}

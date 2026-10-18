"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Phone, RefreshCw, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2 } from "lucide-react";
import { chuskyApi, type CallCapability, type CallConnectedAccount, type CallDisclosure, type CallInboundRoute, type CallMode, type CallPhoneNumber, type CallPhoneNumberOption, type CallProfile, type CallRecord, type CallTone, type Task } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { ProviderVoiceSettings } from "./provider-voice-settings";
import { CallActivityTabs } from "./call-activity-tabs";
import { resolveProviderBrand } from "./trigger-logo";
import { ToolkitLogo } from "./toolkit-logo";

type CallsSection = "numbers" | "representative" | "activity";

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function safePreviewIdentity(value: string) {
  return /\b(?:dr\.?|doctor|nurse|rn|registered\s+nurse|physician|surgeon|pharmacist|therapist|psychologist|lawyer|attorney|accountant|licensed|ordained|human)\b/i.test(value) ? "Chusky" : value.trim() || "Chusky";
}

function profileFromRoute(route: CallInboundRoute): CallPhoneNumber {
  return { phoneNumber: route.phoneNumber, displayName: route.voiceProfile.organization || route.voiceProfile.identity, source: "external", callProfile: route.callProfile, provider: route.provider, purpose: route.purpose, updatedAt: route.updatedAt };
}

export function CallsPage() {
  const [section, setSection] = useState<CallsSection>("numbers");
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
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string>();
  const [phoneNumbers, setPhoneNumbers] = useState<CallPhoneNumber[]>([]);
  const [numberManagementAvailable, setNumberManagementAvailable] = useState(false);
  const [numberOptions, setNumberOptions] = useState<CallPhoneNumberOption[]>([]);
  const [countryCode, setCountryCode] = useState("US");
  const [areaCode, setAreaCode] = useState("");
  const [numberSearchBusy, setNumberSearchBusy] = useState(false);
  const [numberPurchaseBusy, setNumberPurchaseBusy] = useState<string>();
  const [numbersError, setNumbersError] = useState<string>();

  const applyProfile = (profile?: CallProfile) => {
    if (!profile) return;
    setIdentity(profile.identity || "Chusky");
    setOrganization(profile.organization || "");
    setContactName(profile.contactName || "");
    setDisclosure(profile.disclosure ?? "assistant");
    setMode(profile.mode ?? "general");
    setTone(profile.tone ?? "professional");
    setOpening(profile.opening || "");
    setFacts(profile.facts?.join("\n") || "");
    setGuardrails(profile.guardrails?.join("\n") || "");
    setCapabilities(profile.capabilities?.length ? profile.capabilities : ["memory_lookup", "scratchpad_lookup", "schedule_lookup", "task_lookup", "call_history"]);
    setAllowedToolkits(profile.toolPolicy?.allowedToolkits ?? []);
    setAllowedConnectionIds(profile.toolPolicy?.allowedConnectionIds ?? []);
    setAllowExternalWrites(profile.toolPolicy?.allowExternalWrites ?? true);
    const controls = profile.controls;
    if (!controls) return;
    setGreetingMode(controls.greetingMode ?? "dynamic");
    setAllowVoicemail(controls.allowVoicemail ?? true);
    setAllowHumanHandoff(controls.allowHumanHandoff ?? true);
    setRecording(controls.recording ?? "disabled");
    setRetentionDays(controls.retentionDays ?? 30);
    if (controls.quietHours) {
      setQuietHoursEnabled(true);
      setQuietTimezone(controls.quietHours.timezone || "UTC");
      setQuietStart(controls.quietHours.start || "22:00");
      setQuietEnd(controls.quietHours.end || "07:00");
    } else {
      setQuietHoursEnabled(false);
    }
  };

  const load = async () => {
    setError(undefined);
    try {
      const result = await chuskyApi.account.calls.list();
      setCalls(result.data);
      setAvailable(result.available);
      setProvider(result.provider);
      try {
        const capabilitiesResult = await chuskyApi.account.calls.capabilities();
        setCallAccounts(capabilitiesResult.data);
        setCallToolkits(capabilitiesResult.toolkits);
      } catch {
        setCallAccounts([]);
        setCallToolkits([]);
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
    } catch (cause) {
      setCalls([]);
      setTasks([]);
      setTasksLoading(false);
      setError(cause instanceof Error ? cause.message : "Could not load calls.");
    }
  };

  const loadProfile = async () => {
    try {
      const result = await chuskyApi.account.calls.profile.get();
      applyProfile(result.data);
    } catch {
      // Older accounts may not have a saved profile yet; safe local defaults remain usable.
    }
  };

  const loadNumbers = async () => {
    try {
      const result = await chuskyApi.account.calls.numbers.list();
      setPhoneNumbers(result.data);
      setNumberManagementAvailable(result.available);
      setNumbersError(undefined);
    } catch (cause) {
      setPhoneNumbers([]);
      setNumberManagementAvailable(false);
      setNumbersError(cause instanceof Error ? cause.message : "Phone numbers could not be loaded.");
    }
  };

  const loadInboundRoutes = async () => {
    try {
      const result = await chuskyApi.account.calls.inboundRoutes();
      setInboundRoutes(result.data);
      setInboundRoutesError(undefined);
    } catch (cause) {
      setInboundRoutes([]);
      setInboundRoutesError(cause instanceof Error ? cause.message : "Connected numbers could not be loaded.");
    }
  };

  useEffect(() => {
    void load();
    void loadProfile();
    void loadNumbers();
    void loadInboundRoutes();
  }, []);
  useLiveData(() => {
    void load();
    void loadProfile();
    void loadNumbers();
    void loadInboundRoutes();
  });

  const searchNumbers = async () => {
    setNumberSearchBusy(true);
    setNumbersError(undefined);
    try {
      const result = await chuskyApi.account.calls.numbers.search({ countryCode: countryCode.trim().toUpperCase(), ...(areaCode.trim() ? { areaCode: areaCode.trim() } : {}), limit: 12 });
      setNumberOptions(result.data);
      if (!result.data.length) setNumbersError("No matching numbers were found. Try another area code.");
    } catch (cause) {
      setNumberOptions([]);
      setNumbersError(cause instanceof Error ? cause.message : "Phone number search failed.");
    } finally {
      setNumberSearchBusy(false);
    }
  };

  const purchaseNumber = async (option: CallPhoneNumberOption) => {
    setNumberPurchaseBusy(option.phoneNumber);
    setNumbersError(undefined);
    try {
      await chuskyApi.account.calls.numbers.purchase({ phoneNumber: option.phoneNumber, ...(option.friendlyName ? { displayName: option.friendlyName } : {}) });
      setNumberOptions((current) => current.filter((item) => item.phoneNumber !== option.phoneNumber));
      await Promise.all([loadNumbers(), loadInboundRoutes()]);
    } catch (cause) {
      setNumbersError(cause instanceof Error ? cause.message : "That number could not be purchased.");
    } finally {
      setNumberPurchaseBusy(undefined);
    }
  };

  const releaseNumber = async (number: CallPhoneNumber) => {
    if (!window.confirm(`Release ${number.phoneNumber}? Customers will no longer reach this number.`)) return;
    setNumberPurchaseBusy(number.phoneNumber);
    setNumbersError(undefined);
    try {
      await chuskyApi.account.calls.numbers.release(number.phoneNumber);
      await Promise.all([loadNumbers(), loadInboundRoutes()]);
    } catch (cause) {
      setNumbersError(cause instanceof Error ? cause.message : "That number could not be released.");
    } finally {
      setNumberPurchaseBusy(undefined);
    }
  };

  const profilePayload = (): CallProfile => ({
    identity: identity.trim() || "Chusky",
    ...(organization.trim() ? { organization: organization.trim() } : {}),
    ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
    mode,
    tone,
    disclosure,
    ...(opening.trim() ? { opening: opening.trim() } : {}),
    facts: splitLines(facts),
    guardrails: splitLines(guardrails),
    capabilities,
    toolPolicy: { enabled: true, allowedToolkits, allowedConnectionIds, allowExternalWrites, version: 1 },
    controls: { greetingMode, allowVoicemail, allowHumanHandoff, optOutEnabled: true, recording, retentionDays, ...(quietHoursEnabled ? { quietHours: { timezone: quietTimezone, start: quietStart, end: quietEnd } } : {}) },
  });

  const saveProfile = async () => {
    setProfileBusy(true);
    setProfileMessage(undefined);
    try {
      const result = await chuskyApi.account.calls.profile.update(profilePayload());
      applyProfile(result.data);
      setProfileMessage("Representative settings saved. Your managed numbers use this profile for new calls.");
    } catch (cause) {
      setProfileMessage(cause instanceof Error ? cause.message : "Representative settings could not be saved.");
    } finally {
      setProfileBusy(false);
    }
  };

  const requestCall = async () => {
    setBusy("request");
    setError(undefined);
    try {
      const validConnectionIds = allowedConnectionIds.filter((id) => {
        const account = callAccounts.find((candidate) => candidate.id === id);
        return Boolean(account && allowedToolkits.includes(account.toolkit));
      });
      const profile = profilePayload();
      await chuskyApi.account.calls.request({ phoneNumber: normalizePhone(phoneNumber.trim()), purpose: purpose.trim(), callProfile: organization.trim() ? "business" : "personal", ...(continuityFromCallId ? { continuityFromCallId } : {}), profile: { ...profile, toolPolicy: { ...profile.toolPolicy!, allowedConnectionIds: validConnectionIds } } });
      setPhoneNumber("");
      setPurpose("");
      setContinuityFromCallId("");
      await load();
      setSection("activity");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not place a call.");
    } finally {
      setBusy(undefined);
    }
  };

  const control = async (call: CallRecord, input: Parameters<typeof chuskyApi.account.calls.control>[1]) => {
    setBusy(`${call.id}:${input.action}`);
    setError(undefined);
    try {
      await chuskyApi.account.calls.control(call.id, input);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not control the call.");
    } finally {
      setBusy(undefined);
    }
  };

  const setupRequired = error?.toLowerCase().includes("verify your web account") ?? false;
  const continuableCalls = calls?.filter((call) => call.status === "ended" && (call.outcome || call.summary)) ?? [];
  const visibleNumbers = phoneNumbers.length ? phoneNumbers : inboundRoutes.map(profileFromRoute);
  const brandedToolkits = useMemo(() => callToolkits.map((toolkit) => ({ toolkit, brand: resolveProviderBrand({ toolkitSlug: toolkit }) })), [callToolkits]);
  const brandedAccounts = useMemo(() => callAccounts.map((account) => ({ account, brand: resolveProviderBrand({ toolkitSlug: account.toolkit }) })), [callAccounts]);
  const sections: Array<{ id: CallsSection; label: string; description: string }> = [
    { id: "numbers", label: "Phone numbers", description: "Buy and manage the numbers customers call." },
    { id: "representative", label: "Representative", description: "Define how Chusky represents you or your business." },
    { id: "activity", label: "Activity", description: "Place calls and review logs, transcripts, outcomes, and tasks." },
  ];

  return <>
    <PageHeading eyebrow="Voice workspace" title="Calls, with you in control." description="Choose a phone number, configure your representative, and keep every call outcome in one place." action={<Button secondary onClick={() => { void load(); void loadProfile(); void loadNumbers(); }}><RefreshCw size={13} /> <span className="hidden sm:inline">Refresh</span></Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 sm:mb-5 sm:p-4"><div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><div><p>{error}</p>{setupRequired && <p className="mt-1.5 text-amber-900/70">Verify your web account in Settings before using voice calls.</p>}</div></div></Card>}

    <nav aria-label="Calls sections" className="mb-5 grid gap-1 border-b border-foreground/10 sm:grid-cols-3">
      {sections.map((item) => <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-current={section === item.id ? "page" : undefined} className={`border-b-2 px-2 py-3 text-left transition-colors ${section === item.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><span className="block text-xs font-medium">{item.label}</span><span className="mt-1 block text-[10px] leading-4">{item.description}</span></button>)}
    </nav>

    {section === "numbers" && <div className="space-y-4 sm:space-y-5">
      <Card className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your phone numbers</p><h2 className="mt-1.5 font-display text-2xl">Ready for callers</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Every number here is routed to your representative. Customers only see the number and the experience you configure—not the underlying voice service.</p></div><Phone size={20} className="text-muted-foreground" /></div>{numbersError && <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">{numbersError}</p>}{visibleNumbers.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{visibleNumbers.map((number) => <article key={number.phoneNumber} className="flex items-start justify-between gap-3 rounded-lg border border-foreground/10 p-3.5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium tracking-wide">{number.phoneNumber}</p><Status tone="green">Ready</Status></div><p className="mt-1.5 text-[11px] text-muted-foreground">{number.displayName || "Chusky phone number"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{number.source === "managed" ? "Customers can call this number now." : "Connected number · routing is active."}</p><p className="mt-2 text-[10px] text-muted-foreground">Updated {date(new Date(number.updatedAt).toISOString())}</p></div>{number.source === "managed" && <Button secondary disabled={numberPurchaseBusy === number.phoneNumber} onClick={() => void releaseNumber(number)} aria-label={`Release ${number.phoneNumber}`}>{numberPurchaseBusy === number.phoneNumber ? <LoaderCircle size={12} className="animate-spin" /> : <Trash2 size={12} />}<span className="hidden sm:inline">Release</span></Button>}</article>)}</div> : <div className="mt-5 border border-dashed border-foreground/15 p-5 text-xs leading-5 text-muted-foreground">You do not have a phone number yet. Find a number below to give customers a direct line to your representative.</div>}</Card>

      <Card className="p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.05]"><ShoppingBag size={16} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Number inventory</p><h2 className="mt-1.5 font-display text-2xl">Get a new number</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Search by country and optional area code. Buying a number automatically connects it to this workspace and the representative profile.</p></div></div>{!numberManagementAvailable ? <div className="mt-5 border border-amber-300 bg-amber-50 p-3.5 text-[11px] leading-5 text-amber-950">Number purchasing is not enabled for this deployment yet. Existing connected numbers remain available, and an administrator can enable number inventory when billing and voice credentials are ready.</div> : <><div className="mt-5 grid gap-3 sm:grid-cols-[8rem_10rem_auto] sm:items-end"><label className="block text-[11px] text-muted-foreground">Country code<input value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} maxLength={2} placeholder="US" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs uppercase" /></label><label className="block text-[11px] text-muted-foreground">Area code <span className="text-muted-foreground/70">(optional)</span><input value={areaCode} onChange={(event) => setAreaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="415" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><Button disabled={numberSearchBusy || countryCode.trim().length !== 2} onClick={() => void searchNumbers()}>{numberSearchBusy ? <LoaderCircle size={13} className="animate-spin" /> : <Phone size={13} />} Find numbers</Button></div>{numberOptions.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{numberOptions.map((option) => <article key={option.sid} className="flex items-center justify-between gap-3 border border-foreground/10 p-3"><div><p className="text-sm font-medium">{option.phoneNumber}</p><p className="mt-1 text-[10px] text-muted-foreground">{[option.locality, option.region, option.isoCountry].filter(Boolean).join(" · ") || "Voice capable"}</p></div><Button disabled={numberPurchaseBusy === option.phoneNumber} onClick={() => void purchaseNumber(option)}>{numberPurchaseBusy === option.phoneNumber ? <LoaderCircle size={12} className="animate-spin" /> : <ShoppingBag size={12} />} Buy</Button></article>)}</div>}</>}{inboundRoutesError && !visibleNumbers.length && <p className="mt-3 text-[10px] text-muted-foreground">{inboundRoutesError}</p>}</Card>
    </div>}

    {section === "representative" && <div className="space-y-4 sm:space-y-5">
      <ProviderVoiceSettings provider={provider ?? "twilio"} title="Voice" description="Choose the voice your representative uses. The service that delivers the call is managed for you." />
      <Card className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Representative profile</p><h2 className="mt-1.5 font-display text-2xl">How Chusky represents you</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">This profile applies to managed inbound numbers and to outbound calls. Chusky presents itself as the configured assistant, without claiming to be a licensed professional.</p></div><SlidersHorizontal size={18} className="text-muted-foreground" /></div><div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs text-muted-foreground">Representative name<input value={identity} onChange={(event) => setIdentity(event.target.value)} maxLength={180} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Business or personal name <span className="text-muted-foreground/70">(optional)</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={180} placeholder="MedVault" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Contact name <span className="text-muted-foreground/70">(optional)</span><input value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={180} placeholder="The person Chusky is calling" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Conversation purpose<select value={mode} onChange={(event) => setMode(event.target.value as CallMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="general">General assistant</option><option value="sales">Sales</option><option value="onboarding">Onboarding</option><option value="support">Support</option><option value="scheduling">Scheduling</option></select></label><label className="block text-xs text-muted-foreground">Tone<select value={tone} onChange={(event) => setTone(event.target.value as CallTone)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="professional">Professional</option><option value="warm">Warm</option><option value="direct">Direct</option><option value="consultative">Consultative</option></select></label><label className="block text-xs text-muted-foreground">Disclosure<select value={disclosure} onChange={(event) => setDisclosure(event.target.value as CallDisclosure)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="assistant">Configured assistant</option><option value="explicit_ai">Say AI assistant once</option></select></label></div>
        <div className="border border-foreground/10 bg-foreground/[0.02] p-3" aria-live="polite"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Caller-facing preview</p><p className="mt-1.5 text-xs leading-5">Hello, this is {safePreviewIdentity(identity)}, {disclosure === "explicit_ai" ? "an AI assistant" : "an assistant"}{organization.trim() ? ` from ${organization.trim()}` : " calling on behalf of the person or business that asked me to reach you"}.</p><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">The role is disclosed once, naturally. The representative does not claim to be a nurse, doctor, lawyer, accountant, or another licensed professional.</p></div>
        <label className="block text-xs text-muted-foreground">Optional opening<input value={opening} onChange={(event) => setOpening(event.target.value)} maxLength={500} placeholder="Leave empty for a natural introduction" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Verified context, one fact per line<textarea value={facts} onChange={(event) => setFacts(event.target.value)} rows={3} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" /></label><label className="block text-xs text-muted-foreground">Communication guidance, one item per line<textarea value={guardrails} onChange={(event) => setGuardrails(event.target.value)} rows={3} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" /></label>
        <fieldset><legend className="text-xs text-muted-foreground">Read-only context Chusky may consult</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{([["memory_lookup", "Memory"], ["scratchpad_lookup", "Scratchpad"], ["schedule_lookup", "Reminders and schedules"], ["task_lookup", "Tasks"], ["call_history", "Call history"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={capabilities.includes(key)} onChange={(event) => setCapabilities((current) => event.target.checked ? [...new Set([...current, key])] : current.filter((item) => item !== key))} className="accent-foreground" />{label}</label>)}</div></fieldset>
        <fieldset className="border-t border-foreground/10 pt-4"><legend className="text-xs text-muted-foreground">Connected apps</legend><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Choose apps for this representative when calls need business data or an action. Leave all unchecked to let Chusky select from active connections for the caller’s purpose. Actions and schemas load only when needed.</p>{brandedToolkits.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{brandedToolkits.map(({ toolkit, brand }) => <label key={toolkit} className="flex items-center gap-2.5 rounded-md border border-foreground/10 p-2.5 text-[11px]"><input type="checkbox" checked={allowedToolkits.includes(toolkit)} onChange={(event) => setAllowedToolkits((current) => event.target.checked ? [...new Set([...current, toolkit])] : current.filter((item) => item !== toolkit))} className="accent-foreground" /><ToolkitLogo name={brand.name} logo={brand.logo} size={28} /><span className="min-w-0 flex-1"><span className="block font-medium">{brand.name}</span><span className="block text-[10px] text-muted-foreground">Connected app</span></span></label>)}</div> : <p className="mt-3 text-[11px] text-muted-foreground">No active connected apps are available. Connect an app in Apps to enable call actions.</p>}{brandedAccounts.length > 0 && allowedToolkits.length > 0 && <div className="mt-4 border-t border-foreground/10 pt-3"><p className="text-[10px] text-muted-foreground">Optional account restriction</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{brandedAccounts.filter(({ account }) => allowedToolkits.includes(account.toolkit)).map(({ account, brand }) => <label key={account.id} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={allowedConnectionIds.includes(account.id)} onChange={(event) => setAllowedConnectionIds((current) => event.target.checked ? [...new Set([...current, account.id])] : current.filter((item) => item !== account.id))} className="accent-foreground" /><ToolkitLogo name={brand.name} logo={brand.logo} size={22} /><span>{account.alias || brand.name}</span><span className="text-muted-foreground">({account.status.toLowerCase()})</span></label>)}</div><p className="mt-2 text-[10px] text-muted-foreground">If an account is selected, Chusky pins actions to it and will not switch accounts from caller instructions.</p></div>}<label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowExternalWrites} onChange={(event) => setAllowExternalWrites(event.target.checked)} className="accent-foreground" /> Allow approved actions such as bookings, messages, refunds, and updates</label></fieldset>
        <fieldset className="border-t border-foreground/10 pt-4"><legend className="text-xs text-muted-foreground">Call controls</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="block text-[11px] text-muted-foreground">Greeting mode<select value={greetingMode} onChange={(event) => setGreetingMode(event.target.value as typeof greetingMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="dynamic">Dynamic</option><option value="static">Static</option><option value="human_first">Human first</option></select></label><label className="block text-[11px] text-muted-foreground">Transcript retention<select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value) as typeof retentionDays)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value={1}>One day</option><option value={7}>Seven days</option><option value={30}>Thirty days</option></select></label><label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowVoicemail} onChange={(event) => setAllowVoicemail(event.target.checked)} className="accent-foreground" /> Allow voicemail</label><label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowHumanHandoff} onChange={(event) => setAllowHumanHandoff(event.target.checked)} className="accent-foreground" /> Allow human handoff</label><label className="block text-[11px] text-muted-foreground">Recording<select value={recording} onChange={(event) => setRecording(event.target.value as typeof recording)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="disabled">Disabled</option><option value="announce">Announce recording</option><option value="enabled">Enabled</option></select></label></div><label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={quietHoursEnabled} onChange={(event) => setQuietHoursEnabled(event.target.checked)} className="accent-foreground" /> Enforce outbound quiet hours</label>{quietHoursEnabled && <div className="mt-2 grid gap-3 sm:grid-cols-3"><label className="block text-[11px] text-muted-foreground">Timezone<input value={quietTimezone} onChange={(event) => setQuietTimezone(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">From<input type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">Until<input type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label></div>}</fieldset>
        <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4"><Button disabled={profileBusy} onClick={() => void saveProfile()}>{profileBusy ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save representative</Button>{profileMessage && <p role="status" className="text-[11px] text-muted-foreground">{profileMessage}</p>}</div>
      </div></Card>
    </div>}

    {section === "activity" && <div className="space-y-4 sm:space-y-5"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:gap-5"><Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Outbound call</p><h2 className="mt-1.5 font-display text-2xl">Place a call</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Enter the destination and purpose. Chusky uses the saved representative and connected-app policy.</p><div className="mt-5 space-y-3"><label className="block text-xs font-medium">Phone number<input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+1 555 010 0123" inputMode="tel" maxLength={24} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs font-medium">Purpose<textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Confirm tomorrow's appointment" maxLength={1000} rows={3} className="mt-1.5 w-full resize-none border border-foreground/15 bg-background px-2.5 py-2 text-xs leading-5" /></label>{continuableCalls.length > 0 && <label className="block text-xs text-muted-foreground">Continue from a completed call<select value={continuityFromCallId} onChange={(event) => setContinuityFromCallId(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Start fresh</option>{continuableCalls.map((call) => <option key={call.id} value={call.id}>{call.purpose} · {date(call.updatedAt)}</option>)}</select></label>}<div className="flex flex-wrap items-center gap-2"><Button disabled={!available || !normalizePhone(phoneNumber.trim()) || !purpose.trim() || Boolean(busy)} onClick={() => setConfirm(true)}>{busy === "request" ? <LoaderCircle size={13} className="animate-spin" /> : <Phone size={13} />}{available ? "Place call" : "Voice unavailable"}</Button><Button secondary onClick={() => setSection("representative")}><SlidersHorizontal size={13} /> Configure representative</Button></div></div></Card><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call handling</p><h2 className="mt-1.5 font-display text-2xl">Everything stays traceable</h2></div><ShieldCheck size={18} className="text-emerald-600" /></div><div className="mt-4 space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Call state is reconciled as ringing, answered, voicemail, failed, or completed.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Deepgram transcripts and structured outcomes remain attached to the call.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Follow-up tasks, reminders, and tool receipts appear with the call.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Provider credentials and transport details stay out of the customer workflow.</p></div></Card></div><Card><div className="flex items-center justify-between border-b border-foreground/10 p-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call activity</p><h2 className="mt-1 font-display text-2xl">Logs, transcripts, outcomes, and tasks</h2></div><Status tone={available ? "green" : "gray"}>{available ? "Voice ready" : "Not configured"}</Status></div>{calls === undefined ? <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading calls…</div> : !calls.length ? <div className="p-5 text-xs leading-5 text-muted-foreground">No calls yet. Place a call above or wait for a customer to call one of your numbers.</div> : <div>{calls.map((call) => <CallActivityTabs key={call.id} call={call} tasks={tasks} tasksLoading={tasksLoading} tasksError={tasksError} busy={busy} onControl={(input) => void control(call, input)} />)}</div>}</Card></div>}

    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Place this phone call?" description={`Chusky will dial ${phoneNumber || "this number"} now about: ${purpose || "the stated purpose"}.`} confirmLabel="Place call" onConfirm={() => { setConfirm(false); return requestCall(); }} />
  </>;
}

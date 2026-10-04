"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, Check, CircleHelp, Globe2, LoaderCircle, MessagesSquare, PlugZap, RefreshCw, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ChuskyApiError, chuskyApi } from "@/lib/chusky-api";
import {
  ONBOARDING_MEMORY_KEY,
  clearOnboardingDraft,
  clearOnboardingSkip,
  defaultOnboardingProfile,
  loadOnboardingDraft,
  markOnboardingSkipped,
  parseOnboardingProfile,
  safeOnboardingError,
  saveOnboardingDraft,
  setOnboardingActivationDraft,
  serializeOnboardingProfile,
  type OnboardingAutonomy,
  type OnboardingProfile,
  type OnboardingTone,
} from "@/lib/onboarding";
import { Button, Card } from "@/components/app/app-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Context", title: "Start with the right context.", description: "Tell Chusky whether to frame your work personally or around a business. This is private agent context, not a billing or organization setting." },
  { label: "About you", title: "Give Chusky the useful details.", description: "A little context helps the agent make better decisions without making assumptions." },
  { label: "Outcomes", title: "What should move forward first?", description: "Choose the kind of work you want to delegate and name the first outcome that matters." },
  { label: "Working style", title: "Set the pace and boundaries.", description: "Choose how Chusky should communicate and when it should pause for your approval." },
  { label: "Review", title: "Ready to give Chusky a starting point?", description: "Review the profile before it becomes private agent context. You can change it later." },
] as const;

const goals = [
  ["research", "Research and analysis", "Find, compare, and explain useful information."],
  ["communication", "Communication", "Prepare messages, follow-ups, and responses."],
  ["planning", "Planning and reminders", "Turn intentions into clear next steps and schedules."],
  ["documents", "Files and reports", "Create polished documents, reports, and presentations."],
  ["meetings", "Meetings and calls", "Prepare, join, summarize, and follow through."],
  ["operations", "Business operations", "Keep recurring work, handoffs, and decisions moving."],
  ["coding", "Coding and technical work", "Investigate code, build changes, and document systems."],
  ["connected_apps", "Connected apps", "Coordinate work across the apps you already use."],
] as const;

const workstreams = [
  ["research", "Research"], ["communication", "Communication"], ["planning", "Planning"], ["documents", "Documents"],
  ["meetings", "Meetings"], ["operations", "Operations"],
] as const;

const toneOptions: Array<[OnboardingTone, string, string]> = [
  ["concise", "Concise", "Lead with the answer and keep updates short."],
  ["professional", "Professional", "Clear, structured, and ready to share."],
  ["detailed", "Detailed", "Explain the reasoning and important trade-offs."],
  ["warm", "Warm", "A little more conversational and human."],
];

const autonomyOptions: Array<[OnboardingAutonomy, string, string]> = [
  ["ask", "Ask before important actions", "Pause before external messages, calls, or other meaningful changes."],
  ["suggest", "Suggest a plan first", "Prepare the next steps, then let you approve the direction."],
  ["bounded", "Work within clear boundaries", "Move independently on low-risk work while keeping approval gates."],
];

const roleOptions = [
  ["Founder / owner", "Founder / owner"], ["Product / engineering", "Product / engineering"], ["Design", "Design"],
  ["Marketing / growth", "Marketing / growth"], ["Sales / customer success", "Sales / customer success"], ["Operations", "Operations"],
  ["Consulting / professional services", "Consulting / professional services"], ["Student / researcher", "Student / researcher"], ["Other", "Other"],
] as const;

const starterOutcomes = {
  personal: [
    "Turn my priorities into a realistic plan for this week, with the next action for each important item.",
    "Research a decision I am considering and compare the best options, trade-offs, and next steps.",
    "Help me organize a project into clear next actions, reminders, and a simple plan I can follow.",
    "Review my upcoming commitments and suggest what should move first, what can wait, and why.",
  ],
  business: [
    "Prepare a concise brief about our company, customers, current priorities, and the most useful ways Chusky can help.",
    "Turn our weekly priorities into a plan with owners, deadlines, dependencies, and follow-ups.",
    "Research our market and give me a short list of the three most important opportunities or risks to review.",
    "Review our customer and team follow-ups, then draft the most important responses and next actions.",
  ],
} as const;

const industryOptions = [
  ["Technology / software", "Technology / software"], ["Finance", "Finance"], ["Healthcare", "Healthcare"], ["Education", "Education"],
  ["Ecommerce / retail", "Ecommerce / retail"], ["Marketing / agency", "Marketing / agency"], ["Professional services", "Professional services"],
  ["Nonprofit / public sector", "Nonprofit / public sector"], ["Other", "Other"],
] as const;

const timezoneOptions = [
  ["UTC", "UTC"], ["Europe/London", "Europe/London"], ["Europe/Paris", "Europe/Paris"], ["Europe/Berlin", "Europe/Berlin"],
  ["Africa/Lagos", "Africa/Lagos"], ["Africa/Nairobi", "Africa/Nairobi"], ["Asia/Dubai", "Asia/Dubai"], ["Asia/Kolkata", "Asia/Kolkata"],
  ["Asia/Singapore", "Asia/Singapore"], ["Asia/Tokyo", "Asia/Tokyo"], ["Australia/Sydney", "Australia/Sydney"], ["America/New_York", "America/New_York"],
  ["America/Chicago", "America/Chicago"], ["America/Denver", "America/Denver"], ["America/Los_Angeles", "America/Los_Angeles"], ["Pacific/Auckland", "Pacific/Auckland"],
  ["Other", "Other"],
] as const;

function ChoiceCard({ selected, onClick, icon, title, description }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; description: string }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cn("flex min-w-0 w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-left transition-[border-color,background-color,box-shadow] hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:flex-1 sm:gap-3 sm:p-3", selected ? "border-foreground bg-foreground/[0.045] shadow-sm" : "border-foreground/12 bg-background")}>
      {icon && <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border sm:h-8 sm:w-8", selected ? "border-foreground bg-foreground text-background" : "border-foreground/12 text-muted-foreground")} aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1 break-words"><span className="block text-xs font-medium">{title}</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{description}</span></span>
      {selected && <Check size={14} className="ml-auto mt-0.5 shrink-0" aria-hidden="true" />}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; maxLength?: number }) {
  return <label className="block text-xs font-medium">{label}{required && <span className="ml-1 text-amber-700" aria-hidden="true">*</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} className="mt-1.5 min-h-10 w-full rounded-md border border-foreground/15 bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/45 focus:ring-2 focus:ring-foreground/10" /></label>;
}

function SelectField({ label, value, onChange, options, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]>; placeholder: string; required?: boolean }) {
  const hasSavedValue = value !== "" && !options.some(([optionValue]) => optionValue === value);
  return <label className="block min-w-0 text-xs font-medium">{label}{required && <span className="ml-1 text-amber-700" aria-hidden="true">*</span>}<Select value={value} onValueChange={onChange} required={required}><SelectTrigger className="mt-1.5 h-10 min-h-10 w-full min-w-0 rounded-md border-foreground/15 bg-background px-3 text-xs shadow-none hover:-translate-y-0 hover:border-foreground/40"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent align="start" className="max-h-64 w-[var(--radix-select-trigger-width)]">{hasSavedValue && <SelectItem value={value} className="text-xs">{value} · saved</SelectItem>}{options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue} className="text-xs">{optionLabel}</SelectItem>)}</SelectContent></Select></label>;
}

function TextField({ label, value, onChange, placeholder, rows = 4, required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; required?: boolean; maxLength?: number }) {
  return <label className="block text-xs font-medium">{label}{required && <span className="ml-1 text-amber-700" aria-hidden="true">*</span>}<textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} required={required} maxLength={maxLength} className="mt-1.5 w-full resize-none rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/45 focus:ring-2 focus:ring-foreground/10" /></label>;
}

function StarterOutcomeSuggestions({ accountType, onSelect }: { accountType: OnboardingProfile["accountType"]; onSelect: (value: string) => void }) {
  return <div className="mt-2"><p className="mb-1.5 text-[10px] font-medium text-muted-foreground">Try a real starting point</p><div className="flex flex-wrap gap-1.5">{starterOutcomes[accountType].map((outcome) => <button type="button" key={outcome} onClick={() => onSelect(outcome)} className="rounded-md border border-foreground/12 px-2 py-1.5 text-left text-[10px] leading-4 text-muted-foreground transition-colors hover:border-foreground/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30">{outcome}</button>)}</div></div>;
}

function ActivationCard({ profile, userId, returnTo, onReturn }: { profile: OnboardingProfile; userId?: string; returnTo: string; onReturn: () => void }) {
  const router = useRouter();
  const startOutcome = () => {
    setOnboardingActivationDraft(userId, profile.firstOutcome);
    router.replace(`/app/chat?new=1&onboarding=1&nonce=${Date.now()}`);
  };

  return (
      <div className="mx-auto min-w-0 max-w-4xl pb-8">
      <div className="mb-5 max-w-2xl"><p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-700">Profile saved</p><h1 className="font-display text-[1.7rem] leading-[0.98] tracking-tight sm:text-[2.45rem]">Give Chusky something real to do.</h1><p className="mt-2 text-xs leading-relaxed sm:text-sm text-muted-foreground">Your private profile is ready. Start with the outcome you wrote down, or finish connecting the parts of your workspace that Chusky can use.</p></div>
      <Card className="overflow-hidden">
        <div className="border-b border-foreground/10 bg-foreground/[0.018] p-4 sm:p-6"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white"><Check size={17} aria-hidden="true" /></span><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Your first outcome</p><p className="mt-1 break-words text-sm font-medium leading-6">{profile.firstOutcome}</p></div></div><p className="mt-4 flex gap-2 border border-foreground/10 bg-background/70 p-3 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />Saved to your private Chusky account. It guides the agent and is not published, shared with other users, or used to change billing.</p>{profile.websiteSummary && <p className="mt-2 flex gap-2 border border-foreground/10 bg-background/70 p-3 text-[11px] leading-relaxed text-muted-foreground"><Globe2 size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />Your reviewed public-site brief is also saved as private context for the agent.</p>}</div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-6">
          <button type="button" onClick={startOutcome} className="flex min-h-24 items-start gap-3 rounded-lg border border-primary bg-primary p-3 text-left text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><MessagesSquare size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span><span className="block text-xs font-medium">Try the first outcome</span><span className="mt-1 block text-[11px] leading-relaxed text-primary-foreground/70">Open a new conversation with your outcome ready to send.</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium">Start in chat <ArrowRight size={12} aria-hidden="true" /></span></span></button>
          <Link href="/app/apps" className="flex min-h-24 items-start gap-3 rounded-lg border border-foreground/12 p-3 transition-colors hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"><PlugZap size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs font-medium">Connect apps</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Review the apps Chusky can use on your behalf.</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium">Open connected apps <ArrowUpRight size={12} aria-hidden="true" /></span></span></Link>
          <Link href="/app/channels" className="flex min-h-24 items-start gap-3 rounded-lg border border-foreground/12 p-3 transition-colors hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"><MessagesSquare size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs font-medium">Link your channels</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Use the same private agent context from Telegram and other linked channels.</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium">Open channels <ArrowUpRight size={12} aria-hidden="true" /></span></span></Link>
          {profile.accountType === "business" && <Link href="/app/organizations" className="flex min-h-24 items-start gap-3 rounded-lg border border-foreground/12 p-3 transition-colors hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"><Building2 size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs font-medium">Set up a shared workspace</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Create an organization, invite teammates, and configure business agents separately.</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium">Open organizations <ArrowUpRight size={12} aria-hidden="true" /></span></span></Link>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10 px-4 py-3 sm:px-6"><p className="text-[10px] text-muted-foreground">You can revisit this profile from Account → Agent profile.</p><Button secondary onClick={() => { if (returnTo !== "/app/onboarding") onReturn(); else router.replace("/app"); }}>Open dashboard</Button></div>
      </Card>
    </div>
  );
}

export function OnboardingPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile());
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [websiteResearching, setWebsiteResearching] = useState(false);
  const [websiteResearchError, setWebsiteResearchError] = useState<string>();
  const [error, setError] = useState<string>();
  const [savedBefore, setSavedBefore] = useState(false);
  const [activationProfile, setActivationProfile] = useState<OnboardingProfile>();
  const [returnTo, setReturnTo] = useState("/app");

  useEffect(() => {
    let active = true;
    const candidate = new URLSearchParams(window.location.search).get("returnTo");
    if (candidate === "/app" || candidate?.startsWith("/app/")) setReturnTo(candidate);
    setLoading(true);
    setLoadFailed(false);
    void chuskyApi.memory.getByKey(ONBOARDING_MEMORY_KEY).then((result) => {
      if (!active) return;
      const saved = result.data.find((item) => item.key === ONBOARDING_MEMORY_KEY);
      const parsed = saved ? parseOnboardingProfile(saved.value) : undefined;
      if (parsed) {
        setProfile(parsed);
        setSavedBefore(true);
        clearOnboardingDraft(userId);
        clearOnboardingSkip(userId);
      } else {
        const draft = loadOnboardingDraft(userId);
        if (draft) setProfile(draft);
        else if (session?.user?.name) setProfile((current) => ({ ...current, name: session.user.name }));
      }
      setError(undefined);
    }).catch((cause) => {
      if (!active) return;
      const draft = loadOnboardingDraft(userId);
      if (draft) setProfile(draft);
      setLoadFailed(true);
      setError(safeOnboardingError(cause, "We could not verify your existing profile. Retry before saving so existing context is not overwritten."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadAttempt, session?.user?.id, session?.user?.name, userId]);

  useEffect(() => {
    if (!loading && !savedBefore && !activationProfile) saveOnboardingDraft(userId, profile);
  }, [activationProfile, loading, profile, savedBefore, userId]);

  const update = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const updateWebsiteUrl = (value: string) => setProfile((current) => ({
    ...current,
    websiteUrl: value,
    ...(current.websiteSummary && current.websiteSummaryUrl !== value.trim() ? { websiteSummary: undefined, websiteSummaryUrl: undefined, websiteSummaryUpdatedAt: undefined } : {}),
  }));
  const toggleList = (key: "goals" | "workstreams", value: string) => setProfile((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(profile.name.trim());
    if (step === 1) return Boolean(profile.role.trim() && profile.workDescription.trim() && (profile.accountType === "personal" || profile.companyName.trim()));
    if (step === 2) return profile.goals.length > 0 && Boolean(profile.firstOutcome.trim());
    return true;
  }, [profile, step]);

  const researchWebsite = async () => {
    if (profile.accountType !== "business" || !profile.websiteUrl.trim() || websiteResearching) return;
    setWebsiteResearching(true);
    setWebsiteResearchError(undefined);
    try {
      const result = await chuskyApi.onboarding.researchWebsite(profile.websiteUrl.trim());
      setProfile((current) => ({ ...current, websiteUrl: result.data.websiteUrl, websiteSummary: result.data.summary, websiteSummaryUrl: result.data.websiteUrl, websiteSummaryUpdatedAt: result.data.researchedAt }));
    } catch (error) {
      setWebsiteResearchError(error instanceof ChuskyApiError ? error.message : "Chusky could not read that public website right now. You can continue without it or try again.");
    } finally {
      setWebsiteResearching(false);
    }
  };

  const save = async () => {
    if (loadFailed || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const next = { ...profile, completedAt: new Date().toISOString(), version: 1 };
      await chuskyApi.memory.save({ category: "profile", key: ONBOARDING_MEMORY_KEY, value: serializeOnboardingProfile(next), confidence: 1, sensitivity: "normal" });
      clearOnboardingDraft(userId);
      clearOnboardingSkip(userId);
      setSavedBefore(true);
      setActivationProfile(next);
    } catch (cause) {
      setError(safeOnboardingError(cause, "Chusky could not confirm that your profile save completed. Your answers are still on this page; please try again."));
    } finally { setSaving(false); }
  };

  const next = () => { if (!canContinue || loadFailed || saving) return; if (step === steps.length - 1) void save(); else setStep((current) => current + 1); };
  const skip = () => { markOnboardingSkipped(userId); clearOnboardingDraft(userId); router.replace(returnTo); };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite"><LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> Loading your profile…</div>;
  if (activationProfile) return <ActivationCard profile={activationProfile} userId={userId} returnTo={returnTo} onReturn={() => router.replace(returnTo)} />;

  return <div className="mx-auto min-w-0 max-w-4xl pb-5 sm:pb-8">
    <div className="mb-4 flex items-start justify-between gap-2 sm:mb-7 sm:gap-4"><div className="min-w-0"><p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{savedBefore ? "Agent profile" : "Profile setup"}</p><h1 className="max-w-2xl font-display text-[1.55rem] leading-[0.98] tracking-tight sm:text-[2.35rem]">{savedBefore ? "Tune how Chusky works with you." : "Give Chusky a better starting point."}</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">A few answers become private context for your agent. Keep it practical, change it whenever your work changes.</p></div><button type="button" onClick={skip} disabled={saving} className="min-h-8 shrink-0 rounded-md px-1.5 pt-1 text-[10px] text-muted-foreground underline underline-offset-4 hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50">Skip for now</button></div>
    <div className="mb-3 flex items-center gap-1.5" role="progressbar" aria-label={`Onboarding step ${step + 1} of ${steps.length}`} aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-valuetext={`${steps[step].label}, step ${step + 1} of ${steps.length}`}>
      {steps.map((item, index) => <div key={item.label} className="flex min-w-0 flex-1 items-center gap-1.5"><span className={cn("h-1.5 w-full rounded-full transition-colors", index <= step ? "bg-foreground" : "bg-foreground/10")} aria-hidden="true" /><span className={cn("hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] sm:inline", index === step ? "text-foreground" : "text-muted-foreground/60")}>{item.label}</span></div>)}
    </div>
    <Card className="overflow-hidden">
      <div className="border-b border-foreground/10 bg-foreground/[0.018] px-3 py-3.5 sm:px-6 sm:py-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Step {step + 1} of {steps.length}</p><h2 className="mt-1 font-display text-[1.2rem] leading-tight sm:text-[1.6rem]">{steps[step].title}</h2><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{steps[step].description}</p></div>
      <div className="min-h-0 p-3 sm:min-h-[340px] sm:p-6">
        {step === 0 && <div className="space-y-5"><div><p className="mb-2 text-xs font-medium">How should Chusky frame your work?</p><div className="grid gap-2 sm:grid-cols-2"><ChoiceCard selected={profile.accountType === "personal"} onClick={() => update("accountType", "personal")} icon={<UserRound size={16} />} title="Personal context" description="For your own work, planning, learning, and everyday tasks." /><ChoiceCard selected={profile.accountType === "business"} onClick={() => update("accountType", "business")} icon={<BriefcaseBusiness size={16} />} title="Business context" description="For a company, team, or repeatable business operations." /></div></div><Field label="What should Chusky call you?" value={profile.name} onChange={(value) => update("name", value)} placeholder="Your name" required maxLength={120} /><div className="flex gap-2 border border-foreground/10 bg-foreground/[0.025] p-3 text-[11px] leading-relaxed text-muted-foreground"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /><p>This is private agent context. It does not change your account type, billing, organization membership, or sharing settings.</p></div></div>}
        {step === 1 && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Your role" value={profile.role} onChange={(value) => update("role", value)} options={roleOptions} placeholder="Choose your role" required /><SelectField label="Industry or area" value={profile.industry} onChange={(value) => update("industry", value)} options={industryOptions} placeholder="Choose an industry" /><SelectField label="Time zone" value={profile.timezone} onChange={(value) => update("timezone", value)} options={timezoneOptions} placeholder="Choose a time zone" /></div><TextField label="What kind of work do you usually do?" value={profile.workDescription} onChange={(value) => update("workDescription", value)} placeholder="I help early-stage teams turn customer feedback into product decisions and clear launch plans." required maxLength={2400} />{profile.accountType === "business" && <div className="space-y-4 border-t border-foreground/10 pt-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Company or team name" value={profile.companyName} onChange={(value) => update("companyName", value)} placeholder="Acme Studio" required maxLength={180} /><label className="block text-xs font-medium">Team size<select value={profile.teamSize} onChange={(event) => update("teamSize", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-foreground/15 bg-background px-3 text-xs outline-none focus:border-foreground/45"><option value="">Choose a range</option><option>Just me</option><option>2–10</option><option>11–50</option><option>51–200</option><option>200+</option></select></label></div><div className="flex items-start gap-2"><Globe2 size={14} className="mt-7 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><Field label="Public website (optional)" value={profile.websiteUrl} onChange={updateWebsiteUrl} placeholder="https://yourcompany.com" maxLength={2_000} /><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">At the final step, Chusky can read public pages only and prepare a factual draft for you to review before it becomes private agent context.</p></div></div><TextField label="What is the business trying to improve?" value={profile.businessGoal} onChange={(value) => update("businessGoal", value)} placeholder="Reduce manual follow-up, respond faster to customers, and keep projects moving." rows={3} maxLength={2400} /></div>}</div>}
        {step === 2 && <div className="space-y-5"><div><p className="mb-2 text-xs font-medium">What should Chusky help with?</p><div className="grid gap-2 sm:grid-cols-2">{goals.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.goals.includes(value)} onClick={() => toggleList("goals", value)} title={title} description={description} />)}</div></div><TextField label="What is the first outcome you want?" value={profile.firstOutcome} onChange={(value) => update("firstOutcome", value)} placeholder="Help me turn my weekly priorities into a clear plan and follow up on the important tasks." required maxLength={2400} /><StarterOutcomeSuggestions accountType={profile.accountType} onSelect={(value) => update("firstOutcome", value)} /></div>}
        {step === 3 && <div className="space-y-6"><div><p className="mb-2 text-xs font-medium">How should responses feel?</p><div className="grid gap-2 sm:grid-cols-2">{toneOptions.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.tone === value} onClick={() => update("tone", value)} title={title} description={description} />)}</div></div><div><p className="mb-2 text-xs font-medium">How should Chusky handle initiative?</p><div className="space-y-2">{autonomyOptions.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.autonomy === value} onClick={() => update("autonomy", value)} title={title} description={description} />)}</div></div><div><p className="mb-2 text-xs font-medium">Which workstreams matter most?</p><div className="flex flex-wrap gap-2">{workstreams.map(([value, label]) => <button type="button" key={value} aria-pressed={profile.workstreams.includes(value)} onClick={() => toggleList("workstreams", value)} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30", profile.workstreams.includes(value) ? "border-foreground bg-foreground text-background" : "border-foreground/15 text-muted-foreground hover:border-foreground/35 hover:text-foreground")}>{label}</button>)}</div></div><div className="flex gap-2 border border-foreground/10 bg-foreground/[0.025] p-3 text-[11px] leading-relaxed text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><p>These preferences guide Chusky’s behavior. Approval gates still protect external actions and sensitive changes.</p></div></div>}
        {step === 4 && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Context</p><p className="mt-1 break-words text-xs font-medium">{profile.accountType === "business" ? profile.companyName || "Business context" : "Personal context"}</p><p className="mt-1 break-words text-[10px] text-muted-foreground">{profile.name}{profile.role ? ` · ${profile.role}` : ""}</p></div><div className="rounded-md border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Work context</p><p className="mt-1 break-words text-xs font-medium">{profile.industry || "Your work"}</p><p className="mt-1 line-clamp-3 break-words text-[10px] text-muted-foreground">{profile.workDescription}</p></div></div><div className="rounded-md border border-foreground/10 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Desired outcomes</p><div className="mt-2 flex flex-wrap gap-1.5">{profile.goals.map((goal) => <span key={goal} className="rounded-full bg-foreground/[0.06] px-2 py-1 text-[10px]">{goals.find(([value]) => value === goal)?.[1] ?? goal}</span>)}</div><p className="mt-3 break-words text-xs leading-relaxed">{profile.firstOutcome}</p></div><div className="rounded-md border border-foreground/10 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Working style</p><p className="mt-1 break-words text-xs font-medium">{toneOptions.find(([value]) => value === profile.tone)?.[1]} · {autonomyOptions.find(([value]) => value === profile.autonomy)?.[1]}</p><p className="mt-1 break-words text-[10px] text-muted-foreground">Workstreams: {profile.workstreams.join(", ") || "Not specified"}</p></div>{profile.accountType === "business" && <div className="rounded-md border border-foreground/10 p-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><Globe2 size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Public website context</p><p className="mt-1 break-all text-[11px] text-muted-foreground">{profile.websiteUrl || "No website added"}</p></div></div><Button secondary disabled={!profile.websiteUrl.trim() || websiteResearching} onClick={() => void researchWebsite()} className="shrink-0">{websiteResearching ? <LoaderCircle size={12} className="animate-spin" aria-hidden="true" /> : <Search size={12} aria-hidden="true" />}{websiteResearching ? "Researching…" : profile.websiteSummary ? "Refresh summary" : "Research public site"}</Button></div>{profile.websiteSummary && <div className="mt-3 whitespace-pre-wrap border-t border-foreground/10 pt-3 text-[11px] leading-5"><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">AI-drafted from public pages · review before saving</p>{profile.websiteSummary}</div>}{!profile.websiteSummary && profile.websiteUrl.trim() && <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Nothing is saved yet. Research the site to preview what Chusky can use, then save the profile.</p>}{websiteResearchError && <p role="alert" className="mt-2 text-[10px] text-amber-800">{websiteResearchError}</p>}{profile.websiteSummary && <p className="mt-2 text-[10px] text-muted-foreground">This reviewed summary will be saved as private agent context with the profile.</p>}</div>}<div className="flex gap-2 border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950"><Check size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><p>This will be saved as private profile context for your Chusky account. It can be edited from this page or removed from Memory.</p></div></div>}
      </div>
      {error && <div role="alert" className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-950 sm:mx-6 sm:mb-4"><span>{error}</span>{loadFailed && <Button secondary onClick={() => { setError(undefined); setLoadAttempt((current) => current + 1); }}><RefreshCw size={12} aria-hidden="true" /> Retry</Button>}</div>}
      <div className="grid grid-cols-2 gap-2 border-t border-foreground/10 px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:px-6 sm:py-3"><button type="button" onClick={() => step === 0 ? skip() : setStep((current) => current - 1)} disabled={saving} className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50 sm:w-auto sm:gap-1.5 sm:px-2 sm:text-xs"><ArrowLeft size={13} aria-hidden="true" />{step === 0 ? "Skip" : "Back"}</button><Button disabled={!canContinue || saving || loadFailed} onClick={next} className="w-full sm:w-auto">{saving ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" /> : step === steps.length - 1 ? <Check size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}{saving ? "Saving…" : step === steps.length - 1 ? "Save profile" : "Continue"}</Button></div>
    </Card>
  </div>;
}

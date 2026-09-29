"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CircleHelp, LoaderCircle, Sparkles, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { chuskyApi } from "@/lib/chusky-api";
import { cn } from "@/lib/utils";
import { ONBOARDING_MEMORY_KEY, defaultOnboardingProfile, parseOnboardingProfile, serializeOnboardingProfile, type OnboardingAutonomy, type OnboardingProfile, type OnboardingTone } from "@/lib/onboarding";
import { Button, Card } from "@/components/app/app-shell";

const steps = [
  { label: "Workspace", title: "Start with the right context.", description: "Tell Chusky whether this is for your personal work or a business workspace." },
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

function ChoiceCard({ selected, onClick, icon, title, description }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; description: string }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={cn("flex min-w-0 w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-left transition-[border-color,background-color,box-shadow] hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:flex-1 sm:gap-3 sm:p-3", selected ? "border-foreground bg-foreground/[0.045] shadow-sm" : "border-foreground/12 bg-background")}>{icon && <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border sm:h-8 sm:w-8", selected ? "border-foreground bg-foreground text-background" : "border-foreground/12 text-muted-foreground")}>{icon}</span>}<span className="min-w-0 flex-1 break-words"><span className="block text-[11px] font-medium sm:text-xs">{title}</span><span className="mt-1 block text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">{description}</span></span>{selected && <Check size={14} className="ml-auto mt-0.5 shrink-0" />}</button>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; maxLength?: number }) {
  return <label className="block text-xs font-medium">{label}{required && <span className="ml-1 text-amber-700">*</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} className="mt-1.5 min-h-10 w-full rounded-md border border-foreground/15 bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/45 focus:ring-2 focus:ring-foreground/10" /></label>;
}

function TextField({ label, value, onChange, placeholder, rows = 4, required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; required?: boolean; maxLength?: number }) {
  return <label className="block text-xs font-medium">{label}{required && <span className="ml-1 text-amber-700">*</span>}<textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} required={required} maxLength={maxLength} className="mt-1.5 w-full resize-none rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/45 focus:ring-2 focus:ring-foreground/10" /></label>;
}

export function OnboardingPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [savedBefore, setSavedBefore] = useState(false);
  const [returnTo, setReturnTo] = useState("/app");

  useEffect(() => {
    let active = true;
    const candidate = new URLSearchParams(window.location.search).get("returnTo");
    if (candidate?.startsWith("/app") && !candidate.startsWith("//")) setReturnTo(candidate);
    void chuskyApi.memory.list(ONBOARDING_MEMORY_KEY).then((result) => {
      if (!active) return;
      const saved = result.data.find((item) => item.key === ONBOARDING_MEMORY_KEY);
      const parsed = saved ? parseOnboardingProfile(saved.value) : undefined;
      if (parsed) {
        setProfile(parsed);
        setSavedBefore(true);
      } else if (session?.user?.name) {
        setProfile((current) => ({ ...current, name: session.user.name }));
      }
    }).catch(() => {
      if (active) setError("We could not load your existing profile. You can still complete a new one.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.user?.name]);

  const update = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const toggleList = (key: "goals" | "workstreams", value: string) => setProfile((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(profile.name.trim());
    if (step === 1) return Boolean(profile.role.trim() && profile.workDescription.trim() && (profile.accountType === "personal" || profile.companyName.trim()));
    if (step === 2) return profile.goals.length > 0 && Boolean(profile.firstOutcome.trim());
    return true;
  }, [profile, step]);

  const save = async () => {
    setSaving(true); setError(undefined);
    try {
      const next = { ...profile, completedAt: new Date().toISOString(), version: 1 };
      await chuskyApi.memory.save({ category: "profile", key: ONBOARDING_MEMORY_KEY, value: serializeOnboardingProfile(next), confidence: 1, sensitivity: "normal" });
      router.replace(returnTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved. Please try again.");
    } finally { setSaving(false); }
  };

  const next = () => { if (!canContinue) return; if (step === steps.length - 1) void save(); else setStep((current) => current + 1); };
  const skip = () => router.replace(returnTo);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading your profile…</div>;

  return <div className="mx-auto min-w-0 max-w-4xl pb-5 sm:pb-8">
    <div className="mb-4 flex items-start justify-between gap-2 sm:mb-7 sm:gap-4">
      <div className="min-w-0">
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{savedBefore ? "Agent profile" : "Workspace setup"}</p>
        <h1 className="max-w-2xl font-display text-[1.55rem] leading-[0.98] tracking-tight sm:text-[2.35rem]">{savedBefore ? "Tune how Chusky works with you." : "Give Chusky a better starting point."}</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted-foreground sm:text-sm">A few answers become private context for your agent. Keep it practical, change it whenever your work changes.</p>
      </div>
      <button type="button" onClick={skip} className="min-h-8 shrink-0 rounded-md px-1.5 pt-1 text-[10px] text-muted-foreground underline underline-offset-4 hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30">Skip</button>
    </div>

    <div className="mb-3 flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
      {steps.map((item, index) => <div key={item.label} className="flex min-w-0 flex-1 items-center gap-1.5"><span className={cn("h-1.5 w-full rounded-full transition-colors", index <= step ? "bg-foreground" : "bg-foreground/10")} /><span className={cn("hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] sm:inline", index === step ? "text-foreground" : "text-muted-foreground/60")}>{item.label}</span></div>)}
    </div>

    <Card className="overflow-hidden">
      <div className="border-b border-foreground/10 bg-foreground/[0.018] px-3 py-3.5 sm:px-6 sm:py-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Step {step + 1} of {steps.length}</p>
        <h2 className="mt-1 font-display text-[1.2rem] leading-tight sm:text-[1.6rem]">{steps[step].title}</h2>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{steps[step].description}</p>
      </div>

      <div className="min-h-0 p-3 sm:min-h-[340px] sm:p-6">
        {step === 0 && <div className="space-y-5"><div><p className="mb-2 text-xs font-medium">How will you use Chusky?</p><div className="grid gap-2 sm:grid-cols-2"><ChoiceCard selected={profile.accountType === "personal"} onClick={() => update("accountType", "personal")} icon={<UserRound size={16} />} title="Personal workspace" description="For your own work, planning, learning, and everyday tasks." /><ChoiceCard selected={profile.accountType === "business"} onClick={() => update("accountType", "business")} icon={<BriefcaseBusiness size={16} />} title="Business workspace" description="For a company, team, or repeatable business operations." /></div></div><Field label="What should Chusky call you?" value={profile.name} onChange={(value) => update("name", value)} placeholder="Your name" required maxLength={120} /><div className="flex gap-2 border border-foreground/10 bg-foreground/[0.025] p-3 text-[10px] leading-relaxed text-muted-foreground"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-600" /><p>This does not change your account type or billing. It helps Chusky address you naturally and keep personal and business context distinct.</p></div></div>}

        {step === 1 && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Your role" value={profile.role} onChange={(value) => update("role", value)} placeholder={profile.accountType === "business" ? "Founder, operator, team lead…" : "Designer, student, consultant…"} required maxLength={160} /><Field label="Industry or area" value={profile.industry} onChange={(value) => update("industry", value)} placeholder="Technology, education, finance…" maxLength={180} /><Field label="Time zone" value={profile.timezone} onChange={(value) => update("timezone", value)} placeholder="Europe/London" maxLength={100} /></div><TextField label="What kind of work do you usually do?" value={profile.workDescription} onChange={(value) => update("workDescription", value)} placeholder="I help early-stage teams turn customer feedback into product decisions and clear launch plans." required maxLength={2400} />{profile.accountType === "business" && <div className="space-y-4 border-t border-foreground/10 pt-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Company or team name" value={profile.companyName} onChange={(value) => update("companyName", value)} placeholder="Acme Studio" required maxLength={180} /><label className="block text-xs font-medium">Team size<select value={profile.teamSize} onChange={(event) => update("teamSize", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-foreground/15 bg-background px-3 text-xs outline-none focus:border-foreground/45"><option value="">Choose a range</option><option>Just me</option><option>2–10</option><option>11–50</option><option>51–200</option><option>200+</option></select></label></div><TextField label="What is the business trying to improve?" value={profile.businessGoal} onChange={(value) => update("businessGoal", value)} placeholder="Reduce manual follow-up, respond faster to customers, and keep projects moving." rows={3} maxLength={2400} /></div>}</div>}

        {step === 2 && <div className="space-y-5"><div><p className="mb-2 text-xs font-medium">What should Chusky help with?</p><div className="grid gap-2 sm:grid-cols-2">{goals.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.goals.includes(value)} onClick={() => toggleList("goals", value)} title={title} description={description} />)}</div></div><TextField label="What is the first outcome you want?" value={profile.firstOutcome} onChange={(value) => update("firstOutcome", value)} placeholder="Help me turn my weekly priorities into a clear plan and follow up on the important tasks." required maxLength={2400} /></div>}

        {step === 3 && <div className="space-y-6"><div><p className="mb-2 text-xs font-medium">How should responses feel?</p><div className="grid gap-2 sm:grid-cols-2">{toneOptions.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.tone === value} onClick={() => update("tone", value)} title={title} description={description} />)}</div></div><div><p className="mb-2 text-xs font-medium">How should Chusky handle initiative?</p><div className="space-y-2">{autonomyOptions.map(([value, title, description]) => <ChoiceCard key={value} selected={profile.autonomy === value} onClick={() => update("autonomy", value)} title={title} description={description} />)}</div></div><div><p className="mb-2 text-xs font-medium">Which workstreams matter most?</p><div className="flex flex-wrap gap-2">{workstreams.map(([value, label]) => <button type="button" key={value} aria-pressed={profile.workstreams.includes(value)} onClick={() => toggleList("workstreams", value)} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30", profile.workstreams.includes(value) ? "border-foreground bg-foreground text-background" : "border-foreground/15 text-muted-foreground hover:border-foreground/35 hover:text-foreground")}>{label}</button>)}</div></div><div className="flex gap-2 border border-foreground/10 bg-foreground/[0.025] p-3 text-[10px] leading-relaxed text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0" /><p>These preferences guide Chusky’s behavior. Approval gates still protect external actions and sensitive changes.</p></div></div>}

        {step === 4 && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Workspace</p><p className="mt-1 break-words text-xs font-medium">{profile.accountType === "business" ? profile.companyName || "Business workspace" : "Personal workspace"}</p><p className="mt-1 break-words text-[10px] text-muted-foreground">{profile.name}{profile.role ? ` · ${profile.role}` : ""}</p></div><div className="rounded-md border border-foreground/10 bg-foreground/[0.025] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Work context</p><p className="mt-1 break-words text-xs font-medium">{profile.industry || "Your work"}</p><p className="mt-1 line-clamp-3 break-words text-[10px] text-muted-foreground">{profile.workDescription}</p></div></div><div className="rounded-md border border-foreground/10 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Desired outcomes</p><div className="mt-2 flex flex-wrap gap-1.5">{profile.goals.map((goal) => <span key={goal} className="rounded-full bg-foreground/[0.06] px-2 py-1 text-[10px]">{goals.find(([value]) => value === goal)?.[1] ?? goal}</span>)}</div><p className="mt-3 break-words text-xs leading-relaxed">{profile.firstOutcome}</p></div><div className="rounded-md border border-foreground/10 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Working style</p><p className="mt-1 break-words text-xs font-medium">{toneOptions.find(([value]) => value === profile.tone)?.[1]} · {autonomyOptions.find(([value]) => value === profile.autonomy)?.[1]}</p><p className="mt-1 break-words text-[10px] text-muted-foreground">Workstreams: {profile.workstreams.join(", ") || "Not specified"}</p></div><div className="flex gap-2 border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-950"><Check size={14} className="mt-0.5 shrink-0" /><p>Chusky will save this as private profile context. It can be edited from this wizard or removed from Memory at any time.</p></div></div>}
      </div>

      {error && <div role="alert" className="mx-3 mb-3 border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-950 sm:mx-6 sm:mb-4">{error}</div>}
      <div className="grid grid-cols-2 gap-2 border-t border-foreground/10 px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:px-6 sm:py-3"><button type="button" onClick={() => step === 0 ? skip() : setStep((current) => current - 1)} className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:w-auto sm:gap-1.5 sm:px-2 sm:text-xs"><ArrowLeft size={13} />{step === 0 ? "Skip" : "Back"}</button><Button disabled={!canContinue || saving} onClick={next} className="w-full sm:w-auto">{saving ? <LoaderCircle size={13} className="animate-spin" /> : step === steps.length - 1 ? <Check size={13} /> : <ArrowRight size={13} />}{saving ? "Saving…" : step === steps.length - 1 ? "Save profile" : "Continue"}</Button></div>
    </Card>
  </div>;
}

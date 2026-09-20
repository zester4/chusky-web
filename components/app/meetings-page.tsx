"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, LoaderCircle, RefreshCw, Save, Users } from "lucide-react";
import { chuskyApi, type Meeting, type MeetingContact, type MeetingRepresentativeProfile, type MeetingWorkspace } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";

const initialProfile: MeetingRepresentativeProfile = { enabled: false, representativeName: "Chusky", organizationName: "", role: "custom", objective: "", communicationStyle: "", approvedKnowledge: "", authorityBoundaries: "", allowedComposioTools: [], composioAccountAliases: {}, allowedNativeTools: [], allowMeetingScheduling: true, autoJoinCalendar: false, updatedAt: 0 };
const inputClass = "mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs outline-none focus:border-foreground/50";
const textClass = "mt-1.5 w-full resize-y border border-foreground/15 bg-background px-2.5 py-2 text-xs leading-5 outline-none focus:border-foreground/50";

function date(value?: string) { if (!value) return "Time not provided"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Time not provided" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(parsed); }
function bullets(values: string[]) { return values.length ? values.join("\n") : ""; }
function parseLines(value: string) { return [...new Set(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))]; }
function parseAliases(value: string): Record<string, string> {
  return Object.fromEntries(parseLines(value).map((line) => {
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error("Account aliases use one TOOLKIT=account label per line.");
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }).filter(([key, alias]) => key && alias));
}

export function MeetingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<MeetingWorkspace>();
  const [profile, setProfile] = useState<MeetingRepresentativeProfile>(initialProfile);
  const [toolText, setToolText] = useState(""); const [nativeText, setNativeText] = useState(""); const [aliasText, setAliasText] = useState("");
  const [busy, setBusy] = useState<string>(); const [error, setError] = useState<string>(); const [notice, setNotice] = useState<string>();
  const [removeContact, setRemoveContact] = useState<MeetingContact>();

  const load = useCallback(async (refreshProfile = true) => {
    setError(undefined);
    try {
      const nextWorkspace = await chuskyApi.meetings.list();
      setWorkspace(nextWorkspace);
      if (refreshProfile) {
        const nextProfile = await chuskyApi.meetings.profile();
        setProfile(nextProfile);
        setToolText(bullets(nextProfile.allowedComposioTools)); setNativeText(bullets(nextProfile.allowedNativeTools));
        setAliasText(Object.entries(nextProfile.composioAccountAliases).map(([toolkit, alias]) => `${toolkit}=${alias}`).join("\n"));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the meeting workspace."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useLiveData(() => load(false), 15_000);

  const saveProfile = async () => {
    setBusy("profile"); setError(undefined); setNotice(undefined);
    try {
      const next = await chuskyApi.meetings.updateProfile({ ...profile, allowedComposioTools: parseLines(toolText), allowedNativeTools: parseLines(nativeText), composioAccountAliases: parseAliases(aliasText) });
      const { autoJoinReconciliation, ...savedProfile } = next;
      setProfile(savedProfile);
      setNotice(autoJoinReconciliation
        ? `Profile saved. ${autoJoinReconciliation.cancelled} scheduled join${autoJoinReconciliation.cancelled === 1 ? "" : "s"} cancelled; ${autoJoinReconciliation.stillInCall} live meeting${autoJoinReconciliation.stillInCall === 1 ? "" : "s"} left running${autoJoinReconciliation.failures ? `; ${autoJoinReconciliation.failures} cancellation${autoJoinReconciliation.failures === 1 ? "" : "s"} need attention` : ""}.`
        : "Meeting representative profile saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this profile."); }
    finally { setBusy(undefined); }
  };
  const remove = async () => {
    if (!removeContact) return;
    setBusy(removeContact.id); setError(undefined);
    try { await chuskyApi.meetings.deleteContact(removeContact.id); setWorkspace((current) => current ? { ...current, contacts: current.contacts.filter((item) => item.id !== removeContact.id) } : current); setRemoveContact(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove this follow-up contact."); }
    finally { setBusy(undefined); }
  };
  const startJoinDraft = (preparationId: string) => {
    const prompt = `Join the calendar-prepared meeting with preparation ID ${preparationId}. Use the owner-scoped prepared-meeting join capability and its verified event brief; do not guess or ask me to paste the meeting URL. If this preparation is no longer joinable, explain why.`;
    router.push(`/app/chat?new=1&draft=${encodeURIComponent(prompt)}`);
  };

  return <>
    <PageHeading eyebrow="Calendar & live sessions" title="Meetings" description="Review calendar meeting preparations, participant context, live-call outcomes, and the representative profile Chusky uses. Calendar triggers can also describe non-meeting events; only verified supported video links become meeting preparations." action={<Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13}/></span> Refresh</Button>} />
    {error && <div role="alert" className="mb-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">{error}</div>}{notice && <p role="status" className="mb-3 text-xs text-emerald-700">{notice}</p>}

    <section className="mb-5"><div className="mb-2 flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Calendar briefings</p><h2 className="mt-1 font-display text-2xl">Prepared events</h2></div><span className="text-[10px] text-muted-foreground">Refreshes every 15 seconds</span></div>
      {!workspace ? <Card className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin"/> Loading meeting data…</Card> : workspace.preparations.length ? <div className="grid gap-3">{workspace.preparations.map((item) => <Card key={item.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CalendarClock size={15} className="text-muted-foreground"/><h3 className="break-words text-sm font-medium">{item.title || "Calendar event"}</h3><Status tone={item.status === "cancelled" || item.status === "expired" ? "gray" : item.status === "prepared" || item.status === "auto_scheduled" ? "green" : "amber"}>{item.status.replaceAll("_", " ")}</Status></div><p className="mt-1.5 text-[11px] text-muted-foreground">{date(item.startAt)}{item.endAt ? ` – ${date(item.endAt)}` : ""} · {item.lifecycle.replaceAll("_", " ")}</p></div>{(item.status === "prepared" || item.status === "auto_scheduled") && item.meetingUrlAvailable && <Button onClick={() => startJoinDraft(item.id)}>Ask Chusky to join</Button>}</div>
        {item.participants.length > 0 && <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground"><Users size={13} className="mt-0.5 shrink-0"/><span>{item.participants.join(", ")}</span></p>}
        <div className="mt-3 border-t border-foreground/10 pt-3"><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Meeting brief</p>{item.brief ? <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5">{item.brief}</p> : <p className="mt-1.5 text-[11px] text-muted-foreground">{item.briefStatus === "processing" || item.briefStatus === "queued" ? "Brief is being prepared…" : item.status === "cancelled" ? "This event was cancelled; it is not a joinable meeting." : item.meetingUrlAvailable ? "No completed brief is available yet. Chusky can still review the verified event when you ask it to join." : "No supported meeting link was found. This calendar event is not treated as a meeting."}</p>}</div>
        <p className="mt-2 break-all font-mono text-[9px] text-muted-foreground">Preparation {item.id}{item.calendarEventId ? ` · Event ${item.calendarEventId}` : ""}</p>
      </Card>)}</div> : <Card className="p-4 text-xs leading-5 text-muted-foreground">No calendar meeting preparations yet. Calendar triggers remain useful for ordinary events too; only events with a verified supported conferencing link appear here as meetings.</Card>}
    </section>

    <section className="mb-5"><div className="mb-2"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Recall sessions</p><h2 className="mt-1 font-display text-2xl">Recent meetings</h2></div>{!workspace ? null : workspace.meetings.length ? <div className="grid gap-3">{workspace.meetings.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting}/>)}</div> : <Card className="p-4 text-xs text-muted-foreground">No Recall meeting sessions recorded for this workspace.</Card>}</section>

    <section className="mb-5"><div className="mb-2"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Follow-up queue</p><h2 className="mt-1 font-display text-2xl">Interested participants</h2></div>{!workspace ? null : workspace.contacts.length ? <Card>{workspace.contacts.map((contact) => <div key={contact.id} className="flex flex-col gap-2.5 border-b border-foreground/10 p-4 last:border-0 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><p className="text-xs font-medium">{contact.participantName}</p><p className="mt-1 break-words text-[11px] text-muted-foreground">{[contact.email, contact.phone, contact.contactPreference].filter(Boolean).join(" · ")}</p><p className="mt-2 text-xs leading-5">{contact.interest}</p>{contact.nextStep && <p className="mt-1 text-[11px] text-muted-foreground">Next: {contact.nextStep}</p>}{contact.followUpAt && <p className="mt-1 text-[10px] text-muted-foreground">Follow-up {date(contact.followUpAt)}</p>}</div><Button secondary disabled={busy === contact.id} onClick={() => setRemoveContact(contact)}>Remove</Button></div>)}</Card> : <Card className="p-4 text-xs text-muted-foreground">No participant follow-ups have been recorded yet.</Card>}</section>

    <section><div className="mb-2"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">How Chusky represents you</p><h2 className="mt-1 font-display text-2xl">Meeting profile</h2></div><Card className="p-4 sm:p-5"><p className="mb-4 text-xs leading-5 text-muted-foreground">This profile guides the meeting agent’s style and available tools. It does not make a calendar event joinable unless a verified meeting link exists. Connected app aliases refer to exact accounts you choose to make available.</p>
      <div className="grid gap-3 sm:grid-cols-2"><label className="flex min-h-10 items-center gap-2 text-xs"><input type="checkbox" checked={profile.enabled} onChange={(event) => setProfile({ ...profile, enabled: event.target.checked })} className="accent-foreground"/> Enable representative profile</label><label className="block text-xs text-muted-foreground">Representative name<input value={profile.representativeName} onChange={(event) => setProfile({ ...profile, representativeName: event.target.value })} maxLength={80} className={inputClass}/></label><label className="block text-xs text-muted-foreground">Organization<input value={profile.organizationName} onChange={(event) => setProfile({ ...profile, organizationName: event.target.value })} maxLength={120} className={inputClass}/></label><label className="block text-xs text-muted-foreground">Meeting role<select value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value as MeetingRepresentativeProfile["role"] })} className={inputClass}><option value="sales">Sales</option><option value="client_onboarding">Client onboarding</option><option value="employee_onboarding">Employee onboarding</option><option value="customer_success">Customer success</option><option value="custom">Custom</option></select></label></div>
      <label className="mt-3 block text-xs text-muted-foreground">General objective<textarea value={profile.objective} onChange={(event) => setProfile({ ...profile, objective: event.target.value })} rows={2} maxLength={1500} className={textClass}/></label><label className="mt-3 block text-xs text-muted-foreground">Communication style<textarea value={profile.communicationStyle} onChange={(event) => setProfile({ ...profile, communicationStyle: event.target.value })} rows={2} maxLength={1500} className={textClass}/></label><label className="mt-3 block text-xs text-muted-foreground">Approved company / product knowledge<textarea value={profile.approvedKnowledge} onChange={(event) => setProfile({ ...profile, approvedKnowledge: event.target.value })} rows={4} maxLength={12000} className={textClass}/></label><label className="mt-3 block text-xs text-muted-foreground">Authority guidance<textarea value={profile.authorityBoundaries} onChange={(event) => setProfile({ ...profile, authorityBoundaries: event.target.value })} rows={3} maxLength={3000} className={textClass}/></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block text-xs text-muted-foreground">Allowed Composio tools<textarea value={toolText} onChange={(event) => setToolText(event.target.value)} placeholder="One exact tool slug per line" rows={4} className={`${textClass} font-mono`}/></label><label className="block text-xs text-muted-foreground">Connected account aliases<textarea value={aliasText} onChange={(event) => setAliasText(event.target.value)} placeholder="GOOGLECALENDAR=Work calendar" rows={4} className={`${textClass} font-mono`}/></label></div><label className="mt-3 block text-xs text-muted-foreground">Allowed native tools<textarea value={nativeText} onChange={(event) => setNativeText(event.target.value)} placeholder="One supported native tool per line" rows={3} className={`${textClass} font-mono`}/></label>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-foreground/10 pt-4"><Toggle label="Allow calendar scheduling tools" checked={profile.allowMeetingScheduling} onChange={(value) => setProfile({ ...profile, allowMeetingScheduling: value })}/><Toggle label="Automatically join eligible calendar meetings" checked={profile.autoJoinCalendar} onChange={(value) => setProfile({ ...profile, autoJoinCalendar: value })}/></div><p className="mt-2 text-[10px] leading-4 text-muted-foreground">Automatic joining applies only to eligible calendar meetings when the existing profile and calendar rules permit it. A regular calendar trigger is not blanket join authorization.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button disabled={busy === "profile"} onClick={() => void saveProfile()}>{busy === "profile" ? <LoaderCircle size={13} className="animate-spin"/> : <Save size={13}/>} Save meeting profile</Button><span className="text-[10px] text-muted-foreground">Saved to your private Chusky account.</span></div>
    </Card></section>
    {removeContact && <ConfirmDialog open onOpenChange={(open) => !open && setRemoveContact(undefined)} title={`Remove ${removeContact.participantName} from follow-ups?`} description="This removes the saved contact record from your private meeting follow-up list." confirmLabel="Remove contact" destructive onConfirm={remove}/>}
  </>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-foreground"/>{label}</label>; }

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return <Card className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">{meeting.title || `${meeting.platform} meeting`}</h3><Status tone={meeting.status === "in_call" || meeting.status === "joining" ? "green" : meeting.error ? "amber" : "gray"}>{meeting.status.replaceAll("_", " ")}</Status><span className="text-[10px] text-muted-foreground">{meeting.interactionMode} · {date(meeting.joinAt || meeting.createdAt)}</span></div>{meeting.error && <p className="mt-2 text-xs text-amber-800">{meeting.error}</p>}{meeting.participantRoster.length > 0 && <div className="mt-3"><p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground"><Users size={12}/> Participants</p><p className="mt-1.5 text-[11px]">{meeting.participantRoster.map((item) => `${item.name}${item.isHost ? " (host)" : ""}${item.status === "left" ? " · left" : ""}`).join(" · ")}</p></div>}{meeting.history.length > 0 && <div className="mt-3 max-h-48 space-y-2 overflow-y-auto border-t border-foreground/10 pt-3">{meeting.history.slice(-6).map((item, index) => <p key={`${item.createdAt ?? index}-${index}`} className="text-[11px] leading-5"><span className="font-medium">{item.role === "assistant" ? "Chusky" : "Meeting context"}: </span>{item.content}</p>)}</div>}{meeting.outcome && <div className="mt-3 border-t border-foreground/10 pt-3"><p className="text-xs font-medium">Outcome · {meeting.outcome.title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{meeting.outcome.summary}</p>{meeting.outcome.decisions.length > 0 && <p className="mt-2 text-[11px]">Decisions: {meeting.outcome.decisions.join(" · ")}</p>}{meeting.outcome.actionItems.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">{meeting.outcome.actionItems.map((item, index) => <li key={`${item.task}-${index}`}>{item.task} — {item.owner}{item.dueDate ? ` · ${item.dueDate}` : ""}</li>)}</ul>}<p className="mt-2 text-[10px] text-muted-foreground">Follow-through: {meeting.outcomeStatus || "pending"}{meeting.outcomeNotificationStatus ? ` · notification ${meeting.outcomeNotificationStatus}` : ""}</p></div>}</Card>;
}

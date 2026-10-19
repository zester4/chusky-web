"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Bell, Brain, Building2, CalendarDays, CheckCircle2, Code2, LayoutDashboard, ListChecks, LogOut, Menu, MessageCircle, MessagesSquare, PanelLeftClose, PanelLeftOpen, Phone, Plug, Plus, Repeat2, Settings2, ShieldCheck, SquareTerminal, UserRound, Webhook, Workflow, X, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type AccountOverview, type CompanyBranding, type HealthSnapshot } from "@/lib/chusky-api";
import { notifyChuskyDataChanged, useDashboardActivity, useLiveData } from "@/lib/live-sync";
import { DASHBOARD_REFRESH_INTERVAL_MS, DASHBOARD_RETURN_REFRESH_COOLDOWN_MS, shouldPollDashboard, shouldRefreshAfterReturn } from "@/lib/polling-policy";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { TriggerLogo, triggerProviderBrand } from "./trigger-logo";
import { attentionCandidateChatHref, fallbackAttentionCandidateAction } from "./attention-candidate";
import { eventMarkdown } from "./attention-action-card";
import { MarkdownMessage } from "./markdown-message";
import type { HTMLAttributes, ReactNode } from "react";

type NavItem = [label: string, href: string, icon: LucideIcon];
const primary: NavItem[] = [
  ["Overview", "/app", LayoutDashboard], ["Chat", "/app/chat", MessageCircle], ["Conversations", "/app/conversations", MessagesSquare],
  ["Approvals", "/app/approvals", ShieldCheck], ["Calls", "/app/calls", Phone], ["Autonomy", "/app/autonomy", Brain], ["Meetings", "/app/meetings", CalendarDays], ["Apps", "/app/apps", Plug], ["Channels", "/app/channels", Webhook], ["Capabilities", "/app/capabilities", Workflow], ["Tasks", "/app/tasks", ListChecks], ["Missions", "/app/missions", Repeat2],
];
const work: NavItem[] = [
  ["Organizations", "/app/organizations", Building2],
  // Temporarily hidden from the sidebar; the MCP page and route remain available.
  // ["MCP connections", "/app/mcp", "⌁"],
  // Workflow composition is agent-led; the route remains available for internal use.
  // ["Workflow Composer", "/app/composer", Workflow],
  ["Context", "/app/memory", Brain],
];

function relativeTime(value?: string | number) {
  if (!value) return "Recently";
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

type PulseReceipt = NonNullable<NonNullable<AccountOverview["attentionPulse"]>["lastOccurrence"]>;

function pulseReceiptSummary(receipt: PulseReceipt): string {
  if (["queued", "running"].includes(receipt.status)) return "Elena is working. The Pulse run has not produced a provider result yet.";
  if (receipt.status === "failed" || receipt.status === "blocked") return receipt.error || "The latest Pulse run needs attention before it can report a verified result.";
  const reports = receipt.pulseEvidence?.watchReports ?? [];
  if (reports.length) {
    const checked = reports.filter((watch) => watch.status === "checked").length;
    const failed = reports.filter((watch) => watch.status === "failed").length;
    const pending = reports.length - checked - failed;
    const action = receipt.pulseEvidence?.handled ? "An authorized step was handled." : receipt.pulseEvidence?.delegated ? `${receipt.pulseEvidence.delegated} step${receipt.pulseEvidence.delegated === 1 ? "" : "s"} was delegated.` : "No external action was claimed.";
    return `Provider checks: ${checked} verified, ${pending} not checked${failed ? `, ${failed} failed` : ""}. ${action}`;
  }
  const result = receipt.result?.replaceAll("**", "").replace(/\s+/g, " ").trim();
  return result ? result.slice(0, 260) : "The latest Pulse run is ready to review.";
}

function pulseReceiptTitle(receipt: PulseReceipt): string {
  if (["queued", "running"].includes(receipt.status)) return "Elena is working";
  if (receipt.status === "failed" || receipt.status === "blocked") return "Elena pulse needs attention";
  return "Elena pulse report";
}

function pulseReceiptAt(receipt: PulseReceipt): string | number | undefined {
  return receipt.completedAt || receipt.updatedAt || receipt.startedAt || receipt.createdAt;
}

function AttentionCenter({ account, attentionEvents, reminderNotifications, pulseReceipt, attentionCount, onClose, onOpenApprovals, onOpenPulse, onOpenTrigger, onOpenReminder, onOpenMission, onOpenMissionChat, onClearNotifications }: {
  account?: AccountOverview;
  attentionEvents: AccountOverview["triggerEvents"];
  reminderNotifications: AccountOverview["reminders"];
  pulseReceipt?: PulseReceipt;
  attentionCount: number;
  onClose: () => void;
  onOpenApprovals: () => void;
  onOpenPulse: () => void;
  onOpenTrigger: (eventId: string) => void;
  onOpenReminder: (reminderId: string) => void;
  onOpenMission: (missionId: string) => void;
  onOpenMissionChat: () => void;
  onClearNotifications: () => Promise<number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");
  const candidates = account?.attentionCandidates ?? [];
  const hasPulseItem = Boolean(pulseReceipt);
  const approvals = account?.approvals ?? [];
  const missionNotifications = (account?.missionNotifications ?? []).filter((item) => item.unread);
  const hasMore = approvals.length > 3 || candidates.length > 4 || attentionEvents.length > 4 || reminderNotifications.length > 4 || missionNotifications.length > 4;
  const clearableCount = candidates.length + attentionEvents.length + reminderNotifications.length + missionNotifications.length + Number(hasPulseItem);
  const clearNotifications = async () => {
    setClearing(true);
    setClearError("");
    try {
      const failures = await onClearNotifications();
      if (failures > 0) setClearError(`${failures} item${failures === 1 ? "" : "s"} could not be cleared. Try again.`);
    } catch {
      setClearError("Notifications could not be cleared. Try again.");
    } finally {
      setClearing(false);
    }
  };
  return <div role="dialog" aria-label="Notifications and approvals" className="absolute right-0 top-11 z-50 w-[min(25rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-foreground/10 bg-background/95 shadow-[0_18px_50px_rgb(0_0_0/0.14)] backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3 border-b border-foreground/10 bg-foreground/[0.025] px-3.5 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"><Bell size={12}/></span><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Attention center</p>
          <button type="button" onClick={() => void clearNotifications()} disabled={!clearableCount || clearing} title="Clear unread mission and trigger updates and suggestions. Pending approvals stay until resolved." className="ml-1 inline-flex min-h-5 items-center rounded border border-foreground/15 px-1.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Clear unread updates and suggestions">{clearing ? "Clearing" : "Clear"}</button>
        </div>
        <p className="mt-2 text-xs font-medium">What needs your attention</p><p className="mt-0.5 text-[10px] text-muted-foreground">{attentionCount ? `${attentionCount} active item${attentionCount === 1 ? "" : "s"}` : "You’re clear for now"}</p>
      </div>
    </div>
    {hasMore && <div className="border-b border-foreground/10 px-3.5 py-1"><button type="button" onClick={() => setExpanded((current) => !current)} className="text-[9px] font-medium text-muted-foreground underline decoration-foreground/20 underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25">{expanded ? "Show fewer" : "See more"}</button></div>}
    <div className="max-h-[min(55vh,25rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1">
    {approvals.slice(0, expanded ? 12 : 3).map((approval) => <button key={`approval-${approval.id}`} type="button" onClick={onOpenApprovals} className="group flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10"><ShieldCheck size={14} className="text-amber-700"/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium">Approval required</span><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(approval.createdAt)}</span></span><MarkdownMessage content={approval.request || `Review ${approval.toolSlug} before it runs.`} className="mt-1 line-clamp-2 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" /><span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-amber-700">Review action <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5"/></span></span></button>)}
    {candidates.slice(0, expanded ? 12 : 4).map((candidate) => { const actions = candidate.suggestedActions?.length ? candidate.suggestedActions.slice(0, 2) : [fallbackAttentionCandidateAction]; return <div key={`candidate-${candidate.id}`} className="flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-background"><TriggerLogo slug={candidate.providerSlug || "chusky"} size={22}/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium">Elena has a suggestion</span><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(candidate.createdAt)}</span></div><MarkdownMessage content={candidate.reason} className="mt-1 line-clamp-3 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" /><div className="mt-2 flex flex-wrap items-center gap-1.5">{actions.map((action) => <Link key={action.id} href={attentionCandidateChatHref(candidate.id, action.id)} onClick={onClose} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground hover:bg-primary/90">{action.label}<ArrowRight size={10}/></Link>)}<Link href={attentionCandidateChatHref(candidate.id)} onClick={onClose} className="inline-flex items-center gap-1 rounded-md border border-foreground/12 px-2 py-1 text-[9px] font-medium text-foreground/75 hover:border-foreground/30">Open in Chat<ArrowRight size={10}/></Link></div></div></div>; })}
    {hasPulseItem && pulseReceipt && <button type="button" onClick={onOpenPulse} className="group flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10"><Bell size={15} className="text-emerald-700"/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium">{pulseReceiptTitle(pulseReceipt)}</span><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(pulseReceiptAt(pulseReceipt))}</span></span><MarkdownMessage content={pulseReceiptSummary(pulseReceipt)} className="mt-1 line-clamp-3 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" /><span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-emerald-700">Open Pulse report <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5"/></span></span></button>}
    {attentionEvents.slice(0, expanded ? 20 : 4).map((event) => {
      const statusLabel = event.status === "running" || event.status === "queued" ? "Chusky is handling this" : event.status === "awaiting_approval" ? "Approval needed" : event.status === "failed" ? "Handling failed" : "Handled";
      const display = event.result || (event.status === "running" || event.status === "queued" ? "Chusky is processing this event." : event.status === "awaiting_approval" ? "Chusky paused because this action needs your approval." : event.status === "failed" ? "Chusky could not complete this event." : event.summary);
      return <button key={`trigger-${event.id}`} type="button" onClick={() => onOpenTrigger(event.id)} className="group flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10"><TriggerLogo slug={event.slug || "chusky"} size={22}/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium">{triggerProviderBrand(event.slug || "chusky").name} · {statusLabel}</span><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(event.createdAt)}</span></span><MarkdownMessage content={eventMarkdown(display)} className="mt-1 line-clamp-2 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" />{event.status === "completed" && (event.notificationStatus === "failed" || event.notificationStatus === "unknown") && <span className="mt-1 block text-[9px] text-amber-800">Saved in dashboard · owner notification {event.notificationStatus === "unknown" ? "status unconfirmed" : "delivery needs checking"}</span>}<span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-emerald-700">Open activity <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5"/></span></span></button>;
    })}
    {reminderNotifications.slice(0, expanded ? 20 : 4).map((reminder) => <button key={`reminder-${reminder.id}`} type="button" onClick={() => onOpenReminder(reminder.id)} className="group flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10"><Bell size={15} className="text-violet-700" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium">Scheduled follow-up</span><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(reminder.webNotificationAt || reminder.createdAt)}</span></span><MarkdownMessage content={reminder.text} className="mt-1 line-clamp-2 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" /><span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-violet-700">Open reminder activity <ArrowRight size={10} /></span></span></button>)}
    {missionNotifications.slice(0, expanded ? 20 : 4).map((mission) => <div key={`mission-${mission.id}`} className="flex items-start gap-3 border-b border-foreground/10 px-4 py-3.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10"><Workflow size={15} className="text-sky-700"/></span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium">Mission {mission.status === "completed" ? "completed" : mission.status === "failed" ? "needs attention" : "cancelled"}</p><p className="mt-0.5 truncate text-[10px] text-foreground">{mission.title}</p><MarkdownMessage content={mission.summary} className="mt-1 line-clamp-2 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0"/><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-medium"><button type="button" onClick={() => onOpenMission(mission.id)} className="inline-flex items-center gap-1 text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25">Open mission <ArrowRight size={10}/></button><button type="button" onClick={onOpenMissionChat} className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25">View chat update</button></div></div><span className="shrink-0 font-mono text-[8px] text-muted-foreground">{relativeTime(mission.updatedAt)}</span></div>)}
    {!approvals.length && !candidates.length && !attentionEvents.length && !reminderNotifications.length && !missionNotifications.length && !hasPulseItem && <div className="px-4 py-8 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.04] text-muted-foreground"><CheckCircle2 size={18}/></span><p className="mt-2 text-[11px] font-medium">Nothing needs your attention</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{account?.features?.attentionPulse === true ? "Elena will surface the next useful step here." : "Chusky will surface the next useful step here."}</p></div>}
    </div>
    {clearError && <p className="border-t border-rose-500/15 bg-rose-500/[0.04] px-3.5 py-2 text-[9px] text-rose-700" role="alert">{clearError}</p>}
    <button type="button" onClick={onOpenApprovals} className="flex w-full items-center justify-between border-t border-foreground/10 bg-foreground/[0.018] px-4 py-3 text-[10px] font-medium transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/20">Open approvals and activity <ArrowRight size={13} /></button>
  </div>;
}

export type ChatHeader = { title: string; status: "loading" | "ready" | "offline" };
export const AppShellContext = createContext<{ setChatHeader: (header?: ChatHeader) => void; missionToOpen?: string; setMissionToOpen: (missionId?: string) => void }>({ setChatHeader: () => undefined, setMissionToOpen: () => undefined });

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [account, setAccount] = useState<AccountOverview>();
  const [health, setHealth] = useState<HealthSnapshot>();
  const [branding, setBranding] = useState<CompanyBranding>();
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [chatHeader, setChatHeader] = useState<ChatHeader>();
  const [missionToOpen, setMissionToOpen] = useState<string>();
  const [dismissedPulseReceiptId, setDismissedPulseReceiptId] = useState<string>();
  const [missionToastId, setMissionToastId] = useState<string>();
  const lastActivityRefreshAtRef = useRef(0);
  const dashboardLastActivityAtRef = useRef(0);
  const accountRefreshInFlightRef = useRef<Promise<void> | null>(null);
  const { data: session } = authClient.useSession();
  const dashboardLastActivityAt = useDashboardActivity();
  const refreshAccount = useCallback(() => {
    if (accountRefreshInFlightRef.current) return accountRefreshInFlightRef.current;
    const request = chuskyApi.account.get()
      .then(setAccount)
      .catch(() => undefined)
      .finally(() => { accountRefreshInFlightRef.current = null; });
    accountRefreshInFlightRef.current = request;
    return request;
  }, []);
  useEffect(() => { dashboardLastActivityAtRef.current = dashboardLastActivityAt; }, [dashboardLastActivityAt]);
  useEffect(() => { if (pathname !== "/app/chat") setChatHeader(undefined); }, [pathname]);
  useEffect(() => {
    let active = true;
    void Promise.all([refreshAccount(), chuskyApi.health.get()]).then(([, nextHealth]) => { if (active) setHealth(nextHealth); }).catch(() => undefined);
    return () => { active = false; };
  }, [refreshAccount]);
  useEffect(() => {
    if (!session?.user?.id || typeof window === "undefined" || typeof window.EventSource === "undefined") return;
    const stream = new EventSource("/v1/account/notifications/stream");
    const refresh = (raw?: Event) => {
      notifyChuskyDataChanged();
      void refreshAccount();
      if (raw instanceof MessageEvent) {
        try { const data = JSON.parse(String(raw.data)) as { events?: Array<{ kind?: string; missionId?: string }> }; const mission = data.events?.find((event) => event.kind === "mission" && event.missionId); if (mission?.missionId) setMissionToastId(mission.missionId); } catch { /* Durable account polling remains the replay path. */ }
      }
    };
    stream.addEventListener("notification", refresh);
    return () => { stream.removeEventListener("notification", refresh); stream.close(); };
  }, [refreshAccount, session?.user?.id]);
  useLiveData(async () => {
    try {
      const [, nextHealth] = await Promise.all([refreshAccount(), chuskyApi.health.get()]);
      setHealth(nextHealth);
    } catch { /* Keep the shell usable while the API recovers. */ }
  }, DASHBOARD_REFRESH_INTERVAL_MS);
  useEffect(() => {
    let active = true;
    void chuskyApi.branding.public(window.location.hostname).then((result) => { if (active && result.data) setBranding(result.data); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    let since = Date.now();
    let controller: AbortController | undefined;
    let retryDelay = 30_000;
    let timer: number | undefined;
    const poll = async () => {
      const now = Date.now();
      if (!active || !shouldPollDashboard({ visibilityState: document.visibilityState, lastActivityAt: dashboardLastActivityAtRef.current, now }) || controller) return;
      if (!shouldRefreshAfterReturn(lastActivityRefreshAtRef.current, now)) {
        if (active) timer = window.setTimeout(() => void poll(), DASHBOARD_RETURN_REFRESH_COOLDOWN_MS);
        return;
      }
      lastActivityRefreshAtRef.current = now;
      controller = new AbortController();
      try {
        const activity = await chuskyApi.activity.get(since, controller.signal);
        if (!active) return;
        since = activity.now;
        retryDelay = 30_000;
        if (activity.attentionCandidates.length > 0 || activity.approvals.length > 0) {
          void refreshAccount();
        }
      } catch {
        if (active) retryDelay = Math.min(retryDelay * 2, 5 * 60_000);
      } finally {
        controller = undefined;
        if (active) timer = window.setTimeout(() => void poll(), retryDelay);
      }
    };
    const refresh = () => { if (document.visibilityState === "visible") void poll(); };
    void poll();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; controller?.abort(); if (timer !== undefined) window.clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [refreshAccount]);
  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem("chusky-sidebar-collapsed") === "true"); } catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  const signOut = async () => { await authClient.signOut(); router.replace("/sign-in"); };
  const startNewConversation = () => { setOpen(false); router.push(`/app/chat?new=1&nonce=${Date.now()}`); };
  const brandName = branding?.displayName || "Chusky";
  const accountName = session?.user?.name || session?.user?.email || "Your account";
  // Read state controls whether a trigger remains in the notification center.
  // Failed and approval-waiting runs remain available in Activity/Approvals.
  const attentionEvents = (account?.triggerEvents ?? []).filter((event) => !event.webReadAt);
  const reminderNotifications = (account?.reminders ?? []).filter((reminder) => reminder.needsAttention && reminder.webThreadId);
  const unreadMissionNotifications = (account?.missionNotifications ?? []).filter((item) => item.unread);
  const elenaEnabled = account?.features?.attentionPulse === true;
  const latestPulseReceipt = elenaEnabled ? account?.attentionPulse?.lastOccurrence : undefined;
  const pulseReceipt = latestPulseReceipt?.id === dismissedPulseReceiptId ? undefined : latestPulseReceipt;
  const pulseNeedsAttention = Boolean(pulseReceipt);
  useEffect(() => {
    if (!session?.user?.id || typeof window === "undefined") return;
    try { setDismissedPulseReceiptId(window.localStorage.getItem(`chusky:attention:pulse-read:${session.user.id}`) || undefined); }
    catch { setDismissedPulseReceiptId(undefined); }
  }, [session?.user?.id]);
  const attentionCount = (account?.approvals.length ?? 0) + (account?.attentionCandidates.length ?? 0) + attentionEvents.length + reminderNotifications.length + unreadMissionNotifications.length + (pulseNeedsAttention ? 1 : 0);
  const clearAttentionNotifications = async (): Promise<number> => {
    const events = [...attentionEvents];
    const candidates = [...(account?.attentionCandidates ?? [])];
    const reminders = [...reminderNotifications];
    const missions = [...unreadMissionNotifications];
    const [eventResults, candidateResults, reminderResults, missionResults] = await Promise.all([
      Promise.allSettled(events.map((event) => chuskyApi.triggers.markEventRead(event.id))),
      Promise.allSettled(candidates.map((candidate) => chuskyApi.account.dismissAttentionCandidate(candidate.id))),
      Promise.allSettled(reminders.map((reminder) => chuskyApi.reminders.markNotificationRead(reminder.id))),
      Promise.allSettled(missions.map((mission) => chuskyApi.missions.markNotificationRead(mission.id))),
    ]);
    const readAt = new Date().toISOString();
    const readEventIds = new Set(events.filter((_, index) => eventResults[index]?.status === "fulfilled").map((event) => event.id));
    const dismissedCandidateIds = new Set(candidates.filter((_, index) => candidateResults[index]?.status === "fulfilled").map((candidate) => candidate.id));
    const readReminderIds = new Set(reminders.filter((_, index) => reminderResults[index]?.status === "fulfilled").map((reminder) => reminder.id));
    const readMissionIds = new Set(missions.filter((_, index) => missionResults[index]?.status === "fulfilled").map((mission) => mission.id));
    if (pulseReceipt) {
      setDismissedPulseReceiptId(pulseReceipt.id);
      try { window.localStorage.setItem(`chusky:attention:pulse-read:${session?.user?.id ?? "unknown"}`, pulseReceipt.id); } catch { /* The current view is still cleared if local storage is unavailable. */ }
    }
    setAccount((current) => current ? {
      ...current,
      triggerEvents: current.triggerEvents.map((event) => readEventIds.has(event.id) ? { ...event, needsAttention: false, webReadAt: readAt } : event),
      attentionCandidates: current.attentionCandidates.filter((candidate) => !dismissedCandidateIds.has(candidate.id)),
      reminders: current.reminders.map((reminder) => readReminderIds.has(reminder.id) ? { ...reminder, needsAttention: false, webReadAt: reminder.webNotificationAt } : reminder),
      missionNotifications: current.missionNotifications.map((mission) => readMissionIds.has(mission.id) ? { ...mission, unread: false } : mission),
    } : current);
    if (readEventIds.size || dismissedCandidateIds.size || readReminderIds.size || readMissionIds.size) notifyChuskyDataChanged();
    return eventResults.filter((result) => result.status === "rejected").length + candidateResults.filter((result) => result.status === "rejected").length + reminderResults.filter((result) => result.status === "rejected").length + missionResults.filter((result) => result.status === "rejected").length;
  };
  const markMissionRead = (missionId: string) => {
    void chuskyApi.missions.markNotificationRead(missionId).then(() => {
      setAccount((current) => current ? { ...current, missionNotifications: current.missionNotifications.map((item) => item.id === missionId ? { ...item, unread: false } : item) } : current);
      notifyChuskyDataChanged();
    }).catch(() => undefined);
  };
  const openMission = (missionId: string) => { markMissionRead(missionId); setMissionToOpen(missionId); setAttentionOpen(false); router.push("/app/missions"); };
  const openMissionChat = () => { for (const mission of unreadMissionNotifications) markMissionRead(mission.id); setMissionToastId(undefined); setAttentionOpen(false); router.push("/app/chat?thread=thr_mission_updates"); };
  const openPulseReport = () => {
    if (pulseReceipt) {
      setDismissedPulseReceiptId(pulseReceipt.id);
      try { window.localStorage.setItem(`chusky:attention:pulse-read:${session?.user?.id ?? "unknown"}`, pulseReceipt.id); } catch { /* The report remains available in Autonomy. */ }
    }
    setAttentionOpen(false);
    router.push("/app/autonomy");
  };
  const openTriggerEvent = (eventId: string) => {
    const event = account?.triggerEvents.find((item) => item.id === eventId);
    setAttentionOpen(false);
    const readAt = new Date().toISOString();
    setAccount((current) => current ? { ...current, triggerEvents: current.triggerEvents.map((item) => item.id === eventId ? { ...item, needsAttention: false, webReadAt: readAt } : item) } : current);
    void chuskyApi.triggers.markEventRead(eventId).then(() => {
      notifyChuskyDataChanged();
    }).catch(() => {
      // Restore the unread item if the durable read-state write failed.
      setAccount((current) => current ? { ...current, triggerEvents: current.triggerEvents.map((item) => item.id === eventId ? { ...item, needsAttention: true, webReadAt: undefined } : item) } : current);
      notifyChuskyDataChanged();
    });
    const currentThreadFromUrl = pathname === "/app/chat" && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("thread") || undefined
      : undefined;
    void (async () => {
      // Keep the conversation the owner is already using. From another page,
      // resume their latest active chat; the trigger projection is only a
      // fallback when the account has no regular conversation yet.
      let threadId = currentThreadFromUrl && currentThreadFromUrl !== "thr_trigger_updates" && currentThreadFromUrl !== event?.webThreadId
        ? currentThreadFromUrl
        : undefined;
      if (!threadId) {
        try {
          const threads = (await chuskyApi.threads.list({ limit: 100, includeArchived: false })).data;
          threadId = threads.find((thread) => thread.metadata.source !== "trigger-notifications")?.id;
        } catch {
          threadId = undefined;
        }
      }
      threadId ||= event?.webThreadId;
      const query = new URLSearchParams({ triggerEvent: eventId });
      if (threadId) query.set("thread", threadId);
      router.push(`/app/chat?${query.toString()}`, { scroll: false });
    })();
  };
  const openReminder = (reminderId: string) => {
    const reminder = account?.reminders.find((item) => item.id === reminderId);
    setAttentionOpen(false);
    setAccount((current) => current ? { ...current, reminders: current.reminders.map((item) => item.id === reminderId ? { ...item, needsAttention: false, webReadAt: item.webNotificationAt } : item) } : current);
    void chuskyApi.reminders.markNotificationRead(reminderId).then(() => notifyChuskyDataChanged()).catch(() => undefined);
    if (reminder?.webThreadId) router.push(`/app/chat?thread=${encodeURIComponent(reminder.webThreadId)}`, { scroll: false });
    else router.push("/app/reminders");
  };
  const toggleCollapsed = () => setCollapsed((current) => {
    const next = !current;
    try { window.localStorage.setItem("chusky-sidebar-collapsed", String(next)); } catch { /* Storage can be unavailable in private browsing. */ }
    return next;
  });
  const nav = (items: NavItem[]) => items.filter(([label]) => label !== "Autonomy" || elenaEnabled).map(([label, href, Icon]) => (
    <Link key={href} href={href} onClick={() => setOpen(false)} aria-label={label} title={collapsed ? label : undefined} className={cn("flex min-h-9 min-w-0 items-center gap-2 rounded-md py-1.5 text-[11px] transition-colors lg:min-h-0", collapsed ? "px-2.5 lg:justify-center lg:px-2" : "px-2.5", pathname === href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
      <span className="flex w-5 shrink-0 items-center justify-center"><Icon size={14} strokeWidth={1.8} aria-hidden="true" /></span><span className={collapsed ? "lg:hidden" : undefined}>{label}</span>
      {label === "Approvals" && attentionCount > 0 && <span className={cn("ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black", collapsed && "lg:hidden")}>{attentionCount}</span>}
      {label === "Missions" && unreadMissionNotifications.length > 0 && <span className={cn("ml-auto rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white", collapsed && "lg:hidden")}>{unreadMissionNotifications.length > 99 ? "99+" : unreadMissionNotifications.length}</span>}
    </Link>
  ));
  return <AppShellContext.Provider value={{ setChatHeader, missionToOpen, setMissionToOpen }}><div className="app-shell min-h-svh text-foreground" style={branding?.backgroundColor ? { backgroundColor: branding.backgroundColor } : undefined}>
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col overflow-hidden border-r border-foreground/10 bg-background transition-[transform,width] duration-200 lg:flex", collapsed && "lg:w-[68px]")}>
      <div className={cn("flex h-14 items-center border-b border-foreground/10 px-4", collapsed ? "justify-center lg:px-2" : "justify-between")}><Link href="/app" className="flex items-center gap-2 font-display text-xl tracking-tight" aria-label={`${brandName} home`} title={collapsed ? `${brandName} home` : undefined}><span className={collapsed ? "lg:hidden" : undefined}>{branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-6 w-6 object-contain" /> : <>{brandName}<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></>}</span><span className={collapsed ? "hidden lg:block" : "hidden"}>{brandName.slice(0, 1).toUpperCase()}</span></Link><div className="flex items-center gap-1"><button onClick={toggleCollapsed} className="hidden min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button><button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={18}/></button></div></div>
      <div className="p-3"><button type="button" onClick={startNewConversation} aria-label="New conversation" title={collapsed ? "New conversation" : undefined} className={cn("flex min-h-10 w-full items-center gap-2 rounded-lg border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40 lg:min-h-9", collapsed && "lg:justify-center lg:px-0")}><Plus size={14}/><span className={collapsed ? "lg:hidden" : undefined}>New conversation</span><span className={cn("ml-auto font-mono text-[10px] text-muted-foreground", collapsed && "lg:hidden")}>⌘K</span></button></div>
      <nav className="flex-1 overflow-y-auto px-2"><p className={cn("px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Workspace</p>{nav(primary)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Automate</p>{nav(work)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Account</p>{nav([["Agent profile", "/app/onboarding", UserRound], ["Developer API", "/app/developer-api", Code2], ["Devices", "/app/devices", SquareTerminal], ["Settings", "/app/settings", Settings2]])}</nav>
<div className={cn("m-2.5 border border-foreground/10 bg-foreground/[0.03] p-2", collapsed && "lg:m-2 lg:flex lg:justify-center lg:p-2")} title={collapsed ? (health?.ok ? "All systems operational" : "System status") : undefined}><div className="mb-1.5 flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span className={collapsed ? "lg:hidden" : undefined}>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div><p className={cn("text-[9px] leading-relaxed text-muted-foreground", collapsed && "lg:hidden")}>{health ? `${health.persistence === "redis" ? "Redis persistence" : "Memory storage"} · ${account?.channels.length ?? 0} verified channel${account?.channels.length === 1 ? "" : "s"}` : "Loading system diagnostics…"}</p></div>
      <div className={cn("border-t border-foreground/10 p-2.5", collapsed && "lg:p-2")}><div className={cn("mb-2 flex min-w-0 justify-end", collapsed && "lg:hidden")}><ThemeSwitcher /></div><div className={cn("flex min-w-0 items-center gap-2", collapsed && "lg:justify-center")}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{accountName.slice(0, 2).toUpperCase()}</span><span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", collapsed && "lg:hidden")}>{accountName}</span><button onClick={signOut} className={cn("inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-[10px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:min-h-9", collapsed && "lg:min-w-9 lg:px-0")} aria-label="Sign out" title="Sign out"><span className={collapsed ? "lg:hidden" : undefined}>Sign out</span><LogOut size={13} className={collapsed ? "hidden lg:block" : "hidden"}/></button></div></div>
    </aside>
      <Drawer open={open} onOpenChange={setOpen} direction="left"><DrawerContent className="h-full max-h-none w-[min(20rem,calc(100vw-1rem))] p-0"><div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="flex h-14 items-center justify-between border-b border-foreground/10 px-4"><Link href="/app" className="flex items-center gap-2 font-display text-xl tracking-tight">{branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-6 w-6 object-contain" /> : brandName}<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></Link><DrawerClose asChild><button className="flex min-h-9 min-w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close menu"><X size={18}/></button></DrawerClose></div><div className="p-3"><button type="button" onClick={startNewConversation} className="flex min-h-9 w-full items-center gap-2 border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40"><Plus size={14}/> New conversation</button></div><nav className="min-h-0 flex-1 overflow-y-auto px-2"><p className="px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>{nav(primary)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Automate</p>{nav(work)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Account</p>{nav([["Agent profile", "/app/onboarding", UserRound], ["Developer API", "/app/developer-api", Code2], ["Devices", "/app/devices", SquareTerminal], ["Settings", "/app/settings", Settings2]])}</nav><div className="m-3 border border-foreground/10 bg-foreground/[0.03] p-2"><div className="flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div></div><div className="border-t border-foreground/10 p-3"><div className="mb-2 flex justify-end"><ThemeSwitcher /></div><div className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{accountName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-[11px] font-medium">{accountName}</span><button onClick={signOut} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md px-2 text-[10px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label="Sign out">Sign out</button></div></div></div></DrawerContent></Drawer>
<div className={cn("min-w-0 transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[232px]")}><header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-foreground/10 bg-background/90 px-2.5 backdrop-blur-xl sm:h-14 sm:px-4 lg:px-6"><div className="flex min-w-0 items-center gap-2.5"><button onClick={() => setOpen(true)} className="flex min-h-9 min-w-9 items-center justify-center lg:hidden" aria-label="Open menu"><Menu size={17}/></button>{pathname === "/app/chat" && <div className="flex min-w-0 items-center gap-2"><h1 className="max-w-[calc(100vw-6rem)] truncate text-[11px] font-medium sm:max-w-[24rem]">{chatHeader?.title || "Chat"}</h1></div>}</div><div className="relative"><button type="button" onClick={() => setAttentionOpen((current) => !current)} className={cn("relative flex min-h-9 min-w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25", attentionOpen && "bg-foreground/5 text-foreground")} aria-label={`Open notifications and approvals${attentionCount > 0 ? `, ${attentionCount} items` : ""}`} aria-expanded={attentionOpen}><Bell size={15}/>{attentionCount > 0 && <span className="absolute right-0 top-0 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full border-2 border-background bg-amber-400 px-1 text-[8px] font-bold leading-none text-black">{attentionCount > 99 ? "99+" : attentionCount}</span>}</button>{attentionOpen && <AttentionCenter account={account} attentionEvents={attentionEvents} reminderNotifications={reminderNotifications} pulseReceipt={pulseReceipt} attentionCount={attentionCount} onClose={() => setAttentionOpen(false)} onOpenApprovals={() => { setAttentionOpen(false); router.push("/app/approvals"); }} onOpenPulse={openPulseReport} onOpenTrigger={openTriggerEvent} onOpenReminder={openReminder} onOpenMission={openMission} onOpenMissionChat={openMissionChat} onClearNotifications={clearAttentionNotifications} />}</div></header><main className="mx-auto max-w-[1400px] min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-6 lg:px-7 lg:py-8">{children}</main></div>
    {missionToastId && <div role="status" className="fixed bottom-3 right-3 z-[60] flex max-w-[min(26rem,calc(100vw-1.5rem))] items-center gap-3 rounded-lg border border-sky-500/25 bg-background p-3 shadow-lg"><span className="min-w-0 flex-1 text-[11px] leading-4">A mission has finished. Its result is saved in chat and Missions.</span><button type="button" onClick={openMissionChat} className="min-h-8 shrink-0 rounded-md bg-foreground px-2.5 text-[10px] font-medium text-background">View chat update</button><button type="button" onClick={() => setMissionToastId(undefined)} className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Dismiss mission update"><X size={14}/></button></div>}
  </div></AppShellContext.Provider>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="app-page-heading mb-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b border-foreground/10 pb-3.5 sm:mb-5 sm:items-end sm:pb-4"><div className="min-w-0"><p className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-[1.4rem] leading-none tracking-tight sm:text-[1.75rem]">{title}</h1>{description && <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-muted-foreground">{description}</p>}</div>{action && <div className="app-page-heading-actions flex max-w-[min(45vw,12rem)] shrink-0 flex-wrap justify-end gap-1.5">{action}</div>}</div>; }
export function Button({ children, secondary = false, onClick, disabled, className }: { children: ReactNode; secondary?: boolean; onClick?: () => void; disabled?: boolean; className?: string }) { return <button type="button" onClick={onClick} disabled={disabled} className={cn("app-button inline-flex w-fit max-w-full self-start min-h-8 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-medium transition-[color,background-color,border-color,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-7", secondary ? "border border-foreground/12 bg-background shadow-sm hover:border-foreground/30 hover:bg-foreground/[0.03]" : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90", className)}>{children}</button>; }
export function Card({ children, className, ...attributes }: { children: ReactNode; className?: string } & Pick<HTMLAttributes<HTMLDivElement>, "role" | "aria-live">) { return <div {...attributes} className={cn("app-card min-w-0 overflow-hidden rounded-lg border border-foreground/10 bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}>{children}</div>; }
export function Status({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "gray" }) { return <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-medium", tone === "green" ? "bg-emerald-500/10 text-emerald-700" : tone === "amber" ? "bg-amber-400/15 text-amber-700" : "bg-foreground/[0.06] text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-400" : "bg-foreground/25")}/>{children}</span>; }

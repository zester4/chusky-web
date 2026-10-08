"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, Bell, Brain, Building2, CalendarDays, CheckCircle2, Code2, FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, MessageCircle, MessagesSquare, PanelLeftClose, PanelLeftOpen, Phone, Plug, Plus, Repeat2, Settings2, ShieldCheck, SquareTerminal, UserRound, Webhook, Workflow, X, type LucideIcon } from "lucide-react";
import { createContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type AccountOverview, type CompanyBranding, type HealthSnapshot } from "@/lib/chusky-api";
import { useDashboardActivity, useLiveData } from "@/lib/live-sync";
import { DASHBOARD_REFRESH_INTERVAL_MS, DASHBOARD_RETURN_REFRESH_COOLDOWN_MS, shouldPollDashboard, shouldRefreshAfterReturn } from "@/lib/polling-policy";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import type { ReactNode } from "react";

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
  ["Workspace", "/app/workspace", FolderKanban],
];

export type ChatHeader = { title: string; status: "loading" | "ready" | "offline" };
export const AppShellContext = createContext<{ setChatHeader: (header?: ChatHeader) => void }>({ setChatHeader: () => undefined });

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [account, setAccount] = useState<AccountOverview>();
  const [health, setHealth] = useState<HealthSnapshot>();
  const [branding, setBranding] = useState<CompanyBranding>();
  const [activityCount, setActivityCount] = useState(0);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [chatHeader, setChatHeader] = useState<ChatHeader>();
  const lastActivityRefreshAtRef = useRef(0);
  const dashboardLastActivityAtRef = useRef(0);
  const { data: session } = authClient.useSession();
  const dashboardLastActivityAt = useDashboardActivity();
  useEffect(() => { dashboardLastActivityAtRef.current = dashboardLastActivityAt; }, [dashboardLastActivityAt]);
  useEffect(() => { if (pathname !== "/app/chat") setChatHeader(undefined); }, [pathname]);
  useEffect(() => {
    let active = true;
    void Promise.all([chuskyApi.account.get(), chuskyApi.health.get()]).then(([nextAccount, nextHealth]) => { if (active) { setAccount(nextAccount); setHealth(nextHealth); } }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useLiveData(async () => {
    try {
      const [nextAccount, nextHealth] = await Promise.all([chuskyApi.account.get(), chuskyApi.health.get()]);
      setAccount(nextAccount); setHealth(nextHealth);
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
        setActivityCount(activity.tasks.filter((task) => ["queued", "running", "blocked", "failed"].includes(task.status)).length);
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
  }, []);
  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem("chusky-sidebar-collapsed") === "true"); } catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  const signOut = async () => { await authClient.signOut(); router.replace("/sign-in"); };
  const startNewConversation = () => { setOpen(false); router.push(`/app/chat?new=1&nonce=${Date.now()}`); };
  const brandName = branding?.displayName || "Chusky";
  const accountName = session?.user?.name || session?.user?.email || "Your account";
  const attentionEvents = (account?.triggerEvents ?? []).filter((event) => event.needsAttention || ["pending", "failed"].includes(event.notificationStatus));
  const attentionCount = (account?.approvals.length ?? 0) + attentionEvents.length + activityCount;
  const toggleCollapsed = () => setCollapsed((current) => {
    const next = !current;
    try { window.localStorage.setItem("chusky-sidebar-collapsed", String(next)); } catch { /* Storage can be unavailable in private browsing. */ }
    return next;
  });
  const nav = (items: NavItem[]) => items.map(([label, href, Icon]) => (
    <Link key={href} href={href} onClick={() => setOpen(false)} aria-label={label} title={collapsed ? label : undefined} className={cn("flex min-h-9 min-w-0 items-center gap-2 rounded-md py-1.5 text-[11px] transition-colors lg:min-h-0", collapsed ? "px-2.5 lg:justify-center lg:px-2" : "px-2.5", pathname === href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
      <span className="flex w-5 shrink-0 items-center justify-center"><Icon size={14} strokeWidth={1.8} aria-hidden="true" /></span><span className={collapsed ? "lg:hidden" : undefined}>{label}</span>
      {label === "Approvals" && ((account?.approvals.length ?? 0) + activityCount) > 0 && <span className={cn("ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black", collapsed && "lg:hidden")}>{(account?.approvals.length ?? 0) + activityCount}</span>}
    </Link>
  ));
  return <AppShellContext.Provider value={{ setChatHeader }}><div className="app-shell min-h-svh text-foreground" style={branding?.backgroundColor ? { backgroundColor: branding.backgroundColor } : undefined}>
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col overflow-hidden border-r border-foreground/10 bg-background transition-[transform,width] duration-200 lg:flex", collapsed && "lg:w-[68px]")}>
      <div className={cn("flex h-14 items-center border-b border-foreground/10 px-4", collapsed ? "justify-center lg:px-2" : "justify-between")}><Link href="/app" className="flex items-center gap-2 font-display text-xl tracking-tight" aria-label={`${brandName} home`} title={collapsed ? `${brandName} home` : undefined}><span className={collapsed ? "lg:hidden" : undefined}>{branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-6 w-6 object-contain" /> : <>{brandName}<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></>}</span><span className={collapsed ? "hidden lg:block" : "hidden"}>{brandName.slice(0, 1).toUpperCase()}</span></Link><div className="flex items-center gap-1"><button onClick={toggleCollapsed} className="hidden min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button><button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={18}/></button></div></div>
      <div className="p-3"><button type="button" onClick={startNewConversation} aria-label="New conversation" title={collapsed ? "New conversation" : undefined} className={cn("flex min-h-10 w-full items-center gap-2 rounded-lg border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40 lg:min-h-9", collapsed && "lg:justify-center lg:px-0")}><Plus size={14}/><span className={collapsed ? "lg:hidden" : undefined}>New conversation</span><span className={cn("ml-auto font-mono text-[10px] text-muted-foreground", collapsed && "lg:hidden")}>⌘K</span></button></div>
      <nav className="flex-1 overflow-y-auto px-2"><p className={cn("px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Workspace</p>{nav(primary)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Automate</p>{nav(work)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Account</p>{nav([["Agent profile", "/app/onboarding", UserRound], ["Developer API", "/app/developer-api", Code2], ["Devices", "/app/devices", SquareTerminal], ["Settings", "/app/settings", Settings2]])}</nav>
      <div className={cn("m-2.5 border border-foreground/10 bg-foreground/[0.03] p-2", collapsed && "lg:m-2 lg:flex lg:justify-center lg:p-2")} title={collapsed ? (health?.ok ? "All systems operational" : "System status") : undefined}><div className="mb-1.5 flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span className={collapsed ? "lg:hidden" : undefined}>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div><p className={cn("text-[9px] leading-relaxed text-muted-foreground", collapsed && "lg:hidden")}>{health ? `${health.persistence === "redis" ? "Redis persistence" : "Memory storage"} · ${account?.channels.length ?? 0} verified channel${account?.channels.length === 1 ? "" : "s"}` : "Loading live diagnostics…"}</p></div>
      <div className={cn("border-t border-foreground/10 p-2.5", collapsed && "lg:p-2")}><div className={cn("mb-2 flex min-w-0 justify-end", collapsed && "lg:hidden")}><ThemeSwitcher /></div><div className={cn("flex min-w-0 items-center gap-2", collapsed && "lg:justify-center")}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{accountName.slice(0, 2).toUpperCase()}</span><span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", collapsed && "lg:hidden")}>{accountName}</span><button onClick={signOut} className={cn("inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-[10px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:min-h-9", collapsed && "lg:min-w-9 lg:px-0")} aria-label="Sign out" title="Sign out"><span className={collapsed ? "lg:hidden" : undefined}>Sign out</span><LogOut size={13} className={collapsed ? "hidden lg:block" : "hidden"}/></button></div></div>
    </aside>
      <Drawer open={open} onOpenChange={setOpen} direction="left"><DrawerContent className="h-full max-h-none w-[min(20rem,calc(100vw-1rem))] p-0"><div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="flex h-14 items-center justify-between border-b border-foreground/10 px-4"><Link href="/app" className="flex items-center gap-2 font-display text-xl tracking-tight">{branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-6 w-6 object-contain" /> : brandName}<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></Link><DrawerClose asChild><button className="flex min-h-9 min-w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close menu"><X size={18}/></button></DrawerClose></div><div className="p-3"><button type="button" onClick={startNewConversation} className="flex min-h-9 w-full items-center gap-2 border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40"><Plus size={14}/> New conversation</button></div><nav className="min-h-0 flex-1 overflow-y-auto px-2"><p className="px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>{nav(primary)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Automate</p>{nav(work)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Account</p>{nav([["Agent profile", "/app/onboarding", UserRound], ["Developer API", "/app/developer-api", Code2], ["Devices", "/app/devices", SquareTerminal], ["Settings", "/app/settings", Settings2]])}</nav><div className="m-3 border border-foreground/10 bg-foreground/[0.03] p-2"><div className="flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div></div><div className="border-t border-foreground/10 p-3"><div className="mb-2 flex justify-end"><ThemeSwitcher /></div><div className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{accountName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-[11px] font-medium">{accountName}</span><button onClick={signOut} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md px-2 text-[10px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label="Sign out">Sign out</button></div></div></div></DrawerContent></Drawer>
    <div className={cn("min-w-0 transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[232px]")}><header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-foreground/10 bg-background/90 px-2.5 backdrop-blur-xl sm:h-14 sm:px-4 lg:px-6"><div className="flex min-w-0 items-center gap-2.5"><button onClick={() => setOpen(true)} className="flex min-h-9 min-w-9 items-center justify-center lg:hidden" aria-label="Open menu"><Menu size={17}/></button>{pathname === "/app/chat" && <div className="flex min-w-0 items-center gap-2"><h1 className="max-w-[calc(100vw-9rem)] truncate text-[11px] font-medium sm:max-w-[24rem]">{chatHeader?.title || "Chat"}</h1><span className={chatHeader?.status === "ready" ? "shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-emerald-800" : "shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-800"}>{chatHeader?.status === "ready" ? "Live" : chatHeader?.status === "offline" ? "Offline" : "Connecting"}</span></div>}</div><div className="relative"><button type="button" onClick={() => setAttentionOpen((current) => !current)} className="relative flex min-h-9 min-w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Open notifications and approvals" aria-expanded={attentionOpen}><Bell size={15}/>{attentionCount > 0 && <span className="absolute right-0.5 top-0.5 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-bold leading-none text-black">{attentionCount > 99 ? "99+" : attentionCount}</span>}</button>{attentionOpen && <div className="absolute right-0 top-11 z-50 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-foreground/10 bg-background shadow-xl"><div className="flex items-center justify-between border-b border-foreground/10 px-3.5 py-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Attention</p><p className="mt-1 text-xs font-medium">What needs your attention</p></div><span className="text-[10px] text-muted-foreground">Live</span></div>{account?.approvals.slice(0, 3).map((approval) => <button key={`approval-${approval.id}`} type="button" onClick={() => { setAttentionOpen(false); router.push("/app/approvals"); }} className="flex w-full items-start gap-2.5 border-b border-foreground/10 px-3.5 py-3 text-left hover:bg-foreground/[0.03]"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" /><span className="min-w-0"><span className="block truncate text-[11px] font-medium">Approval required</span><span className="mt-0.5 block line-clamp-2 text-[10px] leading-4 text-muted-foreground">{approval.request || `Review ${approval.toolSlug} before it runs.`}</span></span></button>)}{attentionEvents.slice(0, 4).map((event) => <button key={`trigger-${event.id}`} type="button" onClick={() => { setAttentionOpen(false); router.push("/app/approvals"); }} className="flex w-full items-start gap-2.5 border-b border-foreground/10 px-3.5 py-3 text-left hover:bg-foreground/[0.03]"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" /><span className="min-w-0"><span className="block truncate text-[11px] font-medium">{event.slug || "Connected app event"}</span><span className="mt-0.5 block line-clamp-2 text-[10px] leading-4 text-muted-foreground">{event.summary}</span></span></button>)}{!account?.approvals.length && !attentionEvents.length && !activityCount && <div className="px-3.5 py-5 text-center text-[11px] text-muted-foreground">Nothing needs your attention right now.</div>}<button type="button" onClick={() => { setAttentionOpen(false); router.push("/app/approvals"); }} className="flex w-full items-center justify-between px-3.5 py-3 text-[10px] font-medium hover:bg-foreground/[0.03]">Open approvals and activity <ArrowRight size={13} /></button></div>}</div></header><main className="mx-auto max-w-[1400px] min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-6 lg:px-7 lg:py-8">{children}</main></div>
  </div></AppShellContext.Provider>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="app-page-heading mb-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b border-foreground/10 pb-3.5 sm:mb-5 sm:items-end sm:pb-4"><div className="min-w-0"><p className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-[1.4rem] leading-none tracking-tight sm:text-[1.75rem]">{title}</h1>{description && <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-muted-foreground">{description}</p>}</div>{action && <div className="app-page-heading-actions flex max-w-[min(45vw,12rem)] shrink-0 flex-wrap justify-end gap-1.5">{action}</div>}</div>; }
export function Button({ children, secondary = false, onClick, disabled, className }: { children: ReactNode; secondary?: boolean; onClick?: () => void; disabled?: boolean; className?: string }) { return <button type="button" onClick={onClick} disabled={disabled} className={cn("app-button inline-flex w-fit max-w-full self-start min-h-8 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-medium transition-[color,background-color,border-color,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-7", secondary ? "border border-foreground/12 bg-background shadow-sm hover:border-foreground/30 hover:bg-foreground/[0.03]" : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90", className)}>{children}</button>; }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("app-card min-w-0 overflow-hidden rounded-lg border border-foreground/10 bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}>{children}</div>; }
export function Status({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "gray" }) { return <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-medium", tone === "green" ? "bg-emerald-500/10 text-emerald-700" : tone === "amber" ? "bg-amber-400/15 text-amber-700" : "bg-foreground/[0.06] text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-400" : "bg-foreground/25")}/>{children}</span>; }

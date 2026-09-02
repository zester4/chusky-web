"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, ChevronDown, Command, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type AccountOverview, type HealthSnapshot } from "@/lib/chusky-api";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import type { ReactNode } from "react";

const primary = [
  ["Overview", "/app", "⌂"], ["Chat", "/app/chat", "✦"], ["Conversations", "/app/conversations", "◌"],
  ["Approvals", "/app/approvals", "✓"], ["Calls", "/app/calls", "⌕"], ["Connected apps", "/app/apps", "⊞"], ["Tasks", "/app/tasks", "▣"], ["Operations", "/app/operations", "◉"], ["Delivery", "/app/delivery", "↗"],
];
const work = [["Reminders", "/app/reminders", "◷"], ["Recurring jobs", "/app/jobs", "↻"], ["Memory", "/app/memory", "◇"], ["Scratchpad", "/app/scratchpad", "✎"], ["Triggers", "/app/triggers", "⌁"], ["Workspace", "/app/workspace", "▤"]];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [account, setAccount] = useState<AccountOverview>();
  const [health, setHealth] = useState<HealthSnapshot>();
  const [activityCount, setActivityCount] = useState(0);
  const { data: session } = authClient.useSession();
  useEffect(() => {
    let active = true;
    void Promise.all([chuskyApi.account.get(), chuskyApi.health.get()]).then(([nextAccount, nextHealth]) => { if (active) { setAccount(nextAccount); setHealth(nextHealth); } }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    let since = Date.now();
    const poll = async () => { try { const activity = await chuskyApi.activity.get(since); if (!active) return; since = activity.now; setActivityCount(activity.approvals.length + activity.tasks.filter((task) => ["queued", "running", "blocked", "failed"].includes(task.status)).length); } catch { /* Keep navigation usable if activity is temporarily unavailable. */ } };
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem("chusky-sidebar-collapsed") === "true"); } catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  const signOut = async () => { await authClient.signOut(); router.replace("/sign-in"); };
  const toggleCollapsed = () => setCollapsed((current) => {
    const next = !current;
    try { window.localStorage.setItem("chusky-sidebar-collapsed", String(next)); } catch { /* Storage can be unavailable in private browsing. */ }
    return next;
  });
  const nav = (items: string[][]) => items.map(([label, href, icon]) => (
    <Link key={href} href={href} onClick={() => setOpen(false)} aria-label={label} title={collapsed ? label : undefined} className={cn("flex min-w-0 items-center gap-2.5 py-2 text-xs transition-colors", collapsed ? "px-2.5 lg:justify-center lg:px-2" : "px-2.5", pathname === href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
      <span className="w-5 shrink-0 text-center font-mono text-sm">{icon}</span><span className={collapsed ? "lg:hidden" : undefined}>{label}</span>
      {label === "Approvals" && ((account?.approvals.length ?? 0) + activityCount) > 0 && <span className={cn("ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black", collapsed && "lg:hidden")}>{(account?.approvals.length ?? 0) + activityCount}</span>}
    </Link>
  ));
  return <div className="min-h-screen bg-[#f7f7f4] text-foreground">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col overflow-hidden border-r border-foreground/10 bg-background transition-[transform,width] duration-200 lg:flex", collapsed && "lg:w-[68px]")}>
      <div className={cn("flex h-14 items-center border-b border-foreground/10 px-4", collapsed ? "justify-center lg:px-2" : "justify-between")}><Link href="/app" className="font-display text-xl tracking-tight" aria-label="Chusky home" title={collapsed ? "Chusky home" : undefined}><span className={collapsed ? "lg:hidden" : undefined}>Chusky<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></span><span className={collapsed ? "hidden lg:block" : "hidden"}>C</span></Link><div className="flex items-center gap-1"><button onClick={toggleCollapsed} className="hidden min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button><button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={18}/></button></div></div>
      <div className="p-3"><Link href="/app/chat" onClick={() => setOpen(false)} aria-label="New conversation" title={collapsed ? "New conversation" : undefined} className={cn("flex min-h-9 w-full items-center gap-2 border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40", collapsed && "lg:justify-center lg:px-0")}><Plus size={14}/><span className={collapsed ? "lg:hidden" : undefined}>New conversation</span><span className={cn("ml-auto font-mono text-[10px] text-muted-foreground", collapsed && "lg:hidden")}>⌘K</span></Link></div>
      <nav className="flex-1 overflow-y-auto px-2"><p className={cn("px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Workspace</p>{nav(primary)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Automate</p>{nav(work)}<p className={cn("px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground", collapsed && "lg:hidden")}>Account</p>{nav([["Developer API", "/app/developer-api", "⌘"], ["Devices", "/app/devices", "⌁"], ["Settings", "/app/settings", "⚙"]])}</nav>
      <div className={cn("m-2.5 border border-foreground/10 bg-foreground/[0.03] p-2", collapsed && "lg:m-2 lg:flex lg:justify-center lg:p-2")} title={collapsed ? (health?.ok ? "All systems operational" : "System status") : undefined}><div className="mb-1.5 flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span className={collapsed ? "lg:hidden" : undefined}>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div><p className={cn("text-[9px] leading-relaxed text-muted-foreground", collapsed && "lg:hidden")}>{health ? `${health.persistence === "redis" ? "Redis persistence" : "Memory storage"} · ${account?.channels.length ?? 0} verified channel${account?.channels.length === 1 ? "" : "s"}` : "Loading live diagnostics…"}</p></div>
    </aside>
    <Drawer open={open} onOpenChange={setOpen} direction="left"><DrawerContent className="h-full max-h-none w-[min(20rem,calc(100vw-1rem))] p-0"><div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="flex h-14 items-center justify-between border-b border-foreground/10 px-4"><Link href="/app" className="font-display text-xl tracking-tight">Chusky<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></Link><DrawerClose asChild><button className="flex min-h-9 min-w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close menu"><X size={18}/></button></DrawerClose></div><div className="p-3"><Link href="/app/chat" onClick={() => setOpen(false)} className="flex min-h-9 w-full items-center gap-2 border border-foreground/15 bg-background px-2.5 py-2 text-xs hover:border-foreground/40"><Plus size={14}/> New conversation</Link></div><nav className="min-h-0 flex-1 overflow-y-auto px-2"><p className="px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>{nav(primary)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Automate</p>{nav(work)}<p className="px-2 pb-1.5 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Account</p>{nav([["Developer API", "/app/developer-api", "⌘"], ["Devices", "/app/devices", "⌁"], ["Settings", "/app/settings", "⚙"]])}</nav><div className="m-3 border border-foreground/10 bg-foreground/[0.03] p-2"><div className="flex items-center gap-2 text-[10px] font-medium"><span className={cn("h-2 w-2 shrink-0 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/><span>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</span></div></div></div></DrawerContent></Drawer>
    <div className={cn("min-w-0 transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[232px]")}><header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-foreground/10 bg-background/90 px-2.5 backdrop-blur-xl sm:h-14 sm:px-4 lg:px-6"><div className="flex min-w-0 items-center gap-2.5"><button onClick={() => setOpen(true)} className="flex min-h-9 min-w-9 items-center justify-center lg:hidden" aria-label="Open menu"><Menu size={18}/></button><div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex"><Command size={12}/> Press <kbd className="border border-foreground/15 px-1.5 py-0.5 font-mono text-[9px]">K</kbd> to search</div></div><div className="flex min-w-0 items-center gap-2"><button className="flex min-h-9 min-w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Notifications"><Bell size={16}/></button><div className="flex min-w-0 items-center gap-1.5 border-l border-foreground/10 pl-2.5 sm:gap-2 sm:pl-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{(session?.user?.name || session?.user?.email || "C").slice(0, 2).toUpperCase()}</span><span className="hidden max-w-40 truncate text-[11px] sm:block">{session?.user?.name || session?.user?.email || "Your account"}</span><ChevronDown size={12} className="shrink-0 text-muted-foreground"/><button onClick={signOut} className="whitespace-nowrap text-[10px] text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button></div></div></header><main className="mx-auto max-w-[1400px] min-w-0 px-2.5 py-4 sm:px-4 sm:py-6 lg:px-7 lg:py-8">{children}</main></div>
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-4 flex min-w-0 flex-col justify-between gap-2.5 border-b border-foreground/10 pb-4 sm:mb-5 sm:flex-row sm:items-end sm:gap-3 sm:pb-5"><div className="min-w-0"><p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-[1.75rem] leading-none tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">{description}</p>}</div>{action && <div className="flex shrink-0">{action}</div>}</div>; }
export function Button({ children, secondary = false, onClick, disabled }: { children: ReactNode; secondary?: boolean; onClick?: () => void; disabled?: boolean }) { return <button onClick={onClick} disabled={disabled} className={cn("inline-flex w-fit max-w-full self-start min-h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50", secondary ? "border border-foreground/15 bg-background hover:border-foreground/40" : "bg-foreground text-background hover:bg-foreground/85")}>{children}</button>; }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("min-w-0 border border-foreground/10 bg-background", className)}>{children}</div>; }
export function Status({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "gray" }) { return <span className={cn("inline-flex items-center gap-1.5 text-xs", tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-400" : "bg-foreground/25")}/>{children}</span>; }

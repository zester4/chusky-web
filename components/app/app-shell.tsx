"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, ChevronDown, Command, Menu, Plus, Search, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type AccountOverview, type HealthSnapshot } from "@/lib/chusky-api";
import type { ReactNode } from "react";

const primary = [
  ["Overview", "/app", "⌂"], ["Chat", "/app/chat", "✦"], ["Conversations", "/app/conversations", "◌"],
  ["Approvals", "/app/approvals", "✓"], ["Connected apps", "/app/apps", "⊞"], ["Tasks", "/app/tasks", "▣"], ["Operations", "/app/operations", "◉"], ["Delivery", "/app/delivery", "↗"],
];
const work = [["Reminders", "/app/reminders", "◷"], ["Recurring jobs", "/app/jobs", "↻"], ["Memory", "/app/memory", "◇"], ["Scratchpad", "/app/scratchpad", "✎"], ["Triggers", "/app/triggers", "⌁"], ["Workspace", "/app/workspace", "▤"]];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountOverview>();
  const [health, setHealth] = useState<HealthSnapshot>();
  const { data: session } = authClient.useSession();
  useEffect(() => {
    let active = true;
    void Promise.all([chuskyApi.account.get(), chuskyApi.health.get()]).then(([nextAccount, nextHealth]) => { if (active) { setAccount(nextAccount); setHealth(nextHealth); } }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const signOut = async () => { await authClient.signOut(); router.replace("/sign-in"); };
  const nav = (items: string[][]) => items.map(([label, href, icon]) => (
    <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", pathname === href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}>
      <span className="w-5 text-center font-mono text-sm">{icon}</span><span>{label}</span>
      {label === "Approvals" && (account?.approvals.length ?? 0) > 0 && <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{account?.approvals.length}</span>}
    </Link>
  ));
  return <div className="min-h-screen bg-[#f7f7f4] text-foreground">
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-foreground/10 bg-background transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-16 items-center justify-between border-b border-foreground/10 px-5"><Link href="/app" className="font-display text-2xl tracking-tight">Chusky<span className="ml-1 align-top font-mono text-[9px] text-muted-foreground">TM</span></Link><button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={18}/></button></div>
      <div className="p-4"><Link href="/app/chat" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 border border-foreground/15 bg-background px-3 py-2 text-sm hover:border-foreground/40"><Plus size={15}/> New conversation <span className="ml-auto font-mono text-[10px] text-muted-foreground">⌘K</span></Link></div>
      <nav className="flex-1 overflow-y-auto px-3"><p className="px-3 pb-2 pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>{nav(primary)}<p className="px-3 pb-2 pt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Automate</p>{nav(work)}<p className="px-3 pb-2 pt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Account</p>{nav([["Devices", "/app/devices", "⌁"], ["Settings", "/app/settings", "⚙"]])}</nav>
      <div className="m-4 border border-foreground/10 bg-foreground/[0.03] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium"><span className={cn("h-2 w-2 rounded-full", health?.ok ? "bg-emerald-500" : health ? "bg-amber-400" : "bg-foreground/25")}/>{health ? health.ok ? "All systems operational" : "System needs attention" : "Checking system status"}</div><p className="text-[11px] leading-relaxed text-muted-foreground">{health ? `${health.persistence === "redis" ? "Redis persistence" : "Memory storage"} · ${account?.channels.length ?? 0} verified channel${account?.channels.length === 1 ? "" : "s"}` : "Loading live diagnostics…"}</p></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"/>}
    <div className="lg:pl-[252px]"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-foreground/10 bg-background/90 px-4 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu"><Menu size={20}/></button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Command size={14}/> Press <kbd className="border border-foreground/15 px-1.5 py-0.5 font-mono text-[10px]">K</kbd> to search</div></div><div className="flex items-center gap-4"><button className="text-muted-foreground hover:text-foreground" aria-label="Notifications"><Bell size={18}/></button><div className="flex items-center gap-2 border-l border-foreground/10 pl-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs text-background">{(session?.user?.name || session?.user?.email || "C").slice(0, 2).toUpperCase()}</span><span className="hidden max-w-40 truncate text-sm sm:block">{session?.user?.name || session?.user?.email || "Your account"}</span><ChevronDown size={14} className="text-muted-foreground"/><button onClick={signOut} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button></div></div></header><main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main></div>
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-7 sm:flex-row sm:items-end"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>; }
export function Button({ children, secondary = false, onClick }: { children: ReactNode; secondary?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs transition-colors", secondary ? "border border-foreground/15 bg-background hover:border-foreground/40" : "bg-foreground text-background hover:bg-foreground/85")}>{children}</button>; }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("border border-foreground/10 bg-background", className)}>{children}</div>; }
export function Status({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "gray" }) { return <span className={cn("inline-flex items-center gap-1.5 text-xs", tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-400" : "bg-foreground/25")}/>{children}</span>; }

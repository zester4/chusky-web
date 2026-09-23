"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, Laptop, Link2, LoaderCircle, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, Webhook, Zap, Unplug } from "lucide-react";
import { chuskyApi, type AccountOverview, type ConnectedAccount, type LiveVoicePreferences, type Model, type TelegramLinkCode, type Toolkit, type Trigger, type TriggerCatalogueItem, type TriggerToolkit, type VoiceOptions } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PageKind = "approvals" | "apps" | "reminders" | "jobs" | "memory" | "scratchpad" | "triggers" | "workspace" | "devices" | "settings";

const copy: Record<PageKind, { eyebrow: string; title: string; description: string }> = {
  approvals: { eyebrow: "Safety center", title: "Approvals", description: "Review externally visible actions before Chusky executes them." },
  apps: { eyebrow: "Connected services", title: "Connected apps", description: "Connect and manage the external accounts your agent can use." },
  reminders: { eyebrow: "One-time automation", title: "Reminders", description: "Durable reminders delivered when they are due." },
  jobs: { eyebrow: "Scheduled automation", title: "Recurring jobs", description: "Recurring schedules currently stored for your account." },
  memory: { eyebrow: "Long-term context", title: "Memory", description: "Facts and preferences you explicitly asked Chusky to remember." },
  scratchpad: { eyebrow: "Private working notes", title: "Scratchpad", description: "Temporary notes saved in your private Chusky session." },
  triggers: { eyebrow: "Real-time events", title: "Triggers", description: "Connect live events to actions your agent can take for you." },
  workspace: { eyebrow: "Agent workspace", title: "Workspace", description: "The private computer workspace your agent can use for files, commands, and generated work." },
  devices: { eyebrow: "CLI access", title: "Devices", description: "Terminals currently linked to your Chusky account." },
  settings: { eyebrow: "Account configuration", title: "Settings", description: "Live account defaults and runtime preferences." },
};

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function Empty({ children }: { children: ReactNode }) { return <p className="p-4 text-xs text-muted-foreground sm:p-5">{children}</p>; }
function Offline({ retry }: { retry: () => void }) { return <Card className="flex flex-col items-start gap-3 p-4"><Status tone="amber">Backend unavailable</Status><p className="text-xs text-muted-foreground">This page needs the authenticated Chusky API to load your private data.</p><Button secondary onClick={retry}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Retry</Button></Card>; }

export function AccountDataPage({ kind }: { kind: PageKind }) {
  const [data, setData] = useState<AccountOverview>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string>();
  const load = async () => { setOffline(false); try { setData(await chuskyApi.account.get()); } catch { setOffline(true); } };
  useEffect(() => { void load(); }, []);
  useLiveData(load);
  const decide = async (id: string, decision: "approve" | "deny") => { setBusy(id); try { await chuskyApi.approvals.decide(id, decision); await load(); } finally { setBusy(undefined); } };
  const heading = copy[kind];
  return <><PageHeading eyebrow={heading.eyebrow} title={heading.title} description={heading.description} action={<Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Refresh</Button>} />{offline ? <Offline retry={() => void load()} /> : !data ? <Card className="flex items-center gap-3 p-4 text-xs text-muted-foreground sm:p-5"><LoaderCircle size={15} className="animate-spin" /> Loading your saved data…</Card> : <Content kind={kind} data={data} decide={decide} busy={busy} />}</>;
}

function Content({ kind, data, decide, busy }: { kind: PageKind; data: AccountOverview; decide: (id: string, decision: "approve" | "deny") => Promise<void>; busy?: string }) {
  if (kind === "approvals") return <Card>{data.approvals.length ? data.approvals.map((item) => <div key={item.id} className="border-b border-foreground/10 p-3.5 last:border-0 sm:p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start"><ShieldCheck className="mt-1 shrink-0 text-amber-600" size={17} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xs font-medium">{item.toolSlug}</h2><Status tone="amber">Expires {date(item.expiresAt)}</Status></div><p className="mt-2 break-words text-xs text-muted-foreground">{item.request}</p><p className="mt-2 break-all font-mono text-[9px] text-muted-foreground">{item.id}{item.channelProvider ? ` · ${item.channelProvider}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button secondary onClick={() => void decide(item.id, "deny")}><Trash2 size={12} /> Deny</Button><Button onClick={() => void decide(item.id, "approve")}><Check size={12} /> {busy === item.id ? "Working" : "Approve"}</Button></div></div></div>) : <Empty>No pending approvals. Chusky will show risky actions here before execution.</Empty>}</Card>;
  if (kind === "apps") return <AppsPanel channels={data.channels} />;
  if (kind === "reminders") return <Card>{data.reminders.length ? data.reminders.map((item) => <Row key={item.id} icon={<Clock3 size={15} />} title={item.text} detail={`Runs ${date(item.runAt)}`} meta={`Created ${date(item.createdAt)}`} status={item.status} />) : <Empty>No reminders saved yet.</Empty>}</Card>;
  if (kind === "jobs") return <Card>{data.jobs.length ? data.jobs.map((item) => <Row key={item.id} icon={<RotateCcw size={15} />} title={item.text} detail={item.cron} meta={`Created ${date(item.createdAt)}`} status={item.status} />) : <Empty>No recurring jobs saved yet.</Empty>}</Card>;
  if (kind === "memory") return <Card>{data.memory.length ? data.memory.map((item) => <Row key={item.id} icon={<Zap size={15} />} title={item.key} detail={item.value} meta={`${item.category} · ${Math.round(item.confidence * 100)}% confidence · ${date(item.updatedAt)}`} />) : <Empty>No explicit memories saved yet.</Empty>}</Card>;
  if (kind === "scratchpad") return <Card>{data.scratchpad.length ? data.scratchpad.map((item) => <Row key={item.key} icon={<ExternalLink size={15} />} title={item.key} detail={item.content} meta={`Updated ${date(item.updatedAt)}`} />) : <Empty>Your scratchpad is empty.</Empty>}</Card>;
  if (kind === "triggers") return <ComprehensiveTriggersPanel />;
  if (kind === "devices") return <DevicesPanel initial={data.devices} />;
  if (kind === "workspace") return <Card className="p-4 sm:p-5">{data.workspace ? <div className="space-y-4"><div className="flex flex-wrap items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-700"><Laptop size={17} /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-medium">{data.workspace.name}</h2><p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{data.workspace.sandboxId}</p></div><Status tone={data.workspace.lastKnownState === "running" ? "green" : "amber"}>{data.workspace.lastKnownState || "available"}</Status></div><div className="grid gap-2 sm:grid-cols-3"><Info label="PTY sessions" value={String(data.workspace.ptySessions)} /><Info label="Updated" value={date(data.workspace.updatedAt)} /><Info label="Browser" value={data.workspace.lastUrl || "No page saved"} /></div></div> : <Empty>No agent workspace has been created for this account.</Empty>}</Card>;
  return <div className="grid gap-4 lg:grid-cols-2"><SettingsPanel initialModel={data.model} initialVoice={data.voiceReplies} initialPreferences={data.voicePreferences} /><TelegramLink linked={data.telegramLink.linked} /><Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Developer webhooks</p>{data.webhooks.length ? data.webhooks.map((item) => <Row key={item.id} icon={<Webhook size={15} />} title={item.url} detail={item.id} meta={`Created ${date(item.createdAt)}`} />) : <Empty>No developer webhooks configured.</Empty>}</Card></div>;
}

function SettingsPanel({ initialModel, initialVoice, initialPreferences }: { initialModel: string; initialVoice: boolean; initialPreferences: LiveVoicePreferences }) {
  const [model, setModel] = useState(initialModel); const [voice, setVoice] = useState(initialVoice); const [models, setModels] = useState<Model[]>([]); const [voiceOptions, setVoiceOptions] = useState<VoiceOptions>(); const [preferences, setPreferences] = useState(initialPreferences); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string>();
  useEffect(() => { setModel(initialModel); setVoice(initialVoice); setPreferences(initialPreferences); }, [initialModel, initialVoice, initialPreferences]);
  useEffect(() => { void chuskyApi.account.models().then((result) => setModels(result.data)).catch(() => setMessage("Model list is temporarily unavailable.")); void chuskyApi.account.voiceOptions().then(setVoiceOptions).catch(() => setMessage("Voice options are temporarily unavailable.")); }, []);
  const update = async (input: { model?: string; voiceReplies?: boolean; liveVoice?: { provider: "twilio" | "meetings"; voice: string | null } | { provider: "bland"; voice: { id: string; name: string } | null } }) => { setBusy(true); setMessage(undefined); try { const next = await chuskyApi.account.updatePreferences(input); setModel(next.model); setVoice(next.voiceReplies); setPreferences(next.voicePreferences); setOpen(false); setMessage("Saved across supported Chusky channels."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save this preference."); } finally { setBusy(false); } };
  const fluxSelector = (provider: "twilio" | "meetings", label: string) => <label className="block text-xs text-muted-foreground">{label}<select disabled={busy} value={preferences[provider] ?? ""} onChange={(event) => void update({ liveVoice: { provider, voice: event.target.value || null } })} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Provider default</option>{preferences[provider] && !voiceOptions?.fluxVoices.some((item) => item.id === preferences[provider]) && <option value={preferences[provider]}>{preferences[provider]} · saved selection</option>}{voiceOptions?.fluxVoices.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.accent} ({item.id})</option>)}</select>{!voiceOptions && <span className="mt-1 block text-[10px]">Voice catalogue unavailable; existing selection can still be reset.</span>}</label>;
  return <Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Runtime preferences</p><div className="mt-4 space-y-4"><div><label className="text-xs text-muted-foreground">Selected model</label><div className="relative mt-1.5"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" disabled={busy} aria-expanded={open} className="flex min-h-9 w-full items-center justify-between border border-foreground/15 px-2.5 py-2 text-left text-xs hover:border-foreground/40"><span className="truncate">{model}</span><ChevronDown size={14} /></button></PopoverTrigger><PopoverContent align="start" sideOffset={5} className="max-h-64 w-[min(24rem,calc(100vw-1rem))] overflow-auto p-1">{models.map((item) => <button key={item.id} type="button" onClick={() => void update({ model: item.id })} className="block min-h-8 w-full px-2.5 py-2 text-left text-xs hover:bg-foreground/5"><span className="block truncate">{item.name}</span><span className="mt-0.5 block truncate font-mono text-[9px] text-muted-foreground">{item.id}</span></button>)}{!models.length && <p className="p-3 text-xs text-muted-foreground">Loading models…</p>}</PopoverContent></Popover></div></div><div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-3"><div className="min-w-0"><p className="text-xs">Voice replies</p><p className="mt-1 text-[10px] text-muted-foreground">Read Chusky responses aloud where supported.</p></div><button type="button" role="switch" aria-checked={voice} disabled={busy} onClick={() => void update({ voiceReplies: !voice })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${voice ? "bg-foreground" : "bg-foreground/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background transition-transform ${voice ? "translate-x-6" : "translate-x-1"}`} /></button></div><div className="space-y-3 border-t border-foreground/10 pt-3"><p className="text-xs font-medium">Voice selection by provider</p>{fluxSelector("twilio", "Twilio / phone calls")}{fluxSelector("meetings", "Recall meetings")}{voiceOptions?.blandAvailable ? <label className="block text-xs text-muted-foreground">Bland<select disabled={busy} value={preferences.bland?.id ?? ""} onChange={(event) => { const selected = voiceOptions.blandVoices.find((item) => item.id === event.target.value); if (!event.target.value || selected) void update({ liveVoice: { provider: "bland", voice: selected ? { id: selected.id, name: selected.name } : null } }); }} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Provider default{preferences.bland ? ` · current ${preferences.bland.name}` : ""}</option>{preferences.bland && !voiceOptions.blandVoices.some((item) => item.id === preferences.bland?.id) && <option value={preferences.bland.id}>{preferences.bland.name} · saved selection</option>}{voiceOptions.blandVoices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="mt-1 block text-[10px]">{voiceOptions.blandCatalogueAvailable ? "Applies to Bland calls." : "Bland voice catalogue is temporarily unavailable; existing selection can still be reset."}</span></label> : <p className="text-[10px] text-muted-foreground">Bland voice is not configured on this deployment.</p>}</div>{message && <p role="status" className="text-[11px] text-muted-foreground">{message}</p>}</div></Card>;
}

function ToolkitLogo({ item }: { item: Toolkit }) {
  const [failed, setFailed] = useState(false);
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-sm font-medium">
    {item.logo && !failed ? <img src={item.logo} alt="" loading="lazy" className="h-8 w-8 object-contain" onError={() => setFailed(true)} /> : <span aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>}
  </div>;
}

function AppsPanel({ channels }: { channels: AccountOverview["channels"] }) {
  const [items, setItems] = useState<Toolkit[]>([]);
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [authorizationLinks, setAuthorizationLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [confirmId, setConfirmId] = useState<string>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string>();
  const [cursorByPage, setCursorByPage] = useState<Array<string | undefined>>([undefined]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const load = async (requestedPage = page, cursor = cursorByPage[requestedPage - 1], query = search) => {
    const currentRequest = ++requestId.current;
    setError(undefined);
    setLoading(true);
    try {
      const [apps, accounts] = await Promise.all([
        chuskyApi.apps.list({ search: query.trim(), cursor, limit: 30 }),
        chuskyApi.apps.connections(),
      ]);
      // Live refreshes and page changes can overlap. Ignore an older response so
      // it cannot put the user back on a previous page or search result.
      if (currentRequest !== requestId.current) return;
      // Composio's cursor response may report currentPage as 1 even when a
      // cursor was supplied. The cursor requested by the UI is authoritative.
      const effectivePage = requestedPage;
      setItems(apps.data);
      setConnections(accounts.data);
      setPage(effectivePage);
      setTotalPages(Math.max(1, apps.totalPages || 1));
      setTotal(apps.total);
      setNextCursor(apps.nextCursor);
      if (apps.nextCursor) setCursorByPage((current) => { const next = [...current]; next[effectivePage] = apps.nextCursor; return next; });
    } catch (cause) {
      if (currentRequest === requestId.current) setError(cause instanceof Error ? cause.message : "Could not load Composio apps.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => { void load(1, undefined, ""); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setCursorByPage([undefined]);
      void load(1, undefined, search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useLiveData(() => load(page, cursorByPage[page - 1], search));

  const connect = async (slug: string) => {
    setBusy(slug);
    setError(undefined);
    try {
      const result = await chuskyApi.apps.connect(slug, aliases[slug]?.trim() || undefined);
      setAuthorizationLinks((current) => ({ ...current, [slug]: result.url }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a connection link.");
    } finally {
      setBusy(undefined);
    }
  };
  const disconnect = async (id: string) => {
    setBusy(id);
    setError(undefined);
    try {
      await chuskyApi.apps.disconnect(id);
      setConfirmId(undefined);
      await load(page, cursorByPage[page - 1], search);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not disconnect this account.");
    } finally {
      setBusy(undefined);
    }
  };
  const goNext = () => {
    if (!nextCursor || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void load(nextPage, nextCursor, search);
  };
  const goPrevious = () => {
    if (page <= 1) return;
    const previousPage = page - 1;
    setPage(previousPage);
    void load(previousPage, cursorByPage[previousPage - 1], search);
  };
  const connectedChannels = channels.map((item) => item.provider.toLowerCase());

  return <div className="space-y-4">
    <Card className="p-3.5 sm:p-4">
      <div className="flex justify-end">
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{total.toLocaleString()} apps · page {page} of {totalPages}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search connected apps</span>
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search apps, categories, or capabilities…" className="min-h-9 w-full border border-foreground/15 bg-background pl-8 pr-2.5 text-xs outline-none focus:border-foreground/40" />
        </label>
        <Button secondary onClick={() => void load(page, cursorByPage[page - 1], search)} disabled={loading}><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh</Button>
      </div>
    </Card>

    <Card className="overflow-hidden">
      {items.length ? <div className="grid divide-y divide-foreground/10 md:grid-cols-2 md:divide-x md:divide-y-0">
        {items.map((item) => {
          const accounts = connections.filter((connection) => connection.toolkit.toLowerCase() === item.slug.toLowerCase());
          const canConnect = !item.noAuth;
          return <article key={item.slug} className="flex min-w-0 flex-col gap-3 p-3.5 sm:p-4">
            <div className="flex min-w-0 items-start gap-3">
              <ToolkitLogo item={item} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-sm font-medium">{item.name}</h2>
                  <Status tone={accounts.length ? "green" : "gray"}>{accounts.length ? `${accounts.length} connected` : item.noAuth ? "No sign-in required" : "Not connected"}</Status>
                </div>
                <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">{item.slug}</p>
              </div>
              {item.appUrl && <a href={item.appUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={"Open " + item.name + " website"} title="Open provider website"><ExternalLink size={13} /></a>}
            </div>
            {item.description && <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{item.description}</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.categories?.slice(0, 3).map((category) => <span key={category} className="rounded-full bg-foreground/[0.05] px-2 py-1 text-[9px] text-muted-foreground">{category}</span>)}
              {typeof item.toolsCount === "number" && <span className="rounded-full bg-foreground/[0.05] px-2 py-1 text-[9px] text-muted-foreground">{item.toolsCount.toLocaleString()} tools</span>}
              {typeof item.triggersCount === "number" && item.triggersCount > 0 && <span className="rounded-full bg-foreground/[0.05] px-2 py-1 text-[9px] text-muted-foreground">{item.triggersCount.toLocaleString()} triggers</span>}
            </div>
            {accounts.map((account) => <div key={account.id} className="flex min-w-0 flex-wrap items-center gap-2 border-l border-emerald-600/30 pl-3">
              <span className="min-w-0 flex-1 truncate text-[11px]">{account.alias || account.status}</span>
              <Button secondary disabled={busy === account.id} onClick={() => setConfirmId(account.id)}><Unplug size={12} /> Disconnect</Button>
            </div>)}
            {canConnect && <div className="flex flex-wrap items-center gap-2">
              <input aria-label={item.name + " account label"} value={aliases[item.slug] ?? ""} onChange={(event) => setAliases((current) => ({ ...current, [item.slug]: event.target.value }))} maxLength={80} placeholder={accounts.length ? "Label another account (optional)" : "Account label (optional)"} className="min-h-8 min-w-0 flex-1 border border-foreground/15 bg-background px-2 text-[11px]" />
              <Button secondary disabled={busy === item.slug} onClick={() => void connect(item.slug)}>{busy === item.slug ? "Preparing…" : accounts.length ? "Add account" : "Connect"}</Button>
            </div>}
            {authorizationLinks[item.slug] && <div className="border-l border-emerald-600/30 pl-3 text-[11px]">
              <p className="text-muted-foreground">Connection link ready. Open it to authorize this account:</p>
              <a href={authorizationLinks[item.slug]} target="_blank" rel="noreferrer" onClick={() => window.setTimeout(() => void load(page, cursorByPage[page - 1], search), 5000)} className="mt-1 inline-flex items-center gap-1 break-all underline underline-offset-2">Continue {item.name} authorization <ExternalLink size={11} /></a>
            </div>}
          </article>;
        })}
      </div> : <Empty>{error || (loading ? "Loading Composio apps…" : "No Composio apps matched your search.")}</Empty>}
      {error && <p role="alert" className="border-t border-amber-600/20 p-3 text-xs text-amber-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10 px-3.5 py-2.5 sm:px-4">
        <span className="text-[10px] text-muted-foreground">Showing {items.length ? ((page - 1) * 30 + 1) + "–" + ((page - 1) * 30 + items.length) : "0"} of {total.toLocaleString()}</span>
        <div className="flex items-center gap-1">
          <Button secondary onClick={goPrevious} disabled={loading || page <= 1}><ChevronLeft size={13} /> Previous</Button>
          <Button secondary onClick={goNext} disabled={loading || !nextCursor || page >= totalPages}>Next <ChevronRight size={13} /></Button>
        </div>
      </div>
    </Card>
    <Card className="p-4 text-xs text-muted-foreground sm:p-5">{connectedChannels.length ? connectedChannels.length + " verified channel identity" + (connectedChannels.length === 1 ? "" : "ies") + " are managed on the Channels page." : "Channel identities are managed separately from Composio app accounts."}</Card>
    {confirmId && <ConfirmDialog open onOpenChange={(open) => !open && setConfirmId(undefined)} title="Disconnect this connected account?" description="Chusky will stop using the provider account." confirmLabel="Disconnect account" destructive onConfirm={() => disconnect(confirmId)} />}
  </div>;
}
function DevicesPanel({ initial }: { initial: AccountOverview["devices"] }) {
  const [devices, setDevices] = useState(initial); const [confirmId, setConfirmId] = useState<string>(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string>();
  const load = async () => { try { setDevices((await chuskyApi.devices.list()).data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load CLI devices."); } };
  useEffect(() => { setDevices(initial); }, [initial]);
  useLiveData(load);
  const revoke = async (id: string) => { setBusy(true); setError(undefined); try { await chuskyApi.devices.revoke(id); setDevices((current) => current.filter((item) => item.id !== id)); setConfirmId(undefined); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke this device."); } finally { setBusy(false); } };
  return <><Card>{devices.length ? devices.map((item) => <div key={item.id} className="flex flex-col gap-2 border-b border-foreground/10 p-3.5 last:border-0 sm:flex-row sm:items-center sm:p-4"><Laptop size={15} className="shrink-0 text-muted-foreground"/><div className="min-w-0 flex-1"><p className="break-words text-xs font-medium">{item.name}</p><p className="mt-1 text-[11px] text-muted-foreground">Last seen {date(item.lastSeenAt)} · linked {date(item.createdAt)}</p></div><Button secondary disabled={busy} onClick={() => setConfirmId(item.id)}>Revoke access</Button></div>) : <Empty>No CLI devices are linked.</Empty>}{error && <p role="alert" className="p-3 text-xs text-amber-700">{error}</p>}</Card>{confirmId && <ConfirmDialog open onOpenChange={(open) => !open && setConfirmId(undefined)} title="Revoke this device?" description="Its CLI token will stop working immediately. The device can pair again later." confirmLabel="Revoke device" destructive onConfirm={() => revoke(confirmId)} />}</>;
}

function ComprehensiveTriggersPanel() {
  const [items, setItems] = useState<Trigger[]>([]);
  const [toolkits, setToolkits] = useState<TriggerToolkit[]>([]);
  const [types, setTypes] = useState<TriggerCatalogueItem[]>([]);
  const [toolkit, setToolkit] = useState("");
  const [toolkitSearch, setToolkitSearch] = useState("");
  const [trigger, setTrigger] = useState("");
  const [config, setConfig] = useState("{}");
  const [busy, setBusy] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmId, setConfirmId] = useState<string>();

  const load = async () => {
    setError(undefined);
    setLoading(true);
    try {
      const [owned, catalogue] = await Promise.all([chuskyApi.triggers.list(), chuskyApi.triggers.catalogue.toolkits(false)]);
      setItems(owned.data);
      setToolkits(catalogue.data);
      setToolkit((current) => current || catalogue.data[0]?.slug || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the trigger catalogue.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);
  useLiveData(load);
  useEffect(() => {
    if (!toolkit) { setTypes([]); setTrigger(""); return; }
    let active = true;
    setTypes([]); setTrigger("");
    void chuskyApi.triggers.catalogue.types(toolkit).then(async (result) => {
      if (!active) return;
      const remaining = result.totalPages > 1
        ? await Promise.all(Array.from({ length: result.totalPages - 1 }, (_, index) => chuskyApi.triggers.catalogue.types(toolkit, index + 2)))
        : [];
      if (!active) return;
      const allTypes = [result, ...remaining].flatMap((page) => page.data);
      setTypes(allTypes);
      setTrigger(allTypes[0]?.token || "");
      setConfig("{}");
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load trigger types."); });
    return () => { active = false; };
  }, [toolkit]);

  const selectedType = types.find((item) => item.token === trigger);
  const selectedToolkit = toolkits.find((item) => item.slug === toolkit);
  const visibleToolkits = toolkits.filter((item) => {
    const query = toolkitSearch.trim().toLowerCase();
    return !query || `${item.name} ${item.slug}`.toLowerCase().includes(query);
  });
  const calendarGuidance = calendarTriggerGuidance(selectedType?.slug ?? "");
  const required = Array.isArray(selectedType?.config.required) ? selectedType.config.required.filter((field): field is string => typeof field === "string") : [];
  const create = async () => {
    if (!selectedType || !selectedToolkit?.connected) return;
    setBusy("create"); setError(undefined);
    try {
      const parsed = JSON.parse(config) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Trigger configuration must be a JSON object.");
      const missing = required.filter((field) => !(field in parsed));
      if (missing.length) throw new Error(`Add the required field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
      await chuskyApi.triggers.create(selectedType.slug, parsed as Record<string, unknown>);
      setConfig("{}");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Trigger configuration must be valid JSON.");
    } finally { setBusy(undefined); }
  };
  const toggle = async (item: Trigger) => { setBusy(item.id); try { await chuskyApi.triggers.setEnabled(item.id, !["active", "enabled"].includes(item.status.toLowerCase())); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update trigger."); } finally { setBusy(undefined); } };
  const remove = async (id: string) => { setBusy(id); try { await chuskyApi.triggers.remove(id); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete trigger."); } finally { setBusy(undefined); } };
  const confirmedTrigger = items.find((item) => item.id === confirmId);
  return <div className="space-y-3.5">
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Trigger-enabled apps</p>
          <h2 className="mt-1 text-sm font-medium">Browse apps and their events</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">These are the connected-app providers that can send live events to Chusky. Select an app to see its exact trigger types and create one.</p>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{toolkits.length} apps · {toolkits.reduce((sum, item) => sum + item.triggerCount, 0)} triggers</span>
      </div>
      <label className="relative mt-4 block">
        <span className="sr-only">Search trigger-enabled apps</span>
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={toolkitSearch} onChange={(event) => setToolkitSearch(event.target.value)} placeholder="Search apps with triggers…" className="min-h-9 w-full border border-foreground/15 bg-background pl-8 pr-2.5 text-xs outline-none focus:border-foreground/40" />
      </label>
      {visibleToolkits.length ? <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleToolkits.map((item) => <article key={item.slug} className={`flex min-w-0 flex-col gap-3 border p-3.5 transition-colors ${item.slug === toolkit ? "border-foreground/45 bg-foreground/[0.03]" : "border-foreground/10"}`}>
          <div className="flex min-w-0 items-start gap-3">
            <ToolkitLogo item={item} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-sm font-medium">{item.name}</h3>
                <Status tone={item.connected ? "green" : "gray"}>{item.connected ? `${item.accountCount} connected` : "Connect first"}</Status>
              </div>
              <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">{item.slug}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-foreground/10 pt-2.5">
            <span className="text-[10px] text-muted-foreground">{item.triggerCount} trigger {item.triggerCount === 1 ? "type" : "types"}</span>
            <Button secondary onClick={() => setToolkit(item.slug)}>{item.slug === toolkit ? "Selected" : "View triggers"}</Button>
          </div>
        </article>)}
      </div> : <Empty>{error || (loading ? "Loading trigger-enabled apps…" : "No trigger-enabled apps match your search.")}</Empty>}
    </Card>
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Provider-backed trigger catalogue</p><p className="mt-1 text-xs text-muted-foreground">Choose an app above, then select one of its exact Composio trigger types.</p></div><span className="font-mono text-[10px] text-muted-foreground">{selectedToolkit ? `${selectedToolkit.name} · ${types.length} trigger types` : "Select an app above"}</span></div>
      <div className="mt-4 grid gap-2.5 md:grid-cols-[1fr_1.4fr_auto]">
        <select value={toolkit} onChange={(event) => setToolkit(event.target.value)} className="min-h-9 min-w-0 border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Choose an app</option>{toolkits.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {item.triggerCount} triggers{item.connected ? " · connected" : " · connect first"}</option>)}</select>
        <select value={trigger} onChange={(event) => { setTrigger(event.target.value); setConfig("{}"); }} disabled={!types.length} className="min-h-9 min-w-0 border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Choose an event</option>{types.map((item) => <option key={item.token} value={item.token}>{item.name}</option>)}</select>
        <Button disabled={!selectedType || !selectedToolkit?.connected || busy === "create"} onClick={() => void create()}>{busy === "create" ? "Creating…" : "Create trigger"}</Button>
      </div>
      {selectedToolkit && types.length > 0 && <div className="mt-4 border-t border-foreground/10 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[11px] font-medium">{selectedToolkit.name} trigger types</p><span className="font-mono text-[9px] text-muted-foreground">Select an event to configure</span></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {types.map((item) => <button type="button" key={item.token} onClick={() => { setTrigger(item.token); setConfig("{}"); }} className={`flex min-w-0 items-start gap-2.5 border p-2.5 text-left transition-colors ${item.token === trigger ? "border-foreground/45 bg-foreground/[0.04]" : "border-foreground/10 hover:border-foreground/30"}`}>
            <Webhook size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0"><span className="block truncate text-[11px] font-medium">{item.name}</span><span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground">{item.slug}</span></span>
          </button>)}
        </div>
      </div>}
      {selectedType && <div className="mt-3 border border-foreground/10 bg-foreground/[0.02] p-3"><p className="text-xs font-medium">{selectedType.name}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{selectedType.description}</p>{selectedType.instructions && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{selectedType.instructions}</p>}{calendarGuidance && <p className="mt-2 border-l-2 border-sky-500 pl-2.5 text-[11px] leading-5 text-sky-900">{calendarGuidance}</p>}<p className="mt-2 font-mono text-[9px] text-muted-foreground">{selectedType.slug}{required.length ? ` · required: ${required.join(", ")}` : " · no required configuration"}</p></div>}
      <textarea value={config} onChange={(event) => setConfig(event.target.value)} disabled={!selectedType} placeholder='{"repo":"owner/name"}' rows={3} className="mt-2.5 w-full resize-y border border-foreground/15 bg-transparent px-2.5 py-2 font-mono text-xs outline-none disabled:opacity-50" />
      {!selectedToolkit?.connected && toolkit && <p className="mt-2 text-[11px] text-amber-700">Connect this app from Connected apps before creating its trigger.</p>}
      {error && <p className="mt-3 text-xs text-amber-700">{error}</p>}
    </Card>
    <Card>{items.length ? items.map((item) => <div key={item.id} className="flex min-w-0 flex-col gap-2.5 border-b border-foreground/10 p-3.5 last:border-0 sm:flex-row sm:items-center sm:p-4"><Webhook size={15} className="shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="break-all text-xs font-medium">{item.slug || item.id}</p>{calendarTriggerGuidance(item.slug) && <p className="mt-1 text-[11px] leading-5 text-sky-900">{calendarTriggerGuidance(item.slug)}</p>}<p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{item.id}</p></div><div className="flex flex-wrap items-center gap-2"><Status tone={["active", "enabled"].includes(item.status.toLowerCase()) ? "green" : "gray"}>{item.status}</Status><Button secondary disabled={busy === item.id} onClick={() => void toggle(item)}>{["active", "enabled"].includes(item.status.toLowerCase()) ? "Disable" : "Enable"}</Button><Button secondary disabled={busy === item.id} onClick={() => setConfirmId(item.id)}><Trash2 size={12} /> Delete</Button></div></div>) : <Empty>No triggers yet. Choose a provider-backed event above or ask Chusky in Telegram.</Empty>}</Card>
    {confirmedTrigger && <ConfirmDialog open={Boolean(confirmId)} onOpenChange={(open) => !open && setConfirmId(undefined)} title={`Delete ${confirmedTrigger.slug || confirmedTrigger.id}?`} description="This trigger and its configuration will be permanently removed." confirmLabel="Delete trigger" destructive onConfirm={() => { const id = confirmedTrigger.id; setConfirmId(undefined); return remove(id); }} />}
  </div>;
}

function calendarTriggerGuidance(slug: string): string | undefined {
  const normalized = slug.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  if (!normalized.startsWith("GOOGLECALENDAR_")) return undefined;
  if (normalized.endsWith("EVENT_CANCELED_DELETED_TRIGGER")) return "Calendar cancellation only reconciles an existing Chusky preparation; it is not a request to join. Non-meeting calendar items remain ordinary calendar events.";
  if (normalized.endsWith("ATTENDEE_RESPONSE_CHANGED_TRIGGER")) return "An attendee response is calendar context, not a meeting by itself. Chusky prepares a meeting only when the event has a supported video-conference URL.";
  if (normalized.endsWith("EVENT_STARTING_SOON_TRIGGER")) return "Starting-soon can refresh the brief or surface a join suggestion for a supported video meeting. It does not authorize Chusky to join automatically.";
  if (["GOOGLECALENDAR_GOOGLE_CALENDAR_EVENT_CREATED_TRIGGER", "GOOGLECALENDAR_GOOGLE_CALENDAR_EVENT_UPDATED_TRIGGER", "GOOGLECALENDAR_GOOGLE_CALENDAR_EVENT_CHANGE_TRIGGER", "GOOGLECALENDAR_GOOGLE_CALENDAR_EVENT_SYNC_TRIGGER"].includes(normalized)) return "This broad calendar event trigger may include non-meeting events. Chusky treats an item as a meeting only when it can verify a supported conferencing URL; a trigger never directly authorizes a join.";
  return undefined;
}

function TelegramLink({ linked }: { linked: boolean }) {
  const [link, setLink] = useState<TelegramLinkCode>();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();
  const create = async () => {
    setBusy(true); setError(undefined); setCopied(false);
    try { setLink(await chuskyApi.account.createTelegramLink()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a Telegram link code."); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(`/link ${link.code}`); setCopied(true); }
    catch { setError("Copy the command manually, then send it in Telegram."); }
  };
  return <Card className="p-4 sm:p-5"><div className="flex items-start gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/10"><Link2 size={15} /></span><div className="min-w-0 flex-1"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Telegram workspace</p><h2 className="mt-1.5 text-sm font-medium">{linked ? "Linked to Telegram" : "Link your Telegram workspace"}</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{linked ? "This dashboard now reads and controls the same private Chusky workspace as your Telegram account." : "Generate a one-time code, then send it from the Telegram account that already uses Chusky."}</p>{!linked && <div className="mt-3 space-y-2.5">{link ? <div className="rounded-lg border border-foreground/10 bg-muted/30 p-2.5"><div className="flex items-center justify-between gap-2.5"><code className="min-w-0 break-all text-xs">/link {link.code}</code><Button secondary aria-label="Copy Telegram link command" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}</Button></div><p className="mt-2 text-[10px] text-muted-foreground">Send this command in Telegram before {date(link.expiresAt)}. It works once.</p></div> : <Button onClick={() => void create()} disabled={busy}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}{busy ? "Creating code" : "Create link code"}</Button>}{error && <p className="text-xs text-amber-700">{error}</p>}</div>}</div></div></Card>;
}

function Row({ icon, title, detail, meta, status }: { icon: ReactNode; title: string; detail?: string; meta?: string; status?: string }) { return <div className="flex min-w-0 items-start gap-2.5 border-b border-foreground/10 px-3.5 py-2.5 last:border-0 sm:px-4 sm:py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center border border-foreground/10 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="break-words text-xs font-medium">{title}</p>{detail && <p className="mt-1 break-words text-[11px] text-muted-foreground">{detail}</p>}{meta && <p className="mt-1.5 break-words text-[9px] text-muted-foreground">{meta}</p>}</div>{status && <Status tone={status === "failed" ? "amber" : status === "cancelled" ? "gray" : "green"}>{status}</Status>}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-foreground/10 pb-3 text-xs last:border-0"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] break-words text-right">{value}</span></div>; }

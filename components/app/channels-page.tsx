"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, LoaderCircle, RefreshCw, Unlink } from "lucide-react";
import { chuskyApi, type ChannelConnection, type ChannelLinkCode } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";

const channelNames: Record<string, string> = { telegram: "Telegram", slack: "Slack", whatsapp: "WhatsApp", sendblue: "Sendblue" };
const linkable = ["slack", "whatsapp", "sendblue"] as const;

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConnection[]>();
  const [provider, setProvider] = useState<(typeof linkable)[number]>("slack");
  const [linkCode, setLinkCode] = useState<ChannelLinkCode>();
  const [confirm, setConfirm] = useState<ChannelConnection>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const load = async () => {
    setError(undefined);
    try { setChannels((await chuskyApi.channels.list()).data); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load linked channels."); }
  };
  useEffect(() => { void load(); }, []);

  const createCode = async () => {
    setBusy("link"); setError(undefined); setNotice(undefined);
    try { setLinkCode(await chuskyApi.channels.createLinkCode(provider)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a channel link code."); }
    finally { setBusy(undefined); }
  };
  const copyCode = async () => {
    if (!linkCode) return;
    try { await navigator.clipboard.writeText(linkCode.provider === "slack" ? linkCode.installUrl ?? linkCode.code : linkCode.instructions.match(/\/link\s+\S+/)?.[0] ?? linkCode.code); setNotice("Link instructions copied."); }
    catch { setError("Clipboard access is unavailable. Copy the link instructions manually."); }
  };
  const setProactive = async (channel: ChannelConnection, value: boolean) => {
    setBusy(channel.id); setError(undefined);
    try { const updated = await chuskyApi.channels.update(channel, value); setChannels((current) => current?.map((item) => item.id === channel.id ? { ...item, proactiveOptIn: updated.proactiveOptIn } : item)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update channel preferences."); }
    finally { setBusy(undefined); }
  };
  const unlink = async () => {
    if (!confirm) return;
    setBusy(confirm.id); setError(undefined);
    try { await chuskyApi.channels.unlink(confirm); setChannels((current) => current?.filter((item) => item.id !== confirm.id)); setConfirm(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not unlink this channel."); }
    finally { setBusy(undefined); }
  };

  return <>
    <PageHeading eyebrow="Account connections" title="Channels" description="Manage the identities linked to your Chusky workspace. These controls change Chusky’s link, not the provider-side app installation." action={<Button secondary onClick={() => void load()}><span className="hidden sm:inline-flex"><RefreshCw size={13}/></span> Refresh</Button>} />
    {error && <div role="alert" className="mb-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">{error}</div>}
    {notice && <p role="status" className="mb-3 text-xs text-emerald-700">{notice}</p>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <Card>
        <div className="border-b border-foreground/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Linked identities</p></div>
        {channels === undefined ? <p className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin"/> Loading linked channels…</p> : channels.length ? channels.map((channel) => <div key={channel.id} className="flex flex-col gap-3 border-b border-foreground/10 p-4 last:border-0 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{channelNames[channel.provider] ?? channel.provider}</p><Status>{channel.provider === "telegram" ? "Primary workspace" : "Linked"}</Status></div><p className="mt-1 break-all text-[11px] text-muted-foreground">{channel.displayName || channel.externalUserId}{channel.workspaceId ? ` · ${channel.workspaceId}` : ""}</p><p className="mt-1 text-[10px] text-muted-foreground">Verified {date(channel.verifiedAt)}</p></div>
          <div className="flex flex-wrap items-center gap-3"><label className="flex min-h-9 items-center gap-2 text-[11px]"><input type="checkbox" checked={channel.proactiveOptIn} disabled={busy === channel.id} onChange={(event) => void setProactive(channel, event.target.checked)} className="accent-foreground"/>Allow proactive replies</label>{channel.provider !== "telegram" && <Button secondary disabled={busy === channel.id} onClick={() => setConfirm(channel)}><Unlink size={12}/> Unlink</Button>}</div>
        </div>) : <p className="p-4 text-xs text-muted-foreground">No linked channels yet. Link a channel below, or connect Telegram from Settings.</p>}
      </Card>
      <Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Link a channel</p><h2 className="mt-1.5 font-display text-2xl">Bring Chusky into your workspace</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Generate a short-lived link instruction for the account you want to pair. Codes expire after ten minutes.</p>
        <label className="mt-4 block text-xs text-muted-foreground">Channel<select value={provider} onChange={(event) => { setProvider(event.target.value as (typeof linkable)[number]); setLinkCode(undefined); }} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs">{linkable.map((item) => <option key={item} value={item}>{channelNames[item]}</option>)}</select></label>
        <div className="mt-3"><Button disabled={busy === "link"} onClick={() => void createCode()}>{busy === "link" ? <LoaderCircle size={13} className="animate-spin"/> : <Link2 size={13}/>} Generate link code</Button></div>
        {linkCode && <div className="mt-4 border border-foreground/10 bg-foreground/[0.02] p-3"><p className="text-[11px] leading-5">{linkCode.instructions}</p>{linkCode.installUrl && <a className="mt-2 block break-all text-[11px] underline" href={linkCode.installUrl} target="_blank" rel="noreferrer">Open Slack installation</a>}<div className="mt-3 flex flex-wrap items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs">{linkCode.provider === "slack" ? linkCode.code : linkCode.instructions.match(/\/link\s+\S+/)?.[0] ?? linkCode.code}</code><Button secondary onClick={() => void copyCode()}><Copy size={13}/> Copy</Button></div><p className="mt-2 text-[10px] text-muted-foreground">This code is private to your account. Complete linking within ten minutes.</p></div>}
      </Card>
    </div>
    {confirm && <ConfirmDialog open onOpenChange={(open) => !open && setConfirm(undefined)} title={`Unlink ${channelNames[confirm.provider] ?? confirm.provider}?`} description="Chusky will stop accepting messages for this linked identity. The provider-side app or workspace installation will remain in place." confirmLabel="Unlink channel" destructive onConfirm={unlink}/>}
  </>;
}

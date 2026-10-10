"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Link2, LoaderCircle, RefreshCw, Unlink } from "lucide-react";
import { chuskyApi, type ChannelConnection, type ChannelLinkCode, type Delivery, type TelegramLinkCode } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { ChannelLogo, channelBrand } from "./channel-brand";

const linkable = ["slack", "whatsapp", "sendblue", "sms", "x"] as const;
const cliServerUrl = process.env.NEXT_PUBLIC_CHUSKY_CLI_SERVER_URL?.trim();
const cliCommand = cliServerUrl ? `chusky auth link --server ${cliServerUrl}` : "chusky auth link";

function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConnection[]>();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [provider, setProvider] = useState<(typeof linkable)[number]>("slack");
  const [linkCode, setLinkCode] = useState<ChannelLinkCode>();
  const [telegramLink, setTelegramLink] = useState<TelegramLinkCode>();
  const [confirm, setConfirm] = useState<ChannelConnection>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [telegramCopied, setTelegramCopied] = useState(false);
  const [cliCopied, setCliCopied] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string>();
  const availableLinkable = channels === undefined ? linkable : linkable.filter((item) => !channels.some((channel) => channel.provider === item));

  const load = async () => {
    setError(undefined); setDeliveryError(undefined);
    const [channelResult, deliveryResult] = await Promise.allSettled([chuskyApi.channels.list(), chuskyApi.deliveries.list()]);
    if (channelResult.status === "fulfilled") setChannels(channelResult.value.data);
    else setError(channelResult.reason instanceof Error ? channelResult.reason.message : "Could not load linked channels.");
    if (deliveryResult.status === "fulfilled") setDeliveries(deliveryResult.value.data);
    else setDeliveryError(deliveryResult.reason instanceof Error ? deliveryResult.reason.message : "Could not load recent delivery activity.");
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (channels === undefined || availableLinkable.includes(provider)) return;
    setProvider(availableLinkable[0] ?? "slack");
    setLinkCode(undefined);
  }, [availableLinkable, channels, provider]);
  useLiveData(load);

  const createCode = async () => {
    setBusy("link"); setError(undefined); setNotice(undefined);
    try { setLinkCode(await chuskyApi.channels.createLinkCode(provider)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a channel link code."); }
    finally { setBusy(undefined); }
  };
  const createTelegramLink = async () => {
    setBusy("telegram-link"); setError(undefined); setNotice(undefined);
    try { setTelegramLink(await chuskyApi.account.createTelegramLink()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a Telegram link code."); }
    finally { setBusy(undefined); }
  };
  const copyTelegramLink = async () => {
    if (!telegramLink) return;
    try { await navigator.clipboard.writeText(`/link ${telegramLink.code}`); setTelegramCopied(true); setNotice("Telegram link command copied."); window.setTimeout(() => setTelegramCopied(false), 1800); }
    catch { setError("Clipboard access is unavailable. Copy the Telegram command manually."); }
  };
  const copyCode = async () => {
    if (!linkCode) return;
    try { await navigator.clipboard.writeText(linkCode.provider === "slack" ? linkCode.installUrl ?? linkCode.code : linkCode.instructions.match(/\/link\s+\S+/)?.[0] ?? linkCode.code); setNotice("Link instructions copied."); }
    catch { setError("Clipboard access is unavailable. Copy the link instructions manually."); }
  };
  const copyCliCommand = async () => {
    try { await navigator.clipboard.writeText(cliCommand); setCliCopied(true); setNotice("CLI link command copied."); window.setTimeout(() => setCliCopied(false), 1800); }
    catch { setError("Clipboard access is unavailable. Copy the CLI command manually."); }
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
    try { await chuskyApi.channels.unlink(confirm); await load(); setConfirm(undefined); }
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
          <div className="flex min-w-0 flex-1 items-start gap-3"><ChannelLogo provider={channel.provider} size={34}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{channelBrand(channel.provider).name}</p><Status>{channel.provider === "telegram" ? "Primary workspace" : "Linked"}</Status></div><p className="mt-1 break-all text-[11px] text-muted-foreground">{channel.displayName || channel.externalUserId}{channel.workspaceId ? ` · ${channel.workspaceId}` : ""}</p><p className="mt-1 text-[10px] text-muted-foreground">Verified {date(channel.verifiedAt)}</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><label className="flex min-h-9 items-center gap-2 text-[11px]"><input type="checkbox" checked={channel.proactiveOptIn} disabled={busy === channel.id} onChange={(event) => void setProactive(channel, event.target.checked)} className="accent-foreground"/>Allow proactive replies</label>{channel.provider !== "telegram" && <Button secondary disabled={busy === channel.id} onClick={() => setConfirm(channel)}><Unlink size={12}/> Unlink</Button>}</div>
        </div>) : <p className="p-4 text-xs text-muted-foreground">No linked channels yet. Link a channel below, including Telegram.</p>}
      </Card>
      <Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Link a channel</p><h2 className="mt-1.5 font-display text-2xl">Bring Chusky into your workspace</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Connect Telegram or generate a short-lived pairing instruction for another channel. Codes expire after ten minutes.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{channels === undefined ? <p className="border border-dashed border-foreground/15 p-3 text-xs text-muted-foreground">Loading available channels…</p> : availableLinkable.length ? availableLinkable.map((item) => { const brand = channelBrand(item); const selected = provider === item; return <button key={item} type="button" aria-pressed={selected} onClick={() => { setProvider(item); setLinkCode(undefined); }} className={`flex min-h-16 items-center gap-3 border px-3 text-left transition-colors ${selected ? "border-foreground bg-foreground/[0.04]" : "border-foreground/10 hover:border-foreground/30"}`}><ChannelLogo provider={item} size={34}/><span className="min-w-0"><span className="block text-xs font-medium">{brand.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{brand.description}</span></span></button>; }) : <p className="border border-dashed border-foreground/15 p-3 text-xs text-muted-foreground sm:col-span-2">All supported channels are already linked. Unlink a channel above if you need to pair it again.</p>}</div>
        {channels !== undefined && availableLinkable.length > 0 && <div className="mt-3"><Button disabled={busy === "link"} onClick={() => void createCode()}>{busy === "link" ? <LoaderCircle size={13} className="animate-spin"/> : <Link2 size={13}/>} Generate link code</Button></div>}
        {linkCode && <div className="mt-4 border border-foreground/10 bg-foreground/[0.02] p-3"><p className="text-[11px] leading-5">{linkCode.instructions}</p>{linkCode.installUrl && <a className="mt-2 block break-all text-[11px] underline" href={linkCode.installUrl} target="_blank" rel="noreferrer">Open Slack installation</a>}<div className="mt-3 flex flex-wrap items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs">{linkCode.provider === "slack" ? linkCode.code : linkCode.instructions.match(/\/link\s+\S+/)?.[0] ?? linkCode.code}</code><Button secondary onClick={() => void copyCode()}><Copy size={13}/> Copy</Button></div><p className="mt-2 text-[10px] text-muted-foreground">This code is private to your account. Complete linking within ten minutes.</p></div>}
        <div className="mt-5 border-t border-foreground/10 pt-4"><div className="flex items-start gap-3"><ChannelLogo provider="telegram" size={34}/><div className="min-w-0 flex-1"><p className="text-xs font-medium">{channels?.some((item) => item.provider === "telegram") ? "Telegram is connected" : "Connect Telegram"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Link the Telegram account that already uses Chusky to share this private workspace.</p>{!channels?.some((item) => item.provider === "telegram") && <div className="mt-3">{telegramLink ? <div className="border border-foreground/10 bg-foreground/[0.02] p-2.5"><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs">/link {telegramLink.code}</code><Button secondary aria-label="Copy Telegram link command" onClick={() => void copyTelegramLink()}>{telegramCopied ? <Check size={13}/> : <Copy size={13}/>}</Button></div><p className="mt-2 text-[10px] text-muted-foreground">Send this command in Telegram before {date(telegramLink.expiresAt)}.</p></div> : <Button secondary disabled={busy === "telegram-link"} onClick={() => void createTelegramLink()}>{busy === "telegram-link" ? <LoaderCircle size={13} className="animate-spin"/> : <Link2 size={13}/>} Create Telegram link code</Button>}</div>}</div></div></div>
      </Card>
    </div>
    <Card className="mt-4 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ChannelLogo provider="cli" size={34}/>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">CLI access</p>
            <h2 className="mt-1.5 font-display text-2xl">Use Chusky from your terminal</h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Telegram authorizes the terminal, so your CLI joins this same private Chusky workspace instead of creating a separate account or session.</p>
          </div>
        </div>
        <Link href="/app/devices" className="inline-flex min-h-9 shrink-0 items-center justify-center border border-foreground/15 px-3 text-[11px] font-medium hover:border-foreground/40">Manage CLI devices</Link>
      </div>
      <div className="mt-4 grid gap-3 border-t border-foreground/10 pt-4 md:grid-cols-3">
        <div className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">1</span><div><p className="text-xs font-medium">Ask Telegram for a code</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Open your Chusky Telegram chat and send <code className="rounded bg-foreground/[0.06] px-1 py-0.5">/cli link</code>.</p></div></div>
        <div className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">2</span><div><p className="text-xs font-medium">Run the CLI link command</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Run this on the computer you want to connect:</p><div className="mt-2 flex items-center gap-2 border border-foreground/10 bg-foreground/[0.03] p-2"><code className="min-w-0 flex-1 break-all text-[10px]">{cliCommand}</code><Button secondary aria-label="Copy CLI link command" onClick={() => void copyCliCommand()}>{cliCopied ? <Check size={12}/> : <Copy size={12}/>}</Button></div></div></div>
        <div className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] text-background">3</span><div><p className="text-xs font-medium">Finish the pairing</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{cliServerUrl ? "Paste the six-digit Telegram code when prompted." : "If prompted, enter your Chusky server URL, then paste the six-digit Telegram code."} The code expires in ten minutes and works once. The terminal stores the token locally; the server stores only its hash.</p></div></div>
      </div>
    </Card>
    <Card className="mt-4 overflow-hidden">
      <div className="border-b border-foreground/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Recent delivery activity</p><p className="mt-1 text-xs text-muted-foreground">See the latest outbound channel results alongside your linked identities.</p></div>
      {deliveryError && <p role="alert" className="border-b border-amber-300/70 bg-amber-50 p-3 text-xs text-amber-950">{deliveryError}</p>}
      {deliveries.length ? <div className="divide-y divide-foreground/10">{deliveries.slice(0, 8).map((item) => <div key={item.id} className="flex flex-col gap-2 p-4 text-[11px] sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><div className="flex min-w-0 items-center gap-2"><ChannelLogo provider={item.provider} size={22}/><p className="font-medium">{channelBrand(item.provider).name} · {item.kind}</p></div><Status tone={item.status === "delivered" ? "green" : item.status === "failed" || item.status === "ambiguous" ? "amber" : "gray"}>{item.status === "delivered" && item.providerStatus === "owner_confirmed_delivered" ? "confirmed by you" : item.status}</Status></div><p className="mt-1 text-muted-foreground">{date(item.deliveredAt || item.updatedAt)} · {item.attempts} attempt{item.attempts === 1 ? "" : "s"}{item.lastError ? ` · ${item.lastError}` : ""}</p></div>{item.status === "ambiguous" && <span className="shrink-0 text-muted-foreground">Outcome uncertain</span>}</div>)}</div> : !deliveryError && <p className="p-4 text-xs text-muted-foreground">No outbound deliveries have been recorded for this account yet.</p>}
    </Card>
    {confirm && <ConfirmDialog open onOpenChange={(open) => !open && setConfirm(undefined)} title={`Unlink ${channelBrand(confirm.provider).name}?`} description="Chusky will stop accepting messages for this linked identity. The provider-side app or workspace installation will remain in place." confirmLabel="Unlink channel" destructive onConfirm={unlink}/>}
  </>;
}

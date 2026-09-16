"use client";

import { KeyRound, Link2, LoaderCircle, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { chuskyApi, type McpCatalogEntry, type McpConnection } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";

const date = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function McpPage() {
  const [catalog, setCatalog] = useState<McpCatalogEntry[]>([]);
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string>();

  const load = async () => {
    setError(undefined);
    try {
      const [catalogResult, connectionResult] = await Promise.all([chuskyApi.mcp.catalog(), chuskyApi.mcp.connections()]);
      setCatalog(catalogResult.data);
      setErrors(catalogResult.errors ?? []);
      setConnections(connectionResult.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load MCP connections.");
    }
  };

  useEffect(() => { void load(); }, []);

  const connected = useMemo(() => new Set(connections.map((item) => item.serverId)), [connections]);
  const connect = async (server: McpCatalogEntry) => {
    const token = tokens[server.id]?.trim();
    if (server.auth !== "none" && !token) {
      setError(`${server.name} requires an access token before it can be connected.`);
      return;
    }
    setBusy(`connect:${server.id}`); setError(undefined);
    try {
      await chuskyApi.mcp.connect(server.id, token ? { accessToken: token } : undefined);
      setTokens((current) => ({ ...current, [server.id]: "" }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not connect ${server.name}.`);
    } finally { setBusy(undefined); }
  };

  const disconnect = async (serverId: string) => {
    setBusy(`disconnect:${serverId}`); setError(undefined);
    try { await chuskyApi.mcp.disconnect(serverId); setConfirmId(undefined); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not disconnect this MCP server."); }
    finally { setBusy(undefined); }
  };

  return <>
    <PageHeading eyebrow="Agent integrations" title="MCP connections" description="Connect approved third-party MCP servers to Chusky. Credentials are encrypted by the backend and are never returned to the dashboard." action={<Button secondary onClick={() => void load()} disabled={Boolean(busy)}><RefreshCw size={13} /> Refresh</Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">{error}</Card>}
    {errors.length > 0 && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"><p className="font-medium">Some MCP catalogue entries could not be loaded.</p><ul className="mt-2 list-disc space-y-1 pl-4">{errors.map((item) => <li key={item}>{item}</li>)}</ul></Card>}
    <Card className="mb-4 p-4 sm:p-5"><div className="flex items-start gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" /><div><h2 className="text-sm font-medium">A controlled MCP boundary</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Chusky discovers tools through the official MCP client, namespaces them per server, validates arguments, and keeps approval required for side-effecting actions by default. This is separate from the Chusky MCP endpoint that your company agents connect to.</p></div></div></Card>
    <Card>{catalog.length ? catalog.map((server) => { const isConnected = connected.has(server.id); return <div key={server.id} className="border-b border-foreground/10 p-4 last:border-0 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-medium">{server.name}</h2><Status tone={isConnected ? "green" : server.enabled === false ? "gray" : "amber"}>{server.enabled === false ? "Disabled" : isConnected ? "Connected" : "Available"}</Status><span className="font-mono text-[9px] text-muted-foreground">{server.id}</span></div><p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{server.url}</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">Authentication: {server.auth === "none" ? "none" : server.auth === "oauth" ? "OAuth credential" : "bearer token"} · {server.requireApproval === false ? "server actions may run without Chusky approval" : "side effects require Chusky approval"}</p>{server.allowedTools?.length ? <p className="mt-1 text-[10px] text-muted-foreground">Allowed tools: {server.allowedTools.join(", ")}</p> : null}</div><div className="flex w-full flex-col gap-2 lg:w-[22rem]">{!isConnected && server.enabled !== false && server.auth !== "none" && <label className="text-[10px] text-muted-foreground">Access token<input type="password" autoComplete="off" value={tokens[server.id] ?? ""} onChange={(event) => setTokens((current) => ({ ...current, [server.id]: event.target.value }))} placeholder="Paste a token; it is sent once to Chusky" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 text-xs outline-none" /></label>}{isConnected ? <Button secondary disabled={Boolean(busy)} onClick={() => setConfirmId(server.id)}><Unplug size={12} /> Disconnect</Button> : <Button disabled={server.enabled === false || busy === `connect:${server.id}`} onClick={() => void connect(server)}>{busy === `connect:${server.id}` ? <LoaderCircle size={13} className="animate-spin" /> : server.auth === "none" ? <Link2 size={13} /> : <KeyRound size={13} />}{busy === `connect:${server.id}` ? "Connecting…" : "Connect server"}</Button>}</div></div>{isConnected && <p className="mt-3 text-[10px] text-muted-foreground">Connected {date(connections.find((item) => item.serverId === server.id)?.connectedAt ?? "")}. Token material is not displayed or returned.</p>}</div>; }) : <p className="p-5 text-xs text-muted-foreground">No MCP servers are currently available in the Chusky catalogue.</p>}</Card>
    {confirmId && <ConfirmDialog open onOpenChange={(open) => !open && setConfirmId(undefined)} title="Disconnect this MCP server?" description="Chusky will stop discovering and executing this server's tools for your account. The provider account itself is not changed." confirmLabel="Disconnect server" destructive onConfirm={() => disconnect(confirmId)} />}
  </>;
}

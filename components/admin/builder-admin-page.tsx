"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { BuilderApiError, builderRequest, type BuilderAccess, type BuilderAudit, type BuilderControl, type BuilderOverview } from "@/lib/builder-api";

const buttonClass = "min-h-10 rounded-full bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

export function BuilderAdminPage() {
  const [access, setAccess] = useState<BuilderAccess>();
  const [overview, setOverview] = useState<BuilderOverview>();
  const [controls, setControls] = useState<BuilderControl>();
  const [events, setEvents] = useState<BuilderAudit[]>([]);
  const [tab, setTab] = useState<"overview" | "controls" | "audit">("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState(true);
  const [reason, setReason] = useState("maintenance");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] }>();

  async function refresh() {
    setBusy(true); setError("");
    try {
      const current = await builderRequest<BuilderAccess>("access");
      setAccess(current);
      if (current.verified) {
        const [health, saved, audit] = await Promise.all([
          builderRequest<{ data: BuilderOverview }>("overview"), builderRequest<BuilderControl>("controls"), builderRequest<{ data: BuilderAudit[] }>("audit"),
        ]);
        setOverview(health.data); setControls(saved); setDraft(saved.agentEnabled); setEvents(audit.data);
      } else { setOverview(undefined); setControls(undefined); setEvents([]); }
    } catch (failure) {
      setOverview(undefined); setControls(undefined); setEvents([]);
      if (failure instanceof BuilderApiError && failure.status === 401) { window.location.assign("/sign-in?callbackURL=%2Fadmin"); return; }
      setError(errorMessage(failure));
    } finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function enroll() {
    setBusy(true); setError("");
    try {
      const result = await authClient.twoFactor.enable({ password });
      if (result.error) throw new Error(result.error.message || "Authenticator setup could not start.");
      if (result.data && "totpURI" in result.data && "backupCodes" in result.data) setEnrollment({ totpURI: result.data.totpURI, backupCodes: result.data.backupCodes });
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setPassword(""); setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError("");
    try {
      if (enrollment) {
        const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
        if (result.error) throw new Error(result.error.message || "The authenticator code could not be verified.");
        setEnrollment(undefined); setCode("");
        setNotice("Authenticator enabled. Enter a current code to unlock the builder controls.");
        await refresh();
      } else {
        await builderRequest("verify", { code }, "POST");
        setCode(""); await refresh();
      }
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function saveControl() {
    if (!controls) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await builderRequest<BuilderControl>("controls", { version: controls.version, agentEnabled: draft, reason }, "PATCH");
      setControls(saved);
      setNotice(saved.agentEnabled ? "Agent execution enabled. The change was recorded." : "Agent execution paused. The change was recorded.");
      const audit = await builderRequest<{ data: BuilderAudit[] }>("audit"); setEvents(audit.data);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <main className="min-h-svh bg-background text-foreground">
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/admin" className="flex items-center gap-3"><img src="/brand/chusky-logo.png" alt="" className="size-8 object-contain" /><span className="text-sm font-medium">Chusky <span className="ml-2 text-muted-foreground">/ Builders</span></span></Link>
        <Link href="/app" className="text-xs text-muted-foreground underline underline-offset-4">Open workspace</Link>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Private administration</p><h1 className="mt-3 font-display text-4xl">The control plane.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Inspect system signals, pause agent execution, and review changes from one private workspace.</p></div>
        <button type="button" onClick={() => void refresh()} disabled={busy} className={buttonClass}>{busy ? "Checking…" : "Refresh"}</button>
      </div>
      {error ? <div role="alert" className="mt-6 rounded-lg border border-rose-500/25 bg-rose-500/5 p-4 text-sm">{error}<p className="mt-2 text-xs text-muted-foreground">Refresh to check the saved state before retrying a change.</p></div> : null}
      {notice ? <p role="status" className="mt-5 text-sm">{notice}</p> : null}
      {!access && !error ? <p role="status" className="mt-10 text-sm text-muted-foreground">Checking builder access…</p> : null}
      {access && !access.verified ? <section className="mt-8 max-w-lg rounded-xl border border-foreground/10 bg-background p-5 sm:p-7">
        <h2 className="font-display text-2xl">{access.mfaEnabled ? "Verify your authenticator." : "Protect your builder access."}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Builder access requires a verified email and authenticator verification. The control plane unlocks for 15 minutes.</p>
        {!access.fresh ? <Link href="/sign-in?callbackURL=%2Fadmin" className="mt-5 inline-block text-sm underline underline-offset-4">Sign in again to continue</Link> : !access.mfaEnabled && !enrollment ? <form className="mt-5" onSubmit={(event) => { event.preventDefault(); void enroll(); }}>
          <label className="block text-xs">Current password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></label>
          <button type="submit" disabled={busy} className={buttonClass + " mt-4"}>Set up authenticator</button>
        </form> : <div className="mt-5">
          {enrollment ? <div className="mb-5">
            <p className="text-xs leading-5">Add Chusky to your authenticator using this setup key. Keep it private.</p>
            <code className="mt-2 block break-all rounded-lg bg-foreground/5 p-3 text-xs select-all">{new URL(enrollment.totpURI).searchParams.get("secret")}</code>
            <details className="mt-3"><summary className="cursor-pointer py-2 text-xs font-medium">Save your recovery codes before continuing</summary><p className="mb-2 text-xs text-muted-foreground">Each code can be used once. These codes are shown only during setup.</p><pre className="whitespace-pre-wrap rounded-lg bg-foreground/5 p-3 text-xs select-all">{enrollment.backupCodes.join("\n")}</pre></details>
          </div> : null}
          <form onSubmit={(event) => { event.preventDefault(); void verify(); }}><label className="block text-xs">Authenticator code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} className={inputClass} /></label><button type="submit" disabled={busy} className={buttonClass + " mt-4"}>{enrollment ? "Confirm authenticator" : "Unlock controls"}</button></form>
        </div>}
      </section> : null}
      {access?.verified && overview && controls ? <>
        <div className="mt-8 flex flex-wrap items-center gap-5 border-b border-foreground/10" role="tablist" aria-label="Builder views">{(["overview", "controls", "audit"] as const).map((name) => <button key={name} id={`builder-tab-${name}`} type="button" role="tab" aria-selected={tab === name} aria-controls={`builder-panel-${name}`} tabIndex={tab === name ? 0 : -1} onKeyDown={(event) => { const views = ["overview", "controls", "audit"] as const; const index = views.indexOf(name); const nextIndex = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : undefined; if (nextIndex === undefined) return; event.preventDefault(); const nextView = views[nextIndex]; setTab(nextView); document.getElementById(`builder-tab-${nextView}`)?.focus(); }} onClick={() => setTab(name)} className={`min-h-12 border-b-2 px-1 text-xs capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tab === name ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>{name === "audit" ? "Audit trail" : name}</button>)}<span className="ml-auto py-3 text-[10px] text-muted-foreground">{access.role === "builder_admin" ? "Builder administrator" : "Read-only builder"}</span></div>
        <section role="tabpanel" id={`builder-panel-${tab}`} aria-labelledby={`builder-tab-${tab}`} className="pt-6">
          {tab === "overview" ? <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
            <div><h2 className="font-display text-2xl">Deployment signals</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Observed {new Date(overview.observedAt).toLocaleString()}. Refresh on demand; no background polling.</p>
              <dl className="mt-5 divide-y divide-foreground/10 text-sm">
                {[["Agent execution", controls.agentEnabled ? "Enabled" : "Paused"], ["Persistence", overview.persistence], ["Neon reachability", !overview.neon.enabled ? "Not enabled" : overview.neon.reachable ? "Reachable" : "Unavailable"], ["Neon schema", !overview.neon.enabled ? "Not enabled" : overview.neon.schemaReady ? "Ready" : "Not ready"], ["Process uptime", `${Math.floor(overview.uptimeSeconds / 60)} minutes`]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}
              </dl><h3 className="mt-7 text-sm font-medium">Failure counters</h3><p className="mt-1 text-xs text-muted-foreground">Current process; reset when this instance restarts.</p><dl className="mt-3 divide-y divide-foreground/10 text-xs">{Object.entries(overview.monitoring.counters).map(([name, value]) => <div key={name} className="flex justify-between gap-3 py-2.5"><dt>{name.replaceAll("_", " ")}</dt><dd className="font-mono">{value.toLocaleString()}</dd></div>)}</dl>
            </div>
            <div><h2 className="font-display text-2xl">Provider configuration</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Configuration presence only. A configured key does not prove provider availability. Values remain in the deployment secret store.</p><div className="mt-5 divide-y divide-foreground/10">{overview.providers.map((provider) => <div key={provider.name} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{provider.name}</span><span className="text-xs text-muted-foreground">{provider.configured ? "Configured" : "Not configured"}</span></div>)}</div></div>
            <div className="lg:col-span-2"><h2 className="font-display text-2xl">Storage telemetry</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{overview.scope} Persisted aggregates appear only when storage telemetry is enabled.</p>
              {overview.storage && Object.keys(overview.storage).length ? <div className="mt-5 max-h-96 overflow-auto rounded-lg border border-foreground/10"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-background"><tr><th className="p-3 font-medium">Measurement</th><th className="p-3 text-right font-medium">Value</th></tr></thead><tbody className="divide-y divide-foreground/10">{Object.entries(overview.storage).map(([key, value]) => <tr key={key}><td className="break-all p-3 font-mono text-[10px]">{key}</td><td className="whitespace-nowrap p-3 text-right font-mono">{Number.isFinite(value) ? value.toLocaleString() : "Unavailable"}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-muted-foreground">Storage telemetry is unavailable.</p>}
            </div>
          </div> : tab === "controls" ? <div className="max-w-xl">
            <h2 className="font-display text-2xl">Agent execution</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Pause new model turns and subsequent tool dispatch across the shared agent runtime. Work already sent to a provider cannot be recalled. Replicas observe the setting within five seconds of active work.</p>
            <form onSubmit={(event) => { event.preventDefault(); void saveControl(); }} className="mt-6 rounded-xl border border-foreground/10 p-5">
              <label className="flex items-center justify-between gap-4 text-sm font-medium">Allow agent execution<input type="checkbox" checked={draft} disabled={busy || !access.permissions.includes("manage_flags") || !access.fresh} onChange={(event) => setDraft(event.target.checked)} className="size-5 accent-foreground" /></label>
              <label className="mt-5 block text-xs">Change reason<select value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} disabled={busy}><option value="maintenance">Maintenance</option><option value="incident">Incident response</option><option value="release">Release</option></select></label>
              <button type="submit" disabled={busy || draft === controls.agentEnabled || !access.permissions.includes("manage_flags") || !access.fresh} className={buttonClass + " mt-5"}>{busy ? "Saving…" : "Save control"}</button>
              <p className="mt-3 text-xs text-muted-foreground">Version {controls.version}. Changes and audit records are saved together.</p>
              {!access.fresh ? <Link href="/sign-in?callbackURL=%2Fadmin" className="mt-3 inline-block text-xs underline">Sign in again to change controls</Link> : null}
            </form>
          </div> : <div><h2 className="font-display text-2xl">Administrative changes</h2><p className="mt-2 text-xs text-muted-foreground">Latest 100 events. The service retains the most recent 1,000 entries in Redis.</p>{events.length ? <ol className="mt-5 divide-y divide-foreground/10">{events.map((event) => <li key={event.id} className="py-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{event.action === "builder_verified" ? "Builder verified" : `Agent execution ${event.enabled ? "enabled" : "paused"}`}</span><time className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString()}</time></div><p className="mt-1 break-all font-mono text-[10px] leading-5 text-muted-foreground">Actor {event.actorId}{event.reason ? ` · ${event.reason}` : ""}{event.version !== undefined ? ` · version ${event.version}` : ""}</p></li>)}</ol> : <p className="mt-5 text-sm text-muted-foreground">No administrative changes have been recorded.</p>}</div>}
        </section>
      </> : null}
    </div>
  </main>;
}

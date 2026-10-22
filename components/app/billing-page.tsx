"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { chuskyApi, type BillingOverview } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function date(value?: number | string) {
  if (!value) return "—";
  const parsed = typeof value === "number" ? new Date(value) : new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed) : "—";
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingOverview>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      setBilling((await chuskyApi.account.billing.get()).data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Billing information could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return <div className="min-w-0">
    <PageHeading eyebrow="Workspace billing" title="A clear cost for the work Chusky carries." description="Plans cover the agentic platform, durable missions, meetings, and voice. Provider usage stays visible and billing remains protected until the payment integration is verified." action={<Button secondary onClick={() => void load()} disabled={loading}>{loading ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh</Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-4 text-xs text-amber-950" role="alert">{error}</Card>}
    {loading && !billing ? <Card className="flex items-center gap-2 p-5 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Reading billing state…</Card> : billing ? <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><CreditCard size={15} /><span className="font-mono text-[9px] uppercase tracking-[0.18em]">Subscription</span></div><p className="mt-3 text-lg font-medium">{billing.subscription ? billing.subscription.planId : "Not selected"}</p><p className="mt-1 text-[11px] text-muted-foreground">{billing.subscription ? `${billing.subscription.status} · renews ${date(billing.subscription.periodEnd)}` : "Choose a plan when customer billing is enabled."}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={15} /><span className="font-mono text-[9px] uppercase tracking-[0.18em]">Collection</span></div><p className="mt-3 text-lg font-medium">{billing.provider.collectionEnabled ? "Enabled" : "Protected"}</p><p className="mt-1 text-[11px] text-muted-foreground">{billing.provider.collectionEnabled ? "Provider collection is active." : "Real customer charges are disabled until verification."}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 size={15} /><span className="font-mono text-[9px] uppercase tracking-[0.18em]">Voice compliance</span></div><p className="mt-3 text-lg font-medium capitalize">{billing.compliance.readiness.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-muted-foreground">Emergency address and regulatory verification are separate from payment collection.</p></Card>
      </div>

      <section className="mt-5" aria-labelledby="billing-plans-heading"><div className="mb-3"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Launch plans</p><h2 id="billing-plans-heading" className="mt-1 font-display text-2xl">Choose the amount of work you want Chusky to carry.</h2></div><div className="grid gap-3 lg:grid-cols-5">{billing.plans.map((plan) => <Card key={plan.id} className={`p-4 ${plan.id === "business" ? "border-foreground/40" : ""}`}><div className="flex items-start justify-between gap-2"><div><h3 className="font-medium">{plan.name}</h3><p className="mt-1 text-xl font-display">{money(plan.monthlyPriceCents)}<span className="font-sans text-[10px] text-muted-foreground"> / month</span></p></div>{plan.id === "business" && <Status tone="green">Recommended</Status>}</div><dl className="mt-4 space-y-2 text-[10px] text-muted-foreground"><div className="flex justify-between gap-2"><dt>Users</dt><dd className="font-medium text-foreground">{plan.users}</dd></div><div className="flex justify-between gap-2"><dt>Active missions</dt><dd className="font-medium text-foreground">{plan.activeMissions}</dd></div><div className="flex justify-between gap-2"><dt>Agent actions</dt><dd className="font-medium text-foreground">{plan.agentActions.toLocaleString()}</dd></div><div className="flex justify-between gap-2"><dt>Meeting hours</dt><dd className="font-medium text-foreground">{plan.meetingHours}</dd></div><div className="flex justify-between gap-2"><dt>Voice minutes</dt><dd className="font-medium text-foreground">{plan.voiceMinutes.toLocaleString()}</dd></div><div className="flex justify-between gap-2"><dt>Phone numbers</dt><dd className="font-medium text-foreground">{plan.phoneNumbers}</dd></div></dl></Card>)}</div></section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]"><Card><div className="border-b border-foreground/10 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Number ledger</p><h2 className="mt-1 font-display text-xl">Provider-backed rental history</h2></div>{billing.numberLedger.length ? <div>{billing.numberLedger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-foreground/10 p-4 last:border-0"><div className="min-w-0"><p className="text-xs font-medium">{entry.kind.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-muted-foreground">{date(entry.createdAt)} · {entry.status}</p></div><p className="shrink-0 text-xs font-medium">{money(entry.amountCents)}</p></div>)}</div> : <p className="p-4 text-xs text-muted-foreground">No phone-number charges have been recorded.</p>}</Card><Card className="p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Billing protection</p><h2 className="mt-1 font-display text-xl">No silent charges</h2><ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground"><li>• Failed payments move through retry and grace states before suspension.</li><li>• Releasing a number stops future renewal billing.</li><li>• Duplicate provider events are idempotent.</li><li>• Taxes and destination-dependent usage are shown separately.</li></ul></Card></div>
    </> : null}
  </div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type InvitationInfo = { id: string; email: string; role: string; status: string; organizationId: string; organization?: { name?: string } };

export default function AcceptInvitationPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [invitationId, setInvitationId] = useState("");
  const [invitation, setInvitation] = useState<InvitationInfo>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    setInvitationId(id);
    if (!id) { setLoading(false); setError("This invitation link is missing its invitation ID."); return; }
    let active = true;
    void authClient.organization.getInvitation({ query: { id } }).then((result) => {
      if (!active) return;
      if (result.error) throw new Error(result.error.message || "This invitation is invalid or expired.");
      setInvitation(result.data as InvitationInfo);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "This invitation is invalid or expired."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const accept = async () => {
    if (!invitation) return;
    setBusy(true); setError("");
    try {
      const result = await authClient.organization.acceptInvitation({ invitationId: invitation.id });
      if (result.error) throw new Error(result.error.message || "The invitation could not be accepted.");
      const activeResult = await authClient.organization.setActive({ organizationId: invitation.organizationId });
      if (activeResult.error) throw new Error(activeResult.error.message || "Invitation accepted, but workspace switching failed. Open Organizations to continue.");
      setAccepted(true);
      window.location.assign("/app/organizations");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The invitation could not be accepted."); }
    finally { setBusy(false); }
  };

  const signInUrl = `/sign-in?callbackURL=${encodeURIComponent(`/accept-invitation?id=${invitationId}`)}`;
  const emailMatches = !session?.user?.email || !invitation?.email || session.user.email.toLowerCase() === invitation.email.toLowerCase();

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] p-4 text-foreground">
    <section className="w-full max-w-lg border border-foreground/10 bg-background p-5 shadow-sm sm:p-7" aria-labelledby="invitation-title">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center border border-foreground/10"><ShieldCheck size={17} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Chusky workspace</p><h1 id="invitation-title" className="mt-1 font-display text-2xl">Accept invitation</h1></div></div>
      {loading || sessionPending ? <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Checking this invitation…</p>
        : error ? <div className="mt-5 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950" role="alert">{error}</div>
          : invitation ? <>
            <p className="mt-5 text-sm leading-6">You’ve been invited to join <strong>{invitation.organization?.name || "a Chusky organization"}</strong> as a <strong>{invitation.role}</strong>.</p>
            <p className="mt-2 text-xs text-muted-foreground">Invitation for {invitation.email}</p>
            {!session ? <div className="mt-5 space-y-3"><p className="text-xs leading-5 text-muted-foreground">Sign in with the invited email address. Email verification is required before joining.</p><Button asChild className="w-full rounded-full"><Link href={signInUrl}>Sign in to accept <ArrowRight size={14} /></Link></Button></div>
              : !emailMatches ? <div className="mt-5 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">You are signed in as {session.user.email}. Sign out and use the invited address to accept this invitation.</div>
                : <Button className="mt-5 w-full rounded-full" disabled={busy || accepted || invitation.status !== "pending"} onClick={() => void accept()}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowRight size={14} />}{busy ? "Accepting…" : invitation.status === "pending" ? "Accept invitation" : "Invitation already used"}</Button>}
          </> : null}
      <p className="mt-6 border-t border-foreground/10 pt-4 text-xs text-muted-foreground"><Link href="/sign-in" className="underline underline-offset-4">Return to sign in</Link></p>
    </section>
  </main>;
}

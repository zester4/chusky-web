"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
export function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function verify() {
    setBusy(true); setError("");
    try {
      const result = backup ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false }) : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) throw new Error(result.error.message || "The code could not be verified.");
      const requested = new URLSearchParams(window.location.search).get("callbackURL") || "/app";
      window.location.assign(requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/app");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-in could not be verified."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground"><section className="w-full max-w-sm rounded-xl border border-foreground/10 p-7"><img src="/brand/chusky-logo.png" alt="Chusky" className="size-10 object-contain" /><h1 className="mt-5 font-display text-3xl">Verify your sign-in.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{backup ? "Enter one of your saved, single-use recovery codes." : "Enter the six-digit code from your authenticator app."}</p><form className="mt-5" onSubmit={(event) => { event.preventDefault(); void verify(); }}><label className="block text-xs">{backup ? "Recovery code" : "Authenticator code"}<input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode={backup ? "text" : "numeric"} required pattern={backup ? undefined : "[0-9]{6}"} className="mt-2 min-h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm" /></label><button disabled={busy} className="mt-4 min-h-11 w-full rounded-full bg-foreground text-sm text-background disabled:opacity-40">{busy ? "Verifying…" : "Verify"}</button></form>{error ? <p role="alert" className="mt-4 text-xs text-rose-700 dark:text-rose-300">{error}</p> : null}<button type="button" onClick={() => { setBackup(!backup); setCode(""); setError(""); }} className="mt-4 min-h-10 text-xs underline underline-offset-4">{backup ? "Use authenticator instead" : "Use a recovery code"}</button><Link href="/sign-in" className="mt-3 block text-xs text-muted-foreground underline">Back to sign in</Link></section></main>;
}

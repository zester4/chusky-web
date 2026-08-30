"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { InputDialog } from "@/components/app/input-dialog";

type AuthVariant = "sign-in" | "sign-up" | "forgot-password" | "reset-password" | "verify-email" | "email-verified";

const copy: Record<AuthVariant, { eyebrow: string; title: string; description: string }> = {
  "sign-in": { eyebrow: "Welcome back", title: "Continue with Chusky.", description: "Pick up where you left off. Your connected apps, private scratchpad, and persistent workspace are waiting." },
  "sign-up": { eyebrow: "Start creating", title: "Your agent, on call.", description: "Create your Chusky workspace and bring your tools, context, and conversations into one calm place." },
  "forgot-password": { eyebrow: "Account recovery", title: "Find your way back.", description: "Enter your email and we’ll help you securely reset your password." },
  "reset-password": { eyebrow: "New password", title: "Make it yours again.", description: "Choose a strong password for your Chusky account. You’ll use it the next time you sign in." },
  "verify-email": { eyebrow: "One last step", title: "Check your inbox.", description: "Verify your email to finish setting up your Chusky workspace and keep your account secure." },
  "email-verified": { eyebrow: "You’re all set", title: "Email verified.", description: "Your Chusky account is active and ready to use." },
};

function Field({ label, id, type = "text", placeholder, autoComplete, required = true }: { label: string; id: string; type?: string; placeholder?: string; autoComplete?: string; required?: boolean }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={password && visible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="h-12 w-full border border-foreground/15 bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-2 focus:ring-foreground/15"
        />
        {password && (
          <button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 px-4 text-muted-foreground hover:text-foreground" aria-label={visible ? "Hide password" : "Show password"}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function AuthCard({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  return (
    <div className="border border-foreground/10 bg-background p-4 shadow-sm sm:p-6">
      <div className="mb-7">
        <h2 className="font-display text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" className="flex h-11 items-center justify-center gap-2 border border-foreground/15 text-sm transition-colors hover:border-foreground/50"><span className="font-semibold">G</span> Continue with Google</button>
      <button type="button" className="flex h-11 items-center justify-center gap-2 border border-foreground/15 text-sm transition-colors hover:border-foreground/50"><span className="font-semibold">⌘</span> Continue with GitHub</button>
    </div>
  );
}

function Divider() {
  return <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span className="h-px flex-1 bg-foreground/10" /> or continue with email <span className="h-px flex-1 bg-foreground/10" /></div>;
}

function SubmitButton({ children }: { children: ReactNode }) {
  return <Button type="submit" className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90">{children}<ArrowRight size={15} /></Button>;
}

function SignInCard() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    const values = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(values.get("email") ?? ""), password: String(values.get("password") ?? ""), callbackURL: `${window.location.origin}/app` });
    setBusy(false);
    if (result.error) setMessage("We couldn’t sign you in. Check your email and password and try again.");
    else window.location.assign("/app");
  };
  return <AuthCard title="Sign in" description="Use your Chusky account to continue."><SocialButtons /><Divider /><form onSubmit={submit} className="space-y-5"><Field label="Email address" id="email" type="email" autoComplete="email" placeholder="you@example.com" /><div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-sm font-medium">Password</label><Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Forgot password?</Link></div><Field label="" id="password" type="password" autoComplete="current-password" /></div><SubmitButton>{busy ? "Signing in…" : "Sign in"}</SubmitButton><p aria-live="polite" className="min-h-5 text-center text-xs text-muted-foreground">{message}</p></form><p className="mt-6 text-center text-sm text-muted-foreground">New to Chusky? <Link href="/sign-up" className="text-foreground underline underline-offset-4">Create an account</Link></p></AuthCard>;
}

function SignUpCard() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setMessage(""); const values = new FormData(event.currentTarget); const result = await authClient.signUp.email({ name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), password: String(values.get("password") ?? ""), callbackURL: `${window.location.origin}/verify-email/success` }); setBusy(false); if (result.error) setMessage(result.error.message || "We couldn’t create your account. Please try again."); else window.location.assign("/verify-email"); };
  return <AuthCard title="Create your account" description="Start with the essentials. You can connect apps later."><form onSubmit={submit} className="space-y-5"><Field label="Name" id="name" autoComplete="name" placeholder="Morgan Lee" /><Field label="Email address" id="email" type="email" autoComplete="email" placeholder="you@example.com" /><Field label="Password" id="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" /><label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" required className="mt-0.5 h-4 w-4 accent-foreground" /> I agree to the Chusky terms and understand that account access is protected by email verification.</label><SubmitButton>{busy ? "Creating account…" : "Create account"}</SubmitButton><p aria-live="polite" className="min-h-5 text-center text-xs text-muted-foreground">{message}</p></form><p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/sign-in" className="text-foreground underline underline-offset-4">Sign in</Link></p></AuthCard>;
}

function ForgotPasswordCard() {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <AuthCard title="Check your inbox" description="If an account exists for that email, we’ve sent instructions to reset the password. Check your spam folder too."><div className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><Mail size={18} className="mt-0.5 shrink-0" /><p>The recovery link will expire soon and can only be used once.</p></div><Button asChild variant="outline" className="mt-6 h-11 w-full rounded-full"><Link href="/sign-in">Back to sign in</Link></Button></AuthCard>;
  return <AuthCard title="Reset your password" description="We’ll send a secure, one-time recovery link if the account exists."><form onSubmit={async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget); await authClient.requestPasswordReset({ email: String(values.get("email") ?? ""), redirectTo: `${window.location.origin}/reset-password` }); setSubmitted(true); }} className="space-y-5"><Field label="Email address" id="email" type="email" autoComplete="email" placeholder="you@example.com" /><SubmitButton>Email me a reset link</SubmitButton></form><p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/sign-in" className="inline-flex items-center gap-2 text-foreground underline underline-offset-4"><ArrowLeft size={14} /> Back to sign in</Link></p></AuthCard>;
}

function ResetPasswordCard() {
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = new FormData(event.currentTarget); const password = String(values.get("password") ?? ""); if (password !== String(values.get("confirmPassword") ?? "")) { setMessage("Passwords do not match."); return; } const token = new URLSearchParams(window.location.search).get("token") || ""; const result = await authClient.resetPassword({ newPassword: password, token }); setMessage(result.error ? "This reset link is invalid or expired. Request a new one." : "Password updated. You can now sign in."); };
  return <AuthCard title="Choose a new password" description="Use a unique password with at least 12 characters."><form onSubmit={submit} className="space-y-5"><Field label="New password" id="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" /><Field label="Confirm new password" id="confirmPassword" type="password" autoComplete="new-password" /><div className="flex gap-3 border border-foreground/10 bg-foreground/[0.03] p-4 text-xs leading-relaxed text-muted-foreground"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-foreground" /> Your reset token is validated server-side before this password is changed.</div><SubmitButton>Update password</SubmitButton><p aria-live="polite" className="min-h-5 text-center text-xs text-muted-foreground">{message}</p></form></AuthCard>;
}

function VerifyEmailCard() {
  const [resent, setResent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  return <><AuthCard title="Verify your email" description="We sent a verification link to your inbox. Open it to activate your Chusky account."><div className="flex gap-3 border border-foreground/10 bg-foreground/[0.03] p-4 text-sm leading-relaxed"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p>Verification links expire. If you didn’t request this account, you can safely ignore the message.</p></div><button type="button" onClick={() => setDialogOpen(true)} className="mt-6 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">{resent ? "A new verification link is on its way" : "Resend verification email"}</button><Button asChild variant="outline" className="mt-5 h-11 w-full rounded-full"><Link href="/sign-in">Return to sign in</Link></Button></AuthCard><InputDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Resend verification email" description="Enter the email address used for your Chusky account." label="Email address" placeholder="you@example.com" submitLabel="Send link" onSubmit={async (email) => { await authClient.sendVerificationEmail({ email, callbackURL: `${window.location.origin}/verify-email/success` }); setResent(true); }} /></>;
}

function EmailVerifiedCard() {
  return <AuthCard title="Your email is verified" description="Your Chusky account is ready. Sign in to open your dashboard and link your Telegram workspace when you’re ready."><div className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p>Email verification succeeded. You can now sign in securely.</p></div><Button asChild className="mt-6 h-11 w-full rounded-full"><Link href="/sign-in">Continue to sign in <ArrowRight size={15} /></Link></Button></AuthCard>;
}

export function AuthPage({ variant }: { variant: AuthVariant }) {
  const content = copy[variant];
  const card = variant === "sign-in" ? <SignInCard /> : variant === "sign-up" ? <SignUpCard /> : variant === "forgot-password" ? <ForgotPasswordCard /> : variant === "reset-password" ? <ResetPasswordCard /> : variant === "email-verified" ? <EmailVerifiedCard /> : <VerifyEmailCard />;
  return (
    <main className="min-h-screen overflow-x-hidden bg-background noise-overlay">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-3 py-3 sm:px-6 sm:py-5 lg:px-10">
        <header className="flex items-center justify-between"><Link href="/" className="font-display text-2xl tracking-tight">chusky<span className="text-muted-foreground">.</span></Link><Link href="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back to website</Link></header>
        <div className="grid flex-1 items-center gap-6 py-8 sm:gap-8 sm:py-12 lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-16">
          <div className="max-w-2xl"><span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6"><span className="h-px w-6 bg-foreground/30" />{content.eyebrow}</span><h1 className="font-display text-4xl leading-[0.92] tracking-tight sm:text-6xl md:text-7xl">{content.title}</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">{content.description}</p><div className="mt-6 hidden gap-6 border-t border-foreground/10 pt-5 text-[11px] text-muted-foreground sm:flex"><span className="flex items-center gap-2"><Check size={13} /> Persistent context</span><span className="flex items-center gap-2"><Check size={13} /> Human approvals</span></div></div>
          <div>{card}</div>
        </div>
        <footer className="flex flex-col gap-2 border-t border-foreground/10 pt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Private by default · Built for your work</span><span>© Chusky AI</span></footer>
      </div>
    </main>
  );
}

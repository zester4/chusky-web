"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, KeyRound, LoaderCircle, LogOut, Trash2, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type Model } from "@/lib/chusky-api";
import { Button, Card, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SettingsPanelProps = { initialModel: string; initialVoice: boolean };
type ConfirmAction = "memory" | "session" | "delete";
type BusyAction = "preference" | "export" | "memory" | "session" | "password" | "delete";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SettingsPanel({ initialModel, initialVoice }: SettingsPanelProps) {
  const { data: session } = authClient.useSession();
  const [model, setModel] = useState(initialModel);
  const [voiceReplies, setVoiceReplies] = useState(initialVoice);
  const [models, setModels] = useState<Model[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [busy, setBusy] = useState<BusyAction>();
  const [message, setMessage] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    setModel(initialModel);
    setVoiceReplies(initialVoice);
  }, [initialModel, initialVoice]);

  useEffect(() => {
    void chuskyApi.account.models().then((result) => setModels(result.data)).catch(() => setMessage("Model list is temporarily unavailable."));
  }, []);

  const updatePreferences = async (input: { model?: string; voiceReplies?: boolean }) => {
    setBusy("preference");
    setMessage(undefined);
    try {
      const next = await chuskyApi.account.updatePreferences(input);
      setModel(next.model);
      setVoiceReplies(next.voiceReplies);
      setModelOpen(false);
      setMessage("Saved across supported Chusky channels.");
    } catch (error) {
      setMessage(errorMessage(error, "Could not save this preference."));
    } finally {
      setBusy(undefined);
    }
  };

  const exportAccount = async () => {
    setBusy("export");
    setMessage(undefined);
    try {
      const exported = await chuskyApi.account.export();
      const payload = {
        ...exported,
        account: { ...(exported.account as Record<string, unknown> | undefined), name: session?.user?.name, email: session?.user?.email },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chusky-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Your account export has downloaded.");
    } catch (error) {
      setMessage(errorMessage(error, "Could not export your account."));
    } finally {
      setBusy(undefined);
    }
  };

  const clearData = async (action: Exclude<ConfirmAction, "delete">) => {
    setBusy(action);
    setMessage(undefined);
    try {
      const result = action === "memory" ? await chuskyApi.account.clearMemory() : await chuskyApi.account.clearSession();
      setConfirmAction(undefined);
      setMessage(result.message);
    } catch (error) {
      setMessage(errorMessage(error, "Could not clear this data."));
    } finally {
      setBusy(undefined);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 12) {
      setMessage("Use your current password and a new password with at least 12 characters.");
      return;
    }
    setBusy("password");
    setMessage(undefined);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message || "Could not change your password.");
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed. Other sessions were signed out.");
    } catch (error) {
      setMessage(errorMessage(error, "Could not change your password."));
    } finally {
      setBusy(undefined);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE" || !deletePassword) {
      setMessage("Enter DELETE and your current password to continue.");
      return;
    }
    setBusy("delete");
    setMessage(undefined);
    try {
      const result = await authClient.deleteUser({ password: deletePassword });
      if (result.error) throw new Error(result.error.message || "Could not delete your account.");
      window.location.assign("/sign-in?deleted=1");
    } catch (error) {
      setBusy(undefined);
      setMessage(errorMessage(error, "Could not delete your account."));
    }
  };

  const displayName = session?.user?.name || "Chusky account";
  const verified = Boolean(session?.user?.emailVerified);

  return <>
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your account</p>
          <div className="mt-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.03] text-muted-foreground"><UserRound size={18} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-medium">{displayName}</h2>
              <p className="mt-1 break-all text-xs text-muted-foreground">{session?.user?.email || "Email unavailable"}</p>
              <div className="mt-2">{verified ? <Status>Verified email</Status> : <Status tone="amber">Email verification pending</Status>}</div>
            </div>
          </div>
          <p className="mt-4 border-t border-foreground/10 pt-3 text-[11px] leading-5 text-muted-foreground">Your identity is managed securely by Chusky authentication. Connected apps and private agent data remain scoped to this account.</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3"><KeyRound size={16} className="mt-0.5 text-muted-foreground" /><div><p className="text-sm font-medium">Password and sessions</p><p className="mt-1 text-[11px] text-muted-foreground">Change your password and sign out other active sessions.</p></div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="min-h-9 border border-foreground/15 bg-background px-2.5 text-xs" />
            <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (12+ chars)" className="min-h-9 border border-foreground/15 bg-background px-2.5 text-xs" />
          </div>
          <Button secondary disabled={busy === "password"} onClick={() => void changePassword()} className="mt-3">{busy === "password" && <LoaderCircle size={12} className="animate-spin" />} Change password</Button>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">General runtime</p>
          <div className="mt-4 space-y-4">
            <div><label className="text-xs text-muted-foreground">Agent model</label><Popover open={modelOpen} onOpenChange={setModelOpen}><PopoverTrigger asChild><button type="button" disabled={busy === "preference"} aria-expanded={modelOpen} className="mt-1.5 flex min-h-9 w-full items-center justify-between border border-foreground/15 px-2.5 py-2 text-left text-xs hover:border-foreground/40"><span className="truncate">{model}</span><span>⌄</span></button></PopoverTrigger><PopoverContent align="start" sideOffset={5} className="max-h-64 w-[min(24rem,calc(100vw-1rem))] overflow-auto p-1">{models.map((item) => <button key={item.id} type="button" onClick={() => void updatePreferences({ model: item.id })} className="block min-h-8 w-full px-2.5 py-2 text-left text-xs hover:bg-foreground/5"><span className="block truncate">{item.name}</span><span className="mt-0.5 block truncate font-mono text-[9px] text-muted-foreground">{item.id}</span></button>)}{!models.length && <p className="p-3 text-xs text-muted-foreground">Loading models…</p>}</PopoverContent></Popover></div>
            <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-3"><div><p className="text-xs">Voice replies</p><p className="mt-1 text-[10px] text-muted-foreground">Read Chusky responses aloud where supported.</p></div><button type="button" role="switch" aria-checked={voiceReplies} disabled={busy === "preference"} onClick={() => void updatePreferences({ voiceReplies: !voiceReplies })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${voiceReplies ? "bg-foreground" : "bg-foreground/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background transition-transform ${voiceReplies ? "translate-x-6" : "translate-x-1"}`} /></button></div>
            <div className="border-t border-foreground/10 pt-3"><p className="text-xs font-medium">Call and meeting preferences</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Provider-specific voice and meeting choices are managed on their dedicated Calls and Meetings pages.</p></div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Privacy and data</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3"><Button secondary disabled={busy === "export"} onClick={() => void exportAccount()}>{busy === "export" ? <LoaderCircle size={12} className="animate-spin" /> : <Download size={12} />} Export data</Button><Button secondary disabled={busy === "memory"} onClick={() => setConfirmAction("memory")}><Trash2 size={12} /> Clear memory</Button><Button secondary disabled={busy === "session"} onClick={() => setConfirmAction("session")}><LogOut size={12} /> Clear context</Button></div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Export saves the account data available to Chusky. Clearing memory removes personal remembered facts; clearing context starts a fresh active conversation context.</p>
        </Card>

        <Card className="border-red-500/25 p-4 sm:p-5">
          <div className="flex items-start gap-3"><AlertTriangle size={16} className="mt-0.5 text-red-600" /><div><p className="text-sm font-medium text-red-700">Delete account</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">This permanently removes your Chusky authentication account and clears personal Chusky context. External provider accounts are not deleted from their providers.</p></div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Current password" className="min-h-9 border border-foreground/15 bg-background px-2.5 text-xs" /><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={'Type DELETE'} className="min-h-9 border border-foreground/15 bg-background px-2.5 text-xs" /></div>
          <Button disabled={busy === "delete"} onClick={() => setConfirmAction("delete")} className="mt-3 bg-red-600 text-white hover:bg-red-700">{busy === "delete" && <LoaderCircle size={12} className="animate-spin" />} Delete my account</Button>
        </Card>
      </div>
    </div>
    {message && <p role="status" className="mt-4 text-[11px] text-muted-foreground">{message}</p>}
    <ConfirmDialog open={confirmAction === "memory"} onOpenChange={(open) => !open && setConfirmAction(undefined)} title="Clear personal memory?" description="This removes personal facts and preferences Chusky saved for your account. This cannot be undone." confirmLabel={busy === "memory" ? "Clearing…" : "Clear memory"} onConfirm={() => clearData("memory")} />
    <ConfirmDialog open={confirmAction === "session"} onOpenChange={(open) => !open && setConfirmAction(undefined)} title="Start with a clean context?" description="This clears the active Chusky conversation context for your account. Saved memories and connected accounts are not changed." confirmLabel={busy === "session" ? "Clearing…" : "Clear context"} onConfirm={() => clearData("session")} />
    <ConfirmDialog open={confirmAction === "delete"} onOpenChange={(open) => !open && setConfirmAction(undefined)} title="Delete your Chusky account?" description="This is permanent. Your Chusky authentication account and personal Chusky context will be removed, and you will be signed out." confirmLabel={busy === "delete" ? "Deleting…" : "Delete account"} destructive onConfirm={deleteAccount} />
  </>;
}

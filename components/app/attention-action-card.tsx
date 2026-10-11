"use client";

import { ArrowUpRight, Check, CircleAlert, Plug, Sparkles } from "lucide-react";
import type { TriggerEventActivity, TriggerEventAction } from "@/lib/chusky-api";
import { TriggerLogo, triggerProviderBrand } from "@/components/app/trigger-logo";
import { MarkdownMessage } from "./markdown-message";

function providerName(slug: string): string {
  return triggerProviderBrand(slug).name;
}

function cleanText(value: string, max = 520): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, " ")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function summaryField(lines: string[], keys: string[]): string | undefined {
  const wanted = new Set(keys.map((key) => key.replace(/[^a-z0-9]/gi, "").toLowerCase()));
  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (wanted.has(key)) return line.slice(separator + 1).trim();
  }
  return undefined;
}

function displaySummary(event: TriggerEventActivity): string {
  const summary = event.summary.trim();
  const lines = summary.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const looksLegacy = /(?:^|\n)(?:Trigger|Toolkit|Connection|message_text|message_id|inbox_message_id):/i.test(summary);
  if (!looksLegacy) return summary;

  const slug = event.slug.toUpperCase();
  if (/gmail|googlemail|outlook|email/i.test(`${event.slug} ${summary}`)) {
    const body = summaryField(lines, ["message_text", "messagetext", "body", "content", "html", "snippet", "preview"]);
    const title = body?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const subject = summaryField(lines, ["subject", "email_subject"]) || title;
    const sender = summaryField(lines, ["from", "sender", "from_email", "sender_email"]);
    const preview = body ? cleanText(body) : undefined;
    return [
      /NEW.*MESSAGE|MESSAGE/.test(slug) ? "New Gmail message" : "Gmail update",
      ...(subject ? [`Subject: ${cleanText(subject, 180)}`] : []),
      ...(sender ? [`From: ${cleanText(sender, 180)}`] : []),
      ...(preview ? [`Preview: ${preview}`] : []),
    ].join("\n");
  }

  const useful = lines.filter((line) => {
    const key = line.split(":", 1)[0]?.trim() ?? "";
    return !/^(trigger|toolkit|connection)$/i.test(key) && !/(^|_)(id|ids|uuid|connection|account|trigger)(_|$)/i.test(key);
  }).map((line) => cleanText(line)).filter(Boolean).slice(0, 4);
  return [providerName(event.slug), ...useful].join("\n");
}

function fallbackActions(event: TriggerEventActivity): TriggerEventAction[] {
  const haystack = `${event.slug} ${event.summary} ${displaySummary(event)} ${event.result ?? ""}`.toLowerCase();
  if (event.slug.toLowerCase().includes("connected_account_expired") || event.slug.toLowerCase().includes("connected.account.expired") || haystack.includes("expired")) {
    return [{ id: "reconnect", label: "Reconnect", prompt: `Reconnect the ${providerName(event.slug)} account involved in this notification, then verify the connection before attempting any external action.` }];
  }
  if (event.slug.toLowerCase().includes("trigger_disabled") || event.slug.toLowerCase().includes("trigger.disabled") || haystack.includes("monitoring stopped")) {
    return [{ id: "enable", label: "Enable", prompt: `Review why the ${providerName(event.slug)} trigger was disabled and enable it only if the current monitoring intent is still correct.` }];
  }
  if (event.status === "failed" || event.notificationStatus === "failed" || event.notificationStatus === "unavailable") {
    return [{ id: "inspect", label: "Inspect", prompt: `Inspect the saved ${providerName(event.slug)} notification above, explain what needs attention, and suggest the safest next step. Do not repeat any external action automatically.` }];
  }
  if (event.slug.toLowerCase().includes("calendar")) {
    return [{ id: "prepare", label: "Prepare", prompt: `Prepare the next step for this ${providerName(event.slug)} update. Review the saved event, verify what is current, and tell me what needs my decision.` }];
  }
  if (haystack.includes("draft") || haystack.includes("reply")) {
    return [{ id: "review-draft", label: "Review draft", prompt: `Review the draft or reply described in this ${providerName(event.slug)} notification. Verify the recipient, claims, and intended outcome before deciding whether to send it.` }];
  }
  if (haystack.includes("build") || haystack.includes("deployment") || haystack.includes("vercel") || haystack.includes("railway")) {
    return [{ id: "inspect-logs", label: "Inspect logs", prompt: `Inspect the latest ${providerName(event.slug)} build or deployment logs, identify the first actionable failure, and propose a safe fix.` }, { id: "retry", label: "Retry", prompt: `Review the failed ${providerName(event.slug)} build or deployment, fix only the verified issue, and retry it if the change is safe.` }];
  }
  if (haystack.includes("newsletter") || haystack.includes("unread") || haystack.includes("inbox")) {
    return [{ id: "archive", label: "Archive", prompt: `Review the messages described in this ${providerName(event.slug)} notification and archive only the matching low-risk messages after confirming the scope.` }, { id: "filter", label: "Filter", prompt: `Review the sender pattern in this ${providerName(event.slug)} notification and propose a filter that keeps future messages out of the inbox without deleting them.` }];
  }
  return [{ id: "review", label: "Check", prompt: `Check the connected-app update below, verify the current state, and tell me the safest useful next step.\n\n${event.summary}` }];
}

export function attentionActions(event: TriggerEventActivity): TriggerEventAction[] {
  return event.actions?.length ? event.actions : fallbackActions(event);
}

export function AttentionActionCard({ event, onAction, compact = false }: { event: TriggerEventActivity; onAction?: (action: TriggerEventAction) => void; compact?: boolean }) {
  const actions = attentionActions(event);
  const summary = displaySummary(event);
  const ProviderIcon = event.status === "failed" || event.notificationStatus === "failed" ? CircleAlert : event.actions?.length ? Sparkles : Plug;
  const activate = (action: TriggerEventAction) => {
    if (onAction) { onAction(action); return; }
    const query = new URLSearchParams({ new: "1", draft: action.prompt, triggerEvent: event.id, triggerAction: action.id, auto: "1" });
    window.location.assign(`/app/chat?${query.toString()}`);
  };
  return <article className={`group flex min-w-0 items-start gap-2.5 border border-foreground/10 bg-foreground/[0.025] ${compact ? "rounded-md px-3 py-2.5" : "rounded-xl px-3.5 py-3 sm:px-4 sm:py-3.5"}`}>
    <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-background text-muted-foreground" aria-hidden="true">
      <TriggerLogo slug={event.slug} size={30} />
      {(event.status === "failed" || event.notificationStatus === "failed") && <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-background text-destructive"><ProviderIcon size={10} /></span>}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{providerName(event.slug)}</span>
        <span className="text-[9px] text-muted-foreground">·</span>
        <span className="truncate text-[10px] text-muted-foreground">{event.notificationStatus === "delivered" ? "Ready" : "Needs attention"}</span>
      </div>
      <MarkdownMessage content={summary} className={`mt-1 ${compact ? "[&_p]:text-[11px]" : "[&_p]:text-xs"} [&_p]:my-0 [&_p]:leading-5 [&_ul]:my-0 [&_ol]:my-0 [&_pre]:my-1 [&_table]:my-1`} />
      {!compact && event.result && <MarkdownMessage content={event.result} className="mt-1 line-clamp-3 text-muted-foreground [&_p]:my-0 [&_p]:text-[10px] [&_p]:leading-4 [&_ul]:my-0 [&_ol]:my-0" />}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {actions.map((action, index) => <button key={action.id} type="button" onClick={() => activate(action)} className={`inline-flex min-h-7 items-center gap-1 rounded-md border px-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 ${index === 0 ? "border-foreground/20 bg-foreground text-background hover:bg-foreground/85" : "border-foreground/15 bg-background text-foreground hover:border-foreground/35"}`}>
          {index === 0 ? <Check size={11} aria-hidden="true" /> : <ArrowUpRight size={11} aria-hidden="true" />}{action.label}
        </button>)}
      </div>
    </div>
  </article>;
}

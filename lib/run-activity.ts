export type ToolActivity = {
  id: string;
  type: "run.tool_activity";
  at: number;
  toolSlug: string;
  callId?: string;
  status: "started" | "completed" | "failed" | "approval_required" | "cancelled";
  message: string;
  actionLabel?: string;
  toolkitSlug?: string;
  toolkitName?: string;
  toolkitLogo?: string;
  batchActions?: import("./chusky-api.js").RunBatchAction[];
  summary?: string;
  durationMs?: number;
};

export type PresentedToolActivity = Omit<ToolActivity, "status" | "batchActions"> & {
  status: ToolActivity["status"] | "unknown";
  parallelBatch?: boolean;
};

export type RunStatusUpdate = {
  id: string;
  at: number;
  text: string;
};

type ActivityCopy = {
  toolSlug?: string;
  toolkitSlug?: string;
  toolkitName?: string;
  actionLabel?: string;
  message?: string;
  summary?: string;
  status: ToolActivity["status"] | "unknown" | "waiting";
  durationMs?: number;
};

const cleanActivityCopy = (value?: string): string | undefined => {
  const normalized = value?.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();
  return normalized || undefined;
};

const genericActivityCopy = /^(?:i['’]?m|i am)?\s*(?:taking care of that|working(?: through your request| on it)?|processing (?:your request|that|it)|handling (?:that|it)|running(?: now)?|connected app action|remote connected app action|one moment)[\s.!…]*$/i;
const genericProgressCopy = /^(?:preparing your request|researching the request|executing the next action|working(?: now| on it| through your request)?|running(?: now)?|chusky is (?:organizing|keeping the work visible|preparing)(?: the right context)?(?: before it acts)?|i['’]?m\s+(?:understanding(?: your request)?|lining up (?:the )?best way(?: to help)?|taking care of (?:that|it)))[\s.!…]*$/i;

/** True when a lifecycle line is only filler and adds no user-visible information. */
export function isGenericProgressText(value?: string): boolean {
  const candidate = cleanActivityCopy(value);
  return Boolean(candidate && (genericActivityCopy.test(candidate) || genericProgressCopy.test(candidate)));
}

const providerNameForActivity = (activity: Pick<ActivityCopy, "toolSlug" | "toolkitSlug" | "toolkitName">): string | undefined => {
  const supplied = cleanActivityCopy(activity.toolkitName || activity.toolkitSlug);
  if (supplied) return supplied.split(/[_\s-]+/).filter(Boolean).map((part) => part.length <= 3 ? part.toUpperCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" ");
  const slug = activity.toolSlug?.replace(/^(CHUCK|COMPOSIO|MCP)_/i, "");
  const provider = slug?.split("_", 1)[0];
  return provider ? provider.split(/[_-]+/).map((part) => part.length <= 3 ? part.toUpperCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" ") : undefined;
};

const titleCaseActivityToken = (value: string) => value
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((part) => part.length <= 3 ? part.toUpperCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
  .join(" ");

/** Normalize labels written by older runs before the structured action copy existed. */
const legacyActionLabelForTool = (toolSlug?: string): string | undefined => {
  switch (toolSlug?.toUpperCase()) {
    case "CHUCK_TREG_SEARCH": return "Finding research capabilities";
    case "CHUCK_TREG_COMPANY_SEARCH": return "Searching for companies";
    case "CHUCK_TREG_PEOPLE_SEARCH": return "Searching for people";
    case "CHUCK_TREG_COMPANY_JOBS_SEARCH": return "Searching for company jobs";
    case "CHUCK_TREG_ENRICH_COMPANY": return "Enriching the selected company";
    case "CHUCK_TREG_ENRICH_PERSON": return "Enriching the selected person";
    case "CHUCK_TREG_RESOLVE": return "Resolving the requested data";
    case "CHUCK_TREG_CALL": return "Calling the approved endpoint";
    case "CHUCK_MONID_PLAN": return "Planning the research";
    case "CHUCK_MONID_SEARCH": return "Finding research capabilities";
    case "CHUCK_MONID_INSPECT": return "Inspecting the selected capability";
    case "CHUCK_MONID_RUN": return "Running the research action";
    case "CHUCK_MONID_RUN_GET": return "Checking the research run";
    case "CHUCK_MONID_RUNS_LIST": return "Listing research runs";
    case "CHUCK_MONID_BALANCE":
    case "CHUCK_MONID_USAGE": return "Checking usage";
    case "COMPOSIO_REMOTE_BASH_TOOL": return "Running a remote shell command";
    case "COMPOSIO_REMOTE_WORKBENCH": return "Working in the remote workspace";
    case "COMPOSIO_EXECUTE_TOOL": return "Running the connected action";
    case "COMPOSIO_MULTI_EXECUTE_TOOL": return "Running connected actions";
    default: return undefined;
  }
};

const looksLikeLegacyToolLabel = (value: string, toolSlug?: string): boolean => {
  if (!toolSlug) return false;
  const normalizedValue = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const normalizedSlug = toolSlug.replace(/^(CHUCK|COMPOSIO|MCP)_/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return normalizedValue === normalizedSlug || normalizedValue.endsWith(normalizedSlug);
};

/** Return the concrete action instead of generic model filler such as "I'm taking care of that". */
export function activityTitle(activity: Pick<ActivityCopy, "toolSlug" | "toolkitSlug" | "toolkitName" | "actionLabel" | "message">): string {
  const legacyLabel = legacyActionLabelForTool(activity.toolSlug);
  const supplied = [activity.actionLabel, activity.message]
    .map(cleanActivityCopy)
    .map((value) => value && legacyLabel && looksLikeLegacyToolLabel(value, activity.toolSlug) ? legacyLabel : value)
    .find((value) => value && !genericActivityCopy.test(value));
  const provider = providerNameForActivity(activity);
  if (supplied && !genericActivityCopy.test(supplied)) {
    if (!provider || supplied.toLowerCase().startsWith(`${provider.toLowerCase()} ·`)) return supplied;
    return `${provider} · ${supplied}`;
  }

  let token = activity.toolSlug?.replace(/^(CHUCK|COMPOSIO|MCP)_/i, "") || "step";
  const toolkit = (activity.toolkitSlug || activity.toolkitName)?.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (toolkit && token.toUpperCase().startsWith(`${toolkit}_`)) token = token.slice(toolkit.length + 1);
  const concrete = titleCaseActivityToken(token);
  return provider && concrete !== "Step" ? `${provider} · ${concrete}` : concrete;
}

/** Remove only exact model filler lines; never rewrite the saved answer or tool details. */
export function stripGenericProgressText(value: string): string {
  return value
    .split(/\r?\n/)
    .filter((line) => {
      const candidate = line.replace(/^\s*(?:[-*•>]\s+)?/, "").trim();
      return !isGenericProgressText(candidate);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Keep every meaningful human-readable run update in chronological order. */
export function presentRunStatusUpdates(events: readonly { id: string; type: string; at: number; text?: string }[]): RunStatusUpdate[] {
  const updates: RunStatusUpdate[] = [];
  for (const event of events) {
    if (event.type !== "run.status" || !event.text?.trim()) continue;
    const text = stripGenericProgressText(event.text.replace(/\s+/g, " "));
    if (!text || updates.at(-1)?.text === text) continue;
    updates.push({ id: event.id, at: event.at, text });
  }
  return updates;
}

/** Merge live status frames with a restored run without duplicating updates. */
export function upsertRunStatusUpdate(updates: RunStatusUpdate[], update: RunStatusUpdate): RunStatusUpdate[] {
  if (updates.some((item) => item.id === update.id)) return updates;
  if (updates.at(-1)?.text === update.text) return updates;
  return [...updates, update].sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));
}

export function activityStatusLabel(activity: Pick<ActivityCopy, "status" | "durationMs">, current = false): string {
  if (current) return "Running";
  if (activity.status === "completed") return activity.durationMs !== undefined && Number.isFinite(activity.durationMs) ? `Done · ${activity.durationMs < 1000 ? `${Math.round(activity.durationMs)} ms` : `${(activity.durationMs / 1000).toFixed(1)} s`}` : "Done";
  if (activity.status === "approval_required") return "Needs approval";
  if (activity.status === "failed" || activity.status === "unknown") return "Needs attention";
  if (activity.status === "cancelled") return "Cancelled";
  if (activity.status === "waiting") return "Waiting";
  return "Incomplete";
}

/** Keep the exact step visible without repeating a generic label or mechanical provider receipt. */
export function activityDetailLine(activity: ActivityCopy, current = false): string | undefined {
  const title = activityTitle(activity);
  const summary = activityDetailSummary(activity.summary);
  if (summary && summary.toLowerCase() !== title.toLowerCase()) return summary;
  const message = cleanActivityCopy(activity.message);
  if (message && !genericActivityCopy.test(message) && message.toLowerCase() !== title.toLowerCase()) return message;
  if (current) return "Running now";
  return activityStatusLabel(activity);
}

const normalizedToolkit = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();

/**
 * Uses persisted toolkit metadata when available. Older run records predate
 * that metadata, so the prefix is only used as a catalogue lookup candidate;
 * the UI still verifies it against the returned toolkit slug before branding.
 */
export function toolkitSlugForActivity(activity: Pick<PresentedToolActivity, "toolSlug" | "toolkitSlug">): string | undefined {
  if (activity.toolkitSlug?.trim()) return activity.toolkitSlug.trim().toLowerCase();
  if (/^(CHUCK|COMPOSIO|MCP)_/i.test(activity.toolSlug)) return undefined;
  const prefix = activity.toolSlug.split("_", 1)[0]?.trim().toLowerCase();
  return prefix && /^[a-z0-9-]{1,120}$/.test(prefix) ? prefix : undefined;
}

/** A compact, provider-neutral action token for the timeline; never reads tool arguments. */
export function actionTokenForActivity(activity: Pick<PresentedToolActivity, "toolSlug" | "toolkitSlug">): string {
  const toolkit = toolkitSlugForActivity(activity);
  const compactToolkit = toolkit ? normalizedToolkit(toolkit).toUpperCase() : "";
  const normalizedSlug = activity.toolSlug.trim().toUpperCase();
  const withoutToolkit = compactToolkit && normalizedSlug.startsWith(`${compactToolkit}_`)
    ? normalizedSlug.slice(compactToolkit.length + 1)
    : normalizedSlug;
  return withoutToolkit.toLowerCase() || "action";
}

/** Result summaries are optional detail, not the primary action label. */
export function activityDetailSummary(summary?: string): string | undefined {
  const value = summary?.replace(/\s+/g, " ").trim();
  if (!value || value.length > 96) return undefined;
  if (/^(?:result returned|batch response (?:received|returned)|provider confirmed this action|individual outcome (?:was )?not (?:identified|available)|waiting for approval|provider reported this action failed|batch (?:was )?interrupted)/i.test(value)) return undefined;
  return value;
}

const successfulDiscoveryTools = new Set(["COMPOSIO_SEARCH_TOOLS", "COMPOSIO_GET_TOOL_SCHEMAS"]);
const successfulPreparationTools = new Set(["CHUCK_SEARCH_SKILLS", "CHUCK_LIST_SKILL_FILES", "CHUCK_READ_SKILL_FILE"]);
const hiddenSetupStatuses = new Set<ToolActivity["status"]>(["started", "completed"]);

/** Keep internal discovery out of the timeline and surface batch actions individually. */
export function presentToolActivities(activities: ToolActivity[]): PresentedToolActivity[] {
  return activities.flatMap((activity): PresentedToolActivity[] => {
    if (successfulPreparationTools.has(activity.toolSlug) && hiddenSetupStatuses.has(activity.status)) return [];
    if (successfulPreparationTools.has(activity.toolSlug)) {
      return [{
        ...activity,
        toolSlug: "CHUCK_PREPARATION",
        toolkitName: "Chusky",
        actionLabel: "Couldn’t load the relevant guidance",
        message: "Couldn’t load the relevant guidance",
        summary: "Try the request again. If it keeps failing, contact support.",
      }];
    }
    if (successfulDiscoveryTools.has(activity.toolSlug)) {
      if (hiddenSetupStatuses.has(activity.status)) return [];
      return [{
        ...activity,
        toolkitName: activity.toolkitName || "Composio",
        toolkitLogo: activity.toolkitLogo || "/logos/composio.svg",
        actionLabel: activity.actionLabel || "Couldn’t find the right connected capability",
        message: activity.message || "Couldn’t find the right connected capability",
        summary: activity.summary || "Try the request again. If it keeps failing, check the connected app and its permissions.",
      }];
    }
    if (!activity.batchActions?.length) return [{ ...activity, status: activity.status }];
    return activity.batchActions.map((action) => ({
      id: action.id,
      type: "run.tool_activity",
      at: activity.at,
      toolSlug: action.toolSlug,
      callId: activity.callId,
      status: action.status,
      message: action.actionLabel || activity.message,
      ...(action.actionLabel ? { actionLabel: action.actionLabel } : {}),
      ...(action.toolkitSlug ? { toolkitSlug: action.toolkitSlug } : {}),
      ...(action.toolkitName ? { toolkitName: action.toolkitName } : {}),
      ...(action.toolkitLogo ? { toolkitLogo: action.toolkitLogo } : {}),
      ...(action.summary ? { summary: action.summary } : {}),
      parallelBatch: true,
    }));
  });
}

const activityKey = (activity: Pick<ToolActivity, "toolSlug" | "message" | "callId">) => activity.callId ? `call:${activity.callId}` : `${activity.toolSlug}\u0000${activity.message}`;

/** Collapse start/finish events into one durable step, including restored history. */
export function coalesceToolActivities(activities: ToolActivity[]): ToolActivity[] {
  const result: ToolActivity[] = [];
  const openSteps = new Map<string, number[]>();

  for (const activity of activities) {
    if (activity.status === "started") {
      const key = activityKey(activity);
      const indices = openSteps.get(key) ?? [];
      if (activity.callId && indices.length) {
        const index = indices[indices.length - 1]!;
        result[index] = { ...result[index], ...activity, id: result[index]!.id, at: result[index]!.at };
        continue;
      }
      indices.push(result.push(activity) - 1);
      openSteps.set(key, indices);
      continue;
    }

    const key = activityKey(activity);
    const index = openSteps.get(key)?.pop();
    if (index === undefined) {
      result.push(activity);
      continue;
    }

    result[index] = { ...result[index], ...activity, id: result[index].id };
  }

  return result;
}

/** Merge a streamed or polled lifecycle update without duplicating its card. */
export function upsertToolActivity(activities: ToolActivity[], activity: ToolActivity): ToolActivity[] {
  const sameEventIndex = activities.findIndex((item) => item.id === activity.id);
  if (sameEventIndex >= 0) {
    return activities.map((item, index) => index === sameEventIndex ? { ...item, ...activity, id: item.id } : item);
  }

  if (activity.status === "started" && activity.callId) {
    const existingIndex = activities.findLastIndex((item) => item.status === "started" && item.callId === activity.callId);
    if (existingIndex >= 0) return activities.map((item, index) => index === existingIndex ? { ...item, ...activity, id: item.id, at: item.at } : item);
  }

  if (activity.status !== "started") {
    const key = activityKey(activity);
    for (let index = activities.length - 1; index >= 0; index -= 1) {
      const existing = activities[index];
      if (existing.status === "started" && activityKey(existing) === key) {
        return activities.map((item, itemIndex) => itemIndex === index ? { ...item, ...activity, id: item.id } : item);
      }
    }
  }

  return [...activities, activity];
}

export type SubagentActivity = {
  id: string;
  activityId: string;
  at: number;
  parentToolCallId: string;
  handoffId: string;
  worker: string;
  objective: string;
  kind: "worker" | "tool";
  status: "started" | "completed" | "failed" | "approval_required" | "cancelled" | "waiting";
  message: string;
  toolCallId?: string;
  toolSlug?: string;
  actionLabel?: string;
  toolkitSlug?: string;
  toolkitName?: string;
  toolkitLogo?: string;
  summary?: string;
  durationMs?: number;
};

/** Keep the latest state for each durable specialist or specialist tool step. */
export function coalesceSubagentActivities(activities: SubagentActivity[]): SubagentActivity[] {
  const byActivity = new Map<string, SubagentActivity>();
  for (const activity of activities) {
    const existing = byActivity.get(activity.activityId);
    byActivity.set(activity.activityId, existing ? { ...existing, ...activity, id: existing.id, at: existing.at } : activity);
  }
  return [...byActivity.values()].sort((left, right) => left.at - right.at);
}

export function upsertSubagentActivity(activities: SubagentActivity[], activity: SubagentActivity): SubagentActivity[] {
  const index = activities.findIndex((item) => item.activityId === activity.activityId);
  if (index < 0) return [...activities, activity].sort((left, right) => left.at - right.at);
  return activities.map((item, itemIndex) => itemIndex === index ? { ...item, ...activity, id: item.id, at: item.at } : item).sort((left, right) => left.at - right.at);
}

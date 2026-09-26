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

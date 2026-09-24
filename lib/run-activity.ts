export type ToolActivity = {
  id: string;
  type: "run.tool_activity";
  at: number;
  toolSlug: string;
  status: "started" | "completed" | "failed" | "approval_required" | "cancelled";
  message: string;
  summary?: string;
  durationMs?: number;
};

const activityKey = (activity: Pick<ToolActivity, "toolSlug" | "message">) => `${activity.toolSlug}\u0000${activity.message}`;

/** Collapse start/finish events into one durable step, including restored history. */
export function coalesceToolActivities(activities: ToolActivity[]): ToolActivity[] {
  const result: ToolActivity[] = [];
  const openSteps = new Map<string, number[]>();

  for (const activity of activities) {
    if (activity.status === "started") {
      const key = activityKey(activity);
      const indices = openSteps.get(key) ?? [];
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

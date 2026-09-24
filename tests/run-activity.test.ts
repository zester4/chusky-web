import assert from "node:assert/strict";
import test from "node:test";
import { coalesceToolActivities, upsertToolActivity, type ToolActivity } from "../lib/run-activity.js";

const activity = (id: string, status: ToolActivity["status"], at: number, overrides: Partial<ToolActivity> = {}): ToolActivity => ({
  id,
  type: "run.tool_activity",
  at,
  toolSlug: "COMPOSIO_SEARCH_TOOLS",
  status,
  message: "Finding the right connected capability…",
  ...(status === "completed" ? { summary: "Result returned", durationMs: 2600 } : {}),
  ...overrides,
});

test("restored activity history folds each tool start and terminal result into one step", () => {
  const steps = coalesceToolActivities([
    activity("search_started", "started", 1),
    activity("search_completed", "completed", 2),
    activity("execute_started", "started", 3, { toolSlug: "COMPOSIO_MULTI_EXECUTE_TOOL", message: "Carrying those steps out…" }),
    activity("execute_completed", "completed", 4, { toolSlug: "COMPOSIO_MULTI_EXECUTE_TOOL", message: "Carrying those steps out…" }),
  ]);

  assert.equal(steps.length, 2);
  assert.deepEqual(steps.map(({ id, status }) => ({ id, status })), [
    { id: "search_started", status: "completed" },
    { id: "execute_started", status: "completed" },
  ]);
  assert.equal(steps[0].summary, "Result returned");
});

test("repeated identical calls pair with the most recent open step", () => {
  const steps = coalesceToolActivities([
    activity("first_started", "started", 1),
    activity("second_started", "started", 2),
    activity("second_completed", "completed", 3),
    activity("first_completed", "completed", 4),
  ]);

  assert.deepEqual(steps.map(({ id, status }) => ({ id, status })), [
    { id: "first_started", status: "completed" },
    { id: "second_started", status: "completed" },
  ]);
});

test("live events update an existing step and a polled snapshot does not duplicate it", () => {
  const started = activity("started_event", "started", 1);
  const completed = activity("completed_event", "completed", 2);
  const live = upsertToolActivity(upsertToolActivity([], started), completed);
  const restored = coalesceToolActivities([started, completed]);
  const merged = upsertToolActivity(live, restored[0]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, "completed");
  assert.equal(merged[0].id, "started_event");
});

test("terminal tool activity without a matching start remains visible", () => {
  const terminal = activity("orphan_terminal", "failed", 1);
  assert.deepEqual(coalesceToolActivities([terminal]), [terminal]);
});

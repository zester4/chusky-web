import assert from "node:assert/strict";
import test from "node:test";
import { actionTokenForActivity, activityDetailLine, activityDetailSummary, activityStatusLabel, activityTitle, coalesceSubagentActivities, coalesceToolActivities, presentRunStatusUpdates, presentRunTimeline, presentToolActivities, stripGenericProgressText, toolkitSlugForActivity, upsertRunStatusUpdate, upsertSubagentActivity, upsertToolActivity, type SubagentActivity, type ToolActivity } from "../lib/run-activity.js";

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

const subagent = (id: string, activityId: string, status: SubagentActivity["status"], at: number, overrides: Partial<SubagentActivity> = {}): SubagentActivity => ({
  id, activityId, at, parentToolCallId: "parent-call", handoffId: "handoff-1", worker: "nora", objective: "Research the requested topic", kind: "worker", status, message: "Nora is working", ...overrides,
});

test("restored specialist and child-tool events coalesce by durable activity ID", () => {
  const events = [
    subagent("worker-start", "worker:handoff-1", "started", 1),
    subagent("tool-start", "tool:handoff-1:call-1", "started", 2, { kind: "tool", toolCallId: "call-1", toolSlug: "GMAIL_SEARCH_EMAILS", toolkitName: "Gmail", toolkitLogo: "https://example.com/gmail.svg", message: "Searching email" }),
    subagent("tool-done", "tool:handoff-1:call-1", "completed", 3, { kind: "tool", toolCallId: "call-1", toolSlug: "GMAIL_SEARCH_EMAILS", toolkitName: "Gmail", toolkitLogo: "https://example.com/gmail.svg", message: "Searching email", summary: "Result returned" }),
    subagent("worker-done", "worker:handoff-1", "completed", 4, { message: "Nora finished" }),
  ];
  const restored = coalesceSubagentActivities(events);
  assert.equal(restored.length, 2);
  assert.deepEqual(restored.map(({ activityId, status }) => ({ activityId, status })), [
    { activityId: "worker:handoff-1", status: "completed" },
    { activityId: "tool:handoff-1:call-1", status: "completed" },
  ]);
  assert.equal(restored[1]?.toolkitLogo, "https://example.com/gmail.svg");
});

test("live specialist events reconcile to the snapshot without duplicating steps", () => {
  const started = subagent("event-1", "worker:handoff-1", "started", 1);
  const done = subagent("event-2", "worker:handoff-1", "completed", 2, { message: "Nora finished" });
  const live = upsertSubagentActivity(upsertSubagentActivity([], started), done);
  const restored = coalesceSubagentActivities([started, done]);
  assert.equal(upsertSubagentActivity(live, restored[0]!).length, 1);
  assert.equal(live[0]?.status, "completed");
});

test("tool calls with the same label remain linked to their own parent call IDs", () => {
  const steps = coalesceToolActivities([
    activity("first-start", "started", 1, { callId: "call-1" }),
    activity("second-start", "started", 2, { callId: "call-2" }),
    activity("first-done", "completed", 3, { callId: "call-1" }),
  ]);
  assert.deepEqual(steps.map(({ callId, status }) => ({ callId, status })), [
    { callId: "call-1", status: "completed" },
    { callId: "call-2", status: "started" },
  ]);
});

test("restored Composio batch activity keeps app labels and honest unmatched outcomes", () => {
  const started = activity("batch-start", "started", 1, {
    callId: "batch-call",
    actionLabel: "Carrying out 2 independent actions in parallel",
    batchActions: [
      { id: "batch-call:0", toolSlug: "GMAIL_SEARCH_EMAILS", actionLabel: "Search messages", toolkitName: "Gmail", toolkitLogo: "https://assets.example/gmail.svg", status: "started" },
      { id: "batch-call:1", toolSlug: "NOTION_SEARCH", actionLabel: "Search pages", toolkitName: "Notion", status: "started" },
    ],
  });
  const completed = activity("batch-finish", "completed", 2, {
    callId: "batch-call",
    summary: "Batch response returned",
    batchActions: [
      { id: "batch-call:0", toolSlug: "GMAIL_SEARCH_EMAILS", actionLabel: "Search messages", toolkitName: "Gmail", toolkitLogo: "https://assets.example/gmail.svg", status: "completed", summary: "Provider confirmed this action" },
      { id: "batch-call:1", toolSlug: "NOTION_SEARCH", actionLabel: "Search pages", toolkitName: "Notion", status: "unknown", summary: "Individual outcome unavailable" },
    ],
  });
  const restored = coalesceToolActivities([started, completed]);
  assert.equal(restored.length, 1);
  assert.equal(restored[0]?.actionLabel, "Carrying out 2 independent actions in parallel");
  assert.deepEqual(restored[0]?.batchActions?.map(({ toolkitName, status }) => ({ toolkitName, status })), [
    { toolkitName: "Gmail", status: "completed" },
    { toolkitName: "Notion", status: "unknown" },
  ]);
});

test("chat presentation hides successful discovery plumbing and shows batch actions as branded rows", () => {
  const visible = presentToolActivities(coalesceToolActivities([
    activity("skill-start", "started", 0, { toolSlug: "CHUCK_SEARCH_SKILLS", message: "Reviewing the relevant guidance…" }),
    activity("skill-done", "completed", 0.5, { toolSlug: "CHUCK_SEARCH_SKILLS", message: "Reviewing the relevant guidance…" }),
    activity("search-start", "started", 1),
    activity("search-done", "completed", 2),
    activity("schema-start", "started", 3, { toolSlug: "COMPOSIO_GET_TOOL_SCHEMAS", message: "Checking the action schema…" }),
    activity("schema-done", "completed", 4, { toolSlug: "COMPOSIO_GET_TOOL_SCHEMAS", message: "Checking the action schema…" }),
    activity("batch-start", "started", 5, {
      callId: "batch-call",
      toolSlug: "COMPOSIO_MULTI_EXECUTE_TOOL",
      batchActions: [
        { id: "batch-call:0", toolSlug: "GOOGLECALENDAR_EVENTS_LIST", actionLabel: "Finding tomorrow’s interview schedule", toolkitSlug: "googlecalendar", toolkitName: "Google Calendar", toolkitLogo: "https://assets.example/calendar.svg", status: "started" },
        { id: "batch-call:1", toolSlug: "NOTION_CREATE_PAGE", actionLabel: "Saving the prep notes", toolkitSlug: "notion", toolkitName: "Notion", toolkitLogo: "https://assets.example/notion.svg", status: "started" },
      ],
    }),
    activity("batch-done", "completed", 8, {
      callId: "batch-call",
      toolSlug: "COMPOSIO_MULTI_EXECUTE_TOOL",
      durationMs: 3000,
      batchActions: [
        { id: "batch-call:0", toolSlug: "GOOGLECALENDAR_EVENTS_LIST", actionLabel: "Finding tomorrow’s interview schedule", toolkitSlug: "googlecalendar", toolkitName: "Google Calendar", toolkitLogo: "https://assets.example/calendar.svg", status: "completed", summary: "Result returned" },
        { id: "batch-call:1", toolSlug: "NOTION_CREATE_PAGE", actionLabel: "Saving the prep notes", toolkitSlug: "notion", toolkitName: "Notion", toolkitLogo: "https://assets.example/notion.svg", status: "started" },
      ],
    }),
  ]));

  assert.deepEqual(visible.map(({ actionLabel, toolkitName, toolkitLogo, status }) => ({ actionLabel, toolkitName, toolkitLogo, status })), [
    { actionLabel: "Finding tomorrow’s interview schedule", toolkitName: "Google Calendar", toolkitLogo: "https://assets.example/calendar.svg", status: "completed" },
    { actionLabel: "Saving the prep notes", toolkitName: "Notion", toolkitLogo: "https://assets.example/notion.svg", status: "started" },
  ]);
  assert.equal(visible[0]?.durationMs, undefined, "parallel batch duration must not be misattributed to an individual action");
});

test("failed discovery remains visible as a clear recovery state", () => {
  const visible = presentToolActivities([
    activity("search-failed", "failed", 1, { summary: "Connected app search failed" }),
  ]);
  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.actionLabel, "Couldn’t find the right connected capability");
  assert.equal(visible[0]?.status, "failed");
});

test("failed internal skill discovery remains visible", () => {
  const visible = presentToolActivities([
    activity("skill-failed", "failed", 1, { toolSlug: "CHUCK_SEARCH_SKILLS", message: "Reviewing relevant guidance failed" }),
  ]);
  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.status, "failed");
});

test("legacy activity records get a bounded connected-app catalogue candidate and compact action token", () => {
  const legacy = {
    ...activity("legacy", "completed", 1, { toolSlug: "GMAIL_FETCH_EMAILS" }),
    status: "completed" as const,
  };
  assert.equal(toolkitSlugForActivity(legacy), "gmail");
  assert.equal(actionTokenForActivity(legacy), "fetch_emails");
  assert.equal(actionTokenForActivity({ ...legacy, toolSlug: "GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS", toolkitSlug: "googlecalendar" }), "events_list_all_calendars");
});

test("compact rows omit mechanical result summaries but preserve a short safe detail", () => {
  assert.equal(activityDetailSummary("Batch response received; individual outcome was not identified"), undefined);
  assert.equal(activityDetailSummary("Result returned"), undefined);
  assert.equal(activityDetailSummary("Jane Doe · warm HM note"), "Jane Doe · warm HM note");
});

test("chat activity presentation replaces generic filler with the concrete provider action", () => {
  const current = {
    ...activity("gmail-start", "started", 1, {
      toolSlug: "GMAIL_FETCH_EMAILS",
      toolkitSlug: "gmail",
      toolkitName: "Gmail",
      actionLabel: "I'm taking care of that...",
      message: "I'm taking care of that...",
    }),
  };

  assert.equal(activityTitle(current), "Gmail · Fetch Emails");
  assert.equal(activityDetailLine(current, true), "Running now");
  assert.equal(activityStatusLabel(current, true), "Running");
});

test("chat activity presentation prefers a meaningful message over generic action filler", () => {
  const completed = activity("calendar-done", "completed", 1, {
    toolSlug: "GOOGLECALENDAR_EVENTS_LIST",
    toolkitName: "Google Calendar",
    actionLabel: "I'm taking care of that...",
    message: "Checking tomorrow's interview schedule",
    summary: "Found 3 matching events",
    durationMs: 1200,
  });

  assert.equal(activityTitle(completed), "Google Calendar · Checking tomorrow's interview schedule");
  assert.equal(activityDetailLine(completed), "Found 3 matching events");
  assert.equal(activityStatusLabel(completed), "Done · 1.2 s");
});

test("chat output removes only exact generic progress filler", () => {
  assert.equal(
    stripGenericProgressText("Working…\n\nI’m taking care of that…\n\nGoogle Maps · Search Businesses"),
    "Google Maps · Search Businesses",
  );
  assert.equal(stripGenericProgressText("I’m taking care of that for your customers."), "I’m taking care of that for your customers.");
  assert.equal(stripGenericProgressText("🧠 I’m understanding what you need…\n🧭 I’m finding the relevant tools…\n📝 I’m checking your notes…"), "");
  assert.equal(stripGenericProgressText("Pulling everything together…"), "");
});

test("run status updates remain chronological and append instead of replacing prior notes", () => {
  const restored = presentRunStatusUpdates([
    { id: "status-2", type: "run.status", at: 20, text: "Checking the connected calendar." },
    { id: "status-generic", type: "run.status", at: 21, text: "Working…" },
    { id: "status-3", type: "run.status", at: 30, text: "Checking the connected calendar." },
    { id: "status-4", type: "run.status", at: 40, text: "I found the requested time." },
  ]);
  assert.deepEqual(restored.map(({ id, text }) => ({ id, text })), [
    { id: "status-2", text: "Checking the connected calendar." },
    { id: "status-4", text: "I found the requested time." },
  ]);
  const merged = upsertRunStatusUpdate(restored, { id: "status-5", at: 50, text: "The calendar is ready." });
  assert.deepEqual(merged.map(({ id }) => id), ["status-2", "status-4", "status-5"]);
  assert.equal(upsertRunStatusUpdate(merged, { id: "status-5", at: 50, text: "The calendar is ready." }), merged);
});

test("run timeline keeps narrative and tool groups interleaved", () => {
  const timeline = presentRunTimeline([
    { id: "status-1", type: "run.status", at: 10, text: "I found the relevant files." },
    { id: "tool-1-start", type: "run.tool_activity", at: 20, toolSlug: "CHUCK_EDIT_FILES", status: "started", message: "Editing the selected files…", callId: "call-1" },
    { id: "tool-1-done", type: "run.tool_activity", at: 30, toolSlug: "CHUCK_EDIT_FILES", status: "completed", message: "Editing the selected files…", callId: "call-1", summary: "Edited 3 files" },
    { id: "tool-2-start", type: "run.tool_activity", at: 40, toolSlug: "CHUCK_RUN_TESTS", status: "started", message: "Running the focused tests…", callId: "call-2" },
    { id: "tool-2-done", type: "run.tool_activity", at: 50, toolSlug: "CHUCK_RUN_TESTS", status: "completed", message: "Running the focused tests…", callId: "call-2", summary: "234 tests passed" },
    { id: "status-2", type: "run.status", at: 60, text: "The verification passed." },
    { id: "tool-3-start", type: "run.tool_activity", at: 70, toolSlug: "CHUCK_SEARCH_FILES", status: "started", message: "Searching the repository…", callId: "call-3" },
    { id: "tool-3-done", type: "run.tool_activity", at: 80, toolSlug: "CHUCK_SEARCH_FILES", status: "completed", message: "Searching the repository…", callId: "call-3", summary: "1 search returned" },
  ]);

  assert.deepEqual(timeline.map((entry) => entry.kind), ["status", "tools", "status", "tools"]);
  assert.equal(timeline[0]?.kind === "status" ? timeline[0].text : "", "I found the relevant files.");
  assert.equal(timeline[1]?.kind === "tools" ? timeline[1].activities.length : 0, 2);
  assert.equal(timeline[2]?.kind === "status" ? timeline[2].text : "", "The verification passed.");
  assert.equal(timeline[3]?.kind === "tools" ? timeline[3].activities[0]?.summary : "", "1 search returned");
});

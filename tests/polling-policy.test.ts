import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_RUN_RECOVERY_INTERVAL_MS, DASHBOARD_IDLE_TIMEOUT_MS, DASHBOARD_REFRESH_INTERVAL_MS, shouldPollDashboard } from "../lib/polling-policy";

test("dashboard refreshes use a bounded background cadence", () => {
  assert.equal(DASHBOARD_REFRESH_INTERVAL_MS, 60_000);
  assert.ok(DASHBOARD_REFRESH_INTERVAL_MS >= 30_000);
});

test("dashboard polling pauses when hidden or unattended", () => {
  const now = 1_000_000;
  assert.equal(shouldPollDashboard({ visibilityState: "visible", lastActivityAt: now - 1, now }), true);
  assert.equal(shouldPollDashboard({ visibilityState: "hidden", lastActivityAt: now - 1, now }), false);
  assert.equal(shouldPollDashboard({ visibilityState: "visible", lastActivityAt: now - DASHBOARD_IDLE_TIMEOUT_MS, now }), false);
});

test("run recovery is bounded while remaining faster than dashboard refresh", () => {
  assert.equal(ACTIVE_RUN_RECOVERY_INTERVAL_MS, 5_000);
  assert.ok(ACTIVE_RUN_RECOVERY_INTERVAL_MS >= 5_000);
  assert.ok(ACTIVE_RUN_RECOVERY_INTERVAL_MS < DASHBOARD_REFRESH_INTERVAL_MS);
});

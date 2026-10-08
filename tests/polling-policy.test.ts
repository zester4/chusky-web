import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_RUN_RECOVERY_INTERVAL_MS, DASHBOARD_REFRESH_INTERVAL_MS } from "../lib/polling-policy";

test("dashboard refreshes use a bounded background cadence", () => {
  assert.equal(DASHBOARD_REFRESH_INTERVAL_MS, 30_000);
  assert.ok(DASHBOARD_REFRESH_INTERVAL_MS >= 30_000);
});

test("run recovery is bounded while remaining faster than dashboard refresh", () => {
  assert.equal(ACTIVE_RUN_RECOVERY_INTERVAL_MS, 5_000);
  assert.ok(ACTIVE_RUN_RECOVERY_INTERVAL_MS >= 5_000);
  assert.ok(ACTIVE_RUN_RECOVERY_INTERVAL_MS < DASHBOARD_REFRESH_INTERVAL_MS);
});

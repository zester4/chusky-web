import test from "node:test";
import assert from "node:assert/strict";
import { INTERNAL_SESSION_RECOVERY_MESSAGE, safeRunFailure, safeUserFacingError } from "../lib/error-copy";

test("redacts durable session internals from user-facing errors", () => {
  const error = new Error("Durable session domain has overlapping concurrent changes: sdk.sdkThreads.");
  assert.equal(safeUserFacingError(error, INTERNAL_SESSION_RECOVERY_MESSAGE), INTERNAL_SESSION_RECOVERY_MESSAGE);
  assert.deepEqual(safeRunFailure({ code: "agent_error", message: error.message }), {
    code: "agent_error",
    message: INTERNAL_SESSION_RECOVERY_MESSAGE,
  });
});

test("preserves actionable provider errors that are safe to show", () => {
  const message = "The selected model is rate limited. Try another model.";
  assert.equal(safeUserFacingError(new Error(message), "fallback"), message);
  assert.deepEqual(safeRunFailure({ code: "provider_rate_limited", message }), { code: "provider_rate_limited", message });
});

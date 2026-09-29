import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types test runner needs the explicit extension.
import { defaultOnboardingProfile, parseOnboardingProfile, safeOnboardingError, serializeOnboardingProfile } from "../lib/onboarding.ts";

test("onboarding profile parsing keeps only supported bounded choices", () => {
  const parsed = parseOnboardingProfile(JSON.stringify({
    accountType: "business",
    name: "  Morgan\u0000 Lee  ",
    goals: ["research", "invented_goal", 4],
    workstreams: ["planning", "invented_stream"],
    tone: "not-a-tone",
    autonomy: "bounded",
  }));

  assert.equal(parsed?.name, "Morgan Lee");
  assert.deepEqual(parsed?.goals, ["research"]);
  assert.deepEqual(parsed?.workstreams, ["planning"]);
  assert.equal(parsed?.tone, "professional");
  assert.equal(parsed?.autonomy, "bounded");
});

test("onboarding serialization removes control characters and bounds free text", () => {
  const profile = { ...defaultOnboardingProfile(), name: "A\u0000B", firstOutcome: "x".repeat(3000), credential: "must not persist" };
  const parsed = JSON.parse(serializeOnboardingProfile(profile)) as { name: string; firstOutcome: string; credential?: string };

  assert.equal(parsed.name, "AB");
  assert.equal(parsed.firstOutcome.length, 2400);
  assert.equal(parsed.credential, undefined);
});

test("onboarding errors are safe and actionable", () => {
  assert.equal(safeOnboardingError(new Error("fetch failed: private provider payload"), "fallback"), "Chusky could not reach your account. Check your connection and try again.");
  assert.equal(safeOnboardingError(new Error("validation failed for secret_token"), "fallback"), "fallback");
});

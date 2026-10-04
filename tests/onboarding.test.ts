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

test("onboarding preserves reviewed public-site context and excludes unknown fields", () => {
  const profile = {
    ...defaultOnboardingProfile(),
    accountType: "business" as const,
    teamSize: "11–50",
    websiteUrl: "https://example.com",
    websiteSummary: "What the organization appears to do: a bounded public brief.",
    websiteSummaryUrl: "https://example.com/",
    websiteSummaryUpdatedAt: "2026-09-29T12:00:00.000Z",
    hiddenToken: "must not persist",
  };
  const serialized = JSON.parse(serializeOnboardingProfile(profile)) as Record<string, unknown>;
  const parsed = parseOnboardingProfile(JSON.stringify(serialized));

  assert.equal(serialized.teamSize, "11–50");
  assert.equal(serialized.websiteSummary, profile.websiteSummary);
  assert.equal(serialized.hiddenToken, undefined);
  assert.equal(parsed?.websiteUrl, profile.websiteUrl);
  assert.equal(parsed?.websiteSummary, profile.websiteSummary);
});

test("onboarding errors are safe and actionable", () => {
  assert.equal(safeOnboardingError(new Error("fetch failed: private provider payload"), "fallback"), "Chusky could not reach your account. Check your connection and try again.");
  assert.equal(safeOnboardingError(new Error("validation failed for secret_token"), "fallback"), "fallback");
  assert.equal(safeOnboardingError(Object.assign(new Error("Durable session domain version conflict: profile"), { status: 400 }), "fallback"), "fallback");
  assert.equal(safeOnboardingError(Object.assign(new Error("Chusky returned HTTP 401"), { status: 401 }), "fallback"), "Your session may have expired. Refresh the page and sign in again.");
});

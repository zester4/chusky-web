export const ONBOARDING_MEMORY_KEY = "chusky_onboarding_profile";
export const ONBOARDING_VERSION = 1;
export const ONBOARDING_SKIP_STORAGE_PREFIX = "chusky_onboarding_skipped:";
export const ONBOARDING_DRAFT_STORAGE_PREFIX = "chusky_onboarding_draft:";
export const ONBOARDING_ACTIVATION_STORAGE_PREFIX = "chusky_onboarding_activation:";

export type OnboardingAccountType = "personal" | "business";
export type OnboardingTone = "concise" | "detailed" | "professional" | "warm";
export type OnboardingAutonomy = "ask" | "suggest" | "bounded";
export type OnboardingContextScope = "private" | "organization";

export type OnboardingProfile = {
  version: number;
  accountType: OnboardingAccountType;
  name: string;
  role: string;
  industry: string;
  timezone: string;
  workDescription: string;
  companyName: string;
  teamSize: string;
  businessGoal: string;
  websiteUrl: string;
  websiteSummary?: string;
  websiteSummaryUrl?: string;
  websiteSummaryUpdatedAt?: string;
  goals: string[];
  firstOutcome: string;
  tone: OnboardingTone;
  autonomy: OnboardingAutonomy;
  workstreams: string[];
  contextScope: OnboardingContextScope;
  completedAt?: string;
};

export const defaultOnboardingProfile = (name = ""): OnboardingProfile => ({
  version: ONBOARDING_VERSION,
  accountType: "personal",
  name,
  role: "",
  industry: "",
  timezone: "",
  workDescription: "",
  companyName: "",
  teamSize: "",
  businessGoal: "",
  websiteUrl: "",
  goals: [],
  firstOutcome: "",
  tone: "professional",
  autonomy: "ask",
  workstreams: ["research", "planning", "documents"],
  contextScope: "private",
});

const tones = new Set<OnboardingTone>(["concise", "detailed", "professional", "warm"]);
const autonomyModes = new Set<OnboardingAutonomy>(["ask", "suggest", "bounded"]);
const goals = new Set(["research", "communication", "planning", "documents", "meetings", "operations", "coding", "connected_apps"]);
const workstreams = new Set(["research", "communication", "planning", "documents", "meetings", "operations"]);

const cleanText = (value: unknown, maxLength: number) => typeof value === "string"
  ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength)
  : "";

const storageKey = (prefix: string, userId: string | undefined) => {
  const normalized = userId?.trim();
  return normalized ? `${prefix}${normalized}` : undefined;
};

const browserStorage = (kind: "local" | "session") => {
  if (typeof window === "undefined") return undefined;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
};

export function hasSkippedOnboarding(userId: string | undefined): boolean {
  const key = storageKey(ONBOARDING_SKIP_STORAGE_PREFIX, userId);
  if (!key) return false;
  try { return browserStorage("local")?.getItem(key) === "1"; } catch { return false; }
}

export function markOnboardingSkipped(userId: string | undefined): void {
  const key = storageKey(ONBOARDING_SKIP_STORAGE_PREFIX, userId);
  if (!key) return;
  try { browserStorage("local")?.setItem(key, "1"); } catch { /* A browser storage failure must not block navigation. */ }
}

export function clearOnboardingSkip(userId: string | undefined): void {
  const key = storageKey(ONBOARDING_SKIP_STORAGE_PREFIX, userId);
  if (!key) return;
  try { browserStorage("local")?.removeItem(key); } catch { /* Best effort cleanup. */ }
}

export function loadOnboardingDraft(userId: string | undefined): OnboardingProfile | undefined {
  const key = storageKey(ONBOARDING_DRAFT_STORAGE_PREFIX, userId);
  if (!key) return undefined;
  try {
    const value = browserStorage("session")?.getItem(key);
    return value ? parseOnboardingProfile(value) : undefined;
  } catch { return undefined; }
}

export function saveOnboardingDraft(userId: string | undefined, profile: OnboardingProfile): void {
  const key = storageKey(ONBOARDING_DRAFT_STORAGE_PREFIX, userId);
  if (!key) return;
  try { browserStorage("session")?.setItem(key, serializeOnboardingProfile(profile)); } catch { /* Draft persistence is an enhancement, not a blocking dependency. */ }
}

export function clearOnboardingDraft(userId: string | undefined): void {
  const key = storageKey(ONBOARDING_DRAFT_STORAGE_PREFIX, userId);
  if (!key) return;
  try { browserStorage("session")?.removeItem(key); } catch { /* Best effort cleanup. */ }
}

export function setOnboardingActivationDraft(userId: string | undefined, outcome: string): boolean {
  const key = storageKey(ONBOARDING_ACTIVATION_STORAGE_PREFIX, userId);
  if (!key) return false;
  try {
    browserStorage("session")?.setItem(key, cleanText(outcome, 2400));
    return true;
  } catch { return false; }
}

export function consumeOnboardingActivationDraft(userId: string | undefined): string | undefined {
  const key = storageKey(ONBOARDING_ACTIVATION_STORAGE_PREFIX, userId);
  if (!key) return undefined;
  try {
    const value = browserStorage("session")?.getItem(key) ?? undefined;
    browserStorage("session")?.removeItem(key);
    return value ? cleanText(value, 2400) : undefined;
  } catch { return undefined; }
}

export function safeOnboardingError(cause: unknown, fallback: string): string {
  const error = cause && typeof cause === "object" ? cause as { status?: unknown; message?: unknown; code?: unknown } : undefined;
  const status = typeof error?.status === "number" ? error.status : undefined;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (status === 401) return "Your session may have expired. Refresh the page and sign in again.";
  if (status === 429 || message.includes("rate limit")) return "Chusky is busy right now. Please wait a moment and try again.";
  if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) return "Chusky could not reach your account. Check your connection and try again.";
  return fallback;
}

export function parseOnboardingProfile(value: string): OnboardingProfile | undefined {
  try {
    const parsed = JSON.parse(value) as Partial<OnboardingProfile>;
    if (!parsed || typeof parsed !== "object" || (parsed.accountType !== "personal" && parsed.accountType !== "business")) return undefined;
    const fallback = defaultOnboardingProfile();
    return {
      version: typeof parsed.version === "number" && Number.isFinite(parsed.version) ? parsed.version : ONBOARDING_VERSION,
      accountType: parsed.accountType,
      name: cleanText(parsed.name, 120),
      role: cleanText(parsed.role, 160),
      industry: cleanText(parsed.industry, 180),
      timezone: cleanText(parsed.timezone, 100),
      workDescription: cleanText(parsed.workDescription, 2400),
      companyName: cleanText(parsed.companyName, 180),
      teamSize: cleanText(parsed.teamSize, 40),
      businessGoal: cleanText(parsed.businessGoal, 2400),
      websiteUrl: cleanText(parsed.websiteUrl, 2_000),
      ...(typeof parsed.websiteSummary === "string" ? { websiteSummary: cleanText(parsed.websiteSummary, 8_000) } : {}),
      ...(typeof parsed.websiteSummaryUrl === "string" ? { websiteSummaryUrl: cleanText(parsed.websiteSummaryUrl, 2_000) } : {}),
      ...(typeof parsed.websiteSummaryUpdatedAt === "string" ? { websiteSummaryUpdatedAt: cleanText(parsed.websiteSummaryUpdatedAt, 40) } : {}),
      goals: Array.isArray(parsed.goals) ? parsed.goals.filter((item): item is string => typeof item === "string" && goals.has(item)).slice(0, 8) : [],
      firstOutcome: cleanText(parsed.firstOutcome, 2400),
      tone: typeof parsed.tone === "string" && tones.has(parsed.tone as OnboardingTone) ? parsed.tone as OnboardingTone : fallback.tone,
      autonomy: typeof parsed.autonomy === "string" && autonomyModes.has(parsed.autonomy as OnboardingAutonomy) ? parsed.autonomy as OnboardingAutonomy : fallback.autonomy,
      workstreams: Array.isArray(parsed.workstreams) ? parsed.workstreams.filter((item): item is string => typeof item === "string" && workstreams.has(item)).slice(0, 8) : fallback.workstreams,
      contextScope: parsed.contextScope === "organization" ? "organization" : "private",
      ...(typeof parsed.completedAt === "string" ? { completedAt: cleanText(parsed.completedAt, 40) } : {}),
    };
  } catch {
    return undefined;
  }
}

export function serializeOnboardingProfile(profile: OnboardingProfile): string {
  return JSON.stringify({
    version: ONBOARDING_VERSION,
    accountType: profile.accountType,
    name: cleanText(profile.name, 120),
    role: cleanText(profile.role, 160),
    industry: cleanText(profile.industry, 180),
    timezone: cleanText(profile.timezone, 100),
    workDescription: cleanText(profile.workDescription, 2400),
    companyName: cleanText(profile.companyName, 180),
    teamSize: cleanText(profile.teamSize, 40),
    businessGoal: cleanText(profile.businessGoal, 2400),
    websiteUrl: cleanText(profile.websiteUrl, 2_000),
    ...(profile.websiteSummary ? { websiteSummary: cleanText(profile.websiteSummary, 8_000) } : {}),
    ...(profile.websiteSummaryUrl ? { websiteSummaryUrl: cleanText(profile.websiteSummaryUrl, 2_000) } : {}),
    ...(profile.websiteSummaryUpdatedAt ? { websiteSummaryUpdatedAt: cleanText(profile.websiteSummaryUpdatedAt, 40) } : {}),
    goals: profile.goals.filter((goal) => goals.has(goal)).slice(0, 8),
    firstOutcome: cleanText(profile.firstOutcome, 2400),
    tone: tones.has(profile.tone) ? profile.tone : "professional",
    autonomy: autonomyModes.has(profile.autonomy) ? profile.autonomy : "ask",
    workstreams: profile.workstreams.filter((workstream) => workstreams.has(workstream)).slice(0, 8),
    contextScope: profile.contextScope === "organization" ? "organization" : "private",
    ...(profile.completedAt ? { completedAt: cleanText(profile.completedAt, 40) } : {}),
  });
}

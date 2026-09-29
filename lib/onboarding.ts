export const ONBOARDING_MEMORY_KEY = "chusky_onboarding_profile";
export const ONBOARDING_VERSION = 1;

export type OnboardingAccountType = "personal" | "business";
export type OnboardingTone = "concise" | "detailed" | "professional" | "warm";
export type OnboardingAutonomy = "ask" | "suggest" | "bounded";

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
  goals: string[];
  firstOutcome: string;
  tone: OnboardingTone;
  autonomy: OnboardingAutonomy;
  workstreams: string[];
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
  goals: [],
  firstOutcome: "",
  tone: "professional",
  autonomy: "ask",
  workstreams: ["research", "planning", "documents"],
});

const tones = new Set<OnboardingTone>(["concise", "detailed", "professional", "warm"]);
const autonomyModes = new Set<OnboardingAutonomy>(["ask", "suggest", "bounded"]);

export function parseOnboardingProfile(value: string): OnboardingProfile | undefined {
  try {
    const parsed = JSON.parse(value) as Partial<OnboardingProfile>;
    if (!parsed || typeof parsed !== "object" || (parsed.accountType !== "personal" && parsed.accountType !== "business")) return undefined;
    const fallback = defaultOnboardingProfile();
    return {
      ...fallback,
      ...parsed,
      version: typeof parsed.version === "number" ? parsed.version : ONBOARDING_VERSION,
      name: typeof parsed.name === "string" ? parsed.name : "",
      role: typeof parsed.role === "string" ? parsed.role : "",
      industry: typeof parsed.industry === "string" ? parsed.industry : "",
      timezone: typeof parsed.timezone === "string" ? parsed.timezone : "",
      workDescription: typeof parsed.workDescription === "string" ? parsed.workDescription : "",
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "",
      teamSize: typeof parsed.teamSize === "string" ? parsed.teamSize : "",
      businessGoal: typeof parsed.businessGoal === "string" ? parsed.businessGoal : "",
      goals: Array.isArray(parsed.goals) ? parsed.goals.filter((item): item is string => typeof item === "string").slice(0, 8) : [],
      firstOutcome: typeof parsed.firstOutcome === "string" ? parsed.firstOutcome : "",
      tone: typeof parsed.tone === "string" && tones.has(parsed.tone as OnboardingTone) ? parsed.tone as OnboardingTone : fallback.tone,
      autonomy: typeof parsed.autonomy === "string" && autonomyModes.has(parsed.autonomy as OnboardingAutonomy) ? parsed.autonomy as OnboardingAutonomy : fallback.autonomy,
      workstreams: Array.isArray(parsed.workstreams) ? parsed.workstreams.filter((item): item is string => typeof item === "string").slice(0, 8) : fallback.workstreams,
      ...(typeof parsed.completedAt === "string" ? { completedAt: parsed.completedAt } : {}),
    };
  } catch {
    return undefined;
  }
}

export function serializeOnboardingProfile(profile: OnboardingProfile): string {
  return JSON.stringify({
    ...profile,
    version: ONBOARDING_VERSION,
    name: profile.name.trim().slice(0, 120),
    role: profile.role.trim().slice(0, 160),
    industry: profile.industry.trim().slice(0, 180),
    timezone: profile.timezone.trim().slice(0, 100),
    workDescription: profile.workDescription.trim().slice(0, 2400),
    companyName: profile.companyName.trim().slice(0, 180),
    businessGoal: profile.businessGoal.trim().slice(0, 2400),
    goals: profile.goals.slice(0, 8),
    firstOutcome: profile.firstOutcome.trim().slice(0, 2400),
    workstreams: profile.workstreams.slice(0, 8),
  });
}

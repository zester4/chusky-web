import type { Metadata } from "next";
import { OnboardingPage } from "@/components/app/onboarding-page";

export const metadata: Metadata = {
  title: "Set up your agent | Chusky",
  description: "Give Chusky the context it needs to work well with you.",
};

export default function OnboardingRoute() {
  return <OnboardingPage />;
}

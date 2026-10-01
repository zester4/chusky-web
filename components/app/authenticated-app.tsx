"use client";

import { useEffect } from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { chuskyApi } from "@/lib/chusky-api";
import { ONBOARDING_MEMORY_KEY, clearOnboardingSkip, hasSkippedOnboarding } from "@/lib/onboarding";

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [isPending, pathname, router, session]);

  useEffect(() => {
    if (isPending || !session) return;
    if (pathname === "/app/onboarding") {
      setOnboardingChecked(true);
      return;
    }
    if (hasSkippedOnboarding(session.user.id)) {
      setOnboardingChecked(true);
      return;
    }
    let active = true;
    setOnboardingChecked(false);
    void chuskyApi.memory.getByKey(ONBOARDING_MEMORY_KEY).then((result) => {
      if (!active) return;
      if (!result.data.some((item) => item.key === ONBOARDING_MEMORY_KEY)) {
        router.replace(`/app/onboarding?returnTo=${encodeURIComponent(pathname || "/app")}`);
        return;
      }
      clearOnboardingSkip(session.user.id);
      setOnboardingChecked(true);
    }).catch(() => {
      // A profile check must never turn a valid authenticated session into a lockout.
      if (active) setOnboardingChecked(true);
    });
    return () => { active = false; };
  }, [isPending, pathname, router, session]);

  if (isPending || !session || (!onboardingChecked && pathname !== "/app/onboarding")) return <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Checking your workspace"><div className="chusky-loading-mark"><img src="/brand/chusky-logo.png" alt="Chusky" className="chusky-loading-logo object-contain" /></div></div>;
  return <>{children}</>;
}

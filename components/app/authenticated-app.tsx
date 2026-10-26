"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { chuskyApi } from "@/lib/chusky-api";
import { ONBOARDING_MEMORY_KEY, clearOnboardingSkip, hasSkippedOnboarding } from "@/lib/onboarding";

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [isPending, pathname, router, session]);

  const userId = session?.user?.id;

  useEffect(() => {
    if (isPending || !userId) return;
    if (pathname === "/app/onboarding") {
      checkedUserIdRef.current = userId;
      setOnboardingChecked(true);
      return;
    }
    if (hasSkippedOnboarding(userId)) {
      checkedUserIdRef.current = userId;
      setOnboardingChecked(true);
      return;
    }
    // Prevent unmounting children on tab switches / session revalidations:
    // Once verified for this active user session, do not reset or unmount children.
    if (checkedUserIdRef.current === userId) {
      return;
    }

    let active = true;
    void chuskyApi.memory.getByKey(ONBOARDING_MEMORY_KEY).then((result) => {
      if (!active) return;
      if (!result.data.some((item) => item.key === ONBOARDING_MEMORY_KEY)) {
        router.replace(`/app/onboarding?returnTo=${encodeURIComponent(pathname || "/app")}`);
        return;
      }
      clearOnboardingSkip(userId);
      checkedUserIdRef.current = userId;
      setOnboardingChecked(true);
    }).catch(() => {
      // A profile check must never turn a valid authenticated session into a lockout.
      if (active) {
        checkedUserIdRef.current = userId;
        setOnboardingChecked(true);
      }
    });
    return () => { active = false; };
  }, [isPending, pathname, router, userId]);

  if (isPending || !session || (!onboardingChecked && pathname !== "/app/onboarding")) return <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Checking your workspace"><div className="chusky-loading-mark"><img src="/brand/chusky-logo.png" alt="Chusky" className="chusky-loading-logo object-contain" /></div></div>;
  return <>{children}</>;
}

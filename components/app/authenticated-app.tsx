"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [isPending, pathname, router, session]);

  if (isPending || !session) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking your session…</div>;
  return <>{children}</>;
}

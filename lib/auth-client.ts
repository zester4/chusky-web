import { createAuthClient } from "better-auth/react";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";

// Use the frontend origin in the browser. Next.js proxies auth requests to
// Chusky, keeping sessions first-party for both Vercel preview domains and
// the production custom domain.
const authBaseURL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_AUTH_URL || (process.env.NODE_ENV === "production" ? "https://chusky.up.railway.app" : "http://localhost:8080")).replace(/\/+$/, "")
  : window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [organizationClient({ teams: { enabled: true } }), twoFactorClient({
    onTwoFactorRedirect() {
      const callback = new URLSearchParams(window.location.search).get("callbackURL") || "/app";
      const safe = callback.startsWith("/") && !callback.startsWith("//") && !callback.includes("\\") ? callback : "/app";
      window.location.assign(`/two-factor?callbackURL=${encodeURIComponent(safe)}`);
    },
  })],
  fetchOptions: { credentials: "include" },
});

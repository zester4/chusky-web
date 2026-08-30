import { createAuthClient } from "better-auth/react";

// Use the frontend origin in the browser. Next.js proxies auth requests to
// Chusky, keeping sessions first-party for both Vercel preview domains and
// the production custom domain.
const authBaseURL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080").replace(/\/+$/, "")
  : window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: { credentials: "include" },
});

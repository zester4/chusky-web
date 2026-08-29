import { createAuthClient } from "better-auth/react";

const authBaseURL = (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080").replace(/\/+$/, "");

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: { credentials: "include" },
});

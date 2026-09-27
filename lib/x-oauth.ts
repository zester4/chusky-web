import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const X_OAUTH_SCOPES = ["users.read", "dm.read", "dm.write", "media.write", "tweet.write", "offline.access"] as const;
export const X_OAUTH_COOKIE = "chusky_x_oauth";
export const X_OAUTH_TTL_SECONDS = 10 * 60;

const MAX_TOKEN_RESPONSE_BYTES = 64 * 1024;

export type XOAuthConfig = { clientId: string; clientSecret?: string; redirectUri: string };
export type XOAuthFlow = { state: string; verifier: string; redirectUri: string; createdAt: number };
export type XTokenResponse = { access_token: string; refresh_token: string; token_type?: string; expires_in?: number; scope?: string };

export function xOAuthConfig(request: Request): XOAuthConfig {
  const clientId = process.env.X_CLIENT_ID?.trim() ?? "";
  if (!clientId || clientId.length > 256) throw new Error("X_CLIENT_ID is not configured for the dashboard");
  const requestUrl = new URL(request.url);
  const configuredRedirect = process.env.X_OAUTH_REDIRECT_URI?.trim();
  const redirectUri = configuredRedirect || new URL("/api/x/oauth/callback", requestUrl.origin).toString();
  let parsedRedirect: URL;
  try { parsedRedirect = new URL(redirectUri); } catch { throw new Error("X_OAUTH_REDIRECT_URI must be an absolute URL"); }
  if (parsedRedirect.username || parsedRedirect.password || parsedRedirect.search || parsedRedirect.hash) throw new Error("X_OAUTH_REDIRECT_URI must not contain credentials, query parameters, or a fragment");
  if (process.env.NODE_ENV === "production" && parsedRedirect.protocol !== "https:") throw new Error("X_OAUTH_REDIRECT_URI must use HTTPS in production");
  const clientSecret = process.env.X_CLIENT_SECRET?.trim() || undefined;
  return { clientId, ...(clientSecret ? { clientSecret } : {}), redirectUri: parsedRedirect.toString() };
}

export function createXOAuthFlow(redirectUri: string): XOAuthFlow & { challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state: randomBytes(32).toString("base64url"), verifier, challenge, redirectUri, createdAt: Date.now() };
}

export function encodeXOAuthFlow(flow: XOAuthFlow): string { return Buffer.from(JSON.stringify(flow), "utf8").toString("base64url"); }

export function decodeXOAuthFlow(value: string | undefined): XOAuthFlow | undefined {
  if (!value || value.length > 2048) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<XOAuthFlow>;
    if (typeof parsed.state !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(parsed.state)) return undefined;
    if (typeof parsed.verifier !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(parsed.verifier)) return undefined;
    if (typeof parsed.redirectUri !== "string" || parsed.redirectUri.length > 2048) return undefined;
    if (typeof parsed.createdAt !== "number" || !Number.isFinite(parsed.createdAt) || Date.now() - parsed.createdAt > X_OAUTH_TTL_SECONDS * 1000) return undefined;
    return { state: parsed.state, verifier: parsed.verifier, redirectUri: parsed.redirectUri, createdAt: parsed.createdAt };
  } catch { return undefined; }
}

export function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function xAuthorizationUrl(config: XOAuthConfig, flow: XOAuthFlow & { challenge: string }): URL {
  const url = new URL("https://x.com/i/oauth2/authorize");
  url.search = new URLSearchParams({ response_type: "code", client_id: config.clientId, redirect_uri: config.redirectUri, scope: X_OAUTH_SCOPES.join(" "), state: flow.state, code_challenge: flow.challenge, code_challenge_method: "S256" }).toString();
  return url;
}

export async function exchangeXAuthorizationCode(config: XOAuthConfig, code: string, verifier: string, fetchImpl: typeof fetch = fetch): Promise<XTokenResponse> {
  const headers: Record<string, string> = { accept: "application/json", "content-type": "application/x-www-form-urlencoded" };
  if (config.clientSecret) headers.authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`, "utf8").toString("base64")}`;
  const requestBody = new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: config.redirectUri, code_verifier: verifier });
  if (!config.clientSecret) requestBody.set("client_id", config.clientId);
  const response = await fetchImpl("https://api.x.com/2/oauth2/token", { method: "POST", headers, body: requestBody.toString(), cache: "no-store" });
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_TOKEN_RESPONSE_BYTES) throw new Error("X returned an oversized token response");
  const responseBody = await response.text();
  if (responseBody.length > MAX_TOKEN_RESPONSE_BYTES) throw new Error("X returned an oversized token response");
  let parsed: unknown;
  try { parsed = JSON.parse(responseBody); } catch { throw new Error("X returned an invalid token response"); }
  if (!response.ok) {
    const error = parsed && typeof parsed === "object" && typeof (parsed as Record<string, unknown>).error === "string" ? (parsed as Record<string, string>).error : "token_exchange_failed";
    throw new Error(`X authorization failed (${error})`);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("X returned an invalid token response");
  const token = parsed as Record<string, unknown>;
  if (typeof token.access_token !== "string" || !token.access_token || typeof token.refresh_token !== "string" || !token.refresh_token) throw new Error("X did not return a refresh token; include offline.access and retry authorization");
  return { access_token: token.access_token, refresh_token: token.refresh_token, ...(typeof token.token_type === "string" ? { token_type: token.token_type } : {}), ...(typeof token.expires_in === "number" ? { expires_in: token.expires_in } : {}), ...(typeof token.scope === "string" ? { scope: token.scope } : {}) };
}

export function cookieValue(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${X_OAUTH_COOKIE}=`));
  if (!match) return undefined;
  try { return decodeURIComponent(match.slice(X_OAUTH_COOKIE.length + 1)); } catch { return undefined; }
}

export function oauthCookie(value: string, request: Request, maxAge = X_OAUTH_TTL_SECONDS): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${X_OAUTH_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/api/x/oauth; HttpOnly; SameSite=Lax${secure}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

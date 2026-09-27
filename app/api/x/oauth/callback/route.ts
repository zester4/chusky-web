import { NextResponse } from "next/server";
import { cookieValue, decodeXOAuthFlow, escapeHtml, exchangeXAuthorizationCode, oauthCookie, sameSecret, xOAuthConfig } from "@/lib/x-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, message: string, status = 200, refreshToken?: string, clearCookie?: string) {
  const tokenBlock = refreshToken
    ? `<label for="refresh-token" style="display:block;margin-top:1.5rem;color:#c4c4c4">X_REFRESH_TOKEN</label><textarea id="refresh-token" readonly rows="4" style="box-sizing:border-box;width:100%;margin-top:.5rem;padding:.75rem;border:1px solid #444;background:#171717;color:#f5f5f5;font:13px ui-monospace,monospace;resize:vertical">${escapeHtml(refreshToken)}</textarea><p style="font-size:.85rem;color:#fbbf24;line-height:1.5">Copy this value into Railway as <code>X_REFRESH_TOKEN</code>, then remove it from your clipboard. It is shown once and is not stored by this page.</p>`
    : "";
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} · Chusky</title></head><body style="margin:0;background:#0c0c0c;color:#f5f5f5;font:16px system-ui,sans-serif"><main style="max-width:36rem;margin:15vh auto;padding:2rem"><p style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:#a3a3a3">Chusky · X authorization</p><h1 style="font-size:1.8rem;font-weight:500">${escapeHtml(title)}</h1><p style="line-height:1.6;color:#c4c4c4">${escapeHtml(message)}</p>${tokenBlock}</main></body></html>`,
    { status, headers: { "Cache-Control": "no-store, max-age=0", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'", "Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", ...(clearCookie ? { "Set-Cookie": clearCookie } : {}) } },
  );
}

export async function GET(request: Request) {
  const clearCookie = oauthCookie("", request, 0);
  const url = new URL(request.url);
  if (url.searchParams.has("error")) return page("Authorization was not completed", "X declined or cancelled the authorization request. Start again and approve the requested permissions.", 400, undefined, clearCookie);

  const flow = decodeXOAuthFlow(cookieValue(request));
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  let config;
  try { config = xOAuthConfig(request); } catch { config = undefined; }
  if (!flow || !config || flow.redirectUri !== config.redirectUri || !code || !state || !sameSecret(flow.state, state)) return page("Authorization could not be verified", "The X authorization session expired or its state did not match. Start the connection again from Chusky.", 400, undefined, clearCookie);

  try {
    const token = await exchangeXAuthorizationCode(config, code, flow.verifier);
    return page("X authorization succeeded", "X returned a refresh token. Add it to the backend deployment alongside X_CLIENT_ID and X_ENCRYPTION_KEY, then enable the X channel. The access token is not displayed.", 200, token.refresh_token, clearCookie);
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("X did not return") ? error.message : "X could not complete the token exchange. Check the client ID, redirect URI, and requested scopes, then start again.";
    return page("Authorization failed", message, 502, undefined, clearCookie);
  }
}

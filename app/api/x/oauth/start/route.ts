import { NextResponse } from "next/server";
import { createXOAuthFlow, encodeXOAuthFlow, oauthCookie, xAuthorizationUrl, xOAuthConfig } from "@/lib/x-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const config = xOAuthConfig(request);
    const flow = createXOAuthFlow(config.redirectUri);
    const response = NextResponse.redirect(xAuthorizationUrl(config, flow));
    response.headers.set("Set-Cookie", oauthCookie(encodeXOAuthFlow(flow), request));
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch {
    return new NextResponse("X OAuth is not configured for this dashboard.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

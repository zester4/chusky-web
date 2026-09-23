import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, message: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Chusky</title></head><body style="margin:0;background:#0c0c0c;color:#f5f5f5;font:16px system-ui,sans-serif"><main style="max-width:36rem;margin:15vh auto;padding:2rem"><p style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:#a3a3a3">Chusky · X authorization</p><h1 style="font-size:1.8rem;font-weight:500">${title}</h1><p style="line-height:1.6;color:#c4c4c4">${message}</p></main></body></html>`,
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

/**
 * X OAuth redirect target.
 *
 * Authorization codes and tokens are intentionally never rendered, logged, or
 * forwarded by the browser. The bot access token remains an operator-managed
 * deployment secret (`XCHAT_BOT_TOKEN`). This endpoint only gives X a real,
 * HTTPS callback target and provides a safe completion page for the operator.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");

  if (error) {
    return page(
      "Authorization was not completed",
      "X declined or cancelled the authorization request. Return to the X Developer Portal and try again with the bot account.",
      400,
    );
  }

  if (!url.searchParams.has("code")) {
    return page(
      "Authorization callback is ready",
      "This endpoint is configured for X OAuth redirects. Start authorization from the configured Chusky setup flow; do not open this URL directly.",
      400,
    );
  }

  return page(
    "Authorization received",
    "The X authorization response reached Chusky. Keep the resulting access token in the deployment secret store as XCHAT_BOT_TOKEN; it is never displayed in this browser response.",
  );
}

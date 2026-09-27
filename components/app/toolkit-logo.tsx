"use client";

import { useState } from "react";

/** Shared Composio branding used by Connected Apps and chat activity. */
export function ToolkitLogo({ name, logo, size = 40 }: { name: string; logo?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const isAppTile = size >= 32;
  const imageSize = isAppTile ? Math.round(size * 0.8) : size;
  return <span
    className={`flex shrink-0 items-center justify-center overflow-hidden ${isAppTile ? "rounded-lg bg-foreground/[0.04] text-sm font-medium" : "text-[10px] font-medium text-muted-foreground"}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    {logo && !failed
      ? <img src={logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: imageSize, height: imageSize }} className="object-contain" onError={() => setFailed(true)} />
      : <span>{name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

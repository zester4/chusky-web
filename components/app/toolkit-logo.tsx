"use client";

import { useEffect, useState } from "react";

/** Shared Composio branding used by Connected Apps and chat activity. */
export function ToolkitLogo({ name, logo, fallbackLogo, size = 40 }: { name: string; logo?: string; fallbackLogo?: string; size?: number }) {
  const [failedLogo, setFailedLogo] = useState<string>();
  useEffect(() => {
    setFailedLogo(undefined);
  }, [fallbackLogo, logo, name]);
  const isAppTile = size >= 32;
  const imageSize = isAppTile ? Math.round(size * 0.8) : size;
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const needsContrast = normalizedName === "composio";
  const primaryLogo = logo?.trim() || fallbackLogo?.trim();
  const localFallback = fallbackLogo?.trim() && fallbackLogo.trim() !== primaryLogo ? fallbackLogo.trim() : undefined;
  const activeLogo = primaryLogo === failedLogo ? localFallback : primaryLogo;
  return <span
    className={`flex shrink-0 items-center justify-center overflow-hidden ${isAppTile ? "rounded-lg bg-foreground/[0.04] text-sm font-medium" : "text-[10px] font-medium text-muted-foreground"} ${needsContrast ? "toolkit-logo-contrast" : ""}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    {activeLogo
      ? <img src={activeLogo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: imageSize, height: imageSize }} className="object-contain" onError={() => setFailedLogo(activeLogo)} />
      : <span>{name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export type LogoStackItem = { name: string; logo: string };

export function LogoStack({ items, label }: { items: LogoStackItem[]; label: string }) {
  return <span
    role="img"
    aria-label={`${label}: ${items.map((item) => item.name).join(", ")}`}
    className="flex shrink-0 items-center pl-1"
  >
    {items.map((item, index) => <span
      key={item.name}
      title={item.name}
      className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-background shadow-[0_1px_3px_rgb(0_0_0/0.12)] ${index ? "-ml-2" : ""}`}
    >
      <ToolkitLogo name={item.name} logo={item.logo} size={19} />
    </span>)}
  </span>;
}

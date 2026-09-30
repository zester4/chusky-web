"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-8 w-[7.25rem]", className)} aria-hidden="true" />;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-[10px] text-muted-foreground">Theme</span>
      <div className="inline-flex rounded-md border border-foreground/10 bg-foreground/[0.03] p-0.5" role="group" aria-label="Color theme">
        {themes.map(({ value, label, icon: Icon }) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-label={`${label} theme`}
              aria-pressed={selected}
              title={`${label} theme`}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-[0.3rem] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
                selected && "bg-background text-foreground shadow-sm",
              )}
            >
              <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

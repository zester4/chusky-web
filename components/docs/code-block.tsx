"use client";

import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="docs-code-block mt-8 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.035] text-sm text-foreground">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2"><FileCode2 size={13} /> example.ts</span>
        <button type="button" className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground" onClick={() => void copy()}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 leading-7"><code>{code}</code></pre>
    </div>
  );
}

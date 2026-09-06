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
    <div className="mt-8 overflow-hidden rounded-xl border border-foreground/15 bg-[#111] text-sm text-[#f7f7f4]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/50">
        <span className="flex items-center gap-2"><FileCode2 size={13} /> example.ts</span>
        <button type="button" className="flex items-center gap-1.5 text-white/60 hover:text-white" onClick={() => void copy()}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 leading-7"><code>{code}</code></pre>
    </div>
  );
}

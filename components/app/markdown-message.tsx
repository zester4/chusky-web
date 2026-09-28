"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import mermaid from "mermaid";
import type { Components } from "react-markdown";
import { Check, Copy } from "lucide-react";

type ChartDatum = Record<string, string | number>;
type ChartSpec = {
  type: "bar" | "line" | "area" | "pie";
  data: ChartDatum[];
  title?: string;
  xKey?: string;
  valueKey?: string;
  series?: string[];
};

const chartColors = ["#f6a400", "#0891b2", "#334155", "#16a34a", "#db2777"];
let mermaidReady = false;
const mermaidParser = mermaid as unknown as { parse: (text: string, options?: { suppressErrors?: boolean }) => Promise<unknown> };

function normalizeMermaidSource(source: string) {
  return source
    .trim()
    .replace(/^```(?:mermaid|flowchart)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function MermaidBlock({ source }: { source: string }) {
  const rawId = useId();
  const id = `chusky-mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const renderVersion = useRef(0);
  const normalizedSource = normalizeMermaidSource(source);

  useEffect(() => {
    const version = ++renderVersion.current;
    let active = true;
    setSvg("");
    setError("");
    if (!mermaidReady) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          fontFamily: "Instrument Sans, system-ui, sans-serif",
          primaryColor: "#fff7e6",
          primaryTextColor: "#1f2937",
          primaryBorderColor: "#f6a400",
          lineColor: "#64748b",
          secondaryColor: "#f1f5f9",
          tertiaryColor: "#ffffff",
        },
        suppressErrorRendering: true,
      });
      mermaidReady = true;
    }
    void (async () => {
      try {
        const parsed = await mermaidParser.parse(normalizedSource, { suppressErrors: true });
        if (!parsed) throw new Error("Invalid Mermaid syntax");
        const result = await mermaid.render(`${id}-${version}`, normalizedSource);
        if (!result.svg || /syntax error in text|mermaid version/i.test(result.svg)) throw new Error("Invalid Mermaid output");
        if (active && renderVersion.current === version) setSvg(result.svg);
      } catch {
        if (active && renderVersion.current === version) setError("This diagram could not be rendered. The original Mermaid source is available below.");
      }
    })();
    return () => { active = false; };
  }, [id, normalizedSource]);

  return <figure className="my-2 max-w-full overflow-hidden bg-transparent p-0">
    {svg ? <div className="max-w-full overflow-x-auto [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : error ? <div className="space-y-2"><figcaption className="text-[10px] text-amber-700">{error}</figcaption><details className="text-[10px] text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">View Mermaid source</summary><pre className="mt-1 max-w-full overflow-x-auto rounded border border-foreground/10 bg-foreground/[0.03] p-2 font-mono text-[9px] leading-4">{normalizedSource}</pre></details></div> : <figcaption className="flex items-center gap-2 text-[10px] text-muted-foreground">Rendering diagram…</figcaption>}
  </figure>;
}

function parseChart(source: string): ChartSpec | undefined {
  try {
    const value = JSON.parse(source) as Partial<ChartSpec>;
    if (!value || !Array.isArray(value.data) || !["bar", "line", "area", "pie"].includes(String(value.type))) return undefined;
    const data = value.data.filter((item): item is ChartDatum => Boolean(item) && typeof item === "object" && !Array.isArray(item));
    if (!data.length) return undefined;
    return { ...value, type: value.type as ChartSpec["type"], data };
  } catch {
    return undefined;
  }
}

function chartKeys(spec: ChartSpec) {
  const keys = spec.series?.length ? spec.series : Object.keys(spec.data[0] || {}).filter((key) => key !== (spec.xKey || "label") && typeof spec.data[0][key] === "number");
  return keys.length ? keys : [spec.valueKey || "value"];
}

function idSafe(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, "-"); }

function normalizeMarkdownContent(content: string) {
  return content
    // Accept the LaTeX delimiters commonly returned by models in addition to remark-math's dollar syntax.
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression: string) => `$$\n${expression.trim()}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression: string) => `$${expression.trim()}$`)
    // A price such as $500_{setup}+$750 is not an equation. Keep the labels and amounts as literal text.
    .replace(/(?<!\\)\$(\d[\d,]*(?:\.\d+)?)_\{([^}\n]+)\}\s*\+\s*\$?(\d[\d,]*(?:\.\d+)?)(?:\$)?/g, (_, setup: string, label: string, monthly: string) => `\\$${setup} ${label} + \\$${monthly}`)
    // Keep numeric prose with a TeX-looking subscript literal, e.g. $550M_{at 12.55B valuation}.
    // Real equations normally begin with a variable or command, not a currency-sized number.
    .replace(/(?<!\\)\$(\d[\d,]*(?:\.\d+)?\s*[A-Za-z%]+)_\{([^}\n]+)\}/g, (_, value: string, label: string) => `\\$${value} ${label}`)
    .replace(/(\\\$\d[\d,]*(?:\.\d+)?)_\{([^}\n]+)\}/g, "$1 $2")
    // Protect ordinary dollar amounts from being consumed as inline math while preserving $x$, $E=mc^2$, etc.
    .replace(/(?<!\\)\$(?=\s*(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?:\s*[KMBkmb%])?(?=\s*(?:[-–—/,.;:_)]|_\{|[A-Za-z]{1,4}\b|\||$)))/g, "\\$");
}

function DataChart({ source }: { source: string }) {
  const spec = parseChart(source);
  if (!spec) return <pre className="my-2 max-w-full overflow-x-auto rounded-md border border-amber-200 bg-amber-50 p-2.5 font-mono text-[10px] leading-4 text-amber-900">{source}</pre>;
  const xKey = spec.xKey || (spec.data[0].name !== undefined ? "name" : "label");
  const series = chartKeys(spec);
  const data = spec.data.map((item, index) => ({ ...item, [xKey]: item[xKey] ?? `Item ${index + 1}` }));
  const common = { data, margin: { top: 6, right: 8, left: -20, bottom: 0 } };
  return <figure className="my-2 max-w-full overflow-hidden bg-background p-0">
    {spec.title && <figcaption className="mb-1.5 text-[10px] font-medium text-foreground">{spec.title}</figcaption>}
    <div className="h-44 min-w-0 w-full sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        {spec.type === "pie" ? <PieChart><Tooltip contentStyle={{ borderRadius: 6, borderColor: "transparent", boxShadow: "none", fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Pie data={data} dataKey={spec.valueKey || series[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius="70%" paddingAngle={2}>{data.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}</Pie></PieChart>
          : spec.type === "bar" ? <BarChart {...common}><CartesianGrid vertical={false} stroke="#e5e7eb" /><XAxis dataKey={xKey} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: 6, borderColor: "transparent", boxShadow: "none", fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} />{series.map((key, index) => <Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} radius={[3, 3, 0, 0]} maxBarSize={28} />)}</BarChart>
          : spec.type === "area" ? <AreaChart {...common}><defs>{series.map((key, index) => <linearGradient key={key} id={`${idSafe(key)}-gradient`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.28} /><stop offset="95%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.02} /></linearGradient>)}</defs><CartesianGrid vertical={false} stroke="#e5e7eb" /><XAxis dataKey={xKey} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: 6, borderColor: "transparent", boxShadow: "none", fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} />{series.map((key, index) => <Area key={key} type="monotone" dataKey={key} stroke={chartColors[index % chartColors.length]} fill={`url(#${idSafe(key)}-gradient)`} strokeWidth={1.5} />)}</AreaChart>
          : <LineChart {...common}><CartesianGrid vertical={false} stroke="#e5e7eb" /><XAxis dataKey={xKey} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: 6, borderColor: "transparent", boxShadow: "none", fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} />{series.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={chartColors[index % chartColors.length]} strokeWidth={1.5} dot={{ r: 2 }} />)}</LineChart>}
      </ResponsiveContainer>
    </div>
  </figure>;
}

function formatCodeLanguage(className?: string) {
  return /language-([\w-]+)/.exec(className || "")?.[1]?.toLowerCase();
}

const codeLanguageNames: Record<string, string> = {
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  js: "JavaScript",
  javascript: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  md: "Markdown",
  markdown: "Markdown",
  py: "Python",
  python: "Python",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TSX",
  yaml: "YAML",
  yml: "YAML",
};

function codeLanguageLabel(language?: string) {
  if (!language) return "Code";
  return codeLanguageNames[language] || language.toUpperCase();
}

const codeTokenPattern = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:as|async|await|break|case|catch|class|const|continue|def|else|export|extends|false|for|from|function|if|import|in|interface|let|new|null|of|private|protected|public|return|static|this|throw|true|try|type|typeof|var|while|with|yield)\b|\b\d+(?:\.\d+)?\b)/g;

function highlightedCode(source: string, language: string) {
  return source.split(codeTokenPattern).map((token, index) => {
    if (!token) return null;
    const className = /^(\/\/|#|\/\*)/.test(token) ? "text-slate-400" : /^("|'|`)/.test(token) ? "text-emerald-300" : /^(?:true|false|null|\d)/.test(token) ? "text-amber-300" : /^(?:as|async|await|break|case|catch|class|const|continue|def|else|export|extends|for|from|function|if|import|in|interface|let|new|of|private|protected|public|return|static|this|throw|try|type|typeof|var|while|with|yield)$/.test(token) ? "text-violet-300" : "text-[#f5f3ee]";
    return <span key={`${language}-${index}`} className={className}>{token}</span>;
  });
}

const components: Components = {
  h1: ({ children, ...props }) => <h1 className="mt-3 text-sm font-semibold tracking-tight first:mt-0 sm:text-base" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="mt-3 text-[13px] font-semibold tracking-tight first:mt-0 sm:text-sm" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="mt-2.5 text-xs font-semibold" {...props}>{children}</h3>,
  p: ({ children, ...props }) => <p className="my-1.5 text-[12px] leading-[1.45rem] first:mt-0 last:mb-0 sm:text-[13px]" {...props}>{children}</p>,
  ul: ({ children, ...props }) => <ul className="my-1.5 list-disc space-y-0.5 pl-4 text-[12px] leading-[1.45rem] sm:text-[13px]" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-4 text-[12px] leading-[1.45rem] sm:text-[13px]" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="pl-0.5" {...props}>{children}</li>,
  blockquote: ({ children, ...props }) => <blockquote className="my-2 border-l-2 border-foreground/20 pl-2.5 text-[12px] italic leading-5 text-muted-foreground sm:text-[13px]" {...props}>{children}</blockquote>,
  a: ({ children, ...props }) => <a className="break-words underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground" target="_blank" rel="noreferrer" {...props}>{children}</a>,
  hr: (props) => <hr className="my-3 border-foreground/10" {...props} />,
  strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
  del: ({ children, ...props }) => <del className="text-muted-foreground" {...props}>{children}</del>,
  input: ({ type, ...props }) => <input type={type} className="mr-1.5 accent-foreground" {...props} />,
  img: ({ alt, ...props }) => <img alt={alt || ""} loading="lazy" className="my-2 max-h-72 max-w-full rounded-md object-contain" {...props} />,
  code: ({ children, className, ...props }) => {
    const rawSource = String(children);
    const source = rawSource.replace(/\n$/, "");
    const language = formatCodeLanguage(className);
    if (language === "mermaid" || language === "flowchart") return <MermaidBlock source={source} />;
    if (language === "chart" || language === "charts") return <DataChart source={source} />;
    if (language || rawSource.endsWith("\n")) return <CodeBlock source={source} language={language} />;
    return <code className={`rounded bg-foreground/[0.07] px-1 py-0.5 font-mono text-[0.88em] ${className || ""}`} {...props}>{children}</code>;
  },
  pre: ({ children, ...props }) => {
    const child = React.isValidElement(children) ? children : undefined;
    if (child && (child.type === MermaidBlock || child.type === DataChart || child.type === CodeBlock)) return child;
    return <pre className="my-2 max-w-full overflow-x-auto rounded-md border border-foreground/10 bg-foreground/[0.04] p-2.5 font-mono text-[10px] leading-4" {...props}>{children}</pre>;
  },
  table: ({ children, ...props }) => <div className="my-2 max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-foreground/10"><table className="min-w-[34rem] w-full border-collapse text-left text-[10px] leading-4 [font-variant-numeric:tabular-nums] sm:text-[11px]" {...props}>{children}</table></div>,
  thead: ({ children, ...props }) => <thead className="bg-foreground/[0.04]" {...props}>{children}</thead>,
  th: ({ children, ...props }) => <th className="whitespace-nowrap border-b border-foreground/10 px-2.5 py-1.5 font-medium" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="min-w-24 border-b border-foreground/10 px-2.5 py-2 align-top [overflow-wrap:break-word] [word-break:normal] last:border-0" {...props}>{children}</td>,
};

export function MarkdownMessage({ content }: { content: string }) {
  return <div className="min-w-0 break-words tabular-nums text-foreground [&_.katex-display]:my-2 [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1 [&_.katex]:text-[0.9em]">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>{normalizeMarkdownContent(content)}</ReactMarkdown>
  </div>;
}

function CodeBlock({ source, language }: { source: string; language?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyResetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyResetTimer.current), []);

  const copy = async () => {
    window.clearTimeout(copyResetTimer.current);
    try {
      await navigator.clipboard.writeText(source);
      setCopyState("copied");
      copyResetTimer.current = window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
      copyResetTimer.current = window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return <div className="my-2.5 w-full min-w-0 overflow-hidden rounded-lg bg-[#111318] text-[#f5f3ee] shadow-[0_1px_2px_rgb(0_0_0_/_0.14)]">
    <div className="flex min-h-8 items-center justify-between gap-3 border-b border-white/10 px-2.5 sm:px-3">
      <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-white/55">{codeLanguageLabel(language)}</span>
      <button type="button" onClick={() => void copy()} className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-1.5 font-sans text-[9px] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/70" aria-label={copyState === "copied" ? "Code copied" : copyState === "error" ? "Code could not be copied" : "Copy code to clipboard"}>
        {copyState === "copied" ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
        <span aria-live="polite">{copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}</span>
      </button>
    </div>
    <pre className="max-w-full overflow-x-auto overscroll-x-contain p-3 font-mono text-[10px] leading-[1.6] [tab-size:2] sm:p-3.5 sm:text-[11px]" tabIndex={0} aria-label={`${codeLanguageLabel(language)} code`}><code className="whitespace-pre">{highlightedCode(source, language || "text")}</code></pre>
  </div>;
}

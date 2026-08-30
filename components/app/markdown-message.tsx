import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const components: Components = {
  h1: ({ children, ...props }) => <h1 className="mt-4 text-base font-semibold first:mt-0 sm:text-lg" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="mt-4 text-sm font-semibold first:mt-0 sm:text-base" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="mt-3 text-xs font-semibold sm:text-sm" {...props}>{children}</h3>,
  p: ({ children, ...props }) => <p className="my-2 text-[13px] leading-6 first:mt-0 last:mb-0 sm:text-sm" {...props}>{children}</p>,
  ul: ({ children, ...props }) => <ul className="my-2 list-disc space-y-1 pl-5 text-[13px] leading-6 sm:text-sm" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-[13px] leading-6 sm:text-sm" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="pl-1" {...props}>{children}</li>,
  blockquote: ({ children, ...props }) => <blockquote className="my-3 border-l-2 border-foreground/20 pl-3 text-[13px] italic text-muted-foreground sm:text-sm" {...props}>{children}</blockquote>,
  a: ({ children, ...props }) => <a className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground" target="_blank" rel="noreferrer" {...props}>{children}</a>,
  hr: (props) => <hr className="my-4 border-foreground/10" {...props} />,
  strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
  code: ({ children, className, ...props }) => <code className={`rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[11px] ${className || ""}`} {...props}>{children}</code>,
  pre: ({ children, ...props }) => <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-foreground/10 bg-foreground/[0.04] p-3 font-mono text-[11px] leading-5" {...props}>{children}</pre>,
  table: ({ children, ...props }) => <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-foreground/10"><table className="min-w-full border-collapse text-left text-[11px] sm:text-xs" {...props}>{children}</table></div>,
  thead: ({ children, ...props }) => <thead className="bg-foreground/[0.04]" {...props}>{children}</thead>,
  th: ({ children, ...props }) => <th className="whitespace-nowrap border-b border-foreground/10 px-2.5 py-2 font-medium" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="min-w-28 border-b border-foreground/10 px-2.5 py-2 align-top last:border-0" {...props}>{children}</td>,
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="min-w-0 break-words text-foreground [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1 [&_.katex]:text-[0.95em]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

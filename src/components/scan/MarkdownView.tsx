import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * Renders the AI design prompt as nicely-styled Markdown without depending on
 * the Tailwind typography plugin — every element is mapped to project tokens.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-1 font-display text-xl font-bold text-ink">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-6 border-b border-line-soft pb-1.5 font-display text-[15px] font-semibold text-ink">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 font-display text-[13px] font-semibold text-accent-2">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 text-[13.5px] leading-relaxed text-ink-soft">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 text-[13.5px] text-ink-soft">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1 text-[13.5px] text-ink-soft">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed marker:text-ink-faint">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink-soft">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-accent/40 bg-white/[0.02] px-3 py-1 text-[13px] text-ink-dim">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = (className ?? "").includes("language-");
    if (isBlock) {
      return <code className="font-mono text-[12px] leading-relaxed text-ink-soft">{children}</code>;
    }
    return (
      <code className="rounded-[3px] border border-line-soft bg-white/[0.04] px-1 py-0.5 font-mono text-[12px] text-accent-2">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-auto rounded-md border border-line-soft bg-black/30 p-3">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-auto rounded-md border border-line-soft">
      <table className="w-full border-collapse text-left text-[12.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.03]">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-line-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-line-soft/60 px-3 py-1.5 text-ink-soft">{children}</td>,
  hr: () => <hr className="my-4 border-line-soft" />,
};

export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}

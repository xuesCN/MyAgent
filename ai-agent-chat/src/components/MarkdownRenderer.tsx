import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { cn } from "../utils/cn";
import { CodeBlock } from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  isUser = false,
  isStreaming = false,
}) => {
  const extractCodeText = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(extractCodeText).join("");
    if (React.isValidElement(value)) return extractCodeText((value as any).props?.children);
    if (typeof value === "object" && typeof (value as any).value === "string") {
      return (value as any).value;
    }
    return "";
  };

  const baseText = isUser ? "text-white" : "text-slate-100";
  const mutedText = isUser ? "text-cyan-100/85" : "text-slate-300";
  const borderColor = isUser ? "border-cyan-300/30" : "border-slate-600/70";
  const panelBg = isUser ? "bg-cyan-500/15" : "bg-slate-900/70";

  return (
    <div className={cn("text-sm leading-7", baseText, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 text-xl font-semibold leading-8">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-lg font-semibold leading-7">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-base font-semibold leading-7">{children}</h3>
          ),
          p: ({ children }) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-6 marker:text-cyan-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-6 marker:text-cyan-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "my-3 border-l-4 pl-3 italic",
                isUser ? "border-cyan-200/60 text-cyan-100" : "border-slate-500 text-slate-200",
              )}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              {children}
            </a>
          ),
          hr: () => <hr className={cn("my-4 border-t", borderColor)} />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-600/60">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className={cn("bg-slate-900/80", mutedText)}>{children}</thead>,
          th: ({ children }) => (
            <th className={cn("border-b border-slate-600/70 px-3 py-2 font-semibold", mutedText)}>
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-slate-700/70 px-3 py-2">{children}</td>,
          code: ({ inline, className: codeClassName, children, ...props }: any) => {
            const raw = extractCodeText(children).replace(/\n$/, "");
            const match = /language-(\w+)/.exec(codeClassName || "");
            const language = match?.[1];

            if (inline) {
              return (
                <code
                  {...props}
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[0.85em]",
                    borderColor,
                    panelBg,
                  )}
                >
                  {raw}
                </code>
              );
            }

            return (
              <CodeBlock
                code={raw}
                codeClassName={codeClassName}
                language={language}
                isUser={isUser}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {isStreaming && (
        <span className="ml-1 inline-block h-4 w-[2px] animate-pulse rounded bg-cyan-300 align-middle" />
      )}
    </div>
  );
};

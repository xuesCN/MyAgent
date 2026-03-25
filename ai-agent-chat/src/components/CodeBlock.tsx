import React, { useCallback, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../utils/cn";

interface CodeBlockProps {
  code: string;
  codeClassName?: string;
  language?: string;
  isUser?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  codeClassName,
  language,
  isUser = false,
}) => {
  const [copied, setCopied] = useState(false);

  const borderColor = isUser ? "border-cyan-300/30" : "border-slate-600/70";
  const panelBg = isUser ? "bg-cyan-500/15" : "bg-slate-900/70";
  const mutedText = isUser ? "text-cyan-100/85" : "text-slate-300";

  const displayLanguage = useMemo(() => language || "code", [language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("复制代码失败:", error);
    }
  }, [code]);

  return (
    <div className={cn("my-3 overflow-hidden rounded-lg border", borderColor)}>
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-1.5 text-xs uppercase tracking-wide",
          borderColor,
          mutedText,
        )}
      >
        <span>{displayLanguage}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 normal-case transition-colors",
            isUser
              ? "hover:bg-cyan-300/20 text-cyan-100"
              : "hover:bg-slate-700/60 text-slate-200",
          )}
          aria-label="copy-code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>

      <pre className={cn("overflow-x-auto p-3", panelBg)}>
        <code className={cn("font-mono text-[13px] leading-6", codeClassName)}>
          {code}
        </code>
      </pre>
    </div>
  );
};


import React from "react";
import { cn } from "../../../utils/cn";
import { Message } from "../../../types";
import { User, Bot, Loader2 } from "lucide-react";
import { formatMessageTime } from "../../../utils/messageFormatter";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { isSafeImageUrl, sanitizeUserUrl } from "../utils/markdownSecurity";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
}) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors sm:px-6",
        isUser && "flex-row-reverse",
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
          isUser
            ? "border-cyan-300/40 bg-gradient-to-br from-cyan-500 to-blue-500"
            : "border-violet-300/40 bg-gradient-to-br from-violet-500 to-indigo-500",
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div
        className={cn(
          "flex max-w-[84%] flex-col sm:max-w-[78%] lg:max-w-[72%]",
          isUser && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_8px_24px_rgba(6,182,212,0.25)]"
              : "border border-slate-700/80 bg-slate-800/85 text-slate-100",
          )}
        >
          <div className="leading-relaxed">
            {Array.isArray(message.content) ? (
              <div className="space-y-2">
                {message.content.map((item, index) => {
                  if (item.type === "text") {
                    return (
                      <MarkdownRenderer
                        key={index}
                        content={item.text}
                        isUser={isUser}
                      />
                    );
                  }

                  if (item.type === "image_url") {
                    const safeImageUrl = sanitizeUserUrl(item.image_url.url);

                    if (!isSafeImageUrl(safeImageUrl)) {
                      return (
                        <div
                          key={index}
                          className="my-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
                        >
                          图片链接已被安全策略拦截
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="my-1">
                        <img
                          src={safeImageUrl}
                          alt="用户上传"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="max-h-64 max-w-full rounded-lg border border-slate-600/70 object-contain"
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              <MarkdownRenderer
                content={message.content}
                isUser={isUser}
                isStreaming={message.sender === "ai" && !!message.isStreaming}
              />
            )}
          </div>

          {/* 加载指示器 */}
          {message.isStreaming && message.content === "" && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">AI正在思考...</span>
            </div>
          )}
        </div>

      {/* 时间戳 */}
      <div
        className={cn(
          "mt-1 px-1 text-xs",
          isUser ? "text-cyan-100/70" : "text-slate-500",
        )}
      >
        {formatMessageTime(message.timestamp)}
      </div>
    </div>
    </div>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent);

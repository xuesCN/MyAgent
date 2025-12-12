import React, { useState, useEffect } from "react";
import { cn } from "../utils/cn";
import { Message } from "../types";
import { TypingMessage } from "./TypingEffect";
import { User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  showTypingEffect?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastMessage = false,
  showTypingEffect = true,
}) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (
      message.sender === "ai" &&
      isLastMessage &&
      showTypingEffect &&
      message.isStreaming
    ) {
      setIsTyping(true);
    }
  }, [message.sender, isLastMessage, showTypingEffect, message.isStreaming]);

  const handleTypingComplete = () => {
    setIsTyping(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 hover:bg-gray-900/30 transition-colors",
        isUser && "flex-row-reverse"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-tech-blue" : "bg-tech-purple"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn("flex flex-col max-w-[70%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-tech-blue text-white"
              : "bg-tech-gray border border-gray-700"
          )}
        >
          {message.sender === "ai" && isTyping && message.isStreaming ? (
            <TypingMessage
              text={typeof message.content === "string" ? message.content : ""}
              speed={30}
              onComplete={handleTypingComplete}
              showCursor={true}
              className="text-sm leading-relaxed"
            />
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
              {/* 处理不同类型的消息内容 */}
              {Array.isArray(message.content) ? (
                <div>
                  {message.content.map((item, index) => {
                    if (item.type === "text") {
                      return (
                        <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
                          {item.text}
                        </ReactMarkdown>
                      );
                    } else if (item.type === "image_url") {
                      return (
                        <div key={index} className="text-gray-400 italic mt-1">
                          [图片已传入]
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* 加载指示器 */}
          {message.isStreaming && message.content === "" && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">AI正在思考...</span>
            </div>
          )}
        </div>

        {/* 时间戳 */}
        <div className="text-xs text-gray-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

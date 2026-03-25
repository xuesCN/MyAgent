import React, { useState } from "react";
import { cn } from "../utils/cn";
import { Send, Loader2 } from "lucide-react";
import { ImageUploadIndicator } from "./ImageUploadIndicator";
import { useImageUpload } from "../hooks/useImageUpload";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "输入消息...",
  className,
}) => {
  const [inputValue, setInputValue] = useState("");

  // 使用图片上传 Hook
  const { imageUrl, showImagePrompt, handlePaste, resetImage } =
    useImageUpload();

  // 使用文本框自动调整 Hook
  const textareaRef = useAutoResizeTextarea(inputValue);

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    if ((trimmedValue || imageUrl) && !isLoading) {
      // 将图片URL和文本一起发送
      onSendMessage(trimmedValue, imageUrl || undefined);

      // 重置状态
      setInputValue("");
      resetImage(); // 使用 Hook 的重置函数
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-2",
        className
      )}
    >
      {/* 图片提示 */}
      <ImageUploadIndicator visible={showImagePrompt} />

      {/* 输入区域和按钮容器 */}
      <div className="flex items-end gap-2 rounded-[28px] border border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur-md">
        {/* 输入框 */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "w-full min-h-[42px] max-h-[140px] rounded-2xl border-0 bg-transparent px-1 py-2.5",
              "resize-none text-slate-800 placeholder:text-slate-400",
              "focus:outline-none focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              "leading-6"
            )}
            rows={1}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={(!inputValue.trim() && !imageUrl) || isLoading}
          className={cn(
            "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
            "bg-cyan-500 hover:bg-cyan-400",
            "text-white disabled:cursor-not-allowed disabled:bg-slate-300",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-cyan-300/70",
            "focus:ring-offset-2 focus:ring-offset-white"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { cn } from "../utils/cn";
import { Send, Loader2, Search } from "lucide-react";
import { ImageUploadIndicator } from "./ImageUploadIndicator";
import { useImageUpload } from "../hooks/useImageUpload";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

interface ChatInputProps {
  onSendMessage: (
    message: string,
    useSearch?: boolean,
    imageUrl?: string
  ) => void;
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
  const [useSearch, setUseSearch] = useState(false);

  // 使用图片上传 Hook
  const { imageUrl, showImagePrompt, handlePaste, resetImage } =
    useImageUpload();

  // 使用文本框自动调整 Hook
  const textareaRef = useAutoResizeTextarea(inputValue);

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    if ((trimmedValue || imageUrl) && !isLoading) {
      // 将图片URL和文本一起发送
      onSendMessage(trimmedValue, useSearch, imageUrl || undefined);

      // 重置状态
      setInputValue("");
      resetImage(); // 使用 Hook 的重置函数
    }
  };

  const toggleSearch = () => {
    setUseSearch(!useSearch);
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
        "flex flex-col gap-2 p-4 border-t border-gray-800 bg-tech-dark",
        className
      )}
    >
      {/* 图片提示 */}
      <ImageUploadIndicator visible={showImagePrompt} />

      {/* 输入区域和按钮容器 */}
      <div className="flex items-center gap-2">
        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "w-full min-h-[40px] max-h-[120px] px-4 py-2",
              "bg-tech-gray border border-gray-700 rounded-lg",
              "text-white placeholder-gray-500 resize-none",
              "focus:outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              "translate-y-[1px]"
            )}
            rows={1}
          />
        </div>

        {/* 搜索开关按钮 */}
        <button
          onClick={toggleSearch}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-lg",
            useSearch
              ? "bg-tech-green hover:bg-tech-green/90"
              : "bg-gray-800 hover:bg-gray-700",
            "disabled:bg-gray-700 disabled:cursor-not-allowed",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            useSearch ? "focus:ring-tech-green" : "focus:ring-gray-600",
            "focus:ring-offset-2 focus:ring-offset-tech-dark"
          )}
        >
          <Search className="w-4 h-4 text-white" />
        </button>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={(!inputValue.trim() && !imageUrl) || isLoading}
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-lg",
            useSearch
              ? "bg-tech-green hover:bg-tech-green/90"
              : "bg-tech-blue hover:bg-tech-blue/90",
            "disabled:bg-gray-700 disabled:cursor-not-allowed",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            useSearch ? "focus:ring-tech-green" : "focus:ring-tech-blue",
            "focus:ring-offset-2 focus:ring-offset-tech-dark"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

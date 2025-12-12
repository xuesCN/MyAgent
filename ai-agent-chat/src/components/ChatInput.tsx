import React, { useState, useRef, useEffect } from "react";
import { cn } from "../utils/cn";
import { Send, Loader2, Search, ImageIcon } from "lucide-react";

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
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    if ((trimmedValue || imageUrl) && !isLoading) {
      // 将图片URL和文本一起发送
      onSendMessage(trimmedValue, useSearch, imageUrl || undefined);

      // 重置状态
      setInputValue("");
      setImageUrl(null);
      setShowImagePrompt(false); // 发送后隐藏图片提示
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

  // 处理图片粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  };

  // 上传图片并转换为base64 URL
  const handleImageUpload = (file: File) => {
    // 检查文件是否为图片
    if (!file.type.startsWith("image/")) {
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setShowImagePrompt(true);
      // 移除自动隐藏定时器，改为永久显示直到发送
    };

    reader.onerror = (e) => {
      console.error("图片转换失败:", e);
      alert("图片转换失败，请重试");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border-t border-gray-800 bg-tech-dark",
        className
      )}
    >
      {/* 图片提示 */}
      {showImagePrompt && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tech-green/10 border border-tech-green/30 rounded-full text-xs text-tech-green animate-fadeIn">
          <ImageIcon className="w-3 h-3" />
          <span>图片已传入</span>
        </div>
      )}

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

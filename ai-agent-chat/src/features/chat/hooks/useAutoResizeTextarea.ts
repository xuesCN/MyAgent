import { useRef, useEffect } from "react";

/**
 * 文本框自动调整高度 Hook
 * 随着输入内容增加，文本框高度自动扩展
 * 最大高度限制为 120px
 *
 * @param value - 文本框当前值
 * @returns 文本框 ref
 */
export const useAutoResizeTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // 重置高度为 auto，以计算实际高度
      textareaRef.current.style.height = "auto";
      // 设置新高度，限制最大为 120px
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`;
    }
  }, [value]);

  return textareaRef;
};

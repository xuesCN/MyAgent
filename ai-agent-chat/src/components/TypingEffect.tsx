import React, { useState, useEffect } from "react";
import { cn } from "../utils/cn";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
  cursorChar?: string;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 50,
  className,
  onComplete,
  showCursor = true,
  cursorChar = "|",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursorState, setShowCursorState] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);

    if (!text) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsComplete(true);
        setShowCursorState(false);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed, onComplete]);

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor || isComplete) return;

    const cursorInterval = setInterval(() => {
      setShowCursorState((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [showCursor, isComplete]);

  return (
    <span className={cn("font-mono", className)}>
      {displayText}
      {showCursor && showCursorState && (
        <span className="animate-blink text-tech-blue">{cursorChar}</span>
      )}
    </span>
  );
};

// 打字机容器组件，用于整个消息的打字效果
export const TypingMessage: React.FC<TypingEffectProps> = ({
  text,
  speed = 30,
  className,
  onComplete,
  showCursor = true,
  cursorChar = "|",
}) => {
  const [isTyping, setIsTyping] = useState(true);

  const handleComplete = () => {
    setIsTyping(false);
    onComplete?.();
  };

  return (
    <div className={cn("relative", className)}>
      {isTyping ? (
        <TypingEffect
          text={text}
          speed={speed}
          onComplete={handleComplete}
          showCursor={showCursor}
          cursorChar={cursorChar}
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

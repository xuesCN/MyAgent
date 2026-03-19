import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  showTypingEffect?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  showTypingEffect = true,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查是否应该显示打字效果
  const shouldShowTypingEffect = (index: number) => {
    return (
      showTypingEffect &&
      index === messages.length - 1 &&
      messages[index]?.sender === 'ai'
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <div className="py-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLastMessage={index === messages.length - 1}
            showTypingEffect={shouldShowTypingEffect(index)}
          />
        ))}

        {/* 加载指示器 */}
        {isLoading && messages.length > 0 && (
          <div className="flex gap-3 px-4 py-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-tech-purple flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-tech-blue rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-tech-blue rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-tech-blue rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-sm">AI正在输入...</span>
            </div>
          </div>
        )}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};

import React from 'react';
import { cn } from '../utils/cn';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageList } from './MessageList';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, useSearch?: boolean, imageUrl?: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  className
}) => {
  return (
    <div className={cn('flex flex-col h-full bg-tech-dark', className)}>
      {/* 消息列表或欢迎屏幕 */}
      {messages.length === 0 ? (
        <WelcomeScreen onSelectPrompt={(prompt) => onSendMessage(prompt)} />
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* 输入区域 */}
      <div className="border-t border-gray-800">
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          placeholder="输入消息，按Enter发送..."
        />
      </div>
    </div>
  );
};
import React, { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Message } from '../types';
import { Bot, MessageSquare } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查是否应该显示打字效果
  const shouldShowTypingEffect = (index: number) => {
    return index === messages.length - 1 && messages[index]?.sender === 'ai';
  };

  return (
    <div className={cn('flex flex-col h-full bg-tech-dark', className)}>
      {/* 消息列表 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tech-blue to-tech-purple p-1">
                <div className="w-full h-full rounded-full bg-tech-dark flex items-center justify-center">
                  <Bot className="w-10 h-10 text-tech-blue" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-tech-green rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gradient mb-2">
              AI Agent 智能助手
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
              基于火山云LLM的强大AI助手，为您提供智能对话体验。
              开始对话，探索无限可能。
            </p>

            {/* 快速开始提示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                onClick={() => onSendMessage('你好，请介绍一下自己')}
                className="p-3 rounded-lg border border-gray-700 hover:border-tech-blue hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">
                  你好，请介绍一下自己
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  了解AI助手
                </div>
              </button>
              
              <button
                onClick={() => onSendMessage('今天天气怎么样')}
                className="p-3 rounded-lg border border-gray-700 hover:border-tech-blue hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">
                  今天天气怎么样
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  日常对话示例
                </div>
              </button>
              
              <button
                onClick={() => onSendMessage('请解释一下量子计算')}
                className="p-3 rounded-lg border border-gray-700 hover:border-tech-blue hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">
                  请解释一下量子计算
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  科技知识问答
                </div>
              </button>
              
              <button
                onClick={() => onSendMessage('帮我写一段Python代码')}
                className="p-3 rounded-lg border border-gray-700 hover:border-tech-blue hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">
                  帮我写一段Python代码
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  编程助手
                </div>
              </button>
            </div>
          </div>
        ) : (
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
                    <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">AI正在输入...</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

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
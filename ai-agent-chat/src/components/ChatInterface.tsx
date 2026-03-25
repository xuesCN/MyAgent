import React from 'react';
import { cn } from '../utils/cn';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageList } from './MessageList';
import { Message } from '../types';
import { Eye, X } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading?: boolean;
  isPreviewMode?: boolean;
  previewSessionTitle?: string;
  onExitPreview?: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isPreviewMode = false,
  previewSessionTitle,
  onExitPreview,
  className
}) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-transparent', className)}>
      {isPreviewMode && (
        <div className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-100 sm:mx-4">
          <div className="flex min-w-0 items-center gap-2">
            <Eye className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Viewing history mode</p>
              <p className="truncate text-xs text-amber-200/80">
                {previewSessionTitle || '历史会话只读预览中'}
              </p>
            </div>
          </div>
          <button
            onClick={onExitPreview}
            className="flex items-center gap-1 rounded-lg border border-amber-300/40 px-3 py-1 text-xs text-amber-100 transition-colors hover:bg-amber-300/10"
          >
            <X className="h-3 w-3" />
            退出预览
          </button>
        </div>
      )}

      {/* 消息列表或欢迎屏幕 */}
      {messages.length === 0 ? (
        <WelcomeScreen onSelectPrompt={(prompt) => onSendMessage(prompt)} />
      ) : (
        <MessageList messages={messages} />
      )}

      {/* 输入区域 */}
      <div className="px-3 pb-4 pt-2 sm:px-4 sm:pb-5">
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading || isPreviewMode}
          placeholder={
            isPreviewMode
              ? 'Viewing history mode'
              : '输入消息，按Enter发送...'
          }
        />
      </div>
    </div>
  );
};

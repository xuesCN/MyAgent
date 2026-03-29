import React, { useEffect, useRef } from 'react';
import { Message } from '../../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
}) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const updateStickiness = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom <= 80;
    };

    updateStickiness();
    container.addEventListener('scroll', updateStickiness, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateStickiness);
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const hasNewMessage = messages.length > previousMessageCountRef.current;
    const shouldAutoScroll = hasNewMessage || shouldStickToBottomRef.current;

    previousMessageCountRef.current = messages.length;

    if (!shouldAutoScroll) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: hasNewMessage ? 'smooth' : 'auto',
    });
  }, [messages]);

  return (
    <div
      ref={listContainerRef}
      className="min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
    >
      <div className="mx-auto w-full max-w-4xl py-5 sm:py-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};

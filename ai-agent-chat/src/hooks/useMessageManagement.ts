import { useCallback } from "react";
import { Message, ChatSession, MessageContentItem } from "../types";

/**
 * 消息管理 Hook
 * 职责：处理消息的创建、更新和格式化
 */
interface UseMessageManagementResult {
  addUserMessage: (content: string, imageUrl?: string) => Message | null;
  addAIPlaceholder: () => Message | null;
  updateAIMessage: (
    messageId: string,
    content: string,
    isComplete: boolean,
  ) => void;
}

interface UseMessageManagementProps {
  currentSession: ChatSession | null;
  onSessionUpdate: (session: ChatSession) => void;
}

export const useMessageManagement = ({
  currentSession,
  onSessionUpdate,
}: UseMessageManagementProps): UseMessageManagementResult => {
  /**
   * 创建消息内容（支持文本和图片）
   */
  const createMessageContent = useCallback(
    (content: string, imageUrl?: string): string | MessageContentItem[] => {
      if (imageUrl) {
        const textContent = content.trim();
        const contentItems: MessageContentItem[] = [];

        // 添加图片项
        contentItems.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });

        // 如果有文本内容，也添加文本项
        if (textContent) {
          contentItems.push({
            type: "text",
            text: textContent,
          });
        }

        return contentItems;
      }

      return content.trim();
    },
    [],
  );

  /**
   * 添加用户消息
   */
  const addUserMessage = useCallback(
    (content: string, imageUrl?: string): Message | null => {
      if (!currentSession) {
        console.warn("[Message Manager] 当前会话不存在");
        return null;
      }

      const messageContent = createMessageContent(content, imageUrl);

      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        sender: "user",
        timestamp: new Date(),
      };

      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        updatedAt: new Date(),
      };

      console.log("[Message Manager] 添加用户消息:", userMessage.id);
      onSessionUpdate(updatedSession);

      return userMessage;
    },
    [currentSession, onSessionUpdate, createMessageContent],
  );

  /**
   * 添加 AI 占位符消息
   */
  const addAIPlaceholder = useCallback((): Message | null => {
    if (!currentSession) {
      console.warn("[Message Manager] 当前会话不存在");
      return null;
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "ai",
      timestamp: new Date(),
      isStreaming: true,
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, aiMessage],
      updatedAt: new Date(),
    };

    console.log("[Message Manager] 添加 AI 占位符:", aiMessage.id);
    onSessionUpdate(updatedSession);

    return aiMessage;
  }, [currentSession, onSessionUpdate]);

  /**
   * 更新 AI 消息内容
   */
  const updateAIMessage = useCallback(
    (messageId: string, content: string, isComplete: boolean = false) => {
      if (!currentSession) {
        console.warn("[Message Manager] 当前会话不存在");
        return;
      }

      const updatedMessages = currentSession.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content,
              isStreaming: !isComplete,
            }
          : msg,
      );

      const updatedSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      onSessionUpdate(updatedSession);
    },
    [currentSession, onSessionUpdate],
  );

  return {
    addUserMessage,
    addAIPlaceholder,
    updateAIMessage,
  };
};

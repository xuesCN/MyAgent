import { Dispatch, SetStateAction, useCallback } from "react";
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
  onSessionUpdate: Dispatch<SetStateAction<ChatSession | null>>;
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
        return null;
      }

      const messageContent = createMessageContent(content, imageUrl);

      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        sender: "user",
        timestamp: new Date(),
      };

      onSessionUpdate((prevSession) => {
        if (!prevSession || prevSession.id !== currentSession.id) return prevSession;

        return {
          ...prevSession,
          messages: [...prevSession.messages, userMessage],
          updatedAt: new Date(),
        };
      });

      return userMessage;
    },
    [currentSession, onSessionUpdate, createMessageContent],
  );

  /**
   * 添加 AI 占位符消息
   */
  const addAIPlaceholder = useCallback((): Message | null => {
    if (!currentSession) {
      return null;
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "ai",
      timestamp: new Date(),
      isStreaming: true,
    };

      onSessionUpdate((prevSession) => {
        if (!prevSession || prevSession.id !== currentSession.id) return prevSession;

        return {
          ...prevSession,
          messages: [...prevSession.messages, aiMessage],
          updatedAt: new Date(),
        };
      });

    return aiMessage;
  }, [currentSession, onSessionUpdate]);

  /**
   * 更新 AI 消息内容
   */
  const updateAIMessage = useCallback(
    (messageId: string, content: string, isComplete: boolean = false) => {
      if (!currentSession) {
        return;
      }

      onSessionUpdate((prevSession) => {
        if (!prevSession || prevSession.id !== currentSession.id) {
          return prevSession;
        }

        const updatedMessages = prevSession.messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content,
                isStreaming: !isComplete,
              }
            : msg,
        );

        return {
          ...prevSession,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
      });
    },
    [currentSession, onSessionUpdate],
  );

  return {
    addUserMessage,
    addAIPlaceholder,
    updateAIMessage,
  };
};

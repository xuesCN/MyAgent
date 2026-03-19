import { useState, useCallback, useEffect } from "react";
import { ChatSession } from "../types";
import { executeAgentGraphStream } from "../api/services/langGraphService";
import { useSessionManagement } from "./useSessionManagement";
import { useMessageManagement } from "./useMessageManagement";

/**
 * 聊天状态类型定义
 */
interface ChatStateType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

/**
 * useAgentChat Hook 返回值
 */
interface UseAgentChatResult {
  chatState: ChatStateType;
  createSession: (title?: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (
    content: string,
    useSearch?: boolean,
    imageUrl?: string,
  ) => Promise<void>;
  initializeDefaultSession: () => Promise<void>;
}

/**
 * 核心聊天 Hook
 * 职责：整合会话管理、消息管理和 AI 通信
 */
export const useAgentChat = (): UseAgentChatResult => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取会话管理功能
  const {
    sessions,
    createSession: createSessionAPI,
    deleteSession,
    updateSession,
  } = useSessionManagement();

  // 获取消息管理功能
  const { addUserMessage, addAIPlaceholder, updateAIMessage } =
    useMessageManagement({
      currentSession,
      onSessionUpdate: setCurrentSession,
    });

  /**
   * 当 sessions 改变时，同步 currentSession
   */
  useEffect(() => {
    if (currentSession && !sessions.find((s) => s.id === currentSession.id)) {
      // 当前会话已被删除，切换到第一个会话
      setCurrentSession(sessions.length > 0 ? sessions[0] : null);
    }
  }, [sessions, currentSession]);

  /**
   * 创建新会话
   */
  const createSession = useCallback(
    async (title: string = "新对话") => {
      try {
        const newSession = await createSessionAPI(title);
        setCurrentSession(newSession);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "创建会话失败";
        console.error("[Agent Chat] 创建会话失败:", errorMsg);
        setError(errorMsg);
      }
    },
    [createSessionAPI],
  );

  /**
   * 切换会话
   */
  const switchSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        console.log("[Agent Chat] 切换会话:", sessionId);
        setCurrentSession(session);
      }
    },
    [sessions],
  );

  /**
   * 删除会话
   */
  const deleteSessionWrapper = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId);
        // 如果删除的是当前会话，自动切换到第一个
        if (currentSession?.id === sessionId) {
          const remainingSessions = sessions.filter((s) => s.id !== sessionId);
          setCurrentSession(
            remainingSessions.length > 0 ? remainingSessions[0] : null,
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "删除会话失败";
        console.error("[Agent Chat] 删除会话失败:", errorMsg);
        setError(errorMsg);
      }
    },
    [deleteSession, currentSession, sessions],
  );

  /**
   * 初始化默认会话
   */
  const initializeDefaultSession = useCallback(async () => {
    try {
      if (sessions.length === 0) {
        console.log("[Agent Chat] 创建默认会话");
        const newSession = await createSessionAPI("欢迎对话");
        setCurrentSession(newSession);
      } else if (!currentSession) {
        console.log("[Agent Chat] 切换到第一个会话");
        setCurrentSession(sessions[0]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "初始化会话失败";
      console.error("[Agent Chat] 初始化失败:", errorMsg);
      setError(errorMsg);
    }
  }, [sessions, currentSession, createSessionAPI]);

  /**
   * 发送消息（核心功能）
   */
  const sendMessage = useCallback(
    async (content: string, useSearch?: boolean, imageUrl?: string) => {
      // useSearch 参数保留以兼容现有代码，但实际由 LangGraph 决定
      if (!currentSession || (!content.trim() && !imageUrl)) {
        console.warn("[Agent Chat] 会话或内容无效，无法发送消息");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("[Agent Chat] 开始发送消息");

        // 1. 添加用户消息
        const userMessage = addUserMessage(content, imageUrl);
        if (!userMessage) {
          throw new Error("无法创建用户消息");
        }

        // 更新会话到 localStorage
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, userMessage],
            updatedAt: new Date(),
          };
          await updateSession(updatedSession);
        }

        // 2. 添加 AI 占位符
        const aiMessage = addAIPlaceholder();
        if (!aiMessage) {
          throw new Error("无法创建 AI 消息");
        }

        // 更新会话到 localStorage
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, userMessage, aiMessage],
            updatedAt: new Date(),
          };
          await updateSession(updatedSession);
        }

        // 3. 获取 AI 响应（流式）
        console.log("[Agent Chat] 调用 LangGraph 服务");
        let aiContent = "";

        // 获取最新的会话消息（包含用户消息）
        const messagesForAPI = currentSession
          ? [...currentSession.messages, userMessage]
          : [userMessage];

        const stream = executeAgentGraphStream(messagesForAPI);

        for await (const chunk of stream) {
          aiContent += chunk;
          updateAIMessage(aiMessage.id, aiContent, false);
        }

        // 4. 标记完成
        updateAIMessage(aiMessage.id, aiContent, true);

        // 5. 保存完整的会话到 localStorage
        if (currentSession) {
          const finalSession = {
            ...currentSession,
            messages: [
              ...currentSession.messages,
              userMessage,
              {
                ...aiMessage,
                content: aiContent,
                isStreaming: false,
              },
            ],
            updatedAt: new Date(),
          };
          await updateSession(finalSession);
        }

        console.log("[Agent Chat] 消息发送完成");
        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "发送消息失败";
        console.error("[Agent Chat] 发送消息失败:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);

        // 清理失败的 AI 消息
        if (currentSession) {
          const cleanedMessages = currentSession.messages.filter(
            (msg) =>
              msg.sender === "user" ||
              (msg.sender === "ai" && msg.content !== ""),
          );
          setCurrentSession({
            ...currentSession,
            messages: cleanedMessages,
          });
        }
      }
    },
    [
      currentSession,
      addUserMessage,
      addAIPlaceholder,
      updateAIMessage,
      updateSession,
    ],
  );

  return {
    chatState: {
      currentSession,
      sessions,
      isLoading,
      error,
    },
    createSession,
    switchSession,
    deleteSession: deleteSessionWrapper,
    sendMessage,
    initializeDefaultSession,
  };
};

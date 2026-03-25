import { useState, useCallback, useEffect } from "react";
import { ChatSession } from "../types";
import { agentRuntimeFacade } from "../api/services/agentRuntimeFacade";
import { useSessionManagement } from "./useSessionManagement";
import { useMessageManagement } from "./useMessageManagement";
import { warnDevOnce } from "../utils/devLogger";

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
    isSessionsLoaded,
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

  const getErrorMessage = useCallback(
    (err: unknown, fallback: string) =>
      err instanceof Error ? err.message : fallback,
    [],
  );

  const persistSessionMessages = useCallback(
    async (session: ChatSession, messages: ChatSession["messages"]) => {
      await updateSession({
        ...session,
        messages,
        updatedAt: new Date(),
      });
    },
    [updateSession],
  );

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
        const errorMsg = getErrorMessage(err, "创建会话失败");
        console.error("[Agent Chat] 创建会话失败:", errorMsg);
        setError(errorMsg);
      }
    },
    [createSessionAPI, getErrorMessage],
  );

  /**
   * 切换会话
   */
  const switchSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
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
        const errorMsg = getErrorMessage(err, "删除会话失败");
        console.error("[Agent Chat] 删除会话失败:", errorMsg);
        setError(errorMsg);
      }
    },
    [deleteSession, currentSession, sessions, getErrorMessage],
  );

  /**
   * 初始化默认会话
   */
  const initializeDefaultSession = useCallback(async () => {
    try {
      if (!isSessionsLoaded) {
        return;
      }

      if (sessions.length === 0) {
        const newSession = await createSessionAPI("欢迎对话");
        setCurrentSession(newSession);
      } else if (!currentSession) {
        setCurrentSession(sessions[0]);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, "初始化会话失败");
      console.error("[Agent Chat] 初始化失败:", errorMsg);
      setError(errorMsg);
    }
  }, [isSessionsLoaded, sessions, currentSession, createSessionAPI, getErrorMessage]);

  /**
   * 发送消息（核心功能）
   */
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!currentSession) {
        warnDevOnce(
          "send_without_session",
          "[Agent Chat] 在 currentSession 为空时调用了 sendMessage。"
        );
        return;
      }

      if (!content.trim() && !imageUrl) {
        return;
      }

      const session = currentSession;
      setIsLoading(true);
      setError(null);

      try {
        // 1. 添加用户消息
        const userMessage = addUserMessage(content, imageUrl);
        if (!userMessage) {
          throw new Error("无法创建用户消息");
        }

        // 2. 添加 AI 占位符
        const aiMessage = addAIPlaceholder();
        if (!aiMessage) {
          throw new Error("无法创建 AI 消息");
        }

        const requestMessages = [...session.messages, userMessage];
        const pendingMessages = [...requestMessages, aiMessage];
        await persistSessionMessages(session, pendingMessages);

        // 3. 获取 AI 响应（流式）
        let aiContent = "";

        // 获取最新的会话消息（包含用户消息）
        const stream = agentRuntimeFacade.stream(requestMessages);
        let finalAnswerFromState = "";

        while (true) {
          const item = await stream.next();
          if (item.done) {
            finalAnswerFromState = item.value?.final?.answerText || "";
            break;
          }
          aiContent += item.value;
          updateAIMessage(aiMessage.id, aiContent, false);
        }

        if (!aiContent.trim()) {
          aiContent = finalAnswerFromState.trim() || "抱歉，无法生成回答。";
          updateAIMessage(aiMessage.id, aiContent, false);
        }

        // 4. 标记完成
        updateAIMessage(aiMessage.id, aiContent, true);

        // 5. 保存完整的会话到 localStorage
        await persistSessionMessages(session, [
          ...requestMessages,
          {
            ...aiMessage,
            content: aiContent,
            isStreaming: false,
          },
        ]);
      } catch (err) {
        const errorMsg = getErrorMessage(err, "发送消息失败");
        console.error("[Agent Chat] 发送消息失败:", errorMsg);
        setError(errorMsg);

        // 清理失败的 AI 消息
        setCurrentSession((prevSession) => {
          if (!prevSession) return prevSession;
          const cleanedMessages = prevSession.messages.filter(
            (msg) =>
              msg.sender === "user" ||
              (msg.sender === "ai" && msg.content !== ""),
          );
          return {
            ...prevSession,
            messages: cleanedMessages,
          };
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentSession,
      addUserMessage,
      addAIPlaceholder,
      updateAIMessage,
      persistSessionMessages,
      getErrorMessage,
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

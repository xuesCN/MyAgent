import { useState, useEffect, useCallback } from "react";
import {
  ChatState,
  Message,
  ChatSession,
  StreamResponse,
  MessageContentItem,
} from "../types";
import { executeAgentGraphStream } from "../api/services/langGraphService";
import { storageService } from "../utils/storageService";

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,
  });

  // 初始化时加载历史会话
  useEffect(() => {
    const loadSessions = async () => {
      try {
        console.log("Loading sessions from localStorage...");
        const sessions = await storageService.getSessions();
        console.log("Loaded sessions:", sessions);
        setChatState((prev) => ({
          ...prev,
          sessions,
          currentSession: sessions.length > 0 ? sessions[0] : null,
        }));
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };

    loadSessions();
  }, []);

  // 创建新会话
  const createSession = useCallback(
    async (title: string = "新对话") => {
      try {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedSessions = [newSession, ...chatState.sessions];

        setChatState((prev) => ({
          ...prev,
          sessions: updatedSessions,
          currentSession: newSession,
        }));

        await storageService.saveSessions(updatedSessions);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    },
    [chatState.sessions]
  );

  // 切换会话
  const switchSession = useCallback(
    (sessionId: string) => {
      const session = chatState.sessions.find((s) => s.id === sessionId);
      if (session) {
        setChatState((prev) => ({
          ...prev,
          currentSession: session,
        }));
      }
    },
    [chatState.sessions]
  );

  // 删除会话
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const updatedSessions = chatState.sessions.filter(
          (s) => s.id !== sessionId
        );

        setChatState((prev) => ({
          ...prev,
          sessions: updatedSessions,
          currentSession:
            prev.currentSession?.id === sessionId
              ? updatedSessions.length > 0
                ? updatedSessions[0]
                : null
              : prev.currentSession,
        }));

        await storageService.saveSessions(updatedSessions);
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },
    [chatState.sessions]
  );

  // 发送消息（使用 LangGraph 智能决策流程）
  const sendMessage = useCallback(
    async (content: string, useSearch?: boolean, imageUrl?: string) => {
      // useSearch 参数保留以兼容现有代码，但实际由 LangGraph 决定
      if (!chatState.currentSession || (!content.trim() && !imageUrl)) return;

      setChatState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // 解析消息内容，支持图片数据
        let messageContent: string | MessageContentItem[];

        if (imageUrl) {
          const textContent = content.trim();

          // 创建消息内容项数组
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

          messageContent = contentItems;
        } else {
          // 普通文本消息
          messageContent = content.trim();
        }

        // 创建用户消息
        const userMessage: Message = {
          id: Date.now().toString(),
          content: messageContent,
          sender: "user",
          timestamp: new Date(),
        };

        // 更新会话
        const updatedSession = {
          ...chatState.currentSession,
          messages: [...chatState.currentSession.messages, userMessage],
          updatedAt: new Date(),
        };

        setChatState((prev) => ({
          ...prev,
          currentSession: updatedSession,
        }));

        // 更新会话列表并立即保存用户消息到本地存储（防止刷新丢失）
        // 直接从当前会话列表创建更新后的列表，确保使用最新的会话数据
        const sessionsWithUserMessage = chatState.sessions.map((session) =>
          session.id === updatedSession.id ? updatedSession : session
        );

        console.log("Saving user message immediately...");
        await storageService.saveSessions(sessionsWithUserMessage);
        console.log("User message saved successfully");

        // 同时更新chatState中的sessions数组，确保状态一致性
        setChatState((prev) => ({
          ...prev,
          sessions: sessionsWithUserMessage,
        }));

        // 创建AI消息的占位符
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "",
          sender: "ai",
          timestamp: new Date(),
          isStreaming: true,
        };

        const sessionWithAIMessage = {
          ...updatedSession,
          messages: [...updatedSession.messages, aiMessage],
        };

        setChatState((prev) => ({
          ...prev,
          currentSession: sessionWithAIMessage,
        }));

        // 更新会话列表并立即保存AI消息占位符到本地存储
        const sessionsWithAIMessage = sessionsWithUserMessage.map((session) =>
          session.id === sessionWithAIMessage.id
            ? sessionWithAIMessage
            : session
        );

        console.log("Saving AI message placeholder immediately...");
        await storageService.saveSessions(sessionsWithAIMessage);
        console.log("AI message placeholder saved successfully");

        // 更新chatState中的sessions数组，确保状态一致性
        setChatState((prev) => ({
          ...prev,
          sessions: sessionsWithAIMessage,
        }));

        // 使用 LangGraph 执行智能流程（LLM 自动决定是否调用搜索工具）
        let aiContent = "";

        // 调用AI服务获取响应
        const stream = executeAgentGraphStream(updatedSession.messages);

        for await (const chunk of stream) {
          aiContent += chunk;

          // 更新AI消息内容（流式更新）
          setChatState((prev) => {
            if (!prev.currentSession) return prev;

            const updatedMessages = prev.currentSession.messages.map((msg) =>
              msg.id === aiMessage.id ? { ...msg, content: aiContent } : msg
            );

            return {
              ...prev,
              currentSession: {
                ...prev.currentSession,
                messages: updatedMessages,
              },
            };
          });
        }

        // 完成流式响应
        const finalSession = {
          ...sessionWithAIMessage,
          messages: sessionWithAIMessage.messages.map((msg) =>
            msg.id === aiMessage.id
              ? { ...msg, content: aiContent, isStreaming: false }
              : msg
          ),
        };

        // 更新会话列表
        const updatedSessions = chatState.sessions.map((session) =>
          session.id === finalSession.id ? finalSession : session
        );

        setChatState((prev) => ({
          ...prev,
          currentSession: finalSession,
          sessions: updatedSessions,
          isLoading: false,
        }));

        // 保存到本地存储
        console.log("Saving sessions to localStorage:", updatedSessions);
        await storageService.saveSessions(updatedSessions);
        console.log("Sessions saved successfully");
      } catch (error) {
        console.error("Failed to send message:", error);
        setChatState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "发送消息失败",
          isLoading: false,
        }));

        // 移除失败的AI消息
        if (chatState.currentSession) {
          const updatedSession = {
            ...chatState.currentSession,
            messages: chatState.currentSession.messages.filter(
              (msg) => msg.sender === "user" || msg.content !== ""
            ),
          };

          setChatState((prev) => ({
            ...prev,
            currentSession: updatedSession,
          }));
        }
      }
    },
    [chatState.currentSession, chatState.sessions]
  );

  return {
    chatState,
    createSession,
    switchSession,
    deleteSession,
    sendMessage,
  };
};

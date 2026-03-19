import { useState, useEffect, useCallback } from "react";
import { ChatSession } from "../types";
import { storageService } from "../utils/storageService";

/**
 * 会话管理 Hook
 * 职责：处理会话的增删改查和持久化
 */
interface UseSessionManagementResult {
  sessions: ChatSession[];
  createSession: (title?: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSession: (session: ChatSession) => Promise<void>;
  loadSessions: () => Promise<void>;
}

export const useSessionManagement = (): UseSessionManagementResult => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  /**
   * 初始化时加载会话
   */
  useEffect(() => {
    const loadSessionsFromStorage = async () => {
      try {
        console.log("[Session Manager] 从 localStorage 加载会话...");
        const loadedSessions = await storageService.getSessions();
        console.log(
          "[Session Manager] 加载完成，会话数:",
          loadedSessions.length,
        );
        setSessions(loadedSessions);
      } catch (error) {
        console.error("[Session Manager] 加载会话失败:", error);
      }
    };

    loadSessionsFromStorage();
  }, []);

  /**
   * 加载会话（手动触发）
   */
  const loadSessions = useCallback(async () => {
    try {
      const loadedSessions = await storageService.getSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error("[Session Manager] 加载会话失败:", error);
    }
  }, []);

  /**
   * 创建新会话
   */
  const createSession = useCallback(
    async (title: string = "新对话"): Promise<ChatSession> => {
      try {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedSessions = [newSession, ...sessions];

        console.log("[Session Manager] 创建新会话:", newSession.id);
        setSessions(updatedSessions);
        await storageService.saveSessions(updatedSessions);
        console.log("[Session Manager] 会话已保存");

        return newSession;
      } catch (error) {
        console.error("[Session Manager] 创建会话失败:", error);
        throw error;
      }
    },
    [sessions],
  );

  /**
   * 删除会话
   */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const updatedSessions = sessions.filter((s) => s.id !== sessionId);

        console.log("[Session Manager] 删除会话:", sessionId);
        setSessions(updatedSessions);
        await storageService.saveSessions(updatedSessions);
        console.log("[Session Manager] 会话已删除");
      } catch (error) {
        console.error("[Session Manager] 删除会话失败:", error);
        throw error;
      }
    },
    [sessions],
  );

  /**
   * 更新会话
   */
  const updateSession = useCallback(
    async (updatedSession: ChatSession) => {
      try {
        const newSessions = sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s,
        );

        console.log("[Session Manager] 更新会话:", updatedSession.id);
        setSessions(newSessions);
        await storageService.saveSessions(newSessions);
        console.log("[Session Manager] 会话已更新");
      } catch (error) {
        console.error("[Session Manager] 更新会话失败:", error);
        throw error;
      }
    },
    [sessions],
  );

  return {
    sessions,
    createSession,
    deleteSession,
    updateSession,
    loadSessions,
  };
};

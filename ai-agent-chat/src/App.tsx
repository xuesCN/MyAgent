import React, { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ChatInterface } from "./features/chat/components/ChatInterface";
import { useAgentChat } from "./features/chat/hooks/useAgentChat";
import { ChatSession } from "./types";
import "./App.css";

function App() {
  const {
    chatState,
    createSession,
    deleteSession,
    sendMessage,
    initializeDefaultSession,
  } = useAgentChat();
  const [previewSession, setPreviewSession] = useState<ChatSession | null>(null);

  // 初始化时创建默认会话
  useEffect(() => {
    initializeDefaultSession();
  }, [initializeDefaultSession]);

  useEffect(() => {
    if (
      previewSession &&
      !chatState.sessions.some((session) => session.id === previewSession.id)
    ) {
      setPreviewSession(null);
    }
  }, [chatState.sessions, previewSession]);

  const displaySession = useMemo(() => {
    return previewSession ?? chatState.currentSession;
  }, [previewSession, chatState.currentSession]);

  const handlePreviewSession = (session: ChatSession) => {
    if (session.id === chatState.currentSession?.id) {
      setPreviewSession(null);
      return;
    }

    setPreviewSession(session);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative z-10 flex h-full p-2 sm:p-4 lg:p-5">
        <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-[0_12px_60px_rgba(2,6,23,0.65)] backdrop-blur-sm">
          {/* 侧边栏 */}
          <Sidebar
            sessions={chatState.sessions}
            activeSessionId={displaySession?.id ?? null}
            onNewSession={() => createSession()}
            onPreviewSession={handlePreviewSession}
            onDeleteSession={deleteSession}
            className="flex-shrink-0"
          />

          {/* 主聊天界面 */}
          <main className="min-h-0 min-w-0 flex-1 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_42%)]">
            {chatState.currentSession && displaySession ? (
              <ChatInterface
                messages={displaySession.messages}
                onSendMessage={sendMessage}
                isLoading={chatState.isLoading}
                isPreviewMode={!!previewSession}
                previewSessionTitle={previewSession?.title}
                onExitPreview={() => setPreviewSession(null)}
                className="h-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h2 className="mb-3 text-3xl font-semibold text-white">
                    AI Agent 智能对话系统
                  </h2>
                  <p className="text-sm text-slate-400">请创建新对话开始聊天</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

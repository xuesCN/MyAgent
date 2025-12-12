import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { useChat } from './hooks/useChat';
import './App.css';

function App() {
  const { chatState, createSession, switchSession, deleteSession, sendMessage } = useChat();

  // 初始化时创建默认会话
  useEffect(() => {
    if (chatState.sessions.length === 0) {
      createSession('欢迎对话');
    }
  }, [chatState.sessions.length, createSession]);

  return (
    <div className="flex h-screen bg-tech-dark">
      {/* 侧边栏 */}
      <Sidebar
        sessions={chatState.sessions}
        currentSession={chatState.currentSession}
        onNewSession={() => createSession()}
        onSelectSession={switchSession}
        onDeleteSession={deleteSession}
        className="flex-shrink-0"
      />

      {/* 主聊天界面 */}
      <main className="flex-1 min-w-0">
        {chatState.currentSession ? (
          <ChatInterface
            messages={chatState.currentSession.messages}
            onSendMessage={sendMessage}
            isLoading={chatState.isLoading}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gradient mb-4">
                AI Agent 智能对话系统
              </h2>
              <p className="text-gray-400">
                请创建新对话开始聊天
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
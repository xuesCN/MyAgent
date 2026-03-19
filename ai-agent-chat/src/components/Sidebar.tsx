import React, { useState } from "react";
import { cn } from "../utils/cn";
import { ChatSession } from "../types";
import { MessageSquare, Settings, Menu, X } from "lucide-react";
import { SidebarHeader } from "./SidebarHeader";
import { SessionListItem } from "./SessionListItem";

interface SidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSession,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  className,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <SidebarHeader onNewSession={onNewSession} />

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">还没有对话</p>
            <p className="text-xs mt-1">点击上方按钮开始新对话</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={currentSession?.id === session.id}
                onSelect={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
          <Settings className="w-4 h-4" />
          <span>设置</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-tech-gray border border-gray-700 text-white"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed lg:relative z-40 lg:z-auto",
          "w-80 h-screen bg-tech-gray border-r border-gray-800",
          "transform transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

import React, { useState } from "react";
import { cn } from "../utils/cn";
import { ChatSession } from "../types";
import { MessageSquare, Settings, Menu, X } from "lucide-react";
import { SidebarHeader } from "./SidebarHeader";
import { SessionListItem } from "./SessionListItem";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onPreviewSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onNewSession,
  onPreviewSession,
  onDeleteSession,
  className,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* 头部 */}
      <SidebarHeader onNewSession={onNewSession} />

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-slate-700/70 bg-slate-800/40 px-4 py-10 text-center text-slate-400">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">还没有对话</p>
            <p className="mt-1 text-xs">点击上方按钮开始新对话</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onSelect={() => onPreviewSession(session)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="border-t border-slate-700/80 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl border border-slate-700/80 px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800/70">
          <Settings className="h-4 w-4" />
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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-3 top-3 z-50 rounded-xl border border-slate-700/80 bg-slate-900/90 p-2 text-slate-100 shadow-lg shadow-black/30 lg:hidden"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto",
          "h-full w-[18.5rem] border-r border-slate-700/80 bg-slate-900/85 backdrop-blur-sm",
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

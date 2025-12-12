import React, { useState } from "react";
import { cn } from "../utils/cn";
import { ChatSession } from "../types";
import { Plus, Trash2, MessageSquare, Settings, Menu, X } from "lucide-react";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(sessionId);

    // 延迟删除，给用户视觉反馈
    setTimeout(() => {
      onDeleteSession(sessionId);
      setDeletingId(null);
    }, 200);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "今天";
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
      }).format(date);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-tech-blue hover:bg-tech-blue/90 transition-colors text-white font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>新建对话</span>
        </button>
      </div>

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
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                  currentSession?.id === session.id
                    ? "bg-tech-gray border border-tech-blue text-white"
                    : "hover:bg-gray-800 text-gray-300",
                  deletingId === session.id && "opacity-0 scale-95"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {session.messages.length > 0
                        ? (() => {
                            const firstMessage = session.messages[0];
                            if (Array.isArray(firstMessage.content)) {
                              // 使用类型守卫确保TypeScript知道这是包含text属性的元素
                              const isTextItem = (
                                item: any
                              ): item is { type: "text"; text: string } =>
                                item.type === "text" && "text" in item;

                              const textItem =
                                firstMessage.content.find(isTextItem);
                              if (textItem) {
                                const firstSentence =
                                  textItem.text.split("。")[0];
                                const hasPeriod = textItem.text.includes("。");
                                return firstSentence + (hasPeriod ? "。" : "");
                              }
                              return "[图片消息]";
                            } else {
                              const firstSentence =
                                firstMessage.content.split("。")[0];
                              const hasPeriod =
                                firstMessage.content.includes("。");
                              return firstSentence + (hasPeriod ? "。" : "");
                            }
                          })()
                        : session.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(session.updatedAt)}
                      </span>
                      {session.messages.length > 0 && (
                        <span className="text-xs text-gray-600">
                          {session.messages.length} 条消息
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "p-1 rounded hover:bg-red-500/20 text-red-400",
                      "hover:text-red-300"
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
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
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

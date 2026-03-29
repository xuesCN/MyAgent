import React from 'react';
import { Plus } from 'lucide-react';

interface SidebarHeaderProps {
  onNewSession: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onNewSession,
}) => {
  return (
    <div className="border-b border-slate-700/80 px-4 pb-4 pt-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
          Agent Console
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-100">会话中心</h1>
      </div>
      <button
        onClick={onNewSession}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-medium text-white transition hover:brightness-110"
      >
        <Plus className="h-4 w-4" />
        <span>新建对话</span>
      </button>
    </div>
  );
};

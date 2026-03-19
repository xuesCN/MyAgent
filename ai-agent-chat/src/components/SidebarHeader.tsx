import React from 'react';
import { Plus } from 'lucide-react';

interface SidebarHeaderProps {
  onNewSession: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onNewSession,
}) => {
  return (
    <div className="p-4 border-b border-gray-800">
      <button
        onClick={onNewSession}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-tech-blue hover:bg-tech-blue/90 transition-colors text-white font-medium"
      >
        <Plus className="w-4 h-4" />
        <span>新建对话</span>
      </button>
    </div>
  );
};

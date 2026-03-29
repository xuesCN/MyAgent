import React, { useState } from 'react';
import { ChatSession } from '../../../types';
import { Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { extractSessionTitle, formatSessionDate } from '../../../utils/messageFormatter';

interface SessionListItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const SessionListItem: React.FC<SessionListItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
}) => {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingId(session.id);
    setTimeout(() => {
      onDelete();
      setIsDeletingId(null);
    }, 200);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative cursor-pointer rounded-xl border p-3 transition-all duration-200',
        isActive
          ? 'border-cyan-400/70 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
          : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/55',
        isDeletingId === session.id && 'opacity-0 scale-95'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-medium">
            {extractSessionTitle(session)}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {formatSessionDate(session.updatedAt)}
            </span>
            {session.messages.length > 0 && (
              <span className="text-xs text-slate-500">
                {session.messages.length} 条消息
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'rounded p-1 text-red-300/70 hover:bg-red-500/20 hover:text-red-200'
          )}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

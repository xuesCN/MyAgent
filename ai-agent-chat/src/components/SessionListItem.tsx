import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { extractSessionTitle, formatSessionDate } from '../utils/messageFormatter';

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
        'group relative p-3 rounded-lg cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-tech-gray border border-tech-blue text-white'
          : 'hover:bg-gray-800 text-gray-300',
        isDeletingId === session.id && 'opacity-0 scale-95'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">
            {extractSessionTitle(session)}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatSessionDate(session.updatedAt)}
            </span>
            {session.messages.length > 0 && (
              <span className="text-xs text-gray-600">
                {session.messages.length} 条消息
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300'
          )}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

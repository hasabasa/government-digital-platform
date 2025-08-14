import React from 'react';
import { clsx } from 'clsx';
import { Hash, Users, MessageCircle, Bot } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';

interface ChatFiltersProps {
  className?: string;
}

const filters = [
  { key: 'all', label: 'Все', icon: MessageCircle },
  { key: 'channels', label: 'Каналы', icon: Hash },
  { key: 'groups', label: 'Группы', icon: Users },
  { key: 'direct', label: 'Личные', icon: MessageCircle },
];

export const ChatFilters: React.FC<ChatFiltersProps> = ({ className }) => {
  const { filter, setFilter, chats } = useChatStore();

  const getChatCount = (filterKey: string): number => {
    if (filterKey === 'all') return chats.length;
    
    return chats.filter(chat => {
      switch (filterKey) {
        case 'channels':
          return chat.type === 'channel';
        case 'groups':
          return chat.type === 'group';
        case 'direct':
          return chat.type === 'direct';
        default:
          return true;
      }
    }).length;
  };

  return (
    <div className={clsx('flex gap-1 p-2 bg-gray-50 dark:bg-gray-800/50', className)}>
      {filters.map(({ key, label, icon: Icon }) => {
        const count = getChatCount(key);
        const isActive = filter === key;
        
        return (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

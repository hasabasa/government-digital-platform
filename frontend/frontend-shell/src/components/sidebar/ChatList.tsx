import React from 'react';
import { clsx } from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useChatStore } from '../../stores/chat.store';
import { Chat } from '../../types';
import { Lock, Users, Hash, Bot } from 'lucide-react';

interface ChatListProps {
  className?: string;
}

const formatLastMessageTime = (date: Date): string => {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: ru });
  } else if (isYesterday(date)) {
    return 'вчера';
  } else {
    return format(date, 'dd.MM', { locale: ru });
  }
};

const getChatIcon = (type: string) => {
  switch (type) {
    case 'channel':
      return <Hash className="w-4 h-4" />;
    case 'group':
      return <Users className="w-4 h-4" />;
    case 'bot':
      return <Bot className="w-4 h-4" />;
    default:
      return null;
  }
};

const ChatItem: React.FC<{ chat: Chat; isActive: boolean; onClick: () => void }> = ({
  chat,
  isActive,
  onClick,
}) => {
  const unreadCount = useChatStore((state) => state.unreadCounts[chat.id] || 0);
  const lastMessageTime = chat.lastMessageAt ? new Date(chat.lastMessageAt) : null;

  return (
    <div
      className={clsx(
        'sidebar-item group relative',
        isActive && 'active'
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar
          src={chat.avatar}
          name={chat.name}
          size="md"
          status={chat.type === 'direct' ? 'online' : undefined}
        />
        {chat.type !== 'direct' && (
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
            {getChatIcon(chat.type)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {chat.name}
            </h3>
            {chat.isPrivate && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
          </div>
          {lastMessageTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {formatLastMessageTime(lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {chat.lastMessage?.content || 'Нет сообщений'}
          </p>
          {unreadCount > 0 && (
            <Badge variant="primary" size="sm" className="ml-2 flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatList: React.FC<ChatListProps> = ({ className }) => {
  const { chats, activeChat, filter, searchQuery, setActiveChat } = useChatStore();

  const filteredChats = React.useMemo(() => {
    let filtered = chats;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(chat => {
        switch (filter) {
          case 'channels':
            return chat.type === 'channel';
          case 'groups':
            return chat.type === 'group';
          case 'direct':
            return chat.type === 'direct';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.name?.toLowerCase().includes(query) ||
        chat.lastMessage?.content.toLowerCase().includes(query)
      );
    }

    // Sort by last message time
    return filtered.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats, filter, searchQuery]);

  const handleChatClick = (chat: Chat) => {
    setActiveChat(chat);
  };

  if (filteredChats.length === 0) {
    return (
      <div className={clsx('flex-1 flex items-center justify-center', className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          {searchQuery ? (
            <>
              <p className="text-lg font-medium mb-2">Ничего не найдено</p>
              <p className="text-sm">Попробуйте изменить поисковый запрос</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">Нет чатов</p>
              <p className="text-sm">Начните новый разговор</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex-1 overflow-y-auto chat-scrollbar', className)}>
      {filteredChats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={activeChat?.id === chat.id}
          onClick={() => handleChatClick(chat)}
        />
      ))}
    </div>
  );
};

import React from 'react';
import { clsx } from 'clsx';
import { 
  ArrowLeft, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  Hash,
  Lock,
  Bell,

} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useChatStore } from '../../stores/chat.store';
import { Chat } from '../../types';

interface ChatHeaderProps {
  onBack?: () => void;
  onSearch?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onSearch,
  onCall,
  onVideoCall,
  className,
}) => {
  const { activeChat } = useChatStore();
  const [showMenu, setShowMenu] = React.useState(false);

  if (!activeChat) {
    return (
      <div className={clsx('header', className)}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">Выберите чат</p>
        </div>
      </div>
    );
  }

  const getChatIcon = (chat: Chat) => {
    switch (chat.type) {
      case 'channel':
        return <Hash className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getChatStatus = (chat: Chat) => {
    if (chat.type === 'direct') {
      return 'в сети'; // This would come from real online status
    } else if (chat.type === 'group') {
      return `${chat.participantCount || 0} участников`;
    } else if (chat.type === 'channel') {
      return `${chat.subscriberCount || 0} подписчиков`;
    }
    return '';
  };

  return (
    <div className={clsx('header', className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back button for mobile */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Chat info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <Avatar
              src={activeChat.avatar}
              name={activeChat.name}
              size="md"
              status={activeChat.type === 'direct' ? 'online' : undefined}
            />
            {activeChat.type !== 'direct' && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                {getChatIcon(activeChat)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {activeChat.name}
              </h2>
              {activeChat.isPrivate && (
                <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
              {activeChat.isPinned && (
                <Badge variant="primary" size="sm">
                  Закреплён
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {getChatStatus(activeChat)}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSearch}
          className="hidden sm:flex"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Call buttons - only for direct chats */}
        {activeChat.type === 'direct' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCall}
              className="hidden md:flex"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onVideoCall}
              className="hidden md:flex"
            >
              <Video className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* More menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-5 h-5" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Search className="w-4 h-4" />
                  Поиск в чате
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-4 h-4" />
                  Уведомления
                </button>
                {activeChat.type === 'direct' && (
                  <>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Phone className="w-4 h-4" />
                      Голосовой звонок
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Video className="w-4 h-4" />
                      Видеозвонок
                    </button>
                  </>
                )}
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400">
                  Покинуть чат
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

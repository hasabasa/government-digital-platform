import React from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useChatStore } from '../../stores/chat.store';
import { useAuthStore } from '../../stores/auth.store';
import { Message } from '@gov-platform/types';
import { MessageItem } from './MessageItem';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ className }) => {
  const { activeChat, messages, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const chatMessages = activeChat ? messages[activeChat.id] || [] : [];

  // Auto scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: Array<{ date: string; messages: Message[] }> = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;

    chatMessages.forEach((message) => {
      const messageDate = format(new Date(message.createdAt), 'dd MMMM yyyy', { locale: ru });
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = { date: messageDate, messages: [message] };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  }, [chatMessages]);

  if (!activeChat) {
    return (
      <div className={clsx('flex-1 flex items-center justify-center', className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <h3 className="text-xl font-medium mb-2">Добро пожаловать!</h3>
          <p>Выберите чат, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={clsx('flex-1 flex items-center justify-center', className)}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Загрузка сообщений...</span>
        </div>
      </div>
    );
  }

  if (chatMessages.length === 0) {
    return (
      <div className={clsx('flex-1 flex items-center justify-center', className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">Нет сообщений</h3>
          <p>Начните разговор с {activeChat.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex-1 overflow-y-auto chat-scrollbar', className)}>
      <div className="p-4 space-y-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm font-medium">
                {group.date}
              </div>
            </div>

            {/* Messages in this date group */}
            <div className="space-y-2">
              {group.messages.map((message, messageIndex) => {
                const isOwn = message.senderId === user?.id;
                const previousMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                const nextMessage = messageIndex < group.messages.length - 1 ? group.messages[messageIndex + 1] : null;
                
                // Check if this message should show avatar (first in sequence from this sender)
                const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;
                
                // Check if messages should be grouped (same sender, within 5 minutes)
                const shouldGroup = previousMessage && 
                  previousMessage.senderId === message.senderId &&
                  new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 5 * 60 * 1000;

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar && !isOwn}
                    isGrouped={shouldGroup}
                    chatType={activeChat.type}
                  />
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

import React from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar } from '../ui/Avatar';
import { Message } from '../../types';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  File,
  Image,
  Video,
  Music,
  Download,
  Reply,
  MoreHorizontal
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
  chatType: string;
  className?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  return File;
};

const getMessageStatusIcon = (status: string) => {
  switch (status) {
    case 'sent':
      return <Check className="w-3 h-3" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 text-primary" />;
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar = false,
  isGrouped = false,
  chatType,
  className,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const messageTime = format(new Date(message.createdAt), 'HH:mm', { locale: ru });

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words whitespace-pre-wrap">
            {message.content}
          </div>
        );

      case 'file':
        if (message.fileUrl && message.fileName) {
          const FileIcon = getFileIcon(message.fileMimeType || '');
          
          return (
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <FileIcon className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {message.fileName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Файл'}
                </p>
              </div>
              <button className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                <Download className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return <div className="text-gray-500">Файл недоступен</div>;

      case 'image':
        if (message.fileUrl) {
          return (
            <div className="relative max-w-sm">
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Изображение'}
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
              {message.content && (
                <div className="mt-2">
                  {message.content}
                </div>
              )}
            </div>
          );
        }
        return <div className="text-gray-500">Изображение недоступно</div>;

      default:
        return <div className="text-gray-500">Неподдерживаемый тип сообщения</div>;
    }
  };

  return (
    <div
      className={clsx(
        'flex gap-3 group',
        isOwn ? 'justify-end' : 'justify-start',
        isGrouped ? 'mt-1' : 'mt-4',
        className
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Avatar for incoming messages in group chats */}
      {!isOwn && showAvatar && chatType !== 'direct' && (
        <div className="flex-shrink-0">
          <Avatar
            src={message.senderAvatar}
            name={message.senderName}
            size="sm"
          />
        </div>
      )}

      {/* Empty space for grouped messages */}
      {!isOwn && !showAvatar && chatType !== 'direct' && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message content */}
      <div
        className={clsx(
          'message relative max-w-[70%]',
          isOwn ? 'outgoing ml-auto' : 'incoming',
          isGrouped && 'mt-1'
        )}
      >
        {/* Sender name for incoming messages in group chats */}
        {!isOwn && showAvatar && chatType !== 'direct' && (
          <div className="text-xs font-medium text-primary mb-1">
            {message.senderName}
          </div>
        )}

        {/* Message content */}
        <div className="message-content">
          {renderMessageContent()}
        </div>

        {/* Message footer */}
        <div className={clsx(
          'flex items-center gap-1 mt-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {messageTime}
          </span>
          {isOwn && (
            <div className="text-gray-500 dark:text-gray-400">
              {getMessageStatusIcon(message.status || 'sent')}
            </div>
          )}
        </div>

        {/* Message actions menu */}
        {showMenu && (
          <div className={clsx(
            'absolute top-0 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-1 py-1',
            isOwn ? 'right-full mr-2' : 'left-full ml-2'
          )}>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <Reply className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

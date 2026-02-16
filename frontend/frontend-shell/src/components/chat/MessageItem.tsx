import React, { useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Message } from '../../types';
import { apiService } from '../../services/api.service';
import {
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  Video,
  Download,
  Reply,
  MoreHorizontal,
  Play,
  Pause,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
  chatType: string;
  className?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar = false,
  isGrouped = false,
  chatType,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(message.fileUrl || null);
  const [imageLoading, setImageLoading] = useState(false);

  const messageTime = format(new Date(message.createdAt), 'HH:mm', { locale: ru });

  // Load image URL from fileId if needed
  React.useEffect(() => {
    if (message.type === 'image' && message.fileId && !imageUrl) {
      setImageLoading(true);
      apiService.getFileDownloadUrl(message.fileId).then((res) => {
        const url = res.data?.url || res.url;
        setImageUrl(url);
      }).catch(() => {}).finally(() => setImageLoading(false));
    }
  }, [message.fileId, message.type, imageUrl]);

  const handleDownload = async () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank');
      return;
    }
    if (message.fileId) {
      try {
        const res = await apiService.getFileDownloadUrl(message.fileId);
        const url = res.data?.url || res.url;
        if (url) window.open(url, '_blank');
      } catch {
        // ignore
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words whitespace-pre-wrap text-sm">
            {message.content}
          </div>
        );

      case 'image':
        return (
          <div className="max-w-[280px]">
            {imageLoading ? (
              <div className="w-[280px] h-[200px] bg-[#232e3c] rounded-lg animate-pulse" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={message.fileName || 'Изображение'}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                loading="lazy"
                onClick={() => window.open(imageUrl, '_blank')}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#6c7883]">
                <ImageIcon className="w-5 h-5" />
                <span>Изображение недоступно</span>
              </div>
            )}
            {message.content && message.content !== message.fileName && (
              <p className="text-sm mt-1.5">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-[280px]">
            <div
              className="relative bg-[#232e3c] rounded-lg p-4 cursor-pointer hover:bg-[#2a3a4c] transition-colors"
              onClick={handleDownload}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3a73b8]/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#3a73b8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{message.fileName || 'Видео'}</p>
                  <p className="text-xs text-[#6c7883]">{formatFileSize(message.fileSize)}</p>
                </div>
                <Download className="w-4 h-4 text-[#6c7883]" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return <AudioBubble message={message} />;

      case 'file':
        return (
          <div
            className="flex items-center gap-3 bg-[#232e3c] rounded-lg p-3 cursor-pointer hover:bg-[#2a3a4c] transition-colors max-w-[280px]"
            onClick={handleDownload}
          >
            <div className="w-10 h-10 rounded-lg bg-[#3a73b8]/20 flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5 text-[#3a73b8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{message.fileName || 'Файл'}</p>
              <p className="text-xs text-[#6c7883]">{formatFileSize(message.fileSize)}</p>
            </div>
            <Download className="w-4 h-4 text-[#6c7883] flex-shrink-0" />
          </div>
        );

      case 'system':
        return (
          <div className="text-xs text-[#6c7883] text-center italic">
            {message.content}
          </div>
        );

      default:
        return <div className="text-sm text-[#6c7883]">{message.content || 'Сообщение'}</div>;
    }
  };

  // System messages are centered
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-[#232e3c]/50 rounded-full px-4 py-1">
          {renderContent()}
        </div>
      </div>
    );
  }

  const initials = message.senderName
    ? message.senderName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className={clsx(
        'flex gap-2 group px-4',
        isOwn ? 'justify-end' : 'justify-start',
        isGrouped ? 'mt-0.5' : 'mt-3',
        className
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Avatar */}
      {!isOwn && chatType !== 'direct' && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div className="relative max-w-[70%]">
        <div
          className={clsx(
            'rounded-xl px-3 py-2',
            isOwn
              ? 'bg-[#2b5278] text-white'
              : 'bg-[#182533] text-white'
          )}
        >
          {/* Sender name */}
          {!isOwn && showAvatar && chatType !== 'direct' && (
            <p className="text-xs font-medium text-[#3a73b8] mb-1">
              {message.senderName}
            </p>
          )}

          {/* Content */}
          {renderContent()}

          {/* Time + status */}
          <div className={clsx('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            {message.isEdited && (
              <span className="text-[10px] text-[#6c7883]">ред.</span>
            )}
            <span className="text-[10px] text-[#6c7883]">{messageTime}</span>
            {isOwn && (
              <span className="text-[#6c7883]">
                {message.readBy && message.readBy.length > 0 ? (
                  <CheckCheck className="w-3 h-3 text-[#3a73b8]" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons on hover */}
        {showMenu && (
          <div
            className={clsx(
              'absolute top-0 flex items-center gap-0.5 bg-[#17212b] border border-[#232e3c] rounded-lg shadow-lg px-1 py-0.5 z-10',
              isOwn ? 'right-full mr-1' : 'left-full ml-1'
            )}
          >
            <button className="p-1 text-[#6c7883] hover:text-white rounded transition-colors">
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 text-[#6c7883] hover:text-white rounded transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline audio player component
const AudioBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(message.fileUrl || null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (message.fileId && !audioUrl) {
      apiService.getFileDownloadUrl(message.fileId).then((res) => {
        setAudioUrl(res.data?.url || res.url);
      }).catch(() => {});
    }
  }, [message.fileId, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#3a73b8] flex items-center justify-center flex-shrink-0 text-white hover:bg-[#4a83c8] transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="h-1 bg-[#232e3c] rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#3a73b8] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-[#6c7883] mt-1">
          {duration > 0 ? formatDuration(duration) : '0:00'}
        </p>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}
    </div>
  );
};

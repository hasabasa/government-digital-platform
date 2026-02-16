import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Send,
  Paperclip,
  Mic,
  X,
  Image,
  File as FileIcon,
  Loader2,
} from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { useWebSocket } from '../../providers/WebSocketProvider';
import { apiService } from '../../services/api.service';
import toast from 'react-hot-toast';
import { VoiceRecorder } from './VoiceRecorder';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export const MessageComposer: React.FC<{ className?: string }> = ({ className }) => {
  const { activeChat } = useChatStore();
  const { startTyping, stopTyping } = useWebSocket();

  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (!activeChat) return;

    startTyping(activeChat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeChat.id);
    }, 3000);
  }, [activeChat, startTyping, stopTyping]);

  const handleSendMessage = async () => {
    if (!activeChat || (!message.trim() && attachedFiles.length === 0) || isSending) return;

    setIsSending(true);

    // Stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (activeChat) stopTyping(activeChat.id);

    try {
      // Upload files first
      if (attachedFiles.length > 0) {
        const filesToUpload = attachedFiles.map((file) => ({
          file,
          progress: 0,
          status: 'pending' as const,
        }));
        setUploadingFiles(filesToUpload);

        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i];

          // Update status to uploading
          setUploadingFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading', progress: 30 } : f))
          );

          try {
            const uploadResult = await apiService.uploadFile(file);
            const fileData = uploadResult.data || uploadResult;
            const fileId = fileData.id;

            // Update progress
            setUploadingFiles((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading', progress: 80 } : f))
            );

            // Determine message type
            let type = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('audio/')) type = 'audio';
            else if (file.type.startsWith('video/')) type = 'video';

            await apiService.sendMessage({
              chatId: activeChat.id,
              content: file.name,
              type,
              fileId,
            });

            // Mark as done
            setUploadingFiles((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, status: 'done', progress: 100 } : f))
            );
          } catch {
            setUploadingFiles((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, status: 'error' } : f))
            );
            toast.error(`Ошибка загрузки: ${file.name}`);
          }
        }
      }

      // Send text message
      if (message.trim()) {
        await apiService.sendMessage({
          chatId: activeChat.id,
          content: message.trim(),
          type: 'text',
        });
      }

      setMessage('');
      setAttachedFiles([]);
      setUploadingFiles([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка отправки');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Max 10 files, 50MB each
    const valid = files.filter((f) => f.size <= 50 * 1024 * 1024);
    if (valid.length < files.length) {
      toast.error('Максимальный размер файла: 50 МБ');
    }
    setAttachedFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  if (!activeChat) return null;

  const hasContent = message.trim() || attachedFiles.length > 0;
  const isUploading = uploadingFiles.some((f) => f.status === 'uploading');

  // Voice recorder mode
  if (showVoiceRecorder) {
    return (
      <div className={clsx('', className)}>
        <VoiceRecorder onClose={() => setShowVoiceRecorder(false)} />
      </div>
    );
  }

  return (
    <div className={clsx('space-y-0', className)}>
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="pb-2">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => {
              const uploading = uploadingFiles[index];

              return (
                <div
                  key={index}
                  className="relative flex items-center gap-2 bg-[#232e3c] rounded-lg px-3 py-2 max-w-[200px]"
                >
                  {uploading && uploading.status === 'uploading' && (
                    <div
                      className="absolute bottom-0 left-0 h-0.5 bg-[#3a73b8] rounded-b-lg transition-all"
                      style={{ width: `${uploading.progress}%` }}
                    />
                  )}

                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FileIcon className="w-4 h-4 text-[#6c7883]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-[#6c7883]">{formatFileSize(file.size)}</p>
                  </div>
                  {!uploading || uploading.status === 'pending' ? (
                    <button
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 text-[#6c7883] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : uploading.status === 'uploading' ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#3a73b8] animate-spin flex-shrink-0" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Composer row */}
      <div className="flex items-end gap-2">
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c] transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyPress}
            placeholder="Сообщение..."
            rows={1}
            className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] resize-none min-h-[40px] max-h-[120px]"
          />
        </div>

        {/* Send / Mic */}
        {hasContent ? (
          <button
            onClick={handleSendMessage}
            disabled={isSending || isUploading}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#3a73b8] text-white hover:bg-[#4a83c8] transition-colors disabled:opacity-50"
          >
            {isSending || isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[#6c7883] hover:text-white hover:bg-[#232e3c] transition-colors"
            title="Голосовое сообщение"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
      />
    </div>
  );
};

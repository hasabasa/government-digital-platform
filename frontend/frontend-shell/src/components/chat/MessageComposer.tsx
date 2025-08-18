import React from 'react';
import { clsx } from 'clsx';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  X,
  Image,
  File as FileIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useChatStore } from '../../stores/chat.store';
import { apiService } from '../../services/api.service';
import toast from 'react-hot-toast';

interface MessageComposerProps {
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ className }) => {
  const { activeChat } = useChatStore();
  const [message, setMessage] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max 6 lines
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSendMessage = async () => {
    if (!activeChat || (!message.trim() && attachedFiles.length === 0) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      // Send files first if any
      for (const file of attachedFiles) {
        const uploadResult = await apiService.uploadFile(file);
        const fileMessage = {
          chatId: activeChat.id,
          content: '',
          type: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: uploadResult.data.url,
          fileName: file.name,
          fileSize: file.size,
          fileMimeType: file.type,
        };

        await apiService.sendMessage(fileMessage);
      }

      // Send text message if any
      if (message.trim()) {
        await apiService.sendMessage({
          chatId: activeChat.id,
          content: message.trim(),
          type: 'text',
        });
      }

      // Clear input
      setMessage('');
      setAttachedFiles([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка отправки сообщения');
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
    setAttachedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement voice recording
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Stop voice recording and send
  };

  if (!activeChat) {
    return null;
  }

  const hasContent = message.trim() || attachedFiles.length > 0;

  return (
    <div className={clsx('composer', className)}>
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 max-w-xs"
              >
                <div className="flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span className="text-sm truncate flex-1">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main composer */}
      <div className="flex items-end gap-3">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openFileDialog}
          className="flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="composer-input resize-none min-h-[40px] max-h-[120px]"
            rows={1}
          />
          
          {/* Emoji button */}
          <button
            className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => {
              // TODO: Open emoji picker
              toast('Эмодзи будут добавлены в следующих версиях');
            }}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send/Voice button */}
        {hasContent ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendMessage}
            loading={isSending}
            className="flex-shrink-0 rounded-full w-10 h-10 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant={isRecording ? 'danger' : 'ghost'}
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className="flex-shrink-0 rounded-full w-10 h-10 p-0"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
    </div>
  );
};

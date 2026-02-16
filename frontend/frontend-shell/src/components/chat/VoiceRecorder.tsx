import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Square, Send, Trash2, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useChatStore } from '../../stores/chat.store';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onClose: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onClose }) => {
  const { activeChat } = useChatStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Нет доступа к микрофону');
      onClose();
    }
  }, [onClose]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!audioBlob || !activeChat) return;

    setIsSending(true);
    try {
      const fileName = `voice_${Date.now()}.webm`;
      const file = new window.File([audioBlob], fileName, { type: audioBlob.type });

      const uploadResult = await apiService.uploadFile(file);
      const fileData = uploadResult.data || uploadResult;

      await apiService.sendMessage({
        chatId: activeChat.id,
        content: 'Голосовое сообщение',
        type: 'audio',
        fileId: fileData.id,
      });

      onClose();
    } catch {
      toast.error('Ошибка отправки голосового');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) stopRecording();
    cleanup();
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-[#232e3c] transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording indicator */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording && (
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        <span className="text-sm text-white font-mono tabular-nums">
          {formatTime(elapsed)}
        </span>
        {isRecording && (
          <div className="flex-1 flex items-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-[#3a73b8] rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 16 + 4}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
        {!isRecording && audioBlob && (
          <span className="text-xs text-[#6c7883]">Готово к отправке</span>
        )}
      </div>

      {/* Stop / Send */}
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          <Square className="w-4 h-4" />
        </button>
      ) : audioBlob ? (
        <button
          onClick={handleSend}
          disabled={isSending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#3a73b8] text-white hover:bg-[#4a83c8] transition-colors disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      ) : null}
    </div>
  );
};

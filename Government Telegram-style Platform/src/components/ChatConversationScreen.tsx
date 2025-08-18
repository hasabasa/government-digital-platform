import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Phone, VideoIcon, MoreVertical, Search, Paperclip, Smile, Send, 
  Users, Pin, CheckCheck, Check, X, Plus, FileText, Crown, Shield, Star, 
  User, Mic, Camera, Image, File, Download, Play, Pause, LogOut 
} from 'lucide-react';

interface ChatConversationScreenProps {
  chat: any;
  onBack: () => void;
  onCreateTask: () => void;
}

export default function ChatConversationScreen({ chat, onBack, onCreateTask }: ChatConversationScreenProps) {
  const [message, setMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emoji categories
  const emojiCategories = {
    'Смайлы': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
    'Люди': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎'],
    'Природа': ['🌱', '🌿', '🍀', '🍃', '🌾', '🌵', '🌲', '🌳', '🌴', '🌈', '🌊', '💧', '🔥', '❄️', '⛄', '☀️', '🌤', '⛅', '🌦', '🌧'],
    'Объекты': ['📱', '💻', '🖥', '📞', '📠', '📧', '📨', '📩', '📤', '📥', '📦', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂️', '🗃'],
  };

  // Role icons mapping
  const roleIcons = {
    'Министр': { icon: Crown, color: 'text-red-400' },
    'Заместитель министра': { icon: Shield, color: 'text-orange-400' },
    'Начальник департамента': { icon: Star, color: 'text-blue-400' },
    'Начальник отдела': { icon: Shield, color: 'text-green-400' },
    'Сотрудник': { icon: User, color: 'text-[#aaaaaa]' },
  };

  const pinnedMessages = [
    {
      id: 101,
      sender: 'Министр экономики',
      content: 'Важно: Отчет должен быть готов до 15 декабря',
      time: '10:30',
      date: '10 дек',
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'Министр экономики',
      fullName: 'Иванов Иван Иванович',
      role: 'Министр',
      content: 'Добрый день! Необходимо подготовить отчет по результатам Q4.',
      time: '14:30',
      date: 'Сегодня',
      isOwn: false,
      status: 'read',
      type: 'text',
      attachments: [{ name: 'Требования_отчет.pdf', type: 'document', size: '1.2 МБ' }],
    },
    {
      id: 2,
      sender: 'Вы',
      fullName: 'Петров Алексей Иванович',
      role: 'Заместитель министра',
      content: 'Понял. До какого числа нужен отчет?',
      time: '14:31',
      date: 'Сегодня',
      isOwn: true,
      status: 'delivered',
      type: 'text',
    },
    {
      id: 3,
      sender: 'Вы',
      content: '',
      time: '14:32',
      date: 'Сегодня',
      isOwn: true,
      status: 'sent',
      type: 'audio',
      duration: '0:15',
    },
    {
      id: 4,
      sender: 'Министр экономики',
      fullName: 'Иванов Иван Иванович',
      role: 'Министр',
      content: '',
      time: '14:33',
      date: 'Сегодня',
      isOwn: false,
      status: 'sent',
      type: 'video_note',
      duration: '0:08',
    },
    {
      id: 5,
      sender: 'Министр экономики',
      fullName: 'Иванов Иван Иванович',
      role: 'Министр',
      content: 'До 15 декабря. Также нужно включить анализ по всем департаментам.',
      time: '14:35',
      date: 'Сегодня',
      isOwn: false,
      status: 'sent',
      type: 'text',
      isNew: true,
    },
  ];

  const participants = [
    { 
      name: 'Иванов Иван Иванович', 
      role: 'Министр', 
      department: 'Министерство экономики', 
      isOnline: true,
      avatar: '👨‍💼'
    },
    { 
      name: 'Петров Алексей Иванович', 
      role: 'Заместитель министра', 
      department: 'Министерство экономики', 
      isOnline: true,
      avatar: '👨‍💼'
    },
  ];

  const sharedFiles = [
    { id: 1, name: 'Требования_отчет.pdf', type: 'document', size: '1.2 МБ', date: 'Сегодня' },
    { id: 2, name: 'Фото_совещания.jpg', type: 'image', size: '856 КБ', date: 'Вчера' },
    { id: 3, name: 'Презентация.pptx', type: 'document', size: '3.4 МБ', date: '2 дня назад' },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(message + emoji);
  };

  const handleFileUpload = (type: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 
        type === 'image' ? 'image/*' : 
        type === 'video' ? 'video/*' : 
        '*/*';
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // Start recording logic here
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    // Stop recording and send audio message
  };

  const getRoleIcon = (role: string) => {
    const roleData = roleIcons[role as keyof typeof roleIcons] || roleIcons['Сотрудник'];
    const IconComponent = roleData.icon;
    return <IconComponent className={`w-3 h-3 ${roleData.color}`} />;
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-[#888888]" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-[#888888]" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-[#8bb5ff]" />;
      default:
        return null;
    }
  };

  const renderMessageContent = (msg: any) => {
    switch (msg.type) {
      case 'text':
        return (
          <p className="text-sm">{msg.content}</p>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Play className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/30 rounded-full">
                <div className="w-1/3 h-full bg-white rounded-full"></div>
              </div>
              <span className="text-xs opacity-70">{msg.duration}</span>
            </div>
          </div>
        );
      case 'video_note':
        return (
          <div className="relative w-48 h-48 rounded-full bg-black/20 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <Play className="w-8 h-8" />
              </button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-full text-xs">
              {msg.duration}
            </div>
          </div>
        );
      default:
        return <p className="text-sm">{msg.content}</p>;
    }
  };

  return (
    <div className="h-full bg-[#1a1a1a] flex">
      {/* Chat Conversation */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#2a2a2a] p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-3 md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg mr-3">
                  {chat.avatar}
                </div>
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2a]"></div>
                )}
              </div>
              <div>
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="text-white hover:text-[#2D7DD2] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{chat.name}</h3>
                    {getRoleIcon(chat.role)}
                  </div>
                  <p className="text-sm text-gray-400">{chat.role}</p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowCallOptions(!showCallOptions)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Phone className="w-5 h-5 text-gray-400" />
              </button>
              
              {showCallOptions && (
                <div className="absolute right-0 top-full mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-lg z-10">
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors w-full text-left">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Аудио</span>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors w-full text-left">
                    <VideoIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Видео</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              
              {showContextMenu && (
                <div className="absolute right-0 top-full mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-lg z-10 min-w-[200px]">
                  <button 
                    onClick={() => {
                      onCreateTask();
                      setShowContextMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors w-full text-left"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Создать задачу</span>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors w-full text-left">
                    <Pin className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Закрепить сообщение</span>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors w-full text-left">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Информация о чате</span>
                  </button>
                  <div className="border-t border-gray-600"></div>
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-red-600 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Покинуть чат</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="bg-[#2a2a2a] p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск в чате..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-xl border-none outline-none focus:bg-gray-600 transition-colors"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-600"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && !showSearch && (
          <div className="bg-gray-700/30 border-b border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-[#2D7DD2]" />
              <span className="text-sm text-[#2D7DD2] font-medium">Закрепленные сообщения</span>
            </div>
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="text-sm text-gray-300 bg-gray-600/30 rounded-xl p-2">
                <span className="text-[#2D7DD2]">{msg.sender}:</span> {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-xs lg:max-w-md">
                {!msg.isOwn && msg.sender !== 'Непрочитанные сообщения' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-[#2D7DD2] font-medium">{msg.sender}</span>
                    {getRoleIcon(msg.role)}
                    <span className="text-xs text-gray-400">{msg.role}</span>
                  </div>
                )}
                
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    msg.isOwn
                      ? 'bg-[#2D7DD2] text-white'
                      : 'bg-gray-700 text-white'
                  } ${msg.isNew ? 'ring-2 ring-[#2D7DD2]/50' : ''}`}
                >
                  {renderMessageContent(msg)}
                  
                  {msg.attachments && msg.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded-lg">
                      <FileText className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm">{attachment.name}</p>
                        <p className="text-xs opacity-70">{attachment.size}</p>
                      </div>
                      <button className="p-1 rounded hover:bg-black/20">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                  {msg.isOwn && getMessageStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-[#2a2a2a] p-4 border-t border-gray-700">
          <div className="flex items-end gap-3">
            {/* Attachment Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Paperclip className="w-5 h-5 text-gray-400" />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded-2xl shadow-lg border border-gray-600 p-2">
                  <button 
                    onClick={() => handleFileUpload('image')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <Image className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Фото</span>
                  </button>
                  <button 
                    onClick={() => handleFileUpload('video')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-green-400" />
                    <span className="text-white">Видео</span>
                  </button>
                  <button 
                    onClick={() => handleFileUpload('file')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <File className="w-5 h-5 text-gray-400" />
                    <span className="text-white">Документ</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Написать сообщение..."
                className="w-full px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-2xl border-none outline-none focus:bg-gray-600 transition-colors resize-none"
                rows={1}
              />
            </div>
            
            {/* Emoji Button */}
            <div className="relative">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Smile className="w-5 h-5 text-gray-400" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-2xl shadow-lg border border-gray-600 p-4 w-80">
                  <div className="space-y-3">
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category}>
                        <h4 className="text-white text-sm font-medium mb-2">{category}</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Voice Message or Send */}
            {message.trim() ? (
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-full bg-[#2D7DD2] hover:bg-[#1e5a9e] transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={`p-2 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-gray-400'}`} />
              </button>
            )}
          </div>
          
          {isRecording && (
            <div className="flex items-center justify-center mt-2 text-red-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Запись голосового сообщения... {recordingTime}s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      {showParticipants && (
        <div className="w-80 bg-[#2a2a2a] border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Информация о чате</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Participants */}
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-white font-medium mb-3">Участники ({participants.length})</h4>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center p-2 hover:bg-gray-700 rounded-xl transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                      {participant.avatar}
                    </div>
                    {participant.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2a]"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h5 className="text-white text-sm font-medium truncate">{participant.name}</h5>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(participant.role)}
                      <p className="text-xs text-gray-400 truncate">{participant.role}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{participant.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Files */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-white font-medium mb-3">Общие файлы</h4>
            <div className="space-y-2">
              {sharedFiles.map((file) => (
                <div key={file.id} className="flex items-center p-2 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center mr-3">
                    {file.type === 'image' ? (
                      <Image className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.size} • {file.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          // Handle file upload
          console.log('Files selected:', e.target.files);
        }}
      />
    </div>
  );
}
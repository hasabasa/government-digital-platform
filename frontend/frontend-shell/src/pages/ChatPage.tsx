import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
  Send,
  Search,
  Users,
  Paperclip,
  Phone,
  Video,
  ArrowLeft,
  X,
  Smile,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

// === Types ===
interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  participants?: { id: string; name: string; role: string; isOnline: boolean }[];
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
}

// === Demo Data ===
const TEAM = [
  { id: '1', name: 'Хасенхан Казимов', role: 'Управляющий партнёр', isOnline: true },
  { id: '2', name: 'Адиль Хамитов', role: 'Партнёр', isOnline: true },
  { id: '3', name: 'Азамат Бекхалиев', role: 'Партнёр', isOnline: false },
  { id: '4', name: 'Алпамыс Мақажан', role: 'Разработчик', isOnline: true },
];

const DEMO_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Адиль Хамитов',
    type: 'direct',
    lastMessage: 'Отправил документы',
    lastMessageTime: '10:30',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Команда Cube',
    type: 'group',
    lastMessage: 'Алпамыс: Деплой готов',
    lastMessageTime: '09:45',
    unreadCount: 3,
    participants: TEAM,
  },
  {
    id: '3',
    name: 'Азамат Бекхалиев',
    type: 'direct',
    lastMessage: 'Хорошо, сделаю',
    lastMessageTime: 'Вчера',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '4',
    name: 'Алпамыс Мақажан',
    type: 'direct',
    lastMessage: 'Баг пофикшен',
    lastMessageTime: 'Вчера',
    unreadCount: 0,
    isOnline: true,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', content: 'Привет! Как продвигается отчёт?', sender: 'Хасенхан', timestamp: '10:00', isOwn: true },
    { id: '2', content: 'Почти готово, осталось свести финансы', sender: 'Адиль', timestamp: '10:15', isOwn: false },
    { id: '3', content: 'Отправил документы в общий канал', sender: 'Адиль', timestamp: '10:30', isOwn: false },
  ],
  '2': [
    { id: '1', content: 'Всем привет! Новая версия задеплоена', sender: 'Алпамыс', timestamp: '09:00', isOwn: false },
    { id: '2', content: 'Отлично, проверю сегодня', sender: 'Азамат', timestamp: '09:20', isOwn: false },
    { id: '3', content: 'Деплой готов, можно тестить', sender: 'Алпамыс', timestamp: '09:45', isOwn: false },
  ],
  '3': [
    { id: '1', content: 'Азамат, нужно обновить прайс', sender: 'Хасенхан', timestamp: '15:00', isOwn: true },
    { id: '2', content: 'Хорошо, сделаю', sender: 'Азамат', timestamp: '15:30', isOwn: false },
  ],
  '4': [
    { id: '1', content: 'Алпамыс, баг на странице логина', sender: 'Хасенхан', timestamp: '14:00', isOwn: true },
    { id: '2', content: 'Баг пофикшен, проверь', sender: 'Алпамыс', timestamp: '14:20', isOwn: false },
  ],
};

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;

    const newMsg: Message = {
      id: String(Date.now()),
      content: messageText,
      sender: user?.firstName || 'Вы',
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMsg],
    }));
    setMessageText('');
  };

  const filteredChats = DEMO_CHATS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedChat ? messages[selectedChat.id] || [] : [];

  return (
    <MainLayout>
      <div className="flex h-full bg-[#0e1621]">
        {/* === Chat List === */}
        <div
          className={`${selectedChat ? 'hidden md:flex' : 'flex'
            } flex-col w-full md:w-80 lg:w-96 border-r border-[#232e3c] bg-[#17212b] flex-shrink-0`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#232e3c]">
            <h2 className="text-base font-semibold text-white mb-3">Чат</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
              />
            </div>
          </div>

          {/* Chat items */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              const initials = chat.type === 'group'
                ? 'КМ'
                : chat.name.split(' ').map((n) => n[0]).join('');

              return (
                <button
                  key={chat.id}
                  onClick={() => { setSelectedChat(chat); setShowMembers(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedChat?.id === chat.id
                      ? 'bg-[#3a73b8]/20'
                      : 'hover:bg-[#232e3c]'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white ${chat.type === 'group'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                      {chat.type === 'group' ? <Users className="w-5 h-5" /> : initials}
                    </div>
                    {chat.type === 'direct' && chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">{chat.name}</span>
                      <span className="text-[10px] text-[#6c7883] flex-shrink-0 ml-2">{chat.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-[#6c7883] truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-[#3a73b8] text-white text-[10px] rounded-full min-w-[1.25rem] px-1.5 py-0.5 text-center flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* === Chat Area === */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#17212b] border-b border-[#232e3c]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-[#6c7883] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedChat.name}</h3>
                  <p className="text-[11px] text-[#6c7883]">
                    {selectedChat.type === 'group'
                      ? `${selectedChat.participants?.length || 0} участников`
                      : selectedChat.isOnline
                        ? 'в сети'
                        : 'не в сети'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c] transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c] transition-colors">
                  <Video className="w-4 h-4" />
                </button>
                {selectedChat.type === 'group' && (
                  <button
                    onClick={() => setShowMembers(!showMembers)}
                    className={`p-2 rounded-lg transition-colors ${showMembers
                        ? 'text-[#3a73b8] bg-[#3a73b8]/10'
                        : 'text-[#6c7883] hover:text-white hover:bg-[#232e3c]'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Messages */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-xl ${msg.isOwn
                            ? 'bg-[#2b5278] text-white rounded-br-sm'
                            : 'bg-[#182533] text-white rounded-bl-sm'
                          }`}
                      >
                        {!msg.isOwn && (
                          <p className="text-[11px] font-medium text-blue-400 mb-0.5">{msg.sender}</p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className="text-[10px] text-white/40 text-right mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 bg-[#17212b] border-t border-[#232e3c]">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c] transition-colors flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder="Написать сообщение..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
                    />
                    <button className="p-2 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c] transition-colors flex-shrink-0">
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${messageText.trim()
                          ? 'bg-[#3a73b8] text-white hover:bg-[#4a83c8]'
                          : 'text-[#6c7883] bg-transparent cursor-default'
                        }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* === Group Members Panel === */}
              {showMembers && selectedChat.type === 'group' && selectedChat.participants && (
                <div className="w-64 border-l border-[#232e3c] bg-[#17212b] flex-shrink-0 hidden md:flex md:flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#232e3c]">
                    <h4 className="text-xs font-semibold text-[#6c7883] uppercase">
                      Участники ({selectedChat.participants.length})
                    </h4>
                    <button
                      onClick={() => setShowMembers(false)}
                      className="text-[#6c7883] hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {selectedChat.participants.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#232e3c] transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[11px] font-semibold text-white">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          {member.isOnline && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#17212b]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-[#6c7883] truncate">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No chat selected state */
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#232e3c] flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-[#6c7883]" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Выберите чат</h3>
              <p className="text-xs text-[#6c7883]">Начните общение из списка слева</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ChatPage;

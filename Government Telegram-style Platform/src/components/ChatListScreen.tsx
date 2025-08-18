import React, { useState } from 'react';
import { Search, Phone, Users, MoreVertical, Crown, Shield, Star, User } from 'lucide-react';

interface ChatListScreenProps {
  onChatSelect: (chat: any) => void;
  onCallsClick: () => void;
  onContactsClick: () => void;
  selectedChat?: any;
}

export default function ChatListScreen({ onChatSelect, onCallsClick, onContactsClick, selectedChat }: ChatListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Role icons mapping
  const roleIcons = {
    'Министр': { icon: Crown, color: 'text-red-400' },
    'Заместитель министра': { icon: Shield, color: 'text-orange-400' },
    'Начальник департамента': { icon: Star, color: 'text-blue-400' },
    'Начальник отдела': { icon: Shield, color: 'text-green-400' },
    'Сотрудник': { icon: User, color: 'text-[#aaaaaa]' },
    'Групповой чат': { icon: Users, color: 'text-[#8bb5ff]' },
    'Официальный канал': { icon: Crown, color: 'text-purple-400' },
  };

  const chats = [
    {
      id: 1,
      name: 'Министр экономики',
      fullName: 'Иванов Иван Иванович',
      role: 'Министр',
      lastMessage: 'Необходимо подготовить отчет по Q4',
      lastSender: null,
      time: '14:32',
      unread: 2,
      mentions: 1,
      isOnline: true,
      avatar: '🏛️',
      hasNewMessages: true,
    },
    {
      id: 2,
      name: 'Департамент финансов',
      role: 'Групповой чат',
      lastMessage: 'Бюджет на следующий год готов',
      lastSender: 'Петров П.П.',
      time: '13:45',
      unread: 0,
      mentions: 0,
      isOnline: false,
      avatar: '💰',
      isGroup: true,
      participantCount: 15,
    },
    {
      id: 3,
      name: 'Начальник отдела кадров',
      fullName: 'Козлова Елена Александровна',
      role: 'Начальник отдела',
      lastMessage: 'Когда планируется совещание?',
      lastSender: null,
      time: '12:15',
      unread: 1,
      mentions: 0,
      isOnline: true,
      avatar: '👤',
    },
    {
      id: 4,
      name: 'Канал приказов',
      role: 'Официальный канал',
      lastMessage: 'Приказ №1245 от 10.12.2024',
      lastSender: null,
      time: '11:30',
      unread: 0,
      mentions: 0,
      isOnline: false,
      avatar: '📋',
      isChannel: true,
      isPinned: true,
    },
    {
      id: 5,
      name: 'Петров А.И.',
      fullName: 'Петров Алексей Иванович',
      role: 'Сотрудник',
      lastMessage: 'Документы отправлены на подпись',
      lastSender: null,
      time: 'вчера',
      unread: 0,
      mentions: 0,
      isOnline: false,
      avatar: '👨‍💼',
    },
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    const roleData = roleIcons[role as keyof typeof roleIcons] || roleIcons['Сотрудник'];
    const IconComponent = roleData.icon;
    return <IconComponent className={`w-3 h-3 ${roleData.color}`} />;
  };

  return (
    <div className="h-full bg-[#212121] flex">
      {/* Chat List */}
      <div className="w-80 bg-[#212121] border-r border-[#3a3a3a] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl text-white font-medium">Чаты</h1>
            <div className="flex gap-2">
              <button
                onClick={onContactsClick}
                className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors"
                title="Контакты"
              >
                <Users className="w-5 h-5 text-[#aaaaaa]" />
              </button>
              <button
                onClick={onCallsClick}
                className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors"
                title="Звонки"
              >
                <Phone className="w-5 h-5 text-[#aaaaaa]" />
              </button>
              <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors">
                <MoreVertical className="w-5 h-5 text-[#aaaaaa]" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#3a3a3a] text-white placeholder-[#888888] rounded-lg border-none outline-none focus:bg-[#4a4a4a] transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`flex items-center p-3 cursor-pointer border-b border-[#2a2a2a] transition-colors ${
                selectedChat?.id === chat.id 
                  ? 'bg-[#3a3a3a]' 
                  : 'hover:bg-[#2a2a2a]'
              } ${chat.isPinned ? 'bg-[#2a2a2a]' : ''}`}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#4a4a4a] flex items-center justify-center text-xl">
                  {chat.avatar}
                </div>
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#212121]"></div>
                )}
                {chat.hasNewMessages && !chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#8bb5ff] rounded-full border-2 border-[#212121]"></div>
                )}
              </div>

              {/* Chat Info */}
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="text-white truncate font-medium">{chat.name}</h3>
                    {getRoleIcon(chat.role)}
                    {chat.isGroup && <span className="text-xs text-[#888888] ml-1">({chat.participantCount})</span>}
                    {chat.isPinned && <span className="text-xs text-[#8bb5ff]">📌</span>}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-[#888888]">{chat.time}</span>
                    {chat.unread > 0 && (
                      <span className="px-2 py-0.5 bg-[#8bb5ff] text-white text-xs rounded-full min-w-[20px] text-center font-medium">
                        {chat.unread}
                      </span>
                    )}
                    {chat.mentions > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center font-medium">
                        @{chat.mentions}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-[#aaaaaa]'}`}>
                    {chat.lastSender && (
                      <span className="text-[#8bb5ff] mr-1">{chat.lastSender}:</span>
                    )}
                    {chat.lastMessage}
                  </p>
                </div>
                <p className="text-xs text-[#888888] mt-0.5">{chat.role}</p>
              </div>
            </div>
          ))}
          
          {filteredChats.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-[#aaaaaa] text-lg">Чаты не найдены</p>
              <p className="text-[#888888] text-sm mt-2">Попробуйте другой поисковый запрос</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty State or Selected Chat Preview */}
      {!selectedChat && (
        <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-[#aaaaaa] text-lg">Выберите чат для начала общения</p>
            <p className="text-[#888888] text-sm mt-2">Откройте существующий диалог или создайте новый</p>
          </div>
        </div>
      )}
    </div>
  );
}
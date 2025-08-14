import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Paperclip, 
  Send,
  Plus,
  Search,
  MoreVertical,
  Users,
  Image,
  File,
  Mic,
  Smile
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';

interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  avatar?: string;
  participants?: number;
}

interface Message {
  id: string;
  content: string;
  type: 'text' | 'file' | 'image';
  sender: string;
  timestamp: string;
  isOwn: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Иван Иванов',
      type: 'direct',
      lastMessage: 'Отправил вам документы',
      lastMessageTime: '10:30',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      name: 'IT Отдел',
      type: 'group',
      lastMessage: 'Петр: Новое обновление системы',
      lastMessageTime: '09:45',
      unreadCount: 5,
      participants: 12,
    },
    {
      id: '3',
      name: 'Мария Петрова',
      type: 'direct',
      lastMessage: 'Спасибо за информацию!',
      lastMessageTime: 'Вчера',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '4',
      name: 'Планерка руководства',
      type: 'group',
      lastMessage: 'Алексей: Встреча перенесена на завтра',
      lastMessageTime: 'Вчера',
      unreadCount: 1,
      participants: 8,
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      content: 'Добро пожаловать в тестовый чат!',
      type: 'text',
      sender: 'Система',
      timestamp: '10:00',
      isOwn: false,
    },
    {
      id: '2',
      content: 'Здравствуйте! Проверяю функциональность чата.',
      type: 'text',
      sender: user?.fullName || 'Вы',
      timestamp: '10:01',
      isOwn: true,
    },
    {
      id: '3',
      content: 'budget_2024.xlsx',
      type: 'file',
      sender: 'Иван Иванов',
      timestamp: '10:02',
      isOwn: false,
      fileUrl: '#',
      fileName: 'budget_2024.xlsx',
      fileSize: 2048576,
    },
    {
      id: '4',
      content: 'Отлично! Файл получен.',
      type: 'text',
      sender: user?.fullName || 'Вы',
      timestamp: '10:03',
      isOwn: true,
    },
  ];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    console.log('Отправка сообщения:', messageText);
    // TODO: Implement actual message sending
    setMessageText('');
  };

  const handleFileUpload = () => {
    console.log('Выбор файла для отправки');
    // TODO: Implement file upload
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    console.log(`Начать ${type} звонок с:`, selectedChat?.name);
    // TODO: Implement call functionality
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Сообщения
              </h2>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {chat.type === 'group' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        chat.name.charAt(0)
                      )}
                    </div>
                    {chat.type === 'direct' && chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {chat.type === 'group' && (
                      <div className="flex items-center mt-1">
                        <Users className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-400">
                          {chat.participants} участников
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedChat.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        selectedChat.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedChat.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedChat.type === 'group' 
                          ? `${selectedChat.participants} участников`
                          : selectedChat.isOnline ? 'В сети' : 'Не в сети'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartCall('audio')}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartCall('video')}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      {!message.isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.sender}
                        </p>
                      )}
                      
                      {message.type === 'text' && (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      {message.type === 'file' && (
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium">{message.fileName}</p>
                            <p className="text-xs opacity-70">
                              {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Файл'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Image className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Введите сообщение..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Выберите чат
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Начните общение, выбрав чат из списка слева
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;

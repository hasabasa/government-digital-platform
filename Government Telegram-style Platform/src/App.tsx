import React, { useState, useEffect } from 'react';
import { Radio, MessageCircle, CheckSquare, Users, FileText, Phone, UserCircle, BarChart3 } from 'lucide-react';
import { useAuthStore } from './stores/auth.store';
import { useChatStore } from './stores/chat.store';
import { useTaskStore } from './stores/task.store';
import { useOrderStore } from './stores/order.store';
import { useReportStore } from './stores/report.store';
import { websocketService } from './services/websocket.service';
import RoleSelection from './components/RoleSelection';
import SearchBar from './components/SearchBar';
import NewsFeedScreen from './components/NewsFeedScreen';
import TasksScreen from './components/TasksScreen';
import ChatListScreen from './components/ChatListScreen';
import ChatConversationScreen from './components/ChatConversationScreen';
import OrdersScreen from './components/OrdersScreen';
import ReportsScreen from './components/ReportsScreen';
import ContactsScreen from './components/ContactsScreen';
import CallsScreen from './components/CallsScreen';
import SettingsScreen from './components/SettingsScreen';

type Screen = 'news' | 'tasks' | 'channels' | 'chats' | 'conversation' | 'orders' | 'reports' | 'contacts' | 'calls' | 'profile';

export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { setupWebSocket, cleanupWebSocket } = useChatStore();
  const { setupWebSocket: setupTaskWebSocket, cleanupWebSocket: cleanupTaskWebSocket } = useTaskStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('news');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Setup WebSocket connections when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupWebSocket();
      setupTaskWebSocket();
      
      return () => {
        cleanupWebSocket();
        cleanupTaskWebSocket();
      };
    }
  }, [isAuthenticated, setupWebSocket, setupTaskWebSocket, cleanupWebSocket, cleanupTaskWebSocket]);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'news', icon: Radio, label: 'Лента новостей', screen: 'news' as Screen },
    { id: 'tasks', icon: CheckSquare, label: 'Мои задачи', screen: 'tasks' as Screen },
    { id: 'channels', icon: Radio, label: 'Каналы', screen: 'channels' as Screen },
    { id: 'chats', icon: MessageCircle, label: 'Чаты', screen: 'chats' as Screen },
    { id: 'orders', icon: FileText, label: 'Приказы', screen: 'orders' as Screen },
    { id: 'reports', icon: BarChart3, label: 'Отчёты', screen: 'reports' as Screen },
  ];

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'chats', icon: MessageCircle, label: 'Чаты', screen: 'chats' as Screen },
    { id: 'calls', icon: Phone, label: 'Звонки', screen: 'calls' as Screen },
    { id: 'contacts', icon: Users, label: 'Контакты', screen: 'contacts' as Screen },
    { id: 'profile', icon: UserCircle, label: 'Мой профиль', screen: 'profile' as Screen },
  ];

  const handleRoleSelect = async (role: string) => {
    try {
      // Здесь должна быть реальная аутентификация
      // Пока используем mock для демонстрации
      const mockUser = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        firstName: 'Иван',
        lastName: 'Иванов',
        role: role as any,
        organization: 'Министерство',
        position: 'Сотрудник',
        isOnline: true,
        permissions: []
      };
      
      useAuthStore.getState().setUser(mockUser);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentScreen('news');
      setSelectedChat(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSidebarClick = (screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedChat(null);
  };

  const handleBottomNavClick = (screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedChat(null);
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setCurrentScreen('conversation');
  };

  const handleBackToChats = () => {
    setCurrentScreen('chats');
    setSelectedChat(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getRoleBasedScreens = (role: string) => {
    switch (role) {
      case 'minister':
        return ['news', 'tasks', 'channels', 'chats', 'orders', 'reports'];
      case 'department_head':
        return ['news', 'tasks', 'channels', 'chats', 'orders', 'reports'];
      case 'division_head':
        return ['news', 'tasks', 'chats', 'orders', 'reports'];
      case 'employee':
      default:
        return ['news', 'tasks', 'chats', 'reports'];
    }
  };

  const getFilteredSidebarItems = () => {
    if (!user) return [];
    const allowedScreens = getRoleBasedScreens(user.role);
    return sidebarItems.filter(item => allowedScreens.includes(item.screen));
  };

  const renderScreen = () => {
    const userRole = (user?.role || 'employee') as string;
    
    switch (currentScreen) {
      case 'news':
        return <NewsFeedScreen userRole={userRole} searchQuery={searchQuery} />;
      case 'tasks':
        return <TasksScreen userRole={userRole} searchQuery={searchQuery} />;
      case 'chats':
        return (
          <ChatListScreen 
            onChatSelect={handleChatSelect} 
            onCallsClick={() => setCurrentScreen('calls')} 
            onContactsClick={() => setCurrentScreen('contacts')}
            selectedChat={selectedChat}
          />
        );
      case 'conversation':
        return (
          <ChatConversationScreen 
            chat={selectedChat} 
            onBack={handleBackToChats}
            onCreateTask={() => setCurrentScreen('tasks')}
          />
        );
      case 'channels':
        return (
          <ChatListScreen 
            onChatSelect={handleChatSelect} 
            onCallsClick={() => setCurrentScreen('calls')} 
            onContactsClick={() => setCurrentScreen('contacts')}
            selectedChat={selectedChat}
          />
        );
      case 'orders':
        return <OrdersScreen userRole={userRole} />;
      case 'reports':
        return <ReportsScreen userRole={userRole} searchQuery={searchQuery} />;
      case 'contacts':
        return <ContactsScreen onBackToChats={() => setCurrentScreen('chats')} />;
      case 'calls':
        return <CallsScreen onBackToChats={() => setCurrentScreen('chats')} />;
      case 'profile':
        return <SettingsScreen />;
      default:
        return <NewsFeedScreen userRole={userRole} searchQuery={searchQuery} />;
    }
  };

  if (!isAuthenticated) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Top Search Bar - Always visible */}
      <div className="bg-[#2a2a2a] p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="w-20 bg-[#2a2a2a] flex flex-col items-center py-4 border-r border-gray-700">
            {getFilteredSidebarItems().map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.screen)}
                className={`
                  flex flex-col items-center justify-center p-3 mb-3 rounded-xl transition-all duration-200 group
                  ${currentScreen === item.screen 
                    ? 'bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white transform scale-110' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:transform hover:scale-105'
                  }
                `}
                title={item.label}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs text-center leading-tight">
                  {item.label.split(' ').map((word, index) => (
                    <div key={index}>{word}</div>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {renderScreen()}
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      {isMobile && (
        <div className="bg-[#2a2a2a] border-t border-gray-700 px-4 py-2">
          <div className="flex justify-center">
            <div className="flex bg-gray-700 rounded-2xl p-1">
              {bottomNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleBottomNavClick(item.screen)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
                    ${currentScreen === item.screen 
                      ? 'bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
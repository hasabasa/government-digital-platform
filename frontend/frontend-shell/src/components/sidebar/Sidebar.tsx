import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarHeader } from './SidebarHeader';
import { useAuthStore } from '../../stores/auth.store';
import { 
  Home,
  MessageSquare, 
  Phone, 
  Users, 
  FileText, 
  Settings,
  Briefcase,
  Hash,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Crown,
  Pin,
  Plus,
  Video,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className, 
  isMobile = false, 
  onClose 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Состояние для сворачивания секций
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    groups: true,
    directMessages: true,
  });

  // Основная навигация
  const mainNavigationItems = [
    {
      id: 'dashboard',
      label: 'Главная',
      path: '/',
      icon: Home,
    },
    {
      id: 'feed',
      label: 'Лента новостей',
      path: '/feed',
      icon: MessageSquare,
    },
    {
      id: 'calls',
      label: 'Звонки',
      path: '/calls',
      icon: Phone,
    },
    {
      id: 'orders',
      label: 'Задачи и поручения',
      path: '/orders',
      icon: Briefcase,
      managerOnly: true,
    },
  ];

  // Моковые данные каналов (в реальном приложении будут из API)
  const channels = [
    {
      id: 'general',
      name: 'Общие объявления',
      isPinned: true,
      hasUnread: false,
      type: 'announcement'
    },
    {
      id: 'ministry-finance',
      name: 'Министерство финансов',
      isPinned: true,
      hasUnread: true,
      type: 'ministry'
    },
    {
      id: 'dept-budget',
      name: 'Департамент бюджета',
      isPinned: false,
      hasUnread: false,
      type: 'department'
    },
    {
      id: 'div-analytics',
      name: 'Отдел аналитики',
      isPinned: false,
      hasUnread: true,
      type: 'division'
    },
  ];

  // Моковые данные групп
  const groups = [
    {
      id: 'project-alpha',
      name: 'Проект "Цифровизация"',
      hasUnread: true,
      participantCount: 12,
      hasCall: false
    },
    {
      id: 'budget-planning',
      name: 'Планирование бюджета',
      hasUnread: false,
      participantCount: 8,
      hasCall: true
    },
    {
      id: 'emergency-response',
      name: 'Антикризисная группа',
      hasUnread: true,
      participantCount: 5,
      hasCall: false
    },
  ];

  // Моковые данные личных чатов
  const directMessages = [
    {
      id: 'user-1',
      name: 'Асылбек Нурланов',
      position: 'Министр финансов',
      isOnline: true,
      hasUnread: false,
      lastMessage: '15:30'
    },
    {
      id: 'user-2', 
      name: 'Гульнара Касымова',
      position: 'Зам. министра',
      isOnline: false,
      hasUnread: true,
      lastMessage: '14:45'
    },
    {
      id: 'user-3',
      name: 'Ерлан Темиров',
      position: 'Начальник отдела',
      isOnline: true,
      hasUnread: false,
      lastMessage: 'Вчера'
    },
  ];

  const filteredMainItems = mainNavigationItems.filter(item => 
    !item.managerOnly || 
    user?.role === 'admin' || 
    user?.role === 'department_head' ||
    user?.role === 'government_official'
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Crown;
      case 'ministry': return Hash;
      case 'department': return Hash;
      case 'division': return Hash;
      default: return Hash;
    }
  };

  return (
    <div
      className={clsx(
        'sidebar flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        isMobile ? 'w-full' : 'w-72',
        className
      )}
    >
      {/* Header */}
      <SidebarHeader onClose={onClose} />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Основная навигация */}
        <nav className="px-4 space-y-1 mb-6">
          {filteredMainItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Каналы */}
        <div className="px-4 mb-6">
          <button
            onClick={() => toggleSection('channels')}
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
          >
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>Каналы</span>
            </div>
            {expandedSections.channels ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.channels && (
            <div className="mt-2 space-y-1">
              {/* Закрепленные каналы */}
              {channels.filter(channel => channel.isPinned).map((channel) => {
                const ChannelIcon = getChannelIcon(channel.type);
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleNavigate(`/channels/${channel.id}`)}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pin className="w-3 h-3 text-gray-400" />
                    <ChannelIcon className="w-4 h-4" />
                    <span className="text-sm truncate flex-1">{channel.name}</span>
                    {channel.hasUnread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
              
              {/* Обычные каналы */}
              {channels.filter(channel => !channel.isPinned).map((channel) => {
                const ChannelIcon = getChannelIcon(channel.type);
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleNavigate(`/channels/${channel.id}`)}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChannelIcon className="w-4 h-4" />
                    <span className="text-sm truncate flex-1">{channel.name}</span>
                    {channel.hasUnread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
              
              {/* Добавить канал (только для администраторов) */}
              {(user?.role === 'admin' || user?.role === 'department_head') && (
                <button
                  onClick={() => handleNavigate('/channels/create')}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Создать канал</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Группы */}
        <div className="px-4 mb-6">
          <button
            onClick={() => toggleSection('groups')}
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Группы</span>
            </div>
            {expandedSections.groups ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.groups && (
            <div className="mt-2 space-y-1">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleNavigate(`/groups/${group.id}`)}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Users className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm truncate">{group.name}</span>
                      {group.hasCall && (
                        <Video className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{group.participantCount} участников</span>
                  </div>
                  {group.hasUnread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
              
              {/* Создать группу */}
              <button
                onClick={() => handleNavigate('/groups/create')}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Создать группу</span>
              </button>
            </div>
          )}
        </div>

        {/* Личные сообщения */}
        <div className="px-4 mb-6">
          <button
            onClick={() => toggleSection('directMessages')}
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Личные чаты</span>
            </div>
            {expandedSections.directMessages ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.directMessages && (
            <div className="mt-2 space-y-1">
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => handleNavigate(`/chat/${dm.id}`)}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {dm.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {dm.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{dm.name}</span>
                      <span className="text-xs text-gray-500">{dm.lastMessage}</span>
                    </div>
                    <span className="text-xs text-gray-500 truncate">{dm.position}</span>
                  </div>
                  {dm.hasUnread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Status */}
        <div className="px-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">В сети</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {user?.organization || 'Министерство финансов'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

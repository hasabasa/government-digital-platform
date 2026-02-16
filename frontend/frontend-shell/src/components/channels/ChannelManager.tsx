import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Hash,
  Pin,
  PinOff,
  Crown,
  Building,

  Plus,
  Search,
  Star,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  BellOff,

  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react';

interface ChannelManagerProps {
  className?: string;
  onChannelSelect?: (channelId: string) => void;
}

interface Channel {
  id: string;
  name: string;
  type: 'announcement' | 'company' | 'department' | 'team' | 'general';
  isPinned: boolean;
  hasUnread: boolean;
  unreadCount?: number;
  isPrivate: boolean;
  isMuted: boolean;
  isSubscribed: boolean;
  description?: string;
  memberCount: number;
  organizationPath: string;
  createdAt: string;
  lastActivity: string;
}

// Моковые данные каналов
const mockChannels: Channel[] = [
  {
    id: 'general',
    name: 'Общие объявления',
    type: 'announcement',
    isPinned: true,
    hasUnread: false,
    unreadCount: 0,
    isPrivate: false,
    isMuted: false,
    isSubscribed: true,
    description: 'Объявления и новости компании Cube Demper',
    memberCount: 12,
    organizationPath: 'Cube Demper',
    createdAt: '2024-01-01',
    lastActivity: '2 мин назад'
  },
  {
    id: 'dev-team',
    name: 'Разработка',
    type: 'department',
    isPinned: true,
    hasUnread: true,
    unreadCount: 3,
    isPrivate: false,
    isMuted: false,
    isSubscribed: true,
    description: 'Обсуждения по разработке продуктов',
    memberCount: 5,
    organizationPath: 'Cube Demper → Разработка',
    createdAt: '2024-01-15',
    lastActivity: '15 мин назад'
  },
  {
    id: 'sales-team',
    name: 'Продажи',
    type: 'department',
    isPinned: false,
    hasUnread: false,
    unreadCount: 0,
    isPrivate: false,
    isMuted: true,
    isSubscribed: true,
    description: 'Планирование продаж и работа с клиентами',
    memberCount: 4,
    organizationPath: 'Cube Demper → Продажи',
    createdAt: '2024-02-01',
    lastActivity: '1 час назад'
  },
  {
    id: 'marketing-team',
    name: 'Маркетинг',
    type: 'team',
    isPinned: false,
    hasUnread: true,
    unreadCount: 5,
    isPrivate: false,
    isMuted: false,
    isSubscribed: true,
    description: 'Маркетинговые кампании и аналитика',
    memberCount: 3,
    organizationPath: 'Cube Demper → Маркетинг',
    createdAt: '2024-03-01',
    lastActivity: '30 мин назад'
  },
  {
    id: 'project-alpha',
    name: 'Проект Alpha',
    type: 'general',
    isPinned: false,
    hasUnread: true,
    unreadCount: 2,
    isPrivate: true,
    isMuted: false,
    isSubscribed: true,
    description: 'Частный канал для проекта Alpha',
    memberCount: 4,
    organizationPath: 'Кросс-команда',
    createdAt: '2024-06-01',
    lastActivity: '5 мин назад'
  },
  {
    id: 'finance-ops',
    name: 'Финансы',
    type: 'general',
    isPinned: false,
    hasUnread: false,
    unreadCount: 0,
    isPrivate: true,
    isMuted: false,
    isSubscribed: false,
    description: 'Финансовые операции и отчётность',
    memberCount: 3,
    organizationPath: 'Cube Demper → Руководство',
    createdAt: '2024-01-01',
    lastActivity: '2 дня назад'
  }
];

export const ChannelManager: React.FC<ChannelManagerProps> = ({ 
  className, 
  onChannelSelect 
}) => {
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    pinned: true,
    subscribed: true,
    available: false
  });
  const [showManagement, setShowManagement] = useState(false);

  // Фильтрация каналов по поисковому запросу
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Группировка каналов
  const pinnedChannels = filteredChannels.filter(channel => channel.isPinned);
  const subscribedChannels = filteredChannels.filter(channel => !channel.isPinned && channel.isSubscribed);
  const availableChannels = filteredChannels.filter(channel => !channel.isSubscribed);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const togglePin = (channelId: string) => {
    setChannels(prev => prev.map(channel =>
      channel.id === channelId
        ? { ...channel, isPinned: !channel.isPinned }
        : channel
    ));
  };

  const toggleMute = (channelId: string) => {
    setChannels(prev => prev.map(channel =>
      channel.id === channelId
        ? { ...channel, isMuted: !channel.isMuted }
        : channel
    ));
  };

  const toggleSubscription = (channelId: string) => {
    setChannels(prev => prev.map(channel =>
      channel.id === channelId
        ? { ...channel, isSubscribed: !channel.isSubscribed }
        : channel
    ));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Crown;
      case 'company': return Building;
      case 'department': return Hash;
      case 'team': return Hash;
      case 'general': return Hash;
      default: return Hash;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'text-yellow-600 dark:text-yellow-400';
      case 'company': return 'text-purple-600 dark:text-purple-400';
      case 'department': return 'text-blue-600 dark:text-blue-400';
      case 'team': return 'text-green-600 dark:text-green-400';
      case 'general': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderChannel = (channel: Channel, showActions = false) => {
    const ChannelIcon = getChannelIcon(channel.type);
    const iconColorClass = getChannelTypeColor(channel.type);

    return (
      <div
        key={channel.id}
        className={clsx(
          'group flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          channel.hasUnread && !channel.isMuted && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        onClick={() => onChannelSelect?.(channel.id)}
      >
        {/* Channel Icon */}
        <div className="flex items-center space-x-2">
          {channel.isPinned && (
            <Pin className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          )}
          <ChannelIcon className={clsx('w-4 h-4', iconColorClass)} />
          {channel.isPrivate && (
            <Eye className="w-3 h-3 text-gray-400" />
          )}
        </div>

        {/* Channel Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={clsx(
              'text-sm font-medium truncate',
              channel.hasUnread && !channel.isMuted
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
            )}>
              {channel.name}
            </span>
            {channel.isMuted && (
              <VolumeX className="w-3 h-3 text-gray-400" />
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {channel.memberCount} участников • {channel.lastActivity}
          </div>
        </div>

        {/* Unread Badge & Actions */}
        <div className="flex items-center space-x-2">
          {channel.hasUnread && !channel.isMuted && channel.unreadCount && channel.unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full min-w-[1.25rem] text-center">
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
            </span>
          )}
          
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(channel.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                title={channel.isPinned ? 'Открепить' : 'Закрепить'}
              >
                {channel.isPinned ? (
                  <PinOff className="w-3 h-3" />
                ) : (
                  <Pin className="w-3 h-3" />
                )}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(channel.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                title={channel.isMuted ? 'Включить уведомления' : 'Отключить уведомления'}
              >
                {channel.isMuted ? (
                  <Bell className="w-3 h-3" />
                ) : (
                  <BellOff className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={clsx('bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Каналы
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowManagement(!showManagement)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                showManagement
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              title="Управление каналами"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск каналов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Channel Lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Закрепленные каналы */}
        {pinnedChannels.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('pinned')}
              className="flex items-center justify-between w-full mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Закрепленные</span>
              </div>
              {expandedSections.pinned ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.pinned && (
              <div className="space-y-1">
                {pinnedChannels.map(channel => renderChannel(channel, showManagement))}
              </div>
            )}
          </div>
        )}

        {/* Подписанные каналы */}
        {subscribedChannels.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => toggleSection('subscribed')}
              className="flex items-center justify-between w-full mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4" />
                <span>Мои каналы</span>
              </div>
              {expandedSections.subscribed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.subscribed && (
              <div className="space-y-1">
                {subscribedChannels.map(channel => renderChannel(channel, showManagement))}
              </div>
            )}
          </div>
        )}

        {/* Доступные каналы */}
        {availableChannels.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => toggleSection('available')}
              className="flex items-center justify-between w-full mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Доступные для подписки</span>
              </div>
              {expandedSections.available ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.available && (
              <div className="space-y-1">
                {availableChannels.map(channel => (
                  <div
                    key={channel.id}
                    className="group flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      {React.createElement(getChannelIcon(channel.type), {
                        className: clsx('w-4 h-4', getChannelTypeColor(channel.type))
                      })}
                      {channel.isPrivate && (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {channel.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {channel.memberCount} участников
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleSubscription(channel.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Присоединиться
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredChannels.length === 0 && searchTerm && (
          <div className="p-4 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              Каналы не найдены
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Попробуйте изменить поисковый запрос
            </div>
          </div>
        )}
      </div>

      {/* Management Mode Info */}
      {showManagement && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
            Режим управления активен
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400">
            Наведите курсор на канал для доступа к действиям закрепления и уведомлений
          </div>
        </div>
      )}
    </div>
  );
};

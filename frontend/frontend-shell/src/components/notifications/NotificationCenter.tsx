import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Bell,
  X,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle,
  Award,
  Users,
  Video,
  FileText,
  MessageSquare,
  Calendar,
  Star,
  Shield,
  ChevronDown,
  ChevronRight,
  Settings,
  Archive,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type NotificationType = 
  | 'task_assigned' 
  | 'task_completed' 
  | 'task_overdue'
  | 'disciplinary_action'
  | 'commendation'
  | 'call_incoming'
  | 'call_missed'
  | 'meeting_reminder'
  | 'message_mention'
  | 'system_update'
  | 'document_approval';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  actionRequired: boolean;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedUserPosition?: string;
  metadata?: {
    taskId?: string;
    callId?: string;
    documentId?: string;
    meetingId?: string;
    chatId?: string;
  };
}

// Моковые данные уведомлений
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task_assigned',
    title: 'Новая задача назначена',
    message: 'Вам назначена задача "Подготовка квартального отчета" со сроком до 25 марта',
    timestamp: '5 мин назад',
    isRead: false,
    isImportant: true,
    actionRequired: true,
    relatedUserId: 'user-1',
    relatedUserName: 'Асылбек Нурланов',
    relatedUserPosition: 'Министр финансов',
    metadata: { taskId: 'task-123' }
  },
  {
    id: '2',
    type: 'call_incoming',
    title: 'Входящий звонок',
    message: 'Гульнара Касымова начала групповой видеозвонок в группе "Планирование бюджета"',
    timestamp: '10 мин назад',
    isRead: false,
    isImportant: true,
    actionRequired: true,
    relatedUserId: 'user-2',
    relatedUserName: 'Гульнара Касымова',
    relatedUserPosition: 'Зам. министра',
    metadata: { callId: 'call-456' }
  },
  {
    id: '3',
    type: 'commendation',
    title: 'Получена благодарность',
    message: 'Министр финансов выразил благодарность за качественное выполнение аналитической работы',
    timestamp: '1 час назад',
    isRead: false,
    isImportant: true,
    actionRequired: false,
    relatedUserId: 'user-1',
    relatedUserName: 'Асылбек Нурланов',
    relatedUserPosition: 'Министр финансов'
  },
  {
    id: '4',
    type: 'meeting_reminder',
    title: 'Напоминание о совещании',
    message: 'Через 30 минут начнется совещание "Обсуждение бюджета на 2024 год"',
    timestamp: '1 час назад',
    isRead: true,
    isImportant: false,
    actionRequired: true,
    metadata: { meetingId: 'meeting-789' }
  },
  {
    id: '5',
    type: 'task_completed',
    title: 'Задача выполнена',
    message: 'Ерлан Темиров завершил задачу "Анализ налоговых поступлений"',
    timestamp: '2 часа назад',
    isRead: true,
    isImportant: false,
    actionRequired: false,
    relatedUserId: 'user-3',
    relatedUserName: 'Ерлан Темиров',
    relatedUserPosition: 'Начальник отдела',
    metadata: { taskId: 'task-456' }
  },
  {
    id: '6',
    type: 'message_mention',
    title: 'Упоминание в сообщении',
    message: 'Вас упомянули в канале "Министерство финансов"',
    timestamp: '3 часа назад',
    isRead: true,
    isImportant: false,
    actionRequired: false,
    metadata: { chatId: 'channel-finance' }
  },
  {
    id: '7',
    type: 'disciplinary_action',
    title: 'Дисциплинарное взыскание',
    message: 'Получено замечание за нарушение сроков предоставления отчетности',
    timestamp: '1 день назад',
    isRead: true,
    isImportant: true,
    actionRequired: false,
    relatedUserId: 'user-1',
    relatedUserName: 'Асылбек Нурланов',
    relatedUserPosition: 'Министр финансов'
  },
  {
    id: '8',
    type: 'system_update',
    title: 'Обновление системы',
    message: 'Добавлены новые функции управления задачами и улучшена система уведомлений',
    timestamp: '2 дня назад',
    isRead: true,
    isImportant: false,
    actionRequired: false
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [expandedSections, setExpandedSections] = useState({
    actionRequired: true,
    recent: true,
    older: false
  });

  // Фильтрация уведомлений
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'important':
        return notification.isImportant;
      default:
        return true;
    }
  });

  // Группировка уведомлений
  const actionRequiredNotifications = filteredNotifications.filter(n => n.actionRequired && !n.isRead);
  const recentNotifications = filteredNotifications.filter(n => !n.actionRequired && !n.isRead);
  const olderNotifications = filteredNotifications.filter(n => n.isRead);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
        return FileText;
      case 'task_overdue':
        return AlertTriangle;
      case 'disciplinary_action':
        return Shield;
      case 'commendation':
        return Award;
      case 'call_incoming':
      case 'call_missed':
        return Video;
      case 'meeting_reminder':
        return Calendar;
      case 'message_mention':
        return MessageSquare;
      case 'system_update':
        return Settings;
      case 'document_approval':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'task_completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'task_overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'disciplinary_action':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'commendation':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      case 'call_incoming':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'call_missed':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'meeting_reminder':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
      case 'message_mention':
        return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-400';
      case 'system_update':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderNotification = (notification: Notification) => {
    const Icon = getNotificationIcon(notification.type);
    const colorClass = getNotificationColor(notification.type);

    return (
      <div
        key={notification.id}
        className={clsx(
          'group p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          !notification.isRead && 'bg-blue-50 dark:bg-blue-900/10'
        )}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', colorClass)}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={clsx(
                    'text-sm font-medium truncate',
                    !notification.isRead
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {notification.title}
                  </h4>
                  {notification.isImportant && (
                    <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  )}
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                
                {notification.relatedUserName && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {notification.relatedUserName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{notification.relatedUserName}</span>
                      {notification.relatedUserPosition && (
                        <span> • {notification.relatedUserPosition}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {notification.timestamp}
                  </span>
                  
                  {notification.actionRequired && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">
                      Требует действия
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Отметить как прочитанное"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  title="Удалить уведомление"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={clsx(
      'fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300',
      isOpen ? 'translate-x-0' : 'translate-x-full',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Уведомления
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            disabled={unreadCount === 0}
          >
            Прочитать все
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 p-4 bg-gray-50 dark:bg-gray-800">
        {[
          { key: 'all' as const, label: 'Все' },
          { key: 'unread' as const, label: 'Непрочитанные' },
          { key: 'important' as const, label: 'Важные' },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={clsx(
              'px-3 py-1 text-xs rounded-full transition-colors',
              filter === filterOption.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        {/* Требуют действия */}
        {actionRequiredNotifications.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('actionRequired')}
              className="flex items-center justify-between w-full p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Требуют действия ({actionRequiredNotifications.length})
                </span>
              </div>
              {expandedSections.actionRequired ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.actionRequired && (
              <div>
                {actionRequiredNotifications.map(renderNotification)}
              </div>
            )}
          </div>
        )}

        {/* Недавние */}
        {recentNotifications.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('recent')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Недавние ({recentNotifications.length})
                </span>
              </div>
              {expandedSections.recent ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.recent && (
              <div>
                {recentNotifications.map(renderNotification)}
              </div>
            )}
          </div>
        )}

        {/* Старые */}
        {olderNotifications.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('older')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Ранее ({olderNotifications.length})
                </span>
              </div>
              {expandedSections.older ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.older && (
              <div>
                {olderNotifications.map(renderNotification)}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bell className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Нет уведомлений
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {filter === 'unread' && 'Все уведомления прочитаны'}
              {filter === 'important' && 'Нет важных уведомлений'}
              {filter === 'all' && 'У вас пока нет уведомлений'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

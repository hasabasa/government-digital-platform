import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  MessageSquare, 
  Briefcase, 
  FileText, 
  Video,
  Users,
  Settings,
  Bell,
  Phone
} from 'lucide-react';

interface GroupTabsProps {
  groupId: string;
  groupName: string;
  className?: string;
}

type TabType = 'chat' | 'tasks' | 'files' | 'calls' | 'members' | 'settings';

export const GroupTabs: React.FC<GroupTabsProps> = ({ 
  groupId, 
  groupName, 
  className 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const tabs = [
    {
      id: 'chat' as const,
      label: 'Чат',
      icon: MessageSquare,
      count: undefined,
      hasNotification: true,
    },
    {
      id: 'tasks' as const,
      label: 'Задачи',
      icon: Briefcase,
      count: 3,
      hasNotification: false,
    },
    {
      id: 'files' as const,
      label: 'Файлы',
      icon: FileText,
      count: 12,
      hasNotification: false,
    },
    {
      id: 'calls' as const,
      label: 'Звонки',
      icon: Video,
      count: undefined,
      hasNotification: false,
    },
    {
      id: 'members' as const,
      label: 'Участники',
      icon: Users,
      count: 8,
      hasNotification: false,
    },
    {
      id: 'settings' as const,
      label: 'Настройки',
      icon: Settings,
      count: undefined,
      hasNotification: false,
      adminOnly: true,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {groupName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    8 участников • 3 в сети
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Sample messages */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    АН
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Асылбек Нурланов
                      </span>
                      <span className="text-xs text-gray-500">Сегодня в 14:30</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Коллеги, напоминаю о совещании завтра в 10:00. Подготовьте отчеты по текущим проектам.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    ГК
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Гульнара Касымова
                      </span>
                      <span className="text-xs text-gray-500">Сегодня в 14:35</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Понял. Отчет по бюджетному планированию готов, отправлю до конца дня.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Отправить
                </button>
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Задачи группы
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Новая задача
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Active Tasks */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Подготовка квартального отчета
                  </h4>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                    В работе
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Составить детальный анализ расходов за Q1 2024
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Срок: 25 март 2024</span>
                  <span>Исполнитель: Ерлан Темиров</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Анализ эффективности программ
                  </h4>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                    Выполнено
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Оценить результативность социальных программ
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Выполнено: 20 март 2024</span>
                  <span>Исполнитель: Гульнара Касымова</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Файлы группы
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Загрузить файл
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* File items */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Бюджетный план 2024.pdf
                    </h4>
                    <p className="text-xs text-gray-500">2.3 МБ</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Добавлен: Гульнара Касымова • 2 дня назад
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Аналитический отчет.xlsx
                    </h4>
                    <p className="text-xs text-gray-500">1.8 МБ</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Добавлен: Ерлан Темиров • 1 неделя назад
                </div>
              </div>
            </div>
          </div>
        );

      case 'calls':
        return (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                История звонков
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Начать звонок
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Планерка по бюджету
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">Сегодня, 10:30</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Длительность: 45 мин • Участники: 6 человек
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Обсуждение проекта
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">Вчера, 16:00</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Длительность: 23 мин • Участники: 3 человека
                </div>
              </div>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Участники группы
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Добавить участника
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Асылбек Нурланов', position: 'Министр финансов', role: 'Администратор', online: true },
                { name: 'Гульнара Касымова', position: 'Зам. министра', role: 'Модератор', online: true },
                { name: 'Ерлан Темиров', position: 'Начальник отдела', role: 'Участник', online: false },
                { name: 'Айгуль Сарсенова', position: 'Главный специалист', role: 'Участник', online: true },
              ].map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {member.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.position}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {member.role}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Настройки группы
            </h3>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Основные настройки
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Название группы
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Описание
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Краткое описание группы..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Права доступа
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Только участники могут добавлять новых членов
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Требовать одобрение для присоединения
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Разрешить участникам инициировать звонки
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={clsx('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          // Hide admin-only tabs for non-admin users
          if (tab.adminOnly) {
            // In real app, check user permissions
            // For now, show for all users
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              
              {/* Notification indicator */}
              {tab.hasNotification && !isActive && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
              
              {/* Count badge */}
              {tab.count !== undefined && (
                <span className={clsx(
                  'px-2 py-0.5 text-xs rounded-full',
                  isActive
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

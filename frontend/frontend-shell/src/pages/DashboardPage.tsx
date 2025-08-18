import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuthStore } from '../stores/auth.store';
import { 
  Bell, 
  Calendar, 
  FileText, 
  Users, 
  Phone, 
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const stats = [
    { label: 'Новые сообщения', value: '12', icon: MessageCircle, color: 'text-blue-500' },
    { label: 'Активные задачи', value: '5', icon: FileText, color: 'text-green-500' },
    { label: 'Входящие звонки', value: '3', icon: Phone, color: 'text-purple-500' },
    { label: 'Участники онлайн', value: '24', icon: Users, color: 'text-orange-500' },
  ];

  const quickActions = [
    { label: 'Создать задачу', icon: FileText, path: '/orders' },
    { label: 'Начать звонок', icon: Phone, path: '/calls' },
    { label: 'Новое сообщение', icon: MessageCircle, path: '/chat' },
    { label: 'Создать группу', icon: Users, path: '/groups/create' },
  ];

  return (
    <MainLayout>
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Добро пожаловать, {user?.firstName || 'Коллега'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Быстрые действия */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => window.location.href = action.path}
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Последние активности */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Последние активности</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Новое сообщение в канале #Министерство финансов
              </span>
              <span className="text-xs text-gray-500 ml-auto">2 мин назад</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Создана новая задача "Подготовка отчета"
              </span>
              <span className="text-xs text-gray-500 ml-auto">15 мин назад</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Запланирован звонок на 15:00
              </span>
              <span className="text-xs text-gray-500 ml-auto">1 час назад</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  User,
  Building,
  Crown,
  Users,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  FileText,
  MessageSquare,
  Video,
  Settings,
  Edit3,
  Shield,
  Star
} from 'lucide-react';

interface UserProfileProps {
  userId: string;
  className?: string;
}

// Моковые данные (в реальном приложении будут из API)
const mockUserData = {
  id: 'user-1',
  firstName: 'Асылбек',
  lastName: 'Нурланов',
  middleName: 'Серикович',
  position: 'Министр финансов',
  email: 'a.nurlan@minfin.gov.kz',
  phone: '+7 (701) 234-56-78',
  avatar: null,
  joinDate: '2022-01-15',
  location: 'Астана, Казахстан',
  
  // Иерархическая информация
  hierarchy: {
    // Руководители (цепочка вверх)
    supervisors: [
      {
        id: 'president',
        name: 'Касым-Жомарт Токаев',
        position: 'Президент Республики Казахстан',
        level: 1,
        organizationPath: 'Правительство РК'
      }
    ],
    
    // Текущий пользователь
    current: {
      level: 2,
      organizationPath: 'Правительство РК → Министерство финансов',
      organization: 'Министерство финансов',
      department: null,
      directSubordinates: 8,
      totalSubordinates: 156
    },
    
    // Прямые подчиненные
    directReports: [
      {
        id: 'user-2',
        name: 'Гульнара Касымова',
        position: 'Заместитель министра',
        department: 'Бюджетная политика',
        subordinates: 23,
        avatar: null
      },
      {
        id: 'user-3',
        name: 'Ерлан Темиров',
        position: 'Заместитель министра',
        department: 'Налоговая политика',
        subordinates: 31,
        avatar: null
      },
      {
        id: 'user-4',
        name: 'Айгуль Сарсенова',
        position: 'Заместитель министра',
        department: 'Финансовый контроль',
        subordinates: 28,
        avatar: null
      }
    ]
  },
  
  // Статистика
  stats: {
    completedTasks: 142,
    activeTasks: 8,
    commendations: 5,
    yearsOfService: 12,
    teamSize: 156
  },
  
  // Последняя активность
  recentActivity: [
    {
      type: 'task_completed',
      description: 'Завершена задача "Квартальный отчет"',
      timestamp: '2 часа назад'
    },
    {
      type: 'meeting',
      description: 'Участие в совещании "Бюджетное планирование"',
      timestamp: '1 день назад'
    },
    {
      type: 'document',
      description: 'Подписан приказ №145',
      timestamp: '2 дня назад'
    }
  ]
};

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  className 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'activity'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    supervisors: true,
    directReports: true,
    departments: false
  });

  const user = mockUserData; // В реальном приложении - загрузка по userId

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return FileText;
      case 'meeting': return Video;
      case 'document': return FileText;
      default: return MessageSquare;
    }
  };

  const generateInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const tabs = [
    { id: 'overview' as const, label: 'Обзор', icon: User },
    { id: 'hierarchy' as const, label: 'Иерархия', icon: Building },
    { id: 'activity' as const, label: 'Активность', icon: TrendingUp },
  ];

  return (
    <div className={clsx('bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="relative">
        {/* Cover background */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-700 rounded-t-lg"></div>
        
        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {generateInitials(`${user.firstName} ${user.lastName}`)}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            
            {/* Basic info */}
            <div className="flex-1 mt-4 sm:mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                    {user.position}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {user.hierarchy.current.organizationPath}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>Написать</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Video className="w-4 h-4" />
                    <span>Звонок</span>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                В должности с {new Date(user.joinDate).toLocaleDateString('ru')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {user.stats.completedTasks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Выполнено задач
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {user.stats.activeTasks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Активных задач
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {user.stats.commendations}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Благодарностей
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {user.stats.yearsOfService}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Лет стажа
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {user.stats.teamSize}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Размер команды
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Последняя активность
              </h3>
              <div className="space-y-3">
                {user.recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="space-y-6">
            {/* Руководители */}
            {user.hierarchy.supervisors.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => toggleSection('supervisors')}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <span>Руководство</span>
                  </h3>
                  {expandedSections.supervisors ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {expandedSections.supervisors && (
                  <div className="space-y-3">
                    {user.hierarchy.supervisors.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {supervisor.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {supervisor.position}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {supervisor.organizationPath}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Текущая позиция */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>{user.firstName} {user.lastName}</span>
                    <Star className="w-4 h-4 text-blue-500" />
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.position}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.hierarchy.current.organizationPath}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    Уровень {user.hierarchy.current.level}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.hierarchy.current.directSubordinates} прямых подчиненных
                  </div>
                </div>
              </div>
            </div>

            {/* Подчиненные */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <button
                onClick={() => toggleSection('directReports')}
                className="flex items-center justify-between w-full mb-4"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Прямые подчиненные ({user.hierarchy.directReports.length})</span>
                </h3>
                {expandedSections.directReports ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.directReports && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {user.hierarchy.directReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {generateInitials(report.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {report.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {report.position}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {report.department} • {report.subordinates} подчиненных
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Организационная структура */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Building className="w-5 h-5 text-gray-500" />
                <span>Общая структура подчинения</span>
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Прямых подчиненных: <strong>{user.hierarchy.current.directSubordinates}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Всего в команде: <strong>{user.hierarchy.current.totalSubordinates}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Организация: <strong>{user.hierarchy.current.organization}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Детальная активность
              </h3>
              <div className="space-y-4">
                {user.recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

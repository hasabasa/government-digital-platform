import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical,
  Settings,
  UserPlus,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  type: 'open' | 'closed' | 'secret';
  memberCount: number;
  messageCount: number;
  lastActivity: string;
  isOwner: boolean;
  role: 'admin' | 'moderator' | 'member';
  avatar?: string;
  tags: string[];
}

const GroupsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    type: 'open' as const,
    tags: '',
  });

  // Mock data
  const groups: Group[] = [
    {
      id: '1',
      name: 'IT Отдел',
      description: 'Обсуждение технических вопросов и новостей IT',
      type: 'open',
      memberCount: 15,
      messageCount: 234,
      lastActivity: '2 часа назад',
      isOwner: false,
      role: 'member',
      tags: ['технологии', 'поддержка'],
    },
    {
      id: '2',
      name: 'Планерка руководства',
      description: 'Еженедельные совещания руководящего состава',
      type: 'closed',
      memberCount: 8,
      messageCount: 67,
      lastActivity: '1 день назад',
      isOwner: true,
      role: 'admin',
      tags: ['руководство', 'планы'],
    },
    {
      id: '3',
      name: 'Проект Цифровизация',
      description: 'Обсуждение внедрения цифровых решений',
      type: 'open',
      memberCount: 23,
      messageCount: 156,
      lastActivity: '30 минут назад',
      isOwner: false,
      role: 'moderator',
      tags: ['проект', 'цифровизация'],
    },
    {
      id: '4',
      name: 'Секретная группа',
      description: 'Конфиденциальная информация',
      type: 'secret',
      memberCount: 5,
      messageCount: 12,
      lastActivity: '1 неделю назад',
      isOwner: false,
      role: 'member',
      tags: ['конфиденциально'],
    },
  ];

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateGroup = () => {
    if (!newGroupData.name.trim()) {
      toast.error('Введите название группы');
      return;
    }

    console.log('Создание группы:', newGroupData);
    toast.success(`Группа "${newGroupData.name}" создана!`);
    
    // Reset form
    setNewGroupData({
      name: '',
      description: '',
      type: 'open',
      tags: '',
    });
    setShowCreateModal(false);
  };

  const handleJoinGroup = (group: Group) => {
    console.log('Присоединение к группе:', group.name);
    toast.success(`Вы присоединились к группе "${group.name}"`);
  };

  const handleLeaveGroup = (group: Group) => {
    console.log('Выход из группы:', group.name);
    toast.success(`Вы покинули группу "${group.name}"`);
  };

  const handleManageGroup = (group: Group) => {
    console.log('Управление группой:', group.name);
    setSelectedGroup(group);
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'open':
        return <Eye className="w-4 h-4" />;
      case 'closed':
        return <EyeOff className="w-4 h-4" />;
      case 'secret':
        return <Lock className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'open':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'secret':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Группы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управляйте группами и участвуйте в обсуждениях
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Создать группу
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск групп..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Group Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </h3>
                      {getRoleIcon(group.role)}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getGroupTypeColor(group.type)}`}>
                        {getGroupTypeIcon(group.type)}
                        <span className="capitalize">{group.type}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Group Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {group.description}
              </p>

              {/* Group Stats */}
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{group.memberCount} участников</span>
                <span>{group.messageCount} сообщений</span>
              </div>

              {/* Tags */}
              {group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {group.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Last Activity */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Последняя активность: {group.lastActivity}
              </p>

              {/* Actions */}
              <div className="flex space-x-2">
                {group.isOwner || group.role === 'admin' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleManageGroup(group)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Управление
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleJoinGroup(group)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Войти
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLeaveGroup(group)}
                >
                  Выйти
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Группы не найдены
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте свою первую группу'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать группу
              </Button>
            )}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Создать группу
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название группы
                  </label>
                  <input
                    type="text"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                    placeholder="Введите название..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                    placeholder="Краткое описание группы..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип группы
                  </label>
                  <select
                    value={newGroupData.type}
                    onChange={(e) => setNewGroupData({...newGroupData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="open">Открытая - все могут присоединиться</option>
                    <option value="closed">Закрытая - требуется одобрение</option>
                    <option value="secret">Секретная - только по приглашению</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Теги (через запятую)
                  </label>
                  <input
                    type="text"
                    value={newGroupData.tags}
                    onChange={(e) => setNewGroupData({...newGroupData, tags: e.target.value})}
                    placeholder="проект, важное, обсуждение..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Отмена
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateGroup}
                >
                  Создать
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupsPage;

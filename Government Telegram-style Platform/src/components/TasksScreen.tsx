import React, { useState } from 'react';
import { Plus, Calendar, Paperclip, User, MoreVertical, X, Filter } from 'lucide-react';

interface TasksScreenProps {
  userRole: string;
  searchQuery?: string;
}

export default function TasksScreen({ userRole, searchQuery = '' }: TasksScreenProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    group: '',
    department: '',
    employee: '',
    deadline: '',
    description: '',
  });

  const columns = [
    {
      id: 'new',
      title: 'Новая',
      color: 'from-blue-500 to-blue-600',
      tasks: [
        {
          id: 1,
          title: 'Подготовить отчет по Q4',
          assignee: 'Иванов И.И.',
          creator: 'Министр экономики',
          department: 'Финансовый департамент',
          deadline: '2024-12-15',
          attachments: 2,
          priority: 'high',
          canEdit: ['minister', 'department_head'].includes(userRole),
        },
        {
          id: 2,
          title: 'Обновить документацию API',
          assignee: 'Петров П.П.',
          creator: 'Начальник IT отдела',
          department: 'IT департамент',
          deadline: '2024-12-20',
          attachments: 0,
          priority: 'medium',
          canEdit: ['minister', 'department_head', 'division_head'].includes(userRole),
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'В работе',
      color: 'from-yellow-500 to-yellow-600',
      tasks: [
        {
          id: 3,
          title: 'Анализ бюджета на 2025 год',
          assignee: 'Сидоров С.С.',
          creator: 'Министр экономики',
          department: 'Экономический департамент',
          deadline: '2024-12-18',
          attachments: 5,
          priority: 'high',
          canEdit: ['minister'].includes(userRole),
        },
        {
          id: 4,
          title: 'Подготовка к аудиту',
          assignee: 'Козлова К.К.',
          creator: 'Начальник финансового отдела',
          department: 'Финансовый департамент',
          deadline: '2024-12-25',
          attachments: 3,
          priority: 'medium',
          canEdit: ['minister', 'department_head'].includes(userRole),
        },
      ],
    },
    {
      id: 'completed',
      title: 'Завершена',
      color: 'from-green-500 to-green-600',
      tasks: [
        {
          id: 5,
          title: 'Внедрение новой CRM системы',
          assignee: 'Морозов М.М.',
          creator: 'Заместитель министра',
          department: 'IT департамент',
          deadline: '2024-12-10',
          attachments: 8,
          priority: 'high',
          completedAt: '2024-12-09',
          canEdit: false,
        },
      ],
    },
  ];

  const priorities = {
    high: { label: 'Высокий', color: 'from-red-500 to-red-600' },
    medium: { label: 'Средний', color: 'from-yellow-500 to-yellow-600' },
    low: { label: 'Низкий', color: 'from-green-500 to-green-600' },
  };

  const canCreateTasks = () => {
    return ['minister', 'department_head', 'division_head'].includes(userRole);
  };

  const getFilteredTasks = (tasks: any[]) => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesRole = true;
      if (userRole === 'employee') {
        // Employees only see tasks assigned to them
        matchesRole = task.assignee.includes('Вы') || task.assignee === 'Текущий пользователь';
      }
      
      return matchesSearch && matchesRole;
    });
  };

  const handleCreateTask = () => {
    // Handle task creation
    setShowCreateModal(false);
    setNewTask({
      title: '',
      group: '',
      department: '',
      employee: '',
      deadline: '',
      description: '',
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="h-full bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#2a2a2a] p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Мои задачи</h1>
          {canCreateTasks() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 hover:transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать задачу
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Фильтры:</span>
          </div>
          {['all', 'my', 'created'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`
                px-3 py-1 rounded-lg text-sm transition-all duration-200
                ${filterStatus === filter
                  ? 'bg-[#2D7DD2] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {filter === 'all' ? 'Все' : filter === 'my' ? 'Мои' : 'Созданные'}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full min-w-[900px] gap-6">
          {columns.map((column) => {
            const filteredTasks = getFilteredTasks(column.tasks);
            
            return (
              <div key={column.id} className="flex-1 min-w-[320px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${column.color}`}></div>
                  <h2 className="text-white font-bold text-lg">{column.title}</h2>
                  <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                    {filteredTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#2a2a2a] rounded-2xl p-5 border border-gray-700 hover:border-[#2D7DD2]/30 hover:shadow-lg transition-all duration-200 cursor-pointer hover:transform hover:scale-[1.02]"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-white font-medium leading-tight flex-1 mr-2">{task.title}</h3>
                        {task.canEdit && (
                          <button className="p-1 rounded-lg hover:bg-gray-700 transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {/* Priority */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${priorities[task.priority as keyof typeof priorities].color}`}></div>
                        <span className="text-xs text-gray-400 font-medium">
                          {priorities[task.priority as keyof typeof priorities].label}
                        </span>
                      </div>

                      {/* Assignee */}
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{task.assignee}</span>
                      </div>

                      {/* Creator */}
                      <div className="text-xs text-gray-500 mb-4">
                        Создал: {task.creator}
                      </div>

                      {/* Department */}
                      <div className="text-xs text-gray-400 mb-4 px-2 py-1 bg-gray-700/30 rounded-lg inline-block">
                        {task.department}
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            isOverdue(task.deadline) ? 'text-red-400 font-medium' : 'text-gray-400'
                          }`}>
                            {new Date(task.deadline).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                        
                        {task.attachments > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{task.attachments}</span>
                          </div>
                        )}
                      </div>

                      {/* Completion Date */}
                      {task.completedAt && (
                        <div className="text-xs text-green-400 mt-3 px-2 py-1 bg-green-400/10 rounded-lg">
                          Завершено: {new Date(task.completedAt).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-sm">Нет задач</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Создать задачу</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Название задачи</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] focus:bg-[#2D7DD2]/5 outline-none transition-all"
                  placeholder="Введите название задачи"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Группа</label>
                <select
                  value={newTask.group}
                  onChange={(e) => setNewTask({...newTask, group: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                >
                  <option value="">Выберите группу</option>
                  <option value="finance">Финансовая группа</option>
                  <option value="it">IT группа</option>
                  <option value="hr">Кадровая группа</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Отдел</label>
                <select
                  value={newTask.department}
                  onChange={(e) => setNewTask({...newTask, department: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                >
                  <option value="">Выберите отдел</option>
                  <option value="finance">Финансовый департамент</option>
                  <option value="it">IT департамент</option>
                  <option value="economic">Экономический департамент</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Сотрудник</label>
                <select
                  value={newTask.employee}
                  onChange={(e) => setNewTask({...newTask, employee: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                >
                  <option value="">Выберите сотрудника</option>
                  <option value="ivanov">Иванов И.И.</option>
                  <option value="petrov">Петров П.П.</option>
                  <option value="sidorov">Сидоров С.С.</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Дедлайн</label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Описание</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Введите описание задачи"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCreateTask}
                className="flex-1 bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
              >
                Создать
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
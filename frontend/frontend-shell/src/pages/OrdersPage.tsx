import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  ChevronDown,
  X,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

// === Типы ===
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string };
  createdAt: string;
  dueDate?: string;
  completionNote?: string;
}

// === Демо-данные (привязаны к аккаунтам) ===
const DEMO_USERS = [
  { id: '1', name: 'Хасенхан Казимов' },
  { id: '2', name: 'Адиль Хамитов' },
  { id: '3', name: 'Азамат Бекхалиев' },
  { id: '4', name: 'Алпамыс Мақажан' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Доработать мобильную версию приложения',
    description: 'Адаптировать все страницы под мобильные устройства, проверить responsive layout',
    status: 'in_progress',
    priority: 'high',
    createdBy: { id: '1', name: 'Хасенхан Казимов' },
    assignedTo: { id: '4', name: 'Алпамыс Мақажан' },
    createdAt: '2025-02-14',
    dueDate: '2025-02-20',
  },
  {
    id: '2',
    title: 'Подготовить ежемесячный финансовый отчёт',
    description: 'Собрать данные по продажам за февраль, рассчитать прибыль и доли',
    status: 'todo',
    priority: 'medium',
    createdBy: { id: '1', name: 'Хасенхан Казимов' },
    assignedTo: { id: '2', name: 'Адиль Хамитов' },
    createdAt: '2025-02-13',
    dueDate: '2025-02-28',
  },
  {
    id: '3',
    title: 'Найти поставщика упаковки',
    description: 'Рассмотреть минимум 3 варианта поставщиков, запросить прайсы',
    status: 'todo',
    priority: 'medium',
    createdBy: { id: '2', name: 'Адиль Хамитов' },
    assignedTo: { id: '3', name: 'Азамат Бекхалиев' },
    createdAt: '2025-02-12',
    dueDate: '2025-02-25',
  },
  {
    id: '4',
    title: 'Настроить CI/CD для бэкенда',
    description: 'Настроить автоматический деплой через GitHub Actions для production ветки',
    status: 'completed',
    priority: 'high',
    createdBy: { id: '1', name: 'Хасенхан Казимов' },
    assignedTo: { id: '4', name: 'Алпамыс Мақажан' },
    createdAt: '2025-02-10',
    completionNote: 'Настроены workflows для staging и prod. Docker images автоматически пушатся в registry.',
  },
  {
    id: '5',
    title: 'Обновить прайс-лист',
    description: 'Актуализировать цены на все позиции с учетом новых затрат',
    status: 'todo',
    priority: 'critical',
    createdBy: { id: '3', name: 'Азамат Бекхалиев' },
    assignedTo: { id: '1', name: 'Хасенхан Казимов' },
    createdAt: '2025-02-15',
    dueDate: '2025-02-16',
  },
  {
    id: '6',
    title: 'Протестировать модуль авторизации',
    description: 'Проверить регистрацию, вход, сброс пароля, JWT рефреш',
    status: 'in_progress',
    priority: 'medium',
    createdBy: { id: '4', name: 'Алпамыс Мақажан' },
    assignedTo: { id: '4', name: 'Алпамыс Мақажан' },
    createdAt: '2025-02-14',
    dueDate: '2025-02-17',
  },
];

// === Хелперы ===
const STATUS_CONFIG = {
  todo: { label: 'К выполнению', icon: Circle, color: 'text-[#6c7883]', bg: 'bg-[#6c7883]/10' },
  in_progress: { label: 'В работе', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Выполнено', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Низкий', icon: ArrowDown, color: 'text-[#6c7883]' },
  medium: { label: 'Средний', icon: Minus, color: 'text-yellow-400' },
  high: { label: 'Высокий', icon: ArrowUp, color: 'text-orange-400' },
  critical: { label: 'Срочно', icon: AlertTriangle, color: 'text-red-400' },
};

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<Task | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assignedToId: '',
    dueDate: '',
  });

  // === Фильтрация ===
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  // === Действия ===
  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Введите название задачи');
      return;
    }
    if (!newTask.assignedToId) {
      toast.error('Выберите исполнителя');
      return;
    }

    const assignee = DEMO_USERS.find((u) => u.id === newTask.assignedToId);
    const task: Task = {
      id: String(Date.now()),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      createdBy: { id: user?.id || '1', name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
      assignedTo: assignee || DEMO_USERS[0],
      createdAt: new Date().toISOString().slice(0, 10),
      dueDate: newTask.dueDate || undefined,
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium', assignedToId: '', dueDate: '' });
    setShowCreateModal(false);
    toast.success(`Задача назначена: ${assignee?.name}`);
  };

  const handleCompleteTask = (task: Task) => {
    setShowCompleteModal(task);
    setCompletionNote('');
  };

  const submitCompletion = () => {
    if (!showCompleteModal) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === showCompleteModal.id
          ? { ...t, status: 'completed' as const, completionNote: completionNote || undefined }
          : t
      )
    );
    setShowCompleteModal(null);
    toast.success('Задача выполнена!');
  };

  const handleStartTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as const } : t))
    );
    toast.success('Задача взята в работу');
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <MainLayout>
      <div className="h-full overflow-auto bg-[#0e1621]">
        {/* Header */}
        <div className="bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Задачи</h1>
              <p className="text-sm text-[#6c7883]">Управление задачами команды</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#3a73b8] hover:bg-[#4a83c8] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Новая задача
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 bg-[#0e1621] rounded-xl p-1">
            {[
              { key: 'all', label: 'Все' },
              { key: 'todo', label: 'К выполнению' },
              { key: 'in_progress', label: 'В работе' },
              { key: 'completed', label: 'Выполнено' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === tab.key
                  ? 'bg-[#3a73b8] text-white'
                  : 'text-[#6c7883] hover:text-white'
                  }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] min-w-[1.25rem] text-center px-1 rounded-full ${statusFilter === tab.key
                    ? 'bg-white/20'
                    : 'bg-[#232e3c]'
                    }`}
                >
                  {taskCounts[tab.key as keyof typeof taskCounts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="px-6 pb-6 space-y-2">
          {filteredTasks.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status];
            const priorityCfg = PRIORITY_CONFIG[task.priority];
            const StatusIcon = statusCfg.icon;
            const PriorityIcon = priorityCfg.icon;
            const overdue = task.status !== 'completed' && isOverdue(task.dueDate);

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4 hover:border-[#3a73b8]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.status === 'todo') handleStartTask(task.id);
                      else if (task.status === 'in_progress') handleCompleteTask(task);
                    }}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${statusCfg.color} hover:text-green-400`}
                    title={
                      task.status === 'todo'
                        ? 'Начать'
                        : task.status === 'in_progress'
                          ? 'Завершить'
                          : 'Выполнено'
                    }
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3
                      className={`text-sm font-medium mb-1 ${task.status === 'completed'
                        ? 'text-[#6c7883] line-through'
                        : 'text-white'
                        }`}
                    >
                      {task.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#6c7883] mb-2 line-clamp-1">
                      {task.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Priority */}
                      <span className={`flex items-center gap-1 text-[11px] ${priorityCfg.color}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {priorityCfg.label}
                      </span>

                      {/* Assignee */}
                      <span className="flex items-center gap-1 text-[11px] text-[#6c7883]">
                        <User className="w-3 h-3" />
                        {task.assignedTo.name.split(' ')[0]}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-400' : 'text-[#6c7883]'
                            }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {overdue && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      )}

                      {/* Created by */}
                      {task.createdBy.id !== task.assignedTo.id && (
                        <span className="text-[11px] text-[#6c7883]">
                          от {task.createdBy.name.split(' ')[0]}
                        </span>
                      )}

                      {/* Completion note */}
                      {task.completionNote && (
                        <span className="flex items-center gap-1 text-[11px] text-green-400/80">
                          <MessageSquare className="w-3 h-3" />
                          отчёт
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons (visible on hover) */}
                  {task.status !== 'completed' && (
                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                      {task.status === 'todo' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task.id);
                          }}
                          className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          Начать
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTask(task);
                          }}
                          className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          Выполнить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <Circle className="w-12 h-12 text-[#6c7883]/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-[#6c7883] mb-1">
                {searchQuery ? 'Ничего не найдено' : 'Нет задач'}
              </h3>
              <p className="text-xs text-[#6c7883]/60 mb-4">
                {searchQuery ? 'Попробуйте другой запрос' : 'Создайте первую задачу'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm text-[#3a73b8] hover:text-blue-400 transition-colors"
                >
                  + Новая задача
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Create Task Modal === */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-[#17212b] border border-[#232e3c] rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232e3c]">
              <h3 className="text-base font-semibold text-white">Новая задача</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6c7883] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#6c7883] mb-1.5">Название</label>
                <input
                  autoFocus
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Что нужно сделать?"
                  className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6c7883] mb-1.5">Описание</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Детали задачи..."
                  rows={3}
                  className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#6c7883] mb-1.5">Исполнитель</label>
                  <div className="relative">
                    <select
                      value={newTask.assignedToId}
                      onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                      className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#3a73b8] transition-colors"
                    >
                      <option value="">Выбрать...</option>
                      {DEMO_USERS.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#6c7883] mb-1.5">Приоритет</label>
                  <div className="relative">
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                      className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#3a73b8] transition-colors"
                    >
                      <option value="low">🟢 Низкий</option>
                      <option value="medium">🟡 Средний</option>
                      <option value="high">🟠 Высокий</option>
                      <option value="critical">🔴 Срочно</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6c7883] mb-1.5">Дедлайн</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3a73b8] transition-colors"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#232e3c] flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#6c7883] bg-[#232e3c] hover:bg-[#2b3a4c] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-[#3a73b8] hover:bg-[#4a83c8] transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Complete Task Modal === */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCompleteModal(null)}>
          <div
            className="bg-[#17212b] border border-[#232e3c] rounded-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#232e3c]">
              <h3 className="text-base font-semibold text-white">Завершить задачу</h3>
              <p className="text-xs text-[#6c7883] mt-1">{showCompleteModal.title}</p>
            </div>

            <div className="p-5">
              <label className="block text-xs text-[#6c7883] mb-1.5">Что было сделано? (необязательно)</label>
              <textarea
                autoFocus
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Опишите результат..."
                rows={3}
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors resize-none"
              />
            </div>

            <div className="px-5 py-4 border-t border-[#232e3c] flex gap-3">
              <button
                onClick={() => setShowCompleteModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#6c7883] bg-[#232e3c] hover:bg-[#2b3a4c] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={submitCompletion}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-500 transition-colors"
              >
                ✓ Выполнено
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === View Task Modal === */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div
            className="bg-[#17212b] border border-[#232e3c] rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232e3c]">
              <div className="flex items-center gap-2">
                {React.createElement(STATUS_CONFIG[selectedTask.status].icon, {
                  className: `w-5 h-5 ${STATUS_CONFIG[selectedTask.status].color}`,
                })}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_CONFIG[selectedTask.status].bg} ${STATUS_CONFIG[selectedTask.status].color}`}>
                  {STATUS_CONFIG[selectedTask.status].label}
                </span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-[#6c7883] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">{selectedTask.title}</h3>
                <p className="text-sm text-[#adb5bd]">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#0e1621] rounded-xl p-3">
                  <p className="text-[10px] text-[#6c7883] uppercase mb-1">Исполнитель</p>
                  <p className="text-white text-xs font-medium">{selectedTask.assignedTo.name}</p>
                </div>
                <div className="bg-[#0e1621] rounded-xl p-3">
                  <p className="text-[10px] text-[#6c7883] uppercase mb-1">Автор</p>
                  <p className="text-white text-xs font-medium">{selectedTask.createdBy.name}</p>
                </div>
                <div className="bg-[#0e1621] rounded-xl p-3">
                  <p className="text-[10px] text-[#6c7883] uppercase mb-1">Приоритет</p>
                  <p className={`text-xs font-medium ${PRIORITY_CONFIG[selectedTask.priority].color}`}>
                    {PRIORITY_CONFIG[selectedTask.priority].label}
                  </p>
                </div>
                <div className="bg-[#0e1621] rounded-xl p-3">
                  <p className="text-[10px] text-[#6c7883] uppercase mb-1">Дедлайн</p>
                  <p className={`text-xs font-medium ${isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' ? 'text-red-400' : 'text-white'}`}>
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')
                      : '—'}
                  </p>
                </div>
              </div>

              {selectedTask.completionNote && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-green-400 uppercase mb-1">Отчёт о выполнении</p>
                  <p className="text-sm text-[#adb5bd]">{selectedTask.completionNote}</p>
                </div>
              )}
            </div>

            {selectedTask.status !== 'completed' && (
              <div className="px-5 py-4 border-t border-[#232e3c] flex gap-3">
                {selectedTask.status === 'todo' && (
                  <button
                    onClick={() => {
                      handleStartTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Взять в работу
                  </button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      handleCompleteTask(selectedTask);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-500 transition-colors"
                  >
                    ✓ Завершить
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrdersPage;

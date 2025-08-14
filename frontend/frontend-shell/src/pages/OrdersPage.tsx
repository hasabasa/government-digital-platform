import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Download,
  Share
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  number: string;
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  assignedTo: string[];
  createdAt: string;
  deadline?: string;
  category: string;
  attachments?: string[];
}

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderData, setNewOrderData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignedTo: '',
    deadline: '',
    category: '',
  });

  // Check if user can create orders
  const canCreateOrders = user?.role === 'admin' || user?.role === 'department_head';

  // Mock data
  const orders: Order[] = [
    {
      id: '1',
      number: 'ПР-2024-001',
      title: 'О внедрении системы электронного документооборота',
      description: 'Внедрить систему электронного документооборота во всех подразделениях до конца квартала',
      status: 'active',
      priority: 'high',
      createdBy: 'Иван Иванов',
      assignedTo: ['IT Отдел', 'Административный отдел'],
      createdAt: '2024-01-15',
      deadline: '2024-03-31',
      category: 'Технологии',
      attachments: ['specification.pdf', 'timeline.xlsx'],
    },
    {
      id: '2',
      number: 'ПР-2024-002',
      title: 'Об организации обучающих семинаров',
      description: 'Провести серию обучающих семинаров по новым рабочим процессам',
      status: 'pending',
      priority: 'medium',
      createdBy: 'Мария Петрова',
      assignedTo: ['HR Отдел', 'Учебный центр'],
      createdAt: '2024-01-20',
      deadline: '2024-02-28',
      category: 'Обучение',
    },
    {
      id: '3',
      number: 'ПР-2024-003',
      title: 'О проведении инвентаризации',
      description: 'Провести полную инвентаризацию материальных ценностей',
      status: 'completed',
      priority: 'low',
      createdBy: 'Петр Сидоров',
      assignedTo: ['Бухгалтерия', 'Хозяйственный отдел'],
      createdAt: '2024-01-05',
      deadline: '2024-01-25',
      category: 'Административное',
    },
    {
      id: '4',
      number: 'ПР-2024-004',
      title: 'О мерах кибербезопасности',
      description: 'Усилить меры кибербезопасности и провести аудит информационных систем',
      status: 'draft',
      priority: 'urgent',
      createdBy: user?.fullName || 'Текущий пользователь',
      assignedTo: ['IT Отдел', 'Служба безопасности'],
      createdAt: '2024-01-25',
      deadline: '2024-02-15',
      category: 'Безопасность',
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = () => {
    if (!newOrderData.title.trim()) {
      toast.error('Введите название приказа');
      return;
    }

    console.log('Создание приказа:', newOrderData);
    toast.success(`Приказ "${newOrderData.title}" создан!`);
    
    // Reset form
    setNewOrderData({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      deadline: '',
      category: '',
    });
    setShowCreateModal(false);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Изменение статуса приказа ${orderId} на ${newStatus}`);
    toast.success('Статус приказа обновлен');
  };

  const handleViewOrder = (order: Order) => {
    console.log('Просмотр приказа:', order.number);
    setSelectedOrder(order);
  };

  const handleEditOrder = (order: Order) => {
    console.log('Редактирование приказа:', order.number);
    toast.info('Функция редактирования в разработке');
  };

  const handleDeleteOrder = (order: Order) => {
    console.log('Удаление приказа:', order.number);
    toast.success(`Приказ ${order.number} удален`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Выполнен';
      case 'active':
        return 'Активный';
      case 'pending':
        return 'На рассмотрении';
      case 'rejected':
        return 'Отклонен';
      case 'draft':
        return 'Черновик';
      default:
        return status;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Приказы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление приказами и распоряжениями
            </p>
          </div>
          {canCreateOrders && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать приказ
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск приказов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновики</option>
              <option value="pending">На рассмотрении</option>
              <option value="active">Активные</option>
              <option value="completed">Выполненные</option>
              <option value="rejected">Отклоненные</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {order.number}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`}></div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusName(order.status)}</span>
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {order.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {order.description}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{order.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{order.createdAt}</span>
                    </div>
                    {order.deadline && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>До {order.deadline}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {order.category}
                      </span>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Исполнители:</span> {order.assignedTo.join(', ')}
                    </p>
                  </div>

                  {/* Attachments */}
                  {order.attachments && order.attachments.length > 0 && (
                    <div className="mt-3 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {order.attachments.length} файл(ов) прикреплено
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {(canCreateOrders || order.createdBy === user?.fullName) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Status Actions */}
              {order.status === 'pending' && canCreateOrders && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'approved')}
                    >
                      Утвердить
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'rejected')}
                    >
                      Отклонить
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Приказы не найдены
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте первый приказ'}
            </p>
            {!searchQuery && canCreateOrders && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать приказ
              </Button>
            )}
          </div>
        )}

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Создать приказ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название приказа
                  </label>
                  <input
                    type="text"
                    value={newOrderData.title}
                    onChange={(e) => setNewOrderData({...newOrderData, title: e.target.value})}
                    placeholder="Введите название приказа..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={newOrderData.description}
                    onChange={(e) => setNewOrderData({...newOrderData, description: e.target.value})}
                    placeholder="Подробное описание приказа..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Приоритет
                    </label>
                    <select
                      value={newOrderData.priority}
                      onChange={(e) => setNewOrderData({...newOrderData, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Категория
                    </label>
                    <input
                      type="text"
                      value={newOrderData.category}
                      onChange={(e) => setNewOrderData({...newOrderData, category: e.target.value})}
                      placeholder="Категория приказа..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Исполнители (через запятую)
                  </label>
                  <input
                    type="text"
                    value={newOrderData.assignedTo}
                    onChange={(e) => setNewOrderData({...newOrderData, assignedTo: e.target.value})}
                    placeholder="IT Отдел, Административный отдел..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Срок исполнения
                  </label>
                  <input
                    type="date"
                    value={newOrderData.deadline}
                    onChange={(e) => setNewOrderData({...newOrderData, deadline: e.target.value})}
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
                  onClick={handleCreateOrder}
                >
                  Создать приказ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.number}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedOrder.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedOrder.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Статус:</span>
                    <span className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{getStatusName(selectedOrder.status)}</span>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Приоритет:</span>
                    <span className="ml-2 capitalize">{selectedOrder.priority}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Создан:</span>
                    <span className="ml-2">{selectedOrder.createdAt}</span>
                  </div>
                  {selectedOrder.deadline && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Срок:</span>
                      <span className="ml-2">{selectedOrder.deadline}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Исполнители:</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {selectedOrder.assignedTo.join(', ')}
                  </p>
                </div>
                
                {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Вложения:</span>
                    <ul className="mt-1 space-y-1">
                      {selectedOrder.attachments.map((file, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default OrdersPage;

import React, { useState } from 'react';
import { FileText, Calendar, User, Filter, Eye, Download } from 'lucide-react';

interface OrdersScreenProps {
  userRole: string;
}

export default function OrdersScreen({ userRole }: OrdersScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filters = [
    { id: 'all', label: 'Все приказы' },
    { id: 'new', label: 'Новые' },
    { id: 'active', label: 'Действующие' },
    { id: 'archived', label: 'Архивные' }
  ];

  const orders = [
    {
      id: 1,
      number: '№1245',
      title: 'О введении новых стандартов отчетности',
      description: 'Приказ устанавливает новые требования к форматам и срокам предоставления отчетности всеми департаментами министерства.',
      date: '2024-12-10',
      author: 'Министр экономики',
      department: 'Министерство экономики',
      status: 'active',
      priority: 'high',
      attachments: ['Приказ_1245.pdf', 'Форма_отчетности.xlsx'],
      isNew: true,
    },
    {
      id: 2,
      number: '№1244',
      title: 'О проведении аттестации сотрудников',
      description: 'Приказ о проведении ежегодной аттестации государственных служащих в период с 15 декабря 2024 по 15 февраля 2025 года.',
      date: '2024-12-08',
      author: 'Начальник департамента кадров',
      department: 'Департамент кадров',
      status: 'active',
      priority: 'medium',
      attachments: ['Приказ_1244.pdf'],
      isNew: false,
    },
    {
      id: 3,
      number: '№1243',
      title: 'О внедрении новой информационной системы',
      description: 'Приказ о поэтапном внедрении системы электронного документооборота во всех департаментах министерства.',
      date: '2024-12-05',
      author: 'Заместитель министра',
      department: 'Министерство экономики',
      status: 'active',
      priority: 'high',
      attachments: ['Приказ_1243.pdf', 'План_внедрения.docx', 'Инструкция.pdf'],
      isNew: false,
    },
  ];

  const getFilteredOrders = () => {
    switch (selectedFilter) {
      case 'new':
        return orders.filter(order => order.isNew);
      case 'active':
        return orders.filter(order => order.status === 'active');
      case 'archived':
        return orders.filter(order => order.status === 'archived');
      default:
        return orders;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Обычный';
    }
  };

  const canCreateOrders = () => {
    return ['minister', 'department_head'].includes(userRole);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="h-full bg-[#1a1a1a] flex">
      {/* Orders List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#2a2a2a] p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Приказы</h1>
            {canCreateOrders() && (
              <button className="bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 hover:transform hover:scale-105">
                Создать приказ
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-200
                  ${selectedFilter === filter.id
                    ? 'bg-[#2D7DD2] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700 hover:border-[#2D7DD2]/50 hover:bg-[#2D7DD2]/5 cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{order.number}</h3>
                        {order.isNew && (
                          <span className="px-2 py-1 bg-[#F4A261] text-white text-xs rounded-full">
                            Новый
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(order.priority)}`}>
                          {getPriorityLabel(order.priority)}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1">{order.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 mb-4 line-clamp-2">{order.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{order.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(order.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>Вложений: {order.attachments.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-gray-400 mb-2">Приказы не найдены</h3>
              <p className="text-gray-500">В выбранной категории нет приказов</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <div className="w-96 bg-[#2a2a2a] border-l border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Детали приказа</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">{selectedOrder.number}</h4>
                <p className="text-gray-400">{selectedOrder.title}</p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Описание</h4>
                <p className="text-gray-300">{selectedOrder.description}</p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Информация</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Автор:</span>
                    <span className="text-white">{selectedOrder.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Дата:</span>
                    <span className="text-white">{new Date(selectedOrder.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Статус:</span>
                    <span className="text-green-400">Действующий</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Вложения</h4>
                <div className="space-y-2">
                  {selectedOrder.attachments.map((attachment: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <FileText className="w-4 h-4 text-[#2D7DD2] mr-3" />
                      <span className="text-white text-sm flex-1">{attachment}</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Upload, FileText, Eye, Download, Plus, Calendar, User, Filter, Search, X } from 'lucide-react';

interface ReportsScreenProps {
  userRole: string;
  searchQuery?: string;
}

export default function ReportsScreen({ userRole, searchQuery = '' }: ReportsScreenProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const [newReport, setNewReport] = useState({
    title: '',
    type: '',
    department: '',
    description: '',
    files: [] as File[],
  });

  const reportTypes = [
    'Финансовый отчет',
    'Отчет о деятельности',
    'Квартальный отчет',
    'Годовой отчет',
    'Проектный отчет',
    'Другой',
  ];

  const reports = [
    {
      id: 1,
      title: 'Квартальный отчет Q4 2024',
      type: 'Квартальный отчет',
      author: 'Петров А.И.',
      department: 'Финансовый департамент',
      submittedDate: '2024-12-10',
      status: 'На рассмотрении',
      files: ['Q4_Report.pdf', 'Data_Analysis.xlsx'],
      description: 'Подробный анализ финансовых показателей за четвертый квартал 2024 года.',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Отчет о внедрении CRM системы',
      type: 'Проектный отчет',
      author: 'Иванова М.С.',
      department: 'IT департамент',
      submittedDate: '2024-12-08',
      status: 'Одобрен',
      files: ['CRM_Implementation.docx'],
      description: 'Отчет о ходе внедрения новой CRM системы в министерстве.',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Анализ кадровых процессов',
      type: 'Отчет о деятельности',
      author: 'Козлова Е.А.',
      department: 'Департамент кадров',
      submittedDate: '2024-12-05',
      status: 'Требует доработки',
      files: ['HR_Analysis.pdf', 'Statistics.xlsx'],
      description: 'Анализ эффективности кадровых процессов и предложения по улучшению.',
      priority: 'medium',
    },
  ];

  const canViewAllReports = () => {
    return ['minister', 'department_head'].includes(userRole);
  };

  const canSubmitReports = () => {
    return true; // All roles can submit reports
  };

  const getFilteredReports = () => {
    let filtered = reports;

    // Role-based filtering
    if (!canViewAllReports()) {
      filtered = filtered.filter(report => 
        report.author.includes('Текущий пользователь') || 
        report.department === 'Мой департамент'
      );
    }

    // Status filtering
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(report => 
        report.status === selectedFilter
      );
    }

    // Search filtering
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Одобрен': return 'text-green-400 bg-green-400/20';
      case 'На рассмотрении': return 'text-yellow-400 bg-yellow-400/20';
      case 'Требует доработки': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewReport({
        ...newReport,
        files: [...newReport.files, ...Array.from(e.target.files)]
      });
    }
  };

  const handleSubmitReport = () => {
    // Handle report submission
    setShowSubmitModal(false);
    setNewReport({
      title: '',
      type: '',
      department: '',
      description: '',
      files: [],
    });
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="h-full bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#2a2a2a] p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Отчёты</h1>
          {canSubmitReports() && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 hover:transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Подать отчет
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={`
              px-6 py-2 rounded-xl transition-all duration-200 font-medium
              ${activeTab === 'submit'
                ? 'bg-[#2D7DD2] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Мои отчеты
          </button>
          {canViewAllReports() && (
            <button
              onClick={() => setActiveTab('view')}
              className={`
                px-6 py-2 rounded-xl transition-all duration-200 font-medium
                ${activeTab === 'view'
                  ? 'bg-[#2D7DD2] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              Все отчеты
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Статус:</span>
          </div>
          {['all', 'На рассмотрении', 'Одобрен', 'Требует доработки'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`
                px-3 py-1 rounded-lg text-sm transition-all duration-200
                ${selectedFilter === filter
                  ? 'bg-[#2D7DD2] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {filter === 'all' ? 'Все' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-[#2a2a2a] rounded-2xl p-6 border border-gray-700 hover:border-[#2D7DD2]/30 hover:shadow-lg cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] rounded-2xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority === 'high' ? 'Высокий' : report.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3 line-clamp-2">{report.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl hover:bg-gray-700 transition-colors">
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-gray-700 transition-colors">
                    <Download className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{report.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.submittedDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <span>{report.department}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Файлов: {report.files.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-400 mb-2">Отчеты не найдены</h3>
            <p className="text-gray-500">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'В выбранной категории нет отчетов'}
            </p>
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Подать отчет</h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Название отчета</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] focus:bg-[#2D7DD2]/5 outline-none transition-all"
                  placeholder="Введите название отчета"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Тип отчета</label>
                <select
                  value={newReport.type}
                  onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                >
                  <option value="">Выберите тип отчета</option>
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Департамент</label>
                <select
                  value={newReport.department}
                  onChange={(e) => setNewReport({...newReport, department: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                >
                  <option value="">Выберите департамент</option>
                  <option value="finance">Финансовый департамент</option>
                  <option value="it">IT департамент</option>
                  <option value="hr">Департамент кадров</option>
                  <option value="economic">Экономический департамент</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Описание</label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Описание отчета и ключевые выводы"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Прикрепить файлы</label>
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-[#2D7DD2]/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">Нажмите для выбора файлов</p>
                    <p className="text-gray-500 text-sm">Поддерживаются: PDF, DOC, XLS, PPT (до 25 МБ)</p>
                  </label>
                </div>
                
                {newReport.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-300">Выбранные файлы:</p>
                    {newReport.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#2D7DD2]" />
                          <span className="text-white text-sm">{file.name}</span>
                          <span className="text-gray-400 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(1)} МБ)
                          </span>
                        </div>
                        <button
                          onClick={() => setNewReport({
                            ...newReport,
                            files: newReport.files.filter((_, i) => i !== index)
                          })}
                          className="p-1 rounded hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSubmitReport}
                className="flex-1 bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
              >
                Подать отчет
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">Автор</h4>
                  <p className="text-gray-300">{selectedReport.author}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Департамент</h4>
                  <p className="text-gray-300">{selectedReport.department}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Дата подачи</h4>
                  <p className="text-gray-300">{new Date(selectedReport.submittedDate).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Статус</h4>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Описание</h4>
                <p className="text-gray-300 leading-relaxed">{selectedReport.description}</p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Прикрепленные файлы</h4>
                <div className="space-y-2">
                  {selectedReport.files.map((file: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#2D7DD2]" />
                        <span className="text-white">{file}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
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
import React, { useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useCrmStore } from '../stores/crm.store';
import { useAuthStore } from '../stores/auth.store';
import { CrmPipelineTab } from '../components/crm/CrmPipelineTab';
import { CrmLeadsTab } from '../components/crm/CrmLeadsTab';
import { CrmDashboardTab } from '../components/crm/CrmDashboardTab';
import { CrmPlansTab } from '../components/crm/CrmPlansTab';
import { CrmAccessTab } from '../components/crm/CrmAccessTab';
import { Target, Kanban, List, BarChart3, CalendarCheck, Shield } from 'lucide-react';
import { clsx } from 'clsx';

const CrmPage: React.FC = () => {
  const { activeTab, setActiveTab, fetchLeads, fetchDashboard, fetchManagerStats, fetchSalesPlans } = useCrmStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchLeads();
    fetchDashboard();
    fetchManagerStats();
    fetchSalesPlans();
  }, []);

  const tabs = [
    { id: 'pipeline', label: 'Воронка', icon: Kanban },
    { id: 'leads', label: 'Лиды', icon: List },
    { id: 'dashboard', label: 'Дашборд', icon: BarChart3 },
    { id: 'plans', label: 'Планы', icon: CalendarCheck },
    ...(isAdmin ? [{ id: 'access', label: 'Доступ', icon: Shield }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#0e1621]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-[#232e3c] bg-[#17212b] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-[#3a73b8]" />
              <h1 className="text-xl font-bold text-white">CRM</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#3a73b8] text-white'
                      : 'text-[#adb5bd] hover:bg-[#232e3c] hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'pipeline' && <CrmPipelineTab />}
          {activeTab === 'leads' && <CrmLeadsTab />}
          {activeTab === 'dashboard' && <CrmDashboardTab />}
          {activeTab === 'plans' && <CrmPlansTab />}
          {activeTab === 'access' && isAdmin && <CrmAccessTab />}
        </div>
      </div>
    </div>
  );
};

export default CrmPage;

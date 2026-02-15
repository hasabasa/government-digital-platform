import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuthStore } from '../stores/auth.store';
import { useFinanceStore, SHAREHOLDER_LABELS } from '../stores/finance.store';
import {
  Banknote,
  BarChart3,
  MessageSquare,
  ListTodo,
  Phone,
  TrendingUp,
  ArrowRight,
  Wallet,
  Users,
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { salesHistory, shareholderTotals } = useFinanceStore();
  const navigate = useNavigate();

  const isFinanceAllowed = user?.role === 'admin' || user?.role === 'manager';

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';

  const totalRevenue = salesHistory.reduce((s, e) => s + e.grossRevenue, 0);
  const totalNet = salesHistory.reduce((s, e) => s + e.netProfit, 0);
  const totalSales = salesHistory.reduce((s, e) => s + e.salesCount.total, 0);

  const allQuickActions = [
    {
      label: 'Касса',
      desc: 'Записать продажу',
      icon: Banknote,
      path: '/cashier',
      gradient: 'from-green-500 to-emerald-600',
      requiresFinance: true,
    },
    {
      label: 'Финансы',
      desc: 'Дашборд прибыли',
      icon: BarChart3,
      path: '/finance',
      gradient: 'from-blue-500 to-blue-600',
      requiresFinance: true,
    },
    {
      label: 'Задачи',
      desc: 'Управление',
      icon: ListTodo,
      path: '/orders',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Чат',
      desc: 'Сообщения',
      icon: MessageSquare,
      path: '/chat',
      gradient: 'from-cyan-500 to-cyan-600',
    },
  ];

  const quickActions = allQuickActions.filter(
    (a) => !a.requiresFinance || isFinanceAllowed
  );

  const shareholderColors: Record<string, string> = {
    khasenkhan: 'text-blue-400',
    adil: 'text-purple-400',
    azamat: 'text-amber-400',
  };

  return (
    <MainLayout>
      <div className="h-full overflow-auto bg-[#0e1621]">
        {/* Header */}
        <div className="bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-6 py-5">
          <h1 className="text-xl font-semibold text-white mb-1">
            Привет, {user?.firstName || 'Коллега'}! 👋
          </h1>
          <p className="text-sm text-[#6c7883]">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4 text-left hover:border-[#3a73b8]/40 transition-all active:scale-[0.98] group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-sm">{action.label}</h3>
                  <p className="text-xs text-[#6c7883] mt-0.5">{action.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Revenue summary (admin/manager only) */}
          {isFinanceAllowed && (<div className="bg-[#17212b] border border-[#232e3c] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#232e3c]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6c7883]" />
                <span className="text-sm font-medium text-[#6c7883]">Финансовая сводка</span>
              </div>
              <button
                onClick={() => navigate('/finance')}
                className="flex items-center gap-1 text-xs text-[#3a73b8] hover:text-blue-400 transition-colors"
              >
                Подробнее <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#6c7883]">Выручка</p>
                  <p className="text-lg font-bold text-white tabular-nums">{formatMoney(totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6c7883]">Чистая</p>
                  <p className="text-lg font-bold text-green-400 tabular-nums">{formatMoney(totalNet)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6c7883]">Продажи</p>
                  <p className="text-lg font-bold text-white">{totalSales} шт</p>
                </div>
              </div>

              {/* Shareholder mini-cards */}
              <div className="flex gap-2">
                {Object.entries(shareholderTotals).map(([name, amount]) => (
                  <div
                    key={name}
                    className="flex-1 bg-[#232e3c] rounded-lg p-2.5 text-center"
                  >
                    <p className="text-[10px] text-[#6c7883] uppercase tracking-wider">
                      {SHAREHOLDER_LABELS[name]}
                    </p>
                    <p className={`text-sm font-bold tabular-nums mt-0.5 ${shareholderColors[name] || 'text-white'}`}>
                      {formatMoney(amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>)}
          {/* Recent sales (admin/manager only) */}
          {isFinanceAllowed && salesHistory.length > 0 && (
            <div className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[#6c7883] mb-3">Последние продажи</h3>
              <div className="space-y-2">
                {salesHistory.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 border-b border-[#232e3c] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm text-[#adb5bd]">
                        {entry.salesCount.total} шт
                        {entry.note && <span className="text-[#6c7883]"> — {entry.note}</span>}
                      </span>
                    </div>
                    <span className="text-sm text-white font-medium tabular-nums">
                      {formatMoney(entry.grossRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;

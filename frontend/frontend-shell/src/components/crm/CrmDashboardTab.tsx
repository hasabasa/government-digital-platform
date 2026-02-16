import React, { useEffect } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { FunnelStage, TrafficChannel } from '../../types';
import { TrendingUp, Users, DollarSign, Target, Percent } from 'lucide-react';
import { clsx } from 'clsx';

const STAGE_LABELS: Record<FunnelStage, string> = {
  new: 'Новый', contact: 'Контакт', negotiation: 'Переговоры', proposal: 'Предложение', deal: 'Сделка',
};

const STAGE_COLORS: Record<FunnelStage, string> = {
  new: 'bg-blue-500', contact: 'bg-yellow-500', negotiation: 'bg-orange-500', proposal: 'bg-purple-500', deal: 'bg-green-500',
};

const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  website: 'Сайт', instagram: 'Instagram', telegram: 'Telegram', whatsapp: 'WhatsApp',
  facebook: 'Facebook', referral: 'Реферал', cold_call: 'Хол. звонок',
  exhibition: 'Выставка', advertisement: 'Реклама', partner: 'Партнёр', other: 'Другое',
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';

export const CrmDashboardTab: React.FC = () => {
  const { dashboard, managerStats, fetchDashboard, fetchManagerStats } = useCrmStore();

  useEffect(() => {
    fetchDashboard();
    fetchManagerStats();
  }, []);

  if (!dashboard) {
    return <div className="text-[#6c7883] text-center py-8">Загрузка дашборда...</div>;
  }

  const { kpi, funnel, channels } = dashboard;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Всего лидов" value={String(kpi.totalLeads)} color="text-blue-400" />
        <KpiCard icon={TrendingUp} label="Сделки" value={String(kpi.wonDeals)} color="text-green-400" />
        <KpiCard icon={DollarSign} label="Сумма сделок" value={formatMoney(kpi.wonAmount)} color="text-emerald-400" />
        <KpiCard icon={Target} label="Потеряно" value={String(kpi.lostDeals)} color="text-red-400" />
        <KpiCard icon={Percent} label="Конверсия" value={`${kpi.conversionRate}%`} color="text-yellow-400" />
      </div>

      {/* Funnel + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <div className="bg-[#17212b] border border-[#232e3c] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-4">Воронка продаж</h3>
          <div className="space-y-3">
            {funnel.map((item) => {
              const maxCount = Math.max(...funnel.map(f => f.count), 1);
              const width = Math.max((item.count / maxCount) * 100, 5);
              return (
                <div key={item.stage} className="flex items-center gap-3">
                  <span className="text-xs text-[#adb5bd] w-24">{STAGE_LABELS[item.stage]}</span>
                  <div className="flex-1 h-6 bg-[#0e1621] rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full flex items-center px-2', STAGE_COLORS[item.stage])}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-[10px] text-white font-bold">{item.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#6c7883] w-24 text-right">{formatMoney(item.totalAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-[#17212b] border border-[#232e3c] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-4">Каналы трафика</h3>
          <div className="space-y-2">
            {channels
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const maxCount = Math.max(...channels.map(c => c.count), 1);
                const width = Math.max((item.count / maxCount) * 100, 5);
                return (
                  <div key={item.channel} className="flex items-center gap-3">
                    <span className="text-xs text-[#adb5bd] w-24 truncate">
                      {CHANNEL_LABELS[item.channel] || item.channel}
                    </span>
                    <div className="flex-1 h-5 bg-[#0e1621] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3a73b8] rounded-full flex items-center px-2"
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-[10px] text-white font-bold">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Manager Stats Table */}
      <div className="bg-[#17212b] border border-[#232e3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4">Статистика менеджеров (KPI)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232e3c]">
                <th className="text-left text-xs text-[#6c7883] font-medium px-3 py-2">Менеджер</th>
                <th className="text-center text-xs text-[#6c7883] font-medium px-3 py-2">Лиды</th>
                <th className="text-center text-xs text-[#6c7883] font-medium px-3 py-2">Сделки</th>
                <th className="text-center text-xs text-[#6c7883] font-medium px-3 py-2">Потеряно</th>
                <th className="text-right text-xs text-[#6c7883] font-medium px-3 py-2">Сумма</th>
                <th className="text-right text-xs text-[#6c7883] font-medium px-3 py-2">План</th>
                <th className="text-center text-xs text-[#6c7883] font-medium px-3 py-2">Прогресс</th>
              </tr>
            </thead>
            <tbody>
              {managerStats.map((mgr) => (
                <tr key={mgr.managerId} className="border-b border-[#232e3c] last:border-0">
                  <td className="px-3 py-3 text-sm text-white">{mgr.managerName}</td>
                  <td className="px-3 py-3 text-sm text-center text-[#adb5bd]">{mgr.totalLeads}</td>
                  <td className="px-3 py-3 text-sm text-center text-green-400">{mgr.wonCount}</td>
                  <td className="px-3 py-3 text-sm text-center text-red-400">{mgr.lostCount}</td>
                  <td className="px-3 py-3 text-sm text-right text-white">{formatMoney(mgr.wonAmount)}</td>
                  <td className="px-3 py-3 text-sm text-right text-[#6c7883]">{formatMoney(mgr.targetAmount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#0e1621] rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            mgr.amountProgress >= 100 ? 'bg-green-500' :
                            mgr.amountProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          style={{ width: `${Math.min(mgr.amountProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#adb5bd] w-10 text-right">{mgr.amountProgress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {managerStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-[#6c7883]">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: any; label: string; value: string; color: string }> = ({
  icon: Icon, label, value, color,
}) => (
  <div className="bg-[#17212b] border border-[#232e3c] rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={clsx('w-4 h-4', color)} />
      <span className="text-xs text-[#6c7883]">{label}</span>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
  </div>
);

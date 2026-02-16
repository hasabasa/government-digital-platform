import React, { useState } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { CrmLeadModal } from './CrmLeadModal';
import { CrmLeadDetailDrawer } from './CrmLeadDetailDrawer';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { FunnelStage, TrafficChannel, CrmLead } from '../../types';
import { clsx } from 'clsx';

const STAGE_LABELS: Record<FunnelStage, string> = {
  new: 'Новый', contact: 'Контакт', negotiation: 'Переговоры', proposal: 'Предложение', deal: 'Сделка',
};

const STAGE_COLORS: Record<FunnelStage, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contact: 'bg-yellow-500/20 text-yellow-400',
  negotiation: 'bg-orange-500/20 text-orange-400',
  proposal: 'bg-purple-500/20 text-purple-400',
  deal: 'bg-green-500/20 text-green-400',
};

const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  website: 'Сайт', instagram: 'Instagram', telegram: 'Telegram', whatsapp: 'WhatsApp',
  facebook: 'Facebook', referral: 'Реферал', cold_call: 'Холодный звонок',
  exhibition: 'Выставка', advertisement: 'Реклама', partner: 'Партнёр', other: 'Другое',
};

const formatMoney = (amount: string | number | undefined) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('ru-RU').format(Number(amount)) + ' ₸';
};

export const CrmLeadsTab: React.FC = () => {
  const { leads, totalLeads, totalPages, filters, setFilters, selectLead, selectedLead, loading } = useCrmStore();
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    setFilters({ search: searchInput, page: 1 });
  };

  const handleRowClick = (lead: CrmLead) => {
    selectLead(lead);
    setShowDrawer(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Все лиды ({totalLeads})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3a73b8] text-white rounded-lg text-sm hover:bg-[#2d5f9e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новый лид
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск по имени, компании, email..."
            className="w-full pl-10 pr-4 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] focus:border-[#3a73b8] outline-none"
          />
        </div>

        <select
          value={filters.stage || ''}
          onChange={(e) => setFilters({ stage: (e.target.value || undefined) as any, page: 1 })}
          className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white focus:border-[#3a73b8] outline-none"
        >
          <option value="">Все стадии</option>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filters.trafficChannel || ''}
          onChange={(e) => setFilters({ trafficChannel: (e.target.value || undefined) as any, page: 1 })}
          className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white focus:border-[#3a73b8] outline-none"
        >
          <option value="">Все каналы</option>
          {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#17212b] border border-[#232e3c] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#232e3c]">
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Имя</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Компания</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Канал</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Стадия</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Сумма</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => handleRowClick(lead)}
                className="border-b border-[#232e3c] last:border-0 hover:bg-[#1e2c3a] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm text-white">{lead.firstName} {lead.lastName || ''}</span>
                </td>
                <td className="px-4 py-3 text-sm text-[#adb5bd]">{lead.companyName || '—'}</td>
                <td className="px-4 py-3 text-sm text-[#adb5bd]">{CHANNEL_LABELS[lead.trafficChannel] || lead.trafficChannel}</td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs px-2 py-1 rounded-full', STAGE_COLORS[lead.stage])}>
                    {STAGE_LABELS[lead.stage]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white">{formatMoney(lead.dealAmount)}</td>
                <td className="px-4 py-3 text-sm text-[#6c7883]">
                  {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6c7883]">
                  {loading ? 'Загрузка...' : 'Лиды не найдены'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setFilters({ page: Math.max(1, filters.page - 1) })}
            disabled={filters.page <= 1}
            className="p-2 text-[#6c7883] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[#adb5bd]">
            {filters.page} / {totalPages}
          </span>
          <button
            onClick={() => setFilters({ page: Math.min(totalPages, filters.page + 1) })}
            disabled={filters.page >= totalPages}
            className="p-2 text-[#6c7883] hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showModal && <CrmLeadModal onClose={() => setShowModal(false)} />}
      {showDrawer && selectedLead && (
        <CrmLeadDetailDrawer onClose={() => { setShowDrawer(false); selectLead(null); }} />
      )}
    </div>
  );
};

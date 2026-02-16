import React, { useState } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { CrmLead, FunnelStage } from '../../types';
import { CrmLeadModal } from './CrmLeadModal';
import { CrmLeadDetailDrawer } from './CrmLeadDetailDrawer';
import { Plus, User, Phone, Mail, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';

const STAGES: { key: FunnelStage; label: string; color: string }[] = [
  { key: 'new', label: 'Новый', color: 'bg-blue-500' },
  { key: 'contact', label: 'Контакт', color: 'bg-yellow-500' },
  { key: 'negotiation', label: 'Переговоры', color: 'bg-orange-500' },
  { key: 'proposal', label: 'Предложение', color: 'bg-purple-500' },
  { key: 'deal', label: 'Сделка', color: 'bg-green-500' },
];

const formatMoney = (amount: string | number | undefined) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('ru-RU').format(Number(amount)) + ' ₸';
};

export const CrmPipelineTab: React.FC = () => {
  const { leads, moveLeadStage, selectLead, selectedLead } = useCrmStore();
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const leadsByStage = STAGES.map((stage) => ({
    ...stage,
    leads: leads.filter((l) => l.stage === stage.key),
  }));

  const handleCardClick = (lead: CrmLead) => {
    selectLead(lead);
    setShowDrawer(true);
  };

  const handleDrop = (leadId: string, toStage: FunnelStage) => {
    moveLeadStage(leadId, toStage);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Воронка продаж</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3a73b8] text-white rounded-lg text-sm hover:bg-[#2d5f9e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новый лид
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {leadsByStage.map((column) => (
          <div
            key={column.key}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const leadId = e.dataTransfer.getData('leadId');
              if (leadId) handleDrop(leadId, column.key);
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={clsx('w-3 h-3 rounded-full', column.color)} />
              <span className="text-sm font-medium text-white">{column.label}</span>
              <span className="text-xs text-[#6c7883] bg-[#232e3c] px-2 py-0.5 rounded-full">
                {column.leads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px] bg-[#0e1621] rounded-lg p-2">
              {column.leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                  onClick={() => handleCardClick(lead)}
                  className="bg-[#17212b] border border-[#232e3c] rounded-lg p-3 cursor-pointer hover:border-[#3a73b8] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#6c7883]" />
                    <span className="text-sm font-medium text-white truncate">
                      {lead.firstName} {lead.lastName || ''}
                    </span>
                  </div>

                  {lead.companyName && (
                    <p className="text-xs text-[#6c7883] mb-1 truncate">{lead.companyName}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#6c7883] mt-2">
                    {lead.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  {lead.dealAmount && Number(lead.dealAmount) > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                      <DollarSign className="w-3 h-3" />
                      {formatMoney(lead.dealAmount)}
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#232e3c] text-[#adb5bd] rounded-full">
                      {lead.trafficChannel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && <CrmLeadModal onClose={() => setShowModal(false)} />}
      {showDrawer && selectedLead && (
        <CrmLeadDetailDrawer onClose={() => { setShowDrawer(false); selectLead(null); }} />
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { FunnelStage, LeadResult, TrafficChannel } from '../../types';
import { X, Edit2, Trash2, ArrowRight, Clock, User, Phone, Mail, Building2, DollarSign } from 'lucide-react';
import { CrmLeadModal } from './CrmLeadModal';
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

const RESULT_LABELS: Record<LeadResult, string> = {
  pending: 'В процессе', won: 'Выиграно', lost: 'Проиграно', deferred: 'Отложено',
};

const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  website: 'Сайт', instagram: 'Instagram', telegram: 'Telegram', whatsapp: 'WhatsApp',
  facebook: 'Facebook', referral: 'Реферал', cold_call: 'Холодный звонок',
  exhibition: 'Выставка', advertisement: 'Реклама', partner: 'Партнёр', other: 'Другое',
};

const STAGES_ORDER: FunnelStage[] = ['new', 'contact', 'negotiation', 'proposal', 'deal'];

const formatMoney = (amount: string | number | undefined) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('ru-RU').format(Number(amount)) + ' ₸';
};

interface Props {
  onClose: () => void;
}

export const CrmLeadDetailDrawer: React.FC<Props> = ({ onClose }) => {
  const { selectedLead, leadHistory, fetchLeadHistory, moveLeadStage, deleteLead, updateLead } = useCrmStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [moveComment, setMoveComment] = useState('');

  useEffect(() => {
    if (selectedLead) {
      fetchLeadHistory(selectedLead.id);
    }
  }, [selectedLead?.id]);

  if (!selectedLead) return null;

  const currentStageIdx = STAGES_ORDER.indexOf(selectedLead.stage);
  const nextStage = currentStageIdx < STAGES_ORDER.length - 1 ? STAGES_ORDER[currentStageIdx + 1] : null;

  const handleMoveNext = () => {
    if (nextStage) {
      moveLeadStage(selectedLead.id, nextStage, moveComment || undefined);
      setMoveComment('');
    }
  };

  const handleMarkLost = () => {
    updateLead(selectedLead.id, { result: 'lost' });
  };

  const handleDelete = () => {
    deleteLead(selectedLead.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 z-50 bg-[#17212b] border-l border-[#232e3c] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#232e3c]">
          <h2 className="text-lg font-semibold text-white truncate">
            {selectedLead.firstName} {selectedLead.lastName || ''}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c]"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-[#6c7883] hover:text-red-400 rounded-lg hover:bg-[#232e3c]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage + Result */}
        <div className="p-4 border-b border-[#232e3c]">
          <div className="flex items-center gap-2 mb-3">
            <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STAGE_COLORS[selectedLead.stage])}>
              {STAGE_LABELS[selectedLead.stage]}
            </span>
            <span className="text-xs text-[#6c7883]">
              {RESULT_LABELS[selectedLead.result]}
            </span>
          </div>

          {/* Stage progress */}
          <div className="flex gap-1 mb-3">
            {STAGES_ORDER.map((stage, idx) => (
              <div
                key={stage}
                className={clsx(
                  'flex-1 h-1.5 rounded-full',
                  idx <= currentStageIdx ? 'bg-[#3a73b8]' : 'bg-[#232e3c]'
                )}
              />
            ))}
          </div>

          {/* Move buttons */}
          {nextStage && selectedLead.result === 'pending' && (
            <div className="space-y-2">
              <input
                value={moveComment}
                onChange={(e) => setMoveComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
                className="w-full px-3 py-1.5 bg-[#0e1621] border border-[#232e3c] rounded-lg text-xs text-white placeholder-[#6c7883] outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleMoveNext}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#3a73b8] text-white rounded-lg text-xs hover:bg-[#2d5f9e]"
                >
                  <ArrowRight className="w-3 h-3" />
                  {STAGE_LABELS[nextStage]}
                </button>
                <button
                  onClick={handleMarkLost}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                >
                  Потерян
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="p-4 border-b border-[#232e3c] space-y-2">
          {selectedLead.companyName && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#6c7883]" />
              <span className="text-[#adb5bd]">{selectedLead.companyName}</span>
            </div>
          )}
          {selectedLead.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-[#6c7883]" />
              <span className="text-[#adb5bd]">{selectedLead.phone}</span>
            </div>
          )}
          {selectedLead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#6c7883]" />
              <span className="text-[#adb5bd]">{selectedLead.email}</span>
            </div>
          )}
          {selectedLead.dealAmount && Number(selectedLead.dealAmount) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{formatMoney(selectedLead.dealAmount)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs px-2 py-0.5 bg-[#232e3c] text-[#adb5bd] rounded-full">
              {CHANNEL_LABELS[selectedLead.trafficChannel]}
            </span>
          </div>
        </div>

        {/* Notes */}
        {selectedLead.notes && (
          <div className="p-4 border-b border-[#232e3c]">
            <p className="text-xs text-[#6c7883] mb-1">Заметки</p>
            <p className="text-sm text-[#adb5bd]">{selectedLead.notes}</p>
          </div>
        )}

        {/* History */}
        <div className="p-4 flex-1">
          <p className="text-xs text-[#6c7883] mb-3">История изменений</p>
          <div className="space-y-3">
            {leadHistory.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#232e3c] flex items-center justify-center">
                  <Clock className="w-3 h-3 text-[#6c7883]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    {entry.fromStage && (
                      <>
                        <span className="text-[#6c7883]">{STAGE_LABELS[entry.fromStage]}</span>
                        <ArrowRight className="w-3 h-3 text-[#6c7883]" />
                      </>
                    )}
                    <span className="text-white font-medium">{STAGE_LABELS[entry.toStage]}</span>
                  </div>
                  {entry.comment && (
                    <p className="text-xs text-[#6c7883] mt-0.5">{entry.comment}</p>
                  )}
                  <p className="text-[10px] text-[#6c7883] mt-0.5">
                    {new Date(entry.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
            {leadHistory.length === 0 && (
              <p className="text-xs text-[#6c7883]">Нет записей</p>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <CrmLeadModal lead={selectedLead} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
};

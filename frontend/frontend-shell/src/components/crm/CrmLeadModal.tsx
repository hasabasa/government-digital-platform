import React, { useState } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { X } from 'lucide-react';
import { TrafficChannel } from '../../types';

const CHANNEL_OPTIONS: { value: TrafficChannel; label: string }[] = [
  { value: 'website', label: 'Сайт' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral', label: 'Реферал' },
  { value: 'cold_call', label: 'Холодный звонок' },
  { value: 'exhibition', label: 'Выставка' },
  { value: 'advertisement', label: 'Реклама' },
  { value: 'partner', label: 'Партнёр' },
  { value: 'other', label: 'Другое' },
];

interface Props {
  onClose: () => void;
  lead?: any; // For edit mode
}

export const CrmLeadModal: React.FC<Props> = ({ onClose, lead }) => {
  const { createLead, updateLead } = useCrmStore();
  const isEdit = !!lead;

  const [form, setForm] = useState({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    companyName: lead?.companyName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    trafficChannel: lead?.trafficChannel || 'other',
    dealAmount: lead?.dealAmount ? Number(lead.dealAmount) : 0,
    notes: lead?.notes || '',
  });

  const handleSubmit = async () => {
    if (!form.firstName.trim()) return;

    if (isEdit) {
      await updateLead(lead.id, form);
    } else {
      await createLead(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#17212b] border border-[#232e3c] rounded-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Редактировать лид' : 'Новый лид'}
          </h2>
          <button onClick={onClose} className="text-[#6c7883] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Имя *</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Имя"
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Фамилия</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Фамилия"
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6c7883] mb-1 block">Компания</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Название компании"
              className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Телефон</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 ..."
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Канал трафика</label>
              <select
                value={form.trafficChannel}
                onChange={(e) => setForm({ ...form, trafficChannel: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white outline-none focus:border-[#3a73b8]"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6c7883] mb-1 block">Сумма сделки (₸)</label>
              <input
                type="number"
                value={form.dealAmount || ''}
                onChange={(e) => setForm({ ...form, dealAmount: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6c7883] mb-1 block">Заметки</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Заметки о лиде..."
              rows={3}
              className="w-full px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#adb5bd] bg-[#232e3c] rounded-lg hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.firstName.trim()}
            className="px-4 py-2 text-sm text-white bg-[#3a73b8] rounded-lg hover:bg-[#2d5f9e] disabled:opacity-50 transition-colors"
          >
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

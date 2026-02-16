import React, { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { useAuthStore } from '../../stores/auth.store';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const formatMoney = (amount: string | number) =>
  new Intl.NumberFormat('ru-RU').format(Number(amount)) + ' ₸';

export const CrmPlansTab: React.FC = () => {
  const { salesPlans, fetchSalesPlans, createSalesPlan, updateSalesPlan, deleteSalesPlan } = useCrmStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    managerId: '',
    period: 'monthly' as 'monthly' | 'quarterly',
    periodStart: '',
    periodEnd: '',
    targetAmount: 0,
    targetCount: 0,
  });

  useEffect(() => {
    fetchSalesPlans();
  }, []);

  const resetForm = () => {
    setForm({ managerId: '', period: 'monthly', periodStart: '', periodEnd: '', targetAmount: 0, targetCount: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.managerId || !form.periodStart || !form.periodEnd || form.targetAmount <= 0) return;

    if (editingId) {
      await updateSalesPlan(editingId, form);
    } else {
      await createSalesPlan(form);
    }
    resetForm();
  };

  const handleEdit = (plan: any) => {
    setForm({
      managerId: plan.managerId,
      period: plan.period,
      periodStart: plan.periodStart.split('T')[0],
      periodEnd: plan.periodEnd.split('T')[0],
      targetAmount: Number(plan.targetAmount),
      targetCount: plan.targetCount,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Планы продаж</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3a73b8] text-white rounded-lg text-sm hover:bg-[#2d5f9e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый план
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="bg-[#17212b] border border-[#232e3c] rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3">
            {editingId ? 'Редактировать план' : 'Новый план продаж'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="UUID менеджера"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
            />
            <select
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value as any })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white outline-none focus:border-[#3a73b8]"
            >
              <option value="monthly">Месячный</option>
              <option value="quarterly">Квартальный</option>
            </select>
            <input
              type="number"
              placeholder="Цель (сумма)"
              value={form.targetAmount || ''}
              onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
            />
            <input
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white outline-none focus:border-[#3a73b8]"
            />
            <input
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white outline-none focus:border-[#3a73b8]"
            />
            <input
              type="number"
              placeholder="Цель (кол-во сделок)"
              value={form.targetCount || ''}
              onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) })}
              className="px-3 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-4 py-2 bg-[#3a73b8] text-white rounded-lg text-sm hover:bg-[#2d5f9e]"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Сохранить' : 'Создать'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 px-4 py-2 bg-[#232e3c] text-[#adb5bd] rounded-lg text-sm hover:text-white"
            >
              <X className="w-4 h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#17212b] border border-[#232e3c] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#232e3c]">
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Менеджер</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Период</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Начало</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Конец</th>
              <th className="text-right text-xs text-[#6c7883] font-medium px-4 py-3">Цель (сумма)</th>
              <th className="text-right text-xs text-[#6c7883] font-medium px-4 py-3">Цель (кол-во)</th>
              {isAdmin && <th className="text-right text-xs text-[#6c7883] font-medium px-4 py-3">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {salesPlans.map((plan) => (
              <tr key={plan.id} className="border-b border-[#232e3c] last:border-0">
                <td className="px-4 py-3 text-sm text-white">{plan.managerId.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-sm text-[#adb5bd]">
                  {plan.period === 'monthly' ? 'Месячный' : 'Квартальный'}
                </td>
                <td className="px-4 py-3 text-sm text-[#adb5bd]">
                  {new Date(plan.periodStart).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-sm text-[#adb5bd]">
                  {new Date(plan.periodEnd).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-sm text-white text-right">{formatMoney(plan.targetAmount)}</td>
                <td className="px-4 py-3 text-sm text-[#adb5bd] text-right">{plan.targetCount}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-1.5 text-[#6c7883] hover:text-white rounded-lg hover:bg-[#232e3c]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSalesPlan(plan.id)}
                        className="p-1.5 text-[#6c7883] hover:text-red-400 rounded-lg hover:bg-[#232e3c]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {salesPlans.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-sm text-[#6c7883]">
                  Планы продаж не созданы
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

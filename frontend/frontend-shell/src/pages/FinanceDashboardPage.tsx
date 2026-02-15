import React, { useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
    useFinanceStore,
    SHAREHOLDER_LABELS,
    TARIFFS,
} from '../stores/finance.store';
import {
    TrendingUp,
    Users,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Calendar,
    Trash2,
} from 'lucide-react';

export const FinanceDashboardPage: React.FC = () => {
    const { salesHistory, shareholderTotals, clearHistory } = useFinanceStore();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
    };

    // Общая статистика
    const stats = useMemo(() => {
        const totalRevenue = salesHistory.reduce((sum, e) => sum + e.grossRevenue, 0);
        const totalDeductions = salesHistory.reduce((sum, e) => sum + e.deductions.totalDeductions, 0);
        const totalNet = salesHistory.reduce((sum, e) => sum + e.netProfit, 0);
        const totalSales = salesHistory.reduce((sum, e) => sum + e.salesCount.total, 0);
        return { totalRevenue, totalDeductions, totalNet, totalSales };
    }, [salesHistory]);

    // Цвета дольщиков
    const shareholderColors: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
        khasenkhan: {
            bg: 'bg-blue-500/20',
            text: 'text-blue-400',
            ring: 'ring-blue-500/30',
            gradient: 'from-blue-500 to-blue-600',
        },
        adil: {
            bg: 'bg-purple-500/20',
            text: 'text-purple-400',
            ring: 'ring-purple-500/30',
            gradient: 'from-purple-500 to-purple-600',
        },
        azamat: {
            bg: 'bg-amber-500/20',
            text: 'text-amber-400',
            ring: 'ring-amber-500/30',
            gradient: 'from-amber-500 to-amber-600',
        },
    };

    return (
        <MainLayout>
            <div className="h-full overflow-auto bg-[#0e1621]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">Дашборд</h1>
                                <p className="text-sm text-[#6c7883]">Финансовая аналитика</p>
                            </div>
                        </div>

                        {salesHistory.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Очистить
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    {/* Общие показатели */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Выручка"
                            value={formatMoney(stats.totalRevenue)}
                            iconColor="text-green-400"
                            iconBg="bg-green-500/20"
                        />
                        <StatCard
                            icon={<ArrowDownRight className="w-5 h-5" />}
                            label="Вычеты"
                            value={formatMoney(stats.totalDeductions)}
                            iconColor="text-red-400"
                            iconBg="bg-red-500/20"
                        />
                        <StatCard
                            icon={<Wallet className="w-5 h-5" />}
                            label="Чистая прибыль"
                            value={formatMoney(stats.totalNet)}
                            iconColor="text-blue-400"
                            iconBg="bg-blue-500/20"
                        />
                        <StatCard
                            icon={<ArrowUpRight className="w-5 h-5" />}
                            label="Продажи"
                            value={`${stats.totalSales} шт`}
                            iconColor="text-amber-400"
                            iconBg="bg-amber-500/20"
                        />
                    </div>

                    {/* Балансы дольщиков */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-[#6c7883]" />
                            <h2 className="text-base font-medium text-white">Балансы дольщиков</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(shareholderTotals).map(([name, total]) => {
                                const colors = shareholderColors[name] || shareholderColors.azamat;
                                const sharePercent = name === 'azamat' ? 20 : 40;

                                return (
                                    <div
                                        key={name}
                                        className={`bg-[#17212b] border border-[#232e3c] rounded-xl p-5 ring-1 ${colors.ring} transition-all hover:ring-2`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                                                {SHAREHOLDER_LABELS[name]?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">{SHAREHOLDER_LABELS[name]}</h3>
                                                <p className="text-xs text-[#6c7883]">{sharePercent}% от прибыли</p>
                                            </div>
                                        </div>

                                        <div className={`text-2xl font-bold ${colors.text} tabular-nums`}>
                                            {formatMoney(total)}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3 h-1.5 bg-[#232e3c] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-500`}
                                                style={{
                                                    width: stats.totalNet > 0
                                                        ? `${(total / stats.totalNet) * 100}%`
                                                        : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* История продаж */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-[#6c7883]" />
                            <h2 className="text-base font-medium text-white">
                                История продаж
                                {salesHistory.length > 0 && (
                                    <span className="text-[#6c7883] font-normal ml-2">({salesHistory.length})</span>
                                )}
                            </h2>
                        </div>

                        {salesHistory.length === 0 ? (
                            <div className="bg-[#17212b] border border-[#232e3c] rounded-xl p-12 text-center">
                                <BarChart3 className="w-12 h-12 text-[#232e3c] mx-auto mb-3" />
                                <p className="text-[#6c7883]">Пока нет записей</p>
                                <p className="text-sm text-[#4a5568] mt-1">
                                    Перейдите в <span className="text-[#3a73b8]">Кассу</span> для добавления продаж
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {salesHistory.slice(0, 20).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4 hover:border-[#3a73b8]/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {/* Тарифные бейджи */}
                                                    {entry.salesCount.basic > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs">
                                                            Basic ×{entry.salesCount.basic}
                                                        </span>
                                                    )}
                                                    {entry.salesCount.standard > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs">
                                                            Standard ×{entry.salesCount.standard}
                                                        </span>
                                                    )}
                                                    {entry.salesCount.premium > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs">
                                                            Premium ×{entry.salesCount.premium}
                                                        </span>
                                                    )}
                                                </div>

                                                {entry.note && (
                                                    <p className="text-sm text-[#6c7883] mt-1.5">{entry.note}</p>
                                                )}

                                                <p className="text-xs text-[#4a5568] mt-2">
                                                    {new Date(entry.createdAt).toLocaleString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>

                                            <div className="text-right ml-4">
                                                <div className="text-white font-semibold">
                                                    {formatMoney(entry.grossRevenue)}
                                                </div>
                                                <div className="text-sm text-green-400">
                                                    ↳ {formatMoney(entry.netProfit)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

// === Компонент карточки статистики ===

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    iconColor: string;
    iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconColor, iconBg }) => (
    <div className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} mb-3`}>
            {icon}
        </div>
        <p className="text-xs text-[#6c7883] mb-1">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
    </div>
);

export default FinanceDashboardPage;

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
    useFinanceStore,
    TARIFFS,
    SHAREHOLDER_LABELS,
} from '../stores/finance.store';
import {
    Calculator,
    Plus,
    Minus,
    Send,
    RotateCcw,
    TrendingUp,
    Banknote,
    Receipt,
} from 'lucide-react';

export const CashierPage: React.FC = () => {
    const {
        currentInput,
        lastResult,
        setInput,
        resetInput,
        calculate,
        submitSale,
    } = useFinanceStore();

    const [note, setNote] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Пересчитаем при изменении ввода
    useEffect(() => {
        if (currentInput.basic > 0 || currentInput.standard > 0 || currentInput.premium > 0) {
            calculate();
            setShowResult(true);
        } else {
            setShowResult(false);
        }
    }, [currentInput.basic, currentInput.standard, currentInput.premium, calculate]);

    const handleIncrement = (field: 'basic' | 'standard' | 'premium') => {
        setInput({ [field]: currentInput[field] + 1 });
    };

    const handleDecrement = (field: 'basic' | 'standard' | 'premium') => {
        if (currentInput[field] > 0) {
            setInput({ [field]: currentInput[field] - 1 });
        }
    };

    const handleSubmit = () => {
        if (!lastResult || lastResult.salesCount.total === 0) return;
        submitSale(note || undefined);
        setNote('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);
    };

    const handleReset = () => {
        resetInput();
        setNote('');
        setShowResult(false);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
    };

    const tariffCards = [
        {
            key: 'basic' as const,
            label: 'Basic',
            price: TARIFFS.basic,
            color: 'from-emerald-500/20 to-emerald-600/10',
            borderColor: 'border-emerald-500/30',
            textColor: 'text-emerald-400',
            iconBg: 'bg-emerald-500/20',
        },
        {
            key: 'standard' as const,
            label: 'Standard',
            price: TARIFFS.standard,
            color: 'from-blue-500/20 to-blue-600/10',
            borderColor: 'border-blue-500/30',
            textColor: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
        },
        {
            key: 'premium' as const,
            label: 'Premium',
            price: TARIFFS.premium,
            color: 'from-amber-500/20 to-amber-600/10',
            borderColor: 'border-amber-500/30',
            textColor: 'text-amber-400',
            iconBg: 'bg-amber-500/20',
        },
    ];

    return (
        <MainLayout>
            <div className="h-full overflow-auto bg-[#0e1621]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Касса</h1>
                            <p className="text-sm text-[#6c7883]">Быстрый ввод продаж</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
                    {/* Тарифные карточки */}
                    <div className="space-y-3">
                        {tariffCards.map((tariff) => (
                            <div
                                key={tariff.key}
                                className={`bg-gradient-to-r ${tariff.color} border ${tariff.borderColor} rounded-xl p-4 transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${tariff.iconBg} flex items-center justify-center`}>
                                            <Receipt className={`w-5 h-5 ${tariff.textColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{tariff.label}</h3>
                                            <p className={`text-sm ${tariff.textColor}`}>{formatMoney(tariff.price)}</p>
                                        </div>
                                    </div>

                                    {/* Counter */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleDecrement(tariff.key)}
                                            disabled={currentInput[tariff.key] === 0}
                                            className="w-11 h-11 rounded-lg bg-[#17212b] border border-[#232e3c] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#232e3c] transition-colors active:scale-95"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>

                                        <span className="text-xl font-bold text-white min-w-[2.5rem] text-center tabular-nums">
                                            {currentInput[tariff.key]}
                                        </span>

                                        <button
                                            onClick={() => handleIncrement(tariff.key)}
                                            className={`w-11 h-11 rounded-lg bg-[#17212b] border ${tariff.borderColor} flex items-center justify-center text-white hover:bg-[#232e3c] transition-colors active:scale-95`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Заметка */}
                    <div>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Заметка (необязательно)"
                            className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl px-4 py-3 text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
                        />
                    </div>

                    {/* Результат расчёта */}
                    {showResult && lastResult && (
                        <div className="bg-[#17212b] border border-[#232e3c] rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                            <div className="px-4 py-3 border-b border-[#232e3c] flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-[#6c7883]" />
                                <span className="text-sm font-medium text-[#6c7883]">Расчёт</span>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Выручка */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[#adb5bd]">Выручка</span>
                                    <span className="text-white font-semibold">{formatMoney(lastResult.grossRevenue)}</span>
                                </div>

                                {/* Вычеты */}
                                <div className="space-y-2 pl-3 border-l-2 border-red-500/30">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6c7883]">Банк (2%)</span>
                                        <span className="text-red-400">−{formatMoney(lastResult.deductions.bank)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6c7883]">Налог (4%)</span>
                                        <span className="text-red-400">−{formatMoney(lastResult.deductions.tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6c7883]">Арслан (20%)</span>
                                        <span className="text-red-400">−{formatMoney(lastResult.deductions.ambassador)}</span>
                                    </div>
                                </div>

                                {/* Разделитель */}
                                <div className="border-t border-[#232e3c]" />

                                {/* Чистый остаток */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[#adb5bd] font-medium">Чистый остаток</span>
                                    <span className="text-green-400 font-bold text-lg">{formatMoney(lastResult.netProfit)}</span>
                                </div>

                                {/* Доли */}
                                <div className="space-y-2 pt-2">
                                    {lastResult.payouts.map((payout) => (
                                        <div key={payout.name} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${payout.name === 'khasenkhan' ? 'bg-blue-400' :
                                                        payout.name === 'adil' ? 'bg-purple-400' : 'bg-amber-400'
                                                    }`} />
                                                <span className="text-[#adb5bd]">
                                                    {SHAREHOLDER_LABELS[payout.name]} ({payout.sharePercent}%)
                                                </span>
                                            </div>
                                            <span className="text-white font-medium">{formatMoney(payout.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#17212b] border border-[#232e3c] rounded-xl text-[#adb5bd] hover:bg-[#232e3c] transition-colors active:scale-[0.98]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Сбросить
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={!lastResult || lastResult.salesCount.total === 0}
                            className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-[0.98] ${submitted
                                    ? 'bg-green-500 text-white'
                                    : 'bg-[#3a73b8] text-white hover:bg-[#4a83c8] disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                        >
                            {submitted ? (
                                <>
                                    <TrendingUp className="w-4 h-4" />
                                    Записано!
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Записать продажу
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CashierPage;

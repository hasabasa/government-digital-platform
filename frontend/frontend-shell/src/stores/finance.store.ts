import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// === Типы ===

export interface SalesInput {
    basic: number;
    standard: number;
    premium: number;
    date?: string;
    note?: string;
}

export interface DeductionBreakdown {
    bank: number;
    tax: number;
    ambassador: number;
    totalDeductions: number;
}

export interface ShareholderPayout {
    name: 'khasenkhan' | 'adil' | 'azamat';
    sharePercent: number;
    amount: number;
}

export interface CalculationResult {
    salesCount: {
        basic: number;
        standard: number;
        premium: number;
        total: number;
    };
    grossRevenue: number;
    deductions: DeductionBreakdown;
    netProfit: number;
    payouts: ShareholderPayout[];
}

export interface SalesHistoryEntry extends CalculationResult {
    id: string;
    date: string;
    note?: string;
    createdAt: string;
}

// === Тарифы и ставки (зеркало бэкенда) ===

export const TARIFFS = {
    basic: 21_990,
    standard: 27_990,
    premium: 33_990,
} as const;

export const DEDUCTION_RATES = {
    bank: 0.02,
    tax: 0.04,
    ambassador: 0.20,
} as const;

export const SHAREHOLDER_SHARES = {
    khasenkhan: 0.40,
    adil: 0.40,
    azamat: 0.20,
} as const;

export const SHAREHOLDER_LABELS: Record<string, string> = {
    khasenkhan: 'Хасенхан',
    adil: 'Адиль',
    azamat: 'Азамат',
};

// === Локальный расчёт (пока нет API) ===

function calculateLocal(input: SalesInput): CalculationResult {
    const totalSales = input.basic + input.standard + input.premium;
    const grossRevenue =
        input.basic * TARIFFS.basic +
        input.standard * TARIFFS.standard +
        input.premium * TARIFFS.premium;

    const bank = Math.round(grossRevenue * DEDUCTION_RATES.bank);
    const tax = Math.round(grossRevenue * DEDUCTION_RATES.tax);
    const ambassador = Math.round(grossRevenue * DEDUCTION_RATES.ambassador);
    const totalDeductions = bank + tax + ambassador;
    const netProfit = grossRevenue - totalDeductions;

    const payouts: ShareholderPayout[] = (
        Object.entries(SHAREHOLDER_SHARES) as [ShareholderPayout['name'], number][]
    ).map(([name, share]) => ({
        name,
        sharePercent: share * 100,
        amount: Math.round(netProfit * share),
    }));

    return {
        salesCount: { basic: input.basic, standard: input.standard, premium: input.premium, total: totalSales },
        grossRevenue,
        deductions: { bank, tax, ambassador, totalDeductions },
        netProfit,
        payouts,
    };
}

// === Zustand Store ===

interface FinanceState {
    // Текущий ввод
    currentInput: SalesInput;
    // Последний расчёт
    lastResult: CalculationResult | null;
    // История
    salesHistory: SalesHistoryEntry[];
    // Общие балансы дольщиков
    shareholderTotals: Record<string, number>;
}

interface FinanceActions {
    setInput: (input: Partial<SalesInput>) => void;
    resetInput: () => void;
    calculate: () => CalculationResult;
    submitSale: (note?: string) => void;
    clearHistory: () => void;
}

const defaultInput: SalesInput = { basic: 0, standard: 0, premium: 0 };

export const useFinanceStore = create<FinanceState & FinanceActions>()(
    persist(
        (set, get) => ({
            currentInput: { ...defaultInput },
            lastResult: null,
            salesHistory: [],
            shareholderTotals: { khasenkhan: 0, adil: 0, azamat: 0 },

            setInput: (input) => {
                set((state) => ({
                    currentInput: { ...state.currentInput, ...input },
                }));
            },

            resetInput: () => {
                set({ currentInput: { ...defaultInput }, lastResult: null });
            },

            calculate: () => {
                const { currentInput } = get();
                const result = calculateLocal(currentInput);
                set({ lastResult: result });
                return result;
            },

            submitSale: (note?: string) => {
                const { currentInput, salesHistory, shareholderTotals } = get();
                const result = calculateLocal(currentInput);

                const entry: SalesHistoryEntry = {
                    ...result,
                    id: crypto.randomUUID(),
                    date: new Date().toISOString().split('T')[0],
                    note,
                    createdAt: new Date().toISOString(),
                };

                // Обновляем балансы
                const newTotals = { ...shareholderTotals };
                for (const payout of result.payouts) {
                    newTotals[payout.name] = (newTotals[payout.name] || 0) + payout.amount;
                }

                set({
                    salesHistory: [entry, ...salesHistory],
                    shareholderTotals: newTotals,
                    lastResult: result,
                    currentInput: { ...defaultInput },
                });
            },

            clearHistory: () => {
                set({
                    salesHistory: [],
                    shareholderTotals: { khasenkhan: 0, adil: 0, azamat: 0 },
                    lastResult: null,
                });
            },
        }),
        {
            name: 'finance-storage',
            partialize: (state) => ({
                salesHistory: state.salesHistory,
                shareholderTotals: state.shareholderTotals,
            }),
        }
    )
);

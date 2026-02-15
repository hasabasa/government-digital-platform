import { z } from 'zod';

// === Тарифы ===
export const TARIFFS = {
    basic: 21_990,
    standard: 27_990,
    premium: 33_990,
} as const;

export type TariffName = keyof typeof TARIFFS;

// === Ставки вычетов (от выручки) ===
export const DEDUCTION_RATES = {
    bank: 0.02,        // 2% - банковская комиссия
    tax: 0.04,         // 4% - налог
    ambassador: 0.20,  // 20% - Амбассадор Арслан
} as const;

// === Доли (от чистого остатка) ===
export const SHAREHOLDER_SHARES = {
    khasenkhan: 0.40,  // 40%
    adil: 0.40,        // 40%
    azamat: 0.20,      // 20%
} as const;

export type ShareholderName = keyof typeof SHAREHOLDER_SHARES;

// === Zod Schemas ===

export const SalesInputSchema = z.object({
    basic: z.number().int().min(0).default(0),
    standard: z.number().int().min(0).default(0),
    premium: z.number().int().min(0).default(0),
    date: z.string().datetime().optional(),
    note: z.string().max(500).optional(),
});

export type SalesInput = z.infer<typeof SalesInputSchema>;

// === Результат расчёта ===

export interface DeductionBreakdown {
    bank: number;
    tax: number;
    ambassador: number;
    totalDeductions: number;
}

export interface ShareholderPayout {
    name: ShareholderName;
    sharePercent: number;
    amount: number;
}

export interface CalculationResult {
    // Входные данные
    salesCount: {
        basic: number;
        standard: number;
        premium: number;
        total: number;
    };

    // Выручка
    grossRevenue: number;

    // Вычеты
    deductions: DeductionBreakdown;

    // Чистый остаток
    netProfit: number;

    // Распределение
    payouts: ShareholderPayout[];
}

// === Бизнес-логика ===

export class FinanceCalculator {
    /**
     * Основной метод расчёта.
     * 1. Считаем выручку по тарифам.
     * 2. Вычитаем: Банк (2%), Налог (4%), Арслан (20%) — всё от выручки.
     * 3. Чистый остаток делим: Хасенхан 40%, Адиль 40%, Азамат 20%.
     */
    static calculate(input: SalesInput): CalculationResult {
        const totalSales = input.basic + input.standard + input.premium;

        // Выручка
        const grossRevenue =
            input.basic * TARIFFS.basic +
            input.standard * TARIFFS.standard +
            input.premium * TARIFFS.premium;

        // Вычеты (все от выручки)
        const bankDeduction = Math.round(grossRevenue * DEDUCTION_RATES.bank);
        const taxDeduction = Math.round(grossRevenue * DEDUCTION_RATES.tax);
        const ambassadorDeduction = Math.round(grossRevenue * DEDUCTION_RATES.ambassador);
        const totalDeductions = bankDeduction + taxDeduction + ambassadorDeduction;

        // Чистый остаток
        const netProfit = grossRevenue - totalDeductions;

        // Распределение долей
        const payouts: ShareholderPayout[] = (
            Object.entries(SHAREHOLDER_SHARES) as [ShareholderName, number][]
        ).map(([name, share]) => ({
            name,
            sharePercent: share * 100,
            amount: Math.round(netProfit * share),
        }));

        return {
            salesCount: {
                basic: input.basic,
                standard: input.standard,
                premium: input.premium,
                total: totalSales,
            },
            grossRevenue,
            deductions: {
                bank: bankDeduction,
                tax: taxDeduction,
                ambassador: ambassadorDeduction,
                totalDeductions,
            },
            netProfit,
            payouts,
        };
    }
}

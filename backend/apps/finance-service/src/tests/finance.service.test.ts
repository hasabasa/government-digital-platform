import { describe, it, expect } from 'vitest';
import {
    FinanceCalculator,
    TARIFFS,
    DEDUCTION_RATES,
    SHAREHOLDER_SHARES,
    SalesInput,
} from '../services/finance.service';

describe('FinanceCalculator', () => {
    describe('calculate()', () => {
        it('должен корректно рассчитать при нулевых продажах', () => {
            const input: SalesInput = { basic: 0, standard: 0, premium: 0 };
            const result = FinanceCalculator.calculate(input);

            expect(result.grossRevenue).toBe(0);
            expect(result.netProfit).toBe(0);
            expect(result.deductions.totalDeductions).toBe(0);
            result.payouts.forEach((p) => {
                expect(p.amount).toBe(0);
            });
        });

        it('должен корректно рассчитать для 1 продажи basic (21 990)', () => {
            const input: SalesInput = { basic: 1, standard: 0, premium: 0 };
            const result = FinanceCalculator.calculate(input);

            expect(result.grossRevenue).toBe(21_990);

            // Вычеты от выручки
            expect(result.deductions.bank).toBe(Math.round(21_990 * 0.02));       // 440
            expect(result.deductions.tax).toBe(Math.round(21_990 * 0.04));        // 880
            expect(result.deductions.ambassador).toBe(Math.round(21_990 * 0.20)); // 4398

            const expectedNet = 21_990 - result.deductions.totalDeductions;
            expect(result.netProfit).toBe(expectedNet);
        });

        it('должен корректно распределять доли 40/40/20', () => {
            const input: SalesInput = { basic: 10, standard: 5, premium: 3 };
            const result = FinanceCalculator.calculate(input);

            const khasenkhan = result.payouts.find((p) => p.name === 'khasenkhan')!;
            const adil = result.payouts.find((p) => p.name === 'adil')!;
            const azamat = result.payouts.find((p) => p.name === 'azamat')!;

            // Проверяем проценты
            expect(khasenkhan.sharePercent).toBe(40);
            expect(adil.sharePercent).toBe(40);
            expect(azamat.sharePercent).toBe(20);

            // Хасенхан и Адиль должны получить одинаково (40% = 40%)
            expect(khasenkhan.amount).toBe(adil.amount);

            // Азамат получает ровно половину от Хасенхана (20% vs 40%)
            expect(azamat.amount).toBe(Math.round(result.netProfit * 0.20));

            // Сумма долей ≈ netProfit (может быть погрешность округления ±1)
            const totalPayouts = khasenkhan.amount + adil.amount + azamat.amount;
            expect(Math.abs(totalPayouts - result.netProfit)).toBeLessThanOrEqual(2);
        });

        it('должен корректно считать выручку по всем тарифам', () => {
            const input: SalesInput = { basic: 2, standard: 3, premium: 1 };
            const result = FinanceCalculator.calculate(input);

            const expectedRevenue =
                2 * TARIFFS.basic + 3 * TARIFFS.standard + 1 * TARIFFS.premium;
            expect(result.grossRevenue).toBe(expectedRevenue);
        });

        it('вычеты должны составить 26% от выручки', () => {
            const input: SalesInput = { basic: 5, standard: 5, premium: 5 };
            const result = FinanceCalculator.calculate(input);

            const totalRates =
                DEDUCTION_RATES.bank + DEDUCTION_RATES.tax + DEDUCTION_RATES.ambassador;
            expect(totalRates).toBe(0.26); // 2% + 4% + 20%

            // Из-за округления проверяем приблизительно
            const expectedDeductions = Math.round(result.grossRevenue * 0.26);
            expect(Math.abs(result.deductions.totalDeductions - expectedDeductions)).toBeLessThanOrEqual(3);
        });

        it('salesCount должен содержать правильные данные', () => {
            const input: SalesInput = { basic: 7, standard: 3, premium: 2 };
            const result = FinanceCalculator.calculate(input);

            expect(result.salesCount.basic).toBe(7);
            expect(result.salesCount.standard).toBe(3);
            expect(result.salesCount.premium).toBe(2);
            expect(result.salesCount.total).toBe(12);
        });

        it('сумма всех дольщиков = 100%', () => {
            const totalShares = Object.values(SHAREHOLDER_SHARES).reduce((a, b) => a + b, 0);
            expect(totalShares).toBe(1.0);
        });
    });
});

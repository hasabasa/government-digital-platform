import { Request, Response } from 'express';
import { FinanceCalculator, SalesInput } from '../services/finance.service';
import { logger } from '../utils/logger';

export class FinanceController {
    /**
     * POST /api/v1/finance/calculate
     * Рассчитать распределение прибыли по входным данным продаж.
     */
    calculate = async (req: Request, res: Response): Promise<void> => {
        try {
            const input: SalesInput = req.body;
            const result = FinanceCalculator.calculate(input);

            logger.info('Finance calculation performed', {
                userId: (req as any).user?.userId,
                totalSales: result.salesCount.total,
                grossRevenue: result.grossRevenue,
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Calculation error', { error: err.message });
            res.status(500).json({
                success: false,
                error: 'Failed to perform calculation',
            });
        }
    };

    /**
     * GET /api/v1/finance/tariffs
     * Получить список доступных тарифов и ставок.
     */
    getTariffs = async (_req: Request, res: Response): Promise<void> => {
        try {
            const { TARIFFS, DEDUCTION_RATES, SHAREHOLDER_SHARES } = await import(
                '../services/finance.service'
            );

            res.status(200).json({
                success: true,
                data: {
                    tariffs: TARIFFS,
                    deductions: {
                        bank: `${DEDUCTION_RATES.bank * 100}%`,
                        tax: `${DEDUCTION_RATES.tax * 100}%`,
                        ambassador: `${DEDUCTION_RATES.ambassador * 100}%`,
                    },
                    shares: Object.entries(SHAREHOLDER_SHARES).map(([name, share]) => ({
                        name,
                        percent: `${(share as number) * 100}%`,
                    })),
                },
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Get tariffs error', { error: err.message });
            res.status(500).json({
                success: false,
                error: 'Failed to get tariffs',
            });
        }
    };

    /**
     * GET /api/v1/finance/health
     */
    health = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json({
            success: true,
            message: 'Finance service is running',
            timestamp: new Date().toISOString(),
            service: 'finance-service',
            version: '0.1.0',
        });
    };
}

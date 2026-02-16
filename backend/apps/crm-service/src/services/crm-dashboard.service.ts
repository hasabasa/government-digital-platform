import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, sql, count, sum, gte, lte } from 'drizzle-orm';
import { crmLeads, crmSalesPlans, users } from '@cube-demper/database';
import { config } from '../config';

const pool = new Pool({ connectionString: config.databaseUrl });
const db = drizzle(pool);

export class CrmDashboardService {
    /**
     * Полный дашборд CRM: воронка, статистика по менеджерам, общие KPI.
     */
    async getDashboard() {
        // Воронка по стадиям
        const funnelStats = await db.select({
            stage: crmLeads.stage,
            count: count(),
            totalAmount: sum(crmLeads.dealAmount),
        })
            .from(crmLeads)
            .where(eq(crmLeads.isActive, true))
            .groupBy(crmLeads.stage);

        // По каналам трафика
        const channelStats = await db.select({
            channel: crmLeads.trafficChannel,
            count: count(),
        })
            .from(crmLeads)
            .where(eq(crmLeads.isActive, true))
            .groupBy(crmLeads.trafficChannel);

        // По результатам
        const resultStats = await db.select({
            result: crmLeads.result,
            count: count(),
            totalAmount: sum(crmLeads.dealAmount),
        })
            .from(crmLeads)
            .where(eq(crmLeads.isActive, true))
            .groupBy(crmLeads.result);

        // Общие KPI
        const totalLeads = await db.select({ count: count() })
            .from(crmLeads)
            .where(eq(crmLeads.isActive, true));

        const wonDeals = await db.select({
            count: count(),
            totalAmount: sum(crmLeads.dealAmount),
        })
            .from(crmLeads)
            .where(and(eq(crmLeads.isActive, true), eq(crmLeads.result, 'won')));

        const lostDeals = await db.select({ count: count() })
            .from(crmLeads)
            .where(and(eq(crmLeads.isActive, true), eq(crmLeads.result, 'lost')));

        const conversionRate = Number(totalLeads[0]?.count) > 0
            ? (Number(wonDeals[0]?.count) / Number(totalLeads[0]?.count) * 100).toFixed(1)
            : '0';

        return {
            funnel: funnelStats.map(s => ({
                stage: s.stage,
                count: Number(s.count),
                totalAmount: Number(s.totalAmount || 0),
            })),
            channels: channelStats.map(s => ({
                channel: s.channel,
                count: Number(s.count),
            })),
            results: resultStats.map(s => ({
                result: s.result,
                count: Number(s.count),
                totalAmount: Number(s.totalAmount || 0),
            })),
            kpi: {
                totalLeads: Number(totalLeads[0]?.count || 0),
                wonDeals: Number(wonDeals[0]?.count || 0),
                wonAmount: Number(wonDeals[0]?.totalAmount || 0),
                lostDeals: Number(lostDeals[0]?.count || 0),
                conversionRate: Number(conversionRate),
            },
        };
    }

    /**
     * Статистика по менеджерам: лиды, сделки, сумма, план, прогресс.
     */
    async getManagerStats() {
        // Группировка лидов по менеджерам
        const managerLeads = await db.select({
            managerId: crmLeads.assignedTo,
            totalLeads: count(),
            wonCount: sql<number>`count(*) filter (where ${crmLeads.result} = 'won')`,
            lostCount: sql<number>`count(*) filter (where ${crmLeads.result} = 'lost')`,
            wonAmount: sql<number>`coalesce(sum(${crmLeads.dealAmount}) filter (where ${crmLeads.result} = 'won'), 0)`,
            pendingCount: sql<number>`count(*) filter (where ${crmLeads.result} = 'pending')`,
        })
            .from(crmLeads)
            .where(eq(crmLeads.isActive, true))
            .groupBy(crmLeads.assignedTo);

        // Получаем инфо о менеджерах
        const managerIds = managerLeads
            .map(m => m.managerId)
            .filter((id): id is string => id !== null);

        let managersInfo: any[] = [];
        if (managerIds.length > 0) {
            managersInfo = await db.select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
            })
                .from(users)
                .where(sql`${users.id} = ANY(${managerIds})`);
        }

        // Получаем планы продаж для текущего месяца
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const plans = await db.select()
            .from(crmSalesPlans)
            .where(and(
                lte(crmSalesPlans.periodStart, monthEnd),
                gte(crmSalesPlans.periodEnd, monthStart),
            ));

        const plansMap = new Map(plans.map(p => [p.managerId, p]));
        const managersMap = new Map(managersInfo.map(m => [m.id, m]));

        return managerLeads.map(ml => {
            const manager = managersMap.get(ml.managerId || '');
            const plan = plansMap.get(ml.managerId || '');

            const targetAmount = plan ? Number(plan.targetAmount) : 0;
            const targetCount = plan ? Number(plan.targetCount) : 0;
            const wonAmount = Number(ml.wonAmount);
            const wonCount = Number(ml.wonCount);

            return {
                managerId: ml.managerId,
                managerName: manager
                    ? `${manager.firstName} ${manager.lastName}`
                    : 'Неизвестный',
                totalLeads: Number(ml.totalLeads),
                wonCount,
                lostCount: Number(ml.lostCount),
                pendingCount: Number(ml.pendingCount),
                wonAmount,
                targetAmount,
                targetCount,
                amountProgress: targetAmount > 0
                    ? Math.round(wonAmount / targetAmount * 100)
                    : 0,
                countProgress: targetCount > 0
                    ? Math.round(wonCount / targetCount * 100)
                    : 0,
            };
        });
    }

    // === ПЛАНЫ ПРОДАЖ ===

    async getSalesPlans() {
        return db.select()
            .from(crmSalesPlans)
            .orderBy(sql`${crmSalesPlans.periodStart} DESC`);
    }

    async createSalesPlan(data: {
        managerId: string;
        period: string;
        periodStart: string;
        periodEnd: string;
        targetAmount: number;
        targetCount?: number;
    }, createdByUserId: string) {
        const result = await db.insert(crmSalesPlans).values({
            managerId: data.managerId,
            period: data.period as any,
            periodStart: new Date(data.periodStart),
            periodEnd: new Date(data.periodEnd),
            targetAmount: String(data.targetAmount),
            targetCount: data.targetCount || 0,
            createdBy: createdByUserId,
        }).returning();
        return result[0];
    }

    async updateSalesPlan(id: string, data: Record<string, any>) {
        const updateData: any = { updatedAt: new Date() };
        if (data.targetAmount !== undefined) updateData.targetAmount = String(data.targetAmount);
        if (data.targetCount !== undefined) updateData.targetCount = data.targetCount;
        if (data.periodStart) updateData.periodStart = new Date(data.periodStart);
        if (data.periodEnd) updateData.periodEnd = new Date(data.periodEnd);
        if (data.period) updateData.period = data.period;
        if (data.managerId) updateData.managerId = data.managerId;

        const result = await db.update(crmSalesPlans)
            .set(updateData)
            .where(eq(crmSalesPlans.id, id))
            .returning();
        return result[0] || null;
    }

    async deleteSalesPlan(id: string) {
        const result = await db.delete(crmSalesPlans)
            .where(eq(crmSalesPlans.id, id))
            .returning();
        return result[0] || null;
    }
}

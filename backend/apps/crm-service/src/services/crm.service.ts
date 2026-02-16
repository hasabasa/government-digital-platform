import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, ilike, or, sql, desc, asc, count } from 'drizzle-orm';
import { crmLeads, crmLeadHistory, users } from '@cube-demper/database';
import { config } from '../config';
import { logger } from '../utils/logger';

const pool = new Pool({ connectionString: config.databaseUrl });
const db = drizzle(pool);

export class CrmService {
    // === LEADS ===

    async getLeads(filters: {
        stage?: string;
        trafficChannel?: string;
        result?: string;
        assignedTo?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        const conditions: any[] = [eq(crmLeads.isActive, true)];

        if (filters.stage) {
            conditions.push(eq(crmLeads.stage, filters.stage as any));
        }
        if (filters.trafficChannel) {
            conditions.push(eq(crmLeads.trafficChannel, filters.trafficChannel as any));
        }
        if (filters.result) {
            conditions.push(eq(crmLeads.result, filters.result as any));
        }
        if (filters.assignedTo) {
            conditions.push(eq(crmLeads.assignedTo, filters.assignedTo));
        }
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            conditions.push(
                or(
                    ilike(crmLeads.firstName, searchTerm),
                    ilike(crmLeads.lastName, searchTerm),
                    ilike(crmLeads.companyName, searchTerm),
                    ilike(crmLeads.email, searchTerm),
                    ilike(crmLeads.phone, searchTerm),
                )
            );
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

        const [leads, totalResult] = await Promise.all([
            db.select()
                .from(crmLeads)
                .where(whereClause)
                .orderBy(desc(crmLeads.createdAt))
                .limit(limit)
                .offset(offset),
            db.select({ count: count() })
                .from(crmLeads)
                .where(whereClause),
        ]);

        return {
            leads,
            total: Number(totalResult[0]?.count || 0),
            page,
            limit,
            totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
        };
    }

    async getLeadById(id: string) {
        const result = await db.select()
            .from(crmLeads)
            .where(eq(crmLeads.id, id))
            .limit(1);
        return result[0] || null;
    }

    async createLead(data: {
        firstName: string;
        lastName?: string;
        companyName?: string;
        email?: string;
        phone?: string;
        trafficChannel?: string;
        assignedTo?: string;
        dealAmount?: number;
        notes?: string;
        tags?: string[];
        nextContactDate?: string;
    }, createdByUserId: string) {
        const insertData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            companyName: data.companyName,
            email: data.email,
            phone: data.phone,
            trafficChannel: data.trafficChannel || 'other',
            assignedTo: data.assignedTo || createdByUserId,
            notes: data.notes,
            tags: data.tags || [],
        };

        if (data.dealAmount !== undefined) {
            insertData.dealAmount = String(data.dealAmount);
        }
        if (data.nextContactDate) {
            insertData.nextContactDate = new Date(data.nextContactDate);
        }

        const result = await db.insert(crmLeads).values(insertData).returning();
        const lead = result[0];

        // Записываем историю: создание = переход в "new"
        await db.insert(crmLeadHistory).values({
            leadId: lead.id,
            changedBy: createdByUserId,
            toStage: 'new',
            comment: 'Лид создан',
        });

        logger.info('Lead created', { leadId: lead.id, by: createdByUserId });
        return lead;
    }

    async updateLead(id: string, data: Record<string, any>) {
        const updateData: any = { ...data, updatedAt: new Date() };

        if (updateData.dealAmount !== undefined) {
            updateData.dealAmount = String(updateData.dealAmount);
        }
        if (updateData.nextContactDate) {
            updateData.nextContactDate = new Date(updateData.nextContactDate);
        }
        // Не позволяем менять stage через update — для этого есть moveStage
        delete updateData.stage;
        delete updateData.page;
        delete updateData.limit;

        const result = await db.update(crmLeads)
            .set(updateData)
            .where(eq(crmLeads.id, id))
            .returning();
        return result[0] || null;
    }

    async deleteLead(id: string) {
        const result = await db.update(crmLeads)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(crmLeads.id, id))
            .returning();
        return result[0] || null;
    }

    async moveLeadStage(id: string, toStage: string, comment: string | undefined, changedByUserId: string) {
        const lead = await this.getLeadById(id);
        if (!lead) return null;

        const fromStage = lead.stage;

        // Обновляем стадию лида
        const updateData: any = { stage: toStage, updatedAt: new Date() };

        // Если стадия = deal, результат = won
        if (toStage === 'deal') {
            updateData.result = 'won';
        }

        const updated = await db.update(crmLeads)
            .set(updateData)
            .where(eq(crmLeads.id, id))
            .returning();

        // Записываем историю
        await db.insert(crmLeadHistory).values({
            leadId: id,
            changedBy: changedByUserId,
            fromStage: fromStage as any,
            toStage: toStage as any,
            comment,
        });

        logger.info('Lead stage moved', { leadId: id, from: fromStage, to: toStage, by: changedByUserId });
        return updated[0];
    }

    async getLeadHistory(leadId: string) {
        return db.select()
            .from(crmLeadHistory)
            .where(eq(crmLeadHistory.leadId, leadId))
            .orderBy(desc(crmLeadHistory.createdAt));
    }
}

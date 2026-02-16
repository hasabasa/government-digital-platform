import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import { crmAccess, users } from '@cube-demper/database';
import { config } from '../config';
import { logger } from '../utils/logger';

const pool = new Pool({ connectionString: config.databaseUrl });
const db = drizzle(pool);

export class CrmAccessService {
    async getAccessList() {
        const accessEntries = await db.select({
            id: crmAccess.id,
            userId: crmAccess.userId,
            grantedBy: crmAccess.grantedBy,
            isActive: crmAccess.isActive,
            grantedAt: crmAccess.grantedAt,
            revokedAt: crmAccess.revokedAt,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
        })
            .from(crmAccess)
            .leftJoin(users, eq(crmAccess.userId, users.id));

        return accessEntries;
    }

    async grantAccess(userId: string, grantedBy: string) {
        // Проверяем, нет ли уже активного доступа
        const existing = await db.select()
            .from(crmAccess)
            .where(and(eq(crmAccess.userId, userId), eq(crmAccess.isActive, true)))
            .limit(1);

        if (existing.length > 0) {
            return existing[0]; // Уже есть доступ
        }

        const result = await db.insert(crmAccess).values({
            userId,
            grantedBy,
            isActive: true,
        }).returning();

        logger.info('CRM access granted', { userId, grantedBy });
        return result[0];
    }

    async revokeAccess(userId: string) {
        const result = await db.update(crmAccess)
            .set({ isActive: false, revokedAt: new Date() })
            .where(and(eq(crmAccess.userId, userId), eq(crmAccess.isActive, true)))
            .returning();

        logger.info('CRM access revoked', { userId });
        return result[0] || null;
    }

    async checkAccess(userId: string, userRole: string): Promise<boolean> {
        if (userRole === 'admin') return true;

        const result = await db.select()
            .from(crmAccess)
            .where(and(eq(crmAccess.userId, userId), eq(crmAccess.isActive, true)))
            .limit(1);

        return result.length > 0;
    }
}

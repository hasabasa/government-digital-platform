import { Request, Response, NextFunction } from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import { crmAccess } from '@cube-demper/database';
import { config } from '../config';

const pool = new Pool({ connectionString: config.databaseUrl });
const db = drizzle(pool);

export class CrmAccessMiddleware {
    /**
     * Проверяет, имеет ли пользователь доступ к CRM.
     * Admin проходит всегда. Остальные — проверка в таблице crm_access.
     */
    static requireCrmAccess(req: Request, res: Response, next: NextFunction): void {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }

        // Admin всегда имеет доступ
        if (user.role === 'admin') {
            next();
            return;
        }

        // Проверяем запись в crm_access
        db.select()
            .from(crmAccess)
            .where(and(eq(crmAccess.userId, user.userId), eq(crmAccess.isActive, true)))
            .limit(1)
            .then((rows) => {
                if (rows.length > 0) {
                    next();
                } else {
                    res.status(403).json({
                        success: false,
                        error: 'CRM access not granted. Contact your administrator.',
                    });
                }
            })
            .catch((error) => {
                res.status(500).json({
                    success: false,
                    error: 'Failed to check CRM access',
                });
            });
    }
}

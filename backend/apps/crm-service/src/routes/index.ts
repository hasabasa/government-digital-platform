import { Router } from 'express';
import { crmRoutes } from './crm.routes';

const router = Router();

// Mount CRM routes
router.use('/crm', crmRoutes);

// Root health check
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'CRM service is running',
        timestamp: new Date().toISOString(),
        service: 'crm-service',
        version: '0.1.0',
    });
});

export { router as routes };

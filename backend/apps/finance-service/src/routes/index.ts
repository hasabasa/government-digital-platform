import { Router } from 'express';
import { financeRoutes } from './finance.routes';

const router = Router();

// Mount finance routes
router.use('/finance', financeRoutes);

// Root health check
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Finance service is running',
        timestamp: new Date().toISOString(),
        service: 'finance-service',
        version: '0.1.0',
    });
});

export { router as routes };

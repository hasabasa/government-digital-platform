import { Router } from 'express';
import { authRoutes } from './auth.routes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '0.1.0',
  });
});

export { router as routes };

import { Router } from 'express';
import { userRoutes } from './user.routes';

const router = Router();

// Mount user routes
router.use('/users', userRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '0.2.0',
  });
});

export { router as routes };

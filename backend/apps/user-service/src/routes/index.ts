import { Router } from 'express';
import { userRoutes } from './user.routes';
import { hierarchyRoutes } from './hierarchy.routes';

const router = Router();

// Mount user routes
router.use('/users', userRoutes);

// Mount hierarchy routes
router.use('/hierarchy', hierarchyRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '0.1.0',
  });
});

export { router as routes };

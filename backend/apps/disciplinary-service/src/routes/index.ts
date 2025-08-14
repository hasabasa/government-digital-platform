import { Router } from 'express';
import { disciplinaryRoutes } from './disciplinary.routes';

const router = Router();

// Mount disciplinary routes
router.use('/disciplinary', disciplinaryRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Disciplinary service is running',
    timestamp: new Date().toISOString(),
    service: 'disciplinary-service',
    version: '0.1.0',
  });
});

export { router as routes };

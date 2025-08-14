import { Router } from 'express';
import { fileRoutes } from './file.routes';

const router = Router();

// Mount file routes
router.use('/files', fileRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'File service is running',
    timestamp: new Date().toISOString(),
    service: 'file-service',
    version: '0.1.0',
  });
});

export { router as routes };

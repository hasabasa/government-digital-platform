import { Router } from 'express';
import { taskRoutes } from './task.routes';

const router = Router();

// Mount task routes
router.use('/tasks', taskRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task service is running',
    timestamp: new Date().toISOString(),
    service: 'task-service',
    version: '0.1.0',
  });
});

export { router as routes };

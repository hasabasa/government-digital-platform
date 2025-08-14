import { Router } from 'express';
import { chatRoutes } from './chat.routes';

const router = Router();

// Mount chat routes
router.use('/chats', chatRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat service is running',
    timestamp: new Date().toISOString(),
    service: 'chat-service',
    version: '0.1.0',
  });
});

export { router as routes };

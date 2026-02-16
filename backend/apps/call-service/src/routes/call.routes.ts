import { Router } from 'express';
import { CallController } from '../controllers/call.controller';
import { CreateCallRequestSchema } from '@cube-demper/types';
import { z } from 'zod';

const router = Router();
const callController = new CallController();

// Parameter validation
const CallIdParamSchema = z.object({
  callId: z.string().uuid(),
});

// Routes
router.get('/', callController.getCalls);

router.post('/', 
  // ValidationMiddleware would go here
  callController.createCall
);

router.post('/:callId/join',
  // ValidationMiddleware.validateParams(CallIdParamSchema),
  callController.joinCall
);

router.post('/:callId/leave',
  callController.leaveCall
);

router.post('/:callId/end',
  callController.endCall
);

export { router as callRoutes };

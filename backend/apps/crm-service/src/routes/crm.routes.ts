import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { CrmAccessMiddleware } from '../middleware/crm-access.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
    CreateLeadSchema,
    UpdateLeadSchema,
    MoveLeadStageSchema,
    CreateSalesPlanSchema,
    UpdateSalesPlanSchema,
    GrantCrmAccessSchema,
} from '@cube-demper/types';

const router = Router();
const controller = new CrmController();

// Health
router.get('/health', controller.health);

// Все CRM роуты требуют авторизации
router.use(AuthMiddleware.authenticate);

// Проверка доступа к CRM (для фронтенда)
router.get('/access/check', controller.checkAccess);

// CRM-доступные роуты
// Leads
router.get('/leads', CrmAccessMiddleware.requireCrmAccess, controller.getLeads);
router.get('/leads/:id', CrmAccessMiddleware.requireCrmAccess, controller.getLeadById);
router.post('/leads', CrmAccessMiddleware.requireCrmAccess, ValidationMiddleware.validateBody(CreateLeadSchema), controller.createLead);
router.put('/leads/:id', CrmAccessMiddleware.requireCrmAccess, ValidationMiddleware.validateBody(UpdateLeadSchema), controller.updateLead);
router.delete('/leads/:id', CrmAccessMiddleware.requireCrmAccess, controller.deleteLead);
router.post('/leads/:id/move', CrmAccessMiddleware.requireCrmAccess, ValidationMiddleware.validateBody(MoveLeadStageSchema), controller.moveLeadStage);
router.get('/leads/:id/history', CrmAccessMiddleware.requireCrmAccess, controller.getLeadHistory);

// Dashboard
router.get('/dashboard', CrmAccessMiddleware.requireCrmAccess, controller.getDashboard);
router.get('/dashboard/managers', CrmAccessMiddleware.requireCrmAccess, controller.getManagerStats);

// Sales Plans
router.get('/plans', CrmAccessMiddleware.requireCrmAccess, controller.getSalesPlans);
router.post('/plans', AuthMiddleware.requireAdmin, ValidationMiddleware.validateBody(CreateSalesPlanSchema), controller.createSalesPlan);
router.put('/plans/:id', AuthMiddleware.requireAdmin, ValidationMiddleware.validateBody(UpdateSalesPlanSchema), controller.updateSalesPlan);
router.delete('/plans/:id', AuthMiddleware.requireAdmin, controller.deleteSalesPlan);

// Access management (admin only)
router.get('/access', AuthMiddleware.requireAdmin, controller.getAccessList);
router.post('/access', AuthMiddleware.requireAdmin, ValidationMiddleware.validateBody(GrantCrmAccessSchema), controller.grantAccess);
router.delete('/access/:userId', AuthMiddleware.requireAdmin, controller.revokeAccess);

export { router as crmRoutes };

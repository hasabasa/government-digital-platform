import { Request, Response } from 'express';
import { CrmService } from '../services/crm.service';
import { CrmDashboardService } from '../services/crm-dashboard.service';
import { CrmAccessService } from '../services/crm-access.service';
import { logger } from '../utils/logger';

const crmService = new CrmService();
const dashboardService = new CrmDashboardService();
const accessService = new CrmAccessService();

export class CrmController {
    // === LEADS ===

    getLeads = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = {
                stage: req.query.stage as string | undefined,
                trafficChannel: req.query.trafficChannel as string | undefined,
                result: req.query.result as string | undefined,
                assignedTo: req.query.assignedTo as string | undefined,
                search: req.query.search as string | undefined,
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            };
            const result = await crmService.getLeads(filters);
            res.json({ success: true, data: result });
        } catch (error) {
            const err = error as Error;
            logger.error('Get leads error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get leads' });
        }
    };

    getLeadById = async (req: Request, res: Response): Promise<void> => {
        try {
            const lead = await crmService.getLeadById(req.params.id);
            if (!lead) {
                res.status(404).json({ success: false, error: 'Lead not found' });
                return;
            }
            res.json({ success: true, data: lead });
        } catch (error) {
            const err = error as Error;
            logger.error('Get lead error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get lead' });
        }
    };

    createLead = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.userId;
            const lead = await crmService.createLead(req.body, userId);
            res.status(201).json({ success: true, data: lead });
        } catch (error) {
            const err = error as Error;
            logger.error('Create lead error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to create lead' });
        }
    };

    updateLead = async (req: Request, res: Response): Promise<void> => {
        try {
            const lead = await crmService.updateLead(req.params.id, req.body);
            if (!lead) {
                res.status(404).json({ success: false, error: 'Lead not found' });
                return;
            }
            res.json({ success: true, data: lead });
        } catch (error) {
            const err = error as Error;
            logger.error('Update lead error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to update lead' });
        }
    };

    deleteLead = async (req: Request, res: Response): Promise<void> => {
        try {
            const lead = await crmService.deleteLead(req.params.id);
            if (!lead) {
                res.status(404).json({ success: false, error: 'Lead not found' });
                return;
            }
            res.json({ success: true, data: lead });
        } catch (error) {
            const err = error as Error;
            logger.error('Delete lead error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to delete lead' });
        }
    };

    moveLeadStage = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.userId;
            const { toStage, comment } = req.body;
            const lead = await crmService.moveLeadStage(req.params.id, toStage, comment, userId);
            if (!lead) {
                res.status(404).json({ success: false, error: 'Lead not found' });
                return;
            }
            res.json({ success: true, data: lead });
        } catch (error) {
            const err = error as Error;
            logger.error('Move lead stage error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to move lead stage' });
        }
    };

    getLeadHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const history = await crmService.getLeadHistory(req.params.id);
            res.json({ success: true, data: history });
        } catch (error) {
            const err = error as Error;
            logger.error('Get lead history error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get lead history' });
        }
    };

    // === DASHBOARD ===

    getDashboard = async (_req: Request, res: Response): Promise<void> => {
        try {
            const data = await dashboardService.getDashboard();
            res.json({ success: true, data });
        } catch (error) {
            const err = error as Error;
            logger.error('Get dashboard error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get dashboard' });
        }
    };

    getManagerStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const data = await dashboardService.getManagerStats();
            res.json({ success: true, data });
        } catch (error) {
            const err = error as Error;
            logger.error('Get manager stats error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get manager stats' });
        }
    };

    // === SALES PLANS ===

    getSalesPlans = async (_req: Request, res: Response): Promise<void> => {
        try {
            const plans = await dashboardService.getSalesPlans();
            res.json({ success: true, data: plans });
        } catch (error) {
            const err = error as Error;
            logger.error('Get sales plans error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get sales plans' });
        }
    };

    createSalesPlan = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.userId;
            const plan = await dashboardService.createSalesPlan(req.body, userId);
            res.status(201).json({ success: true, data: plan });
        } catch (error) {
            const err = error as Error;
            logger.error('Create sales plan error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to create sales plan' });
        }
    };

    updateSalesPlan = async (req: Request, res: Response): Promise<void> => {
        try {
            const plan = await dashboardService.updateSalesPlan(req.params.id, req.body);
            if (!plan) {
                res.status(404).json({ success: false, error: 'Sales plan not found' });
                return;
            }
            res.json({ success: true, data: plan });
        } catch (error) {
            const err = error as Error;
            logger.error('Update sales plan error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to update sales plan' });
        }
    };

    deleteSalesPlan = async (req: Request, res: Response): Promise<void> => {
        try {
            const plan = await dashboardService.deleteSalesPlan(req.params.id);
            if (!plan) {
                res.status(404).json({ success: false, error: 'Sales plan not found' });
                return;
            }
            res.json({ success: true, data: plan });
        } catch (error) {
            const err = error as Error;
            logger.error('Delete sales plan error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to delete sales plan' });
        }
    };

    // === ACCESS ===

    getAccessList = async (_req: Request, res: Response): Promise<void> => {
        try {
            const list = await accessService.getAccessList();
            res.json({ success: true, data: list });
        } catch (error) {
            const err = error as Error;
            logger.error('Get access list error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to get access list' });
        }
    };

    grantAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const grantedBy = (req as any).user.userId;
            const { userId } = req.body;
            const access = await accessService.grantAccess(userId, grantedBy);
            res.status(201).json({ success: true, data: access });
        } catch (error) {
            const err = error as Error;
            logger.error('Grant access error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to grant access' });
        }
    };

    revokeAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await accessService.revokeAccess(req.params.userId);
            if (!result) {
                res.status(404).json({ success: false, error: 'Active access not found' });
                return;
            }
            res.json({ success: true, data: result });
        } catch (error) {
            const err = error as Error;
            logger.error('Revoke access error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to revoke access' });
        }
    };

    checkAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const hasAccess = await accessService.checkAccess(user.userId, user.role);
            res.json({ success: true, data: { hasAccess } });
        } catch (error) {
            const err = error as Error;
            logger.error('Check access error', { error: err.message });
            res.status(500).json({ success: false, error: 'Failed to check access' });
        }
    };

    // === HEALTH ===

    health = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json({
            success: true,
            message: 'CRM service is running',
            timestamp: new Date().toISOString(),
            service: 'crm-service',
            version: '0.1.0',
        });
    };
}

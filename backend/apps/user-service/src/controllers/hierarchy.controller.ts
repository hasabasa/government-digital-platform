import { Request, Response } from 'express';
import { HierarchyService } from '../services/hierarchy.service';
import { 
  CreateGovernmentStructureRequestSchema,
  UpdateGovernmentStructureRequestSchema,
  CreatePositionRequestSchema,
  UpdatePositionRequestSchema,
  CreateAppointmentRequestSchema,
  PaginationSchema
} from '@gov-platform/types';
import { z } from 'zod';

export class HierarchyController {
  private hierarchyService: HierarchyService;

  constructor() {
    this.hierarchyService = new HierarchyService();
  }

  // Government Structure Endpoints
  getGovernmentStructure = async (req: Request, res: Response) => {
    try {
      const { level, type, parentId } = req.query;
      const filters = {
        level: level as string,
        type: type as string,
        parentId: parentId as string,
      };

      const structure = await this.hierarchyService.getGovernmentStructure(filters);
      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getGovernmentStructureTree = async (req: Request, res: Response) => {
    try {
      const { rootId, maxDepth } = req.query;
      const tree = await this.hierarchyService.getGovernmentStructureTree(
        rootId as string,
        maxDepth ? parseInt(maxDepth as string) : undefined
      );

      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createGovernmentStructure = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateGovernmentStructureRequestSchema.parse(req.body);
      const structure = await this.hierarchyService.createGovernmentStructure(validatedData);

      res.status(201).json({
        success: true,
        data: structure,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  updateGovernmentStructure = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateGovernmentStructureRequestSchema.parse(req.body);
      
      const structure = await this.hierarchyService.updateGovernmentStructure(id, validatedData);
      
      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  deleteGovernmentStructure = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { force } = req.query;
      
      await this.hierarchyService.deleteGovernmentStructure(id, force === 'true');
      
      res.json({
        success: true,
        message: 'Government structure deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Position Endpoints
  getPositions = async (req: Request, res: Response) => {
    try {
      const { organizationId, type, category, isManagerial } = req.query;
      const { page = 1, limit = 20 } = PaginationSchema.parse(req.query);
      
      const filters = {
        organizationId: organizationId as string,
        type: type as string,
        category: category as string,
        isManagerial: isManagerial === 'true',
      };

      const result = await this.hierarchyService.getPositions(filters, { page, limit });
      
      res.json({
        success: true,
        data: result.positions,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getPositionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const position = await this.hierarchyService.getPositionById(id);
      
      if (!position) {
        return res.status(404).json({
          success: false,
          error: 'Position not found',
        });
      }

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createPosition = async (req: Request, res: Response) => {
    try {
      const validatedData = CreatePositionRequestSchema.parse(req.body);
      const position = await this.hierarchyService.createPosition(validatedData);

      res.status(201).json({
        success: true,
        data: position,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  updatePosition = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = UpdatePositionRequestSchema.parse(req.body);
      
      const position = await this.hierarchyService.updatePosition(id, validatedData);
      
      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Appointment Endpoints
  getUserAppointments = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { current = true } = req.query;
      
      const appointments = await this.hierarchyService.getUserAppointments(
        userId, 
        current === 'true'
      );
      
      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createAppointment = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateAppointmentRequestSchema.parse(req.body);
      const appointment = await this.hierarchyService.createAppointment(validatedData);

      res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  dismissFromPosition = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const { dismissalReason, dismissalOrder } = req.body;
      
      const appointment = await this.hierarchyService.dismissFromPosition(
        appointmentId,
        {
          dismissalReason,
          dismissalOrder,
          dismissalDate: new Date(),
        }
      );
      
      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // User Hierarchy Info
  getUserHierarchyInfo = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const hierarchyInfo = await this.hierarchyService.getUserHierarchyInfo(userId);
      
      res.json({
        success: true,
        data: hierarchyInfo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getUserSubordinates = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { direct = true, includeIndirect = false } = req.query;
      
      const subordinates = await this.hierarchyService.getUserSubordinates(
        userId,
        {
          directOnly: direct === 'true',
          includeIndirect: includeIndirect === 'true',
        }
      );
      
      res.json({
        success: true,
        data: subordinates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getOrganizationEmployees = async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { page = 1, limit = 50 } = PaginationSchema.parse(req.query);
      const { includeSuborganizations = false } = req.query;
      
      const result = await this.hierarchyService.getOrganizationEmployees(
        organizationId,
        {
          page,
          limit,
          includeSuborganizations: includeSuborganizations === 'true',
        }
      );
      
      res.json({
        success: true,
        data: result.employees,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Channel Management
  createOrganizationChannel = async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await this.hierarchyService.createOrganizationChannel(
        organizationId,
        userId
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            channelId: result.channelId,
            subscribersAdded: result.subscribersAdded,
          },
          message: 'Organization channel created successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to create organization channel',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  syncChannelMembership = async (req: Request, res: Response) => {
    try {
      const { channelId, organizationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await this.hierarchyService.syncOrganizationChannelMembership(
        channelId,
        organizationId
      );

      res.json({
        success: true,
        data: {
          usersAdded: result.usersAdded,
          usersSkipped: result.usersSkipped,
          errors: result.errors,
        },
        message: 'Channel membership synchronized successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Health check
  health = async (req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'hierarchy-controller',
      timestamp: new Date().toISOString(),
    });
  };
}

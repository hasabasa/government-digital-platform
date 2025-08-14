import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';
import { 
  CreateDisciplinaryActionRequestSchema,
  UpdateDisciplinaryActionRequestSchema,
  CreateCommendationRequestSchema,
  UpdateCommendationRequestSchema,
  CreateAppealRequestSchema,
  UpdateAppealRequestSchema,
  DisciplinaryFiltersSchema,
  CommendationFiltersSchema,
  PaginationSchema
} from '@gov-platform/types';
import { z } from 'zod';

export class DisciplinaryController {
  private disciplinaryService: DisciplinaryService;

  constructor() {
    this.disciplinaryService = new DisciplinaryService();
  }

  // Disciplinary Actions
  getDisciplinaryActions = async (req: Request, res: Response) => {
    try {
      const filters = DisciplinaryFiltersSchema.parse(req.query);
      const { page = 1, limit = 20 } = PaginationSchema.parse(req.query);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await this.disciplinaryService.getDisciplinaryActions(
        filters, 
        { page, limit }, 
        userId
      );
      
      res.json({
        success: true,
        data: result.actions,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
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

  getDisciplinaryActionById = async (req: Request, res: Response) => {
    try {
      const { actionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await this.disciplinaryService.getDisciplinaryActions(
        { search: undefined }, 
        { page: 1, limit: 1 }, 
        userId
      );

      const action = result.actions.find(a => a.id === actionId);
      
      if (!action) {
        return res.status(404).json({
          success: false,
          error: 'Disciplinary action not found',
        });
      }

      res.json({
        success: true,
        data: action,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createDisciplinaryAction = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateDisciplinaryActionRequestSchema.parse(req.body);
      const issuedBy = req.user?.id;

      if (!issuedBy) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const action = await this.disciplinaryService.createDisciplinaryAction({
        ...validatedData,
        issuedBy,
      });

      res.status(201).json({
        success: true,
        data: action,
        message: 'Disciplinary action created successfully',
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

  updateDisciplinaryAction = async (req: Request, res: Response) => {
    try {
      const { actionId } = req.params;
      const validatedData = UpdateDisciplinaryActionRequestSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const action = await this.disciplinaryService.updateDisciplinaryAction(
        actionId, 
        validatedData, 
        userId
      );
      
      res.json({
        success: true,
        data: action,
        message: 'Disciplinary action updated successfully',
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

  // Commendations
  getCommendations = async (req: Request, res: Response) => {
    try {
      const filters = CommendationFiltersSchema.parse(req.query);
      const { page = 1, limit = 20 } = PaginationSchema.parse(req.query);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await this.disciplinaryService.getCommendations(
        filters, 
        { page, limit }, 
        userId
      );
      
      res.json({
        success: true,
        data: result.commendations,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
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

  createCommendation = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateCommendationRequestSchema.parse(req.body);
      const issuedBy = req.user?.id;

      if (!issuedBy) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const commendation = await this.disciplinaryService.createCommendation({
        ...validatedData,
        issuedBy,
      });

      res.status(201).json({
        success: true,
        data: commendation,
        message: 'Commendation created successfully',
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

  // Appeals
  createAppeal = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateAppealRequestSchema.parse(req.body);
      const appealedBy = req.user?.id;

      if (!appealedBy) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const appeal = await this.disciplinaryService.createAppeal({
        ...validatedData,
        appealedBy,
      });

      res.status(201).json({
        success: true,
        data: appeal,
        message: 'Appeal submitted successfully',
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

  // Employee Records
  getEmployeeDisciplinaryRecord = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const record = await this.disciplinaryService.getEmployeeDisciplinaryRecord(
        employeeId, 
        userId
      );
      
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Statistics and Reports
  getDisciplinaryStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const stats = await this.disciplinaryService.getDisciplinaryStats(
        userId,
        organizationId as string
      );
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Action Templates (for common violations)
  getActionTemplates = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Return predefined templates for common disciplinary actions
      const templates = [
        {
          id: 'late-arrival',
          title: 'Опоздание на работу',
          description: 'Систематическое нарушение трудовой дисциплины - опоздание на рабочее место',
          actionType: 'verbal_warning',
          severityLevel: 'minor',
          violatedRegulations: [
            {
              regulation: 'Трудовой кодекс РК',
              article: 'Статья 52',
              description: 'Нарушение трудовой дисциплины'
            }
          ]
        },
        {
          id: 'absence-without-permission',
          title: 'Прогул',
          description: 'Отсутствие на рабочем месте без уважительной причины',
          actionType: 'reprimand',
          severityLevel: 'serious',
          violatedRegulations: [
            {
              regulation: 'Трудовой кодекс РК',
              article: 'Статья 52',
              description: 'Прогул'
            }
          ]
        },
        {
          id: 'misconduct',
          title: 'Нарушение этики',
          description: 'Нарушение норм служебной этики и поведения',
          actionType: 'written_warning',
          severityLevel: 'moderate',
          violatedRegulations: [
            {
              regulation: 'Кодекс этики государственных служащих',
              article: 'Раздел 3',
              description: 'Нарушение норм служебного поведения'
            }
          ]
        }
      ];

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Commendation Templates
  getCommendationTemplates = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const templates = [
        {
          id: 'excellent-performance',
          title: 'Отличное выполнение обязанностей',
          description: 'За качественное и своевременное выполнение служебных обязанностей',
          commendationType: 'written_praise',
          achievement: 'Показал высокие результаты в работе и профессионализм'
        },
        {
          id: 'initiative',
          title: 'Проявление инициативы',
          description: 'За проявление инициативы и внедрение улучшений в рабочий процесс',
          commendationType: 'certificate',
          achievement: 'Предложил и внедрил эффективные решения для оптимизации работы'
        },
        {
          id: 'special-task',
          title: 'Выполнение особого задания',
          description: 'За успешное выполнение особо важного задания',
          commendationType: 'bonus',
          achievement: 'Успешно справился с поставленной задачей в сжатые сроки'
        }
      ];

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Check User Permissions
  getUserPermissions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // This would call the internal permission check method
      // For now, return basic permissions structure
      const permissions = {
        canIssueActions: true, // Would be determined by position
        canIssueCommendations: true,
        canReviewAppeals: false,
        canViewConfidential: false,
        canManageAllActions: false,
        allowedActionTypes: [
          'verbal_warning',
          'written_warning',
          'reprimand'
        ],
        allowedCommendationTypes: [
          'verbal_praise',
          'written_praise',
          'certificate'
        ]
      };

      res.json({
        success: true,
        data: permissions,
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
      service: 'disciplinary-service',
      timestamp: new Date().toISOString(),
    });
  };
}

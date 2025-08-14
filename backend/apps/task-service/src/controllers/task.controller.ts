import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { 
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  AssignTaskRequestSchema,
  UpdateAssignmentRequestSchema,
  CreateCommentRequestSchema,
  CreateChecklistItemRequestSchema,
  UpdateChecklistItemRequestSchema,
  TaskFiltersSchema,
  PaginationSchema
} from '@gov-platform/types';
import { z } from 'zod';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  // Task Management
  getTasks = async (req: Request, res: Response) => {
    try {
      const filters = TaskFiltersSchema.parse(req.query);
      const { page = 1, limit = 20 } = PaginationSchema.parse(req.query);
      const userId = req.user?.id;

      const result = await this.taskService.getTasks(filters, { page, limit }, userId);
      
      res.json({
        success: true,
        data: result.tasks,
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

  getTaskById = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      const task = await this.taskService.getTaskById(taskId, userId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createTask = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateTaskRequestSchema.parse(req.body);
      const createdBy = req.user?.id;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const task = await this.taskService.createTask({
        ...validatedData,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: task,
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

  updateTask = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const validatedData = UpdateTaskRequestSchema.parse(req.body);
      const userId = req.user?.id;

      const task = await this.taskService.updateTask(taskId, validatedData, userId);
      
      res.json({
        success: true,
        data: task,
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

  deleteTask = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      await this.taskService.deleteTask(taskId, userId);
      
      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Task Assignments
  assignTask = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const validatedData = AssignTaskRequestSchema.parse(req.body);
      const assignedBy = req.user?.id;

      const assignment = await this.taskService.assignTask(taskId, {
        ...validatedData,
        assignedBy,
      });

      res.status(201).json({
        success: true,
        data: assignment,
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

  updateAssignment = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const validatedData = UpdateAssignmentRequestSchema.parse(req.body);
      const userId = req.user?.id;

      const assignment = await this.taskService.updateAssignment(assignmentId, validatedData, userId);
      
      res.json({
        success: true,
        data: assignment,
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

  removeAssignment = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user?.id;

      await this.taskService.removeAssignment(assignmentId, userId);
      
      res.json({
        success: true,
        message: 'Assignment removed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Comments
  getTaskComments = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { page = 1, limit = 50 } = PaginationSchema.parse(req.query);
      const userId = req.user?.id;

      const result = await this.taskService.getTaskComments(taskId, { page, limit }, userId);
      
      res.json({
        success: true,
        data: result.comments,
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

  createComment = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const validatedData = CreateCommentRequestSchema.parse(req.body);
      const authorId = req.user?.id;

      const comment = await this.taskService.createComment(taskId, {
        ...validatedData,
        authorId,
      });

      res.status(201).json({
        success: true,
        data: comment,
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

  // Checklist
  getTaskChecklist = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      const checklist = await this.taskService.getTaskChecklist(taskId, userId);
      
      res.json({
        success: true,
        data: checklist,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  createChecklistItem = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const validatedData = CreateChecklistItemRequestSchema.parse(req.body);
      const userId = req.user?.id;

      const item = await this.taskService.createChecklistItem(taskId, validatedData, userId);

      res.status(201).json({
        success: true,
        data: item,
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

  updateChecklistItem = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const validatedData = UpdateChecklistItemRequestSchema.parse(req.body);
      const userId = req.user?.id;

      const item = await this.taskService.updateChecklistItem(itemId, validatedData, userId);
      
      res.json({
        success: true,
        data: item,
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

  deleteChecklistItem = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id;

      await this.taskService.deleteChecklistItem(itemId, userId);
      
      res.json({
        success: true,
        message: 'Checklist item deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Statistics and Reports
  getTaskStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { organizationId, period = '30d' } = req.query;

      const stats = await this.taskService.getTaskStats(userId, {
        organizationId: organizationId as string,
        period: period as string,
      });
      
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

  getTaskTimeline = async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      const timeline = await this.taskService.getTaskTimeline(taskId, userId);
      
      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Assignable Users
  getAssignableUsers = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const users = await this.taskService.getAssignableUsers(userId, organizationId as string);
      
      res.json({
        success: true,
        data: users,
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
      service: 'task-service',
      timestamp: new Date().toISOString(),
    });
  };
}

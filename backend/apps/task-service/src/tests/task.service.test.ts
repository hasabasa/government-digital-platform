import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@gov-platform/database';
import { 
  tasks, 
  taskAssignments, 
  taskComments, 
  taskChecklist,
  users,
  governmentStructure,
  appointments
} from '@gov-platform/database/schema';
import { TaskService } from '../services/task.service';
import { PermissionsService } from '../services/permissions.service';

// Mock permissions service
vi.mock('../services/permissions.service');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockPermissionsService: vi.Mocked<PermissionsService>;

  // Test data
  const testManager = {
    id: 'manager-1',
    email: 'manager@minfin.gov.kz',
    firstName: 'Менеджер',
    lastName: 'Тестовый',
    role: 'department_head'
  };

  const testEmployee = {
    id: 'employee-1',
    email: 'employee@minfin.gov.kz',
    firstName: 'Сотрудник',
    lastName: 'Тестовый',
    role: 'specialist'
  };

  const testOrganization = {
    id: 'org-1',
    name: 'Тестовый департамент',
    type: 'department' as const,
    level: 6,
    path: '1.4.6'
  };

  const testTask = {
    title: 'Тестовая задача',
    description: 'Описание тестовой задачи',
    priority: 'high' as const,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
    organizationId: testOrganization.id,
    createdBy: testManager.id
  };

  beforeEach(async () => {
    taskService = new TaskService();
    
    // Setup mocks
    mockPermissionsService = vi.mocked(PermissionsService.prototype);
    mockPermissionsService.canCreateTask.mockResolvedValue(true);
    mockPermissionsService.canEditTask.mockResolvedValue(true);
    mockPermissionsService.canAssignTaskToUser.mockResolvedValue(true);
    mockPermissionsService.getTaskPermissions.mockResolvedValue({
      canView: true,
      canEdit: true,
      canAssign: true,
      canComplete: true,
      canDelete: true
    });
    mockPermissionsService.getAssignableUsers.mockResolvedValue([
      { id: testEmployee.id, name: `${testEmployee.firstName} ${testEmployee.lastName}`, position: 'Специалист' }
    ]);

    // Clean up test data
    await db.delete(taskAssignments);
    await db.delete(taskComments);
    await db.delete(taskChecklist);
    await db.delete(tasks);
    await db.delete(appointments);
    await db.delete(users);
    await db.delete(governmentStructure);

    // Insert test data
    await db.insert(users).values([testManager, testEmployee]);
    await db.insert(governmentStructure).values(testOrganization);
  });

  afterEach(async () => {
    await db.delete(taskAssignments);
    await db.delete(taskComments);
    await db.delete(taskChecklist);
    await db.delete(tasks);
    await db.delete(appointments);
    await db.delete(users);
    await db.delete(governmentStructure);
    vi.clearAllMocks();
  });

  describe('Task Creation', () => {
    it('должен создать новую задачу', async () => {
      const result = await taskService.createTask(testTask);

      expect(result).toBeDefined();
      expect(result.title).toBe(testTask.title);
      expect(result.description).toBe(testTask.description);
      expect(result.priority).toBe(testTask.priority);
      expect(result.status).toBe('draft');
      expect(result.createdBy).toBe(testManager.id);
    });

    it('должен проверить права доступа при создании задачи', async () => {
      await taskService.createTask(testTask);

      expect(mockPermissionsService.canCreateTask).toHaveBeenCalledWith(
        testManager.id,
        testOrganization.id
      );
    });

    it('должен отклонить создание задачи без прав доступа', async () => {
      mockPermissionsService.canCreateTask.mockResolvedValue(false);

      await expect(taskService.createTask(testTask))
        .rejects.toThrow('Permission denied: Cannot create tasks in this organization');
    });

    it('должен установить правильную дату создания', async () => {
      const beforeCreate = new Date();
      const result = await taskService.createTask(testTask);
      const afterCreate = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Task Assignment', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await taskService.createTask(testTask);
    });

    it('должен назначить задачу пользователю', async () => {
      const assignmentData = {
        userId: testEmployee.id,
        assignedBy: testManager.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 дня
        priority: 'high' as const,
        instructions: 'Выполнить до конца недели'
      };

      const result = await taskService.assignTask(createdTask.id, assignmentData);

      expect(result).toBeDefined();
      expect(result.taskId).toBe(createdTask.id);
      expect(result.userId).toBe(testEmployee.id);
      expect(result.assignedBy).toBe(testManager.id);
      expect(result.status).toBe('assigned');
    });

    it('должен проверить права назначения задачи', async () => {
      const assignmentData = {
        userId: testEmployee.id,
        assignedBy: testManager.id,
        dueDate: new Date(),
        priority: 'medium' as const
      };

      await taskService.assignTask(createdTask.id, assignmentData);

      expect(mockPermissionsService.canAssignTaskToUser).toHaveBeenCalledWith(
        testManager.id,
        testEmployee.id
      );
      expect(mockPermissionsService.getTaskPermissions).toHaveBeenCalledWith(
        createdTask.id,
        testManager.id
      );
    });

    it('должен отклонить назначение без прав', async () => {
      mockPermissionsService.canAssignTaskToUser.mockResolvedValue(false);

      const assignmentData = {
        userId: testEmployee.id,
        assignedBy: testManager.id,
        dueDate: new Date(),
        priority: 'medium' as const
      };

      await expect(taskService.assignTask(createdTask.id, assignmentData))
        .rejects.toThrow('Permission denied: Cannot assign tasks to this user');
    });

    it('должен обновить статус задачи на assigned', async () => {
      const assignmentData = {
        userId: testEmployee.id,
        assignedBy: testManager.id,
        dueDate: new Date(),
        priority: 'medium' as const
      };

      await taskService.assignTask(createdTask.id, assignmentData);

      const updatedTask = await taskService.getTaskById(createdTask.id, testManager.id);
      expect(updatedTask.status).toBe('assigned');
    });
  });

  describe('Task Status Management', () => {
    let createdTask: any;
    let assignment: any;

    beforeEach(async () => {
      createdTask = await taskService.createTask(testTask);
      assignment = await taskService.assignTask(createdTask.id, {
        userId: testEmployee.id,
        assignedBy: testManager.id,
        dueDate: new Date(),
        priority: 'medium' as const
      });
    });

    it('должен начать выполнение задачи', async () => {
      const result = await taskService.startTask(createdTask.id, {
        userId: testEmployee.id,
        startedAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('in_progress');
    });

    it('должен завершить задачу', async () => {
      // Сначала начинаем задачу
      await taskService.startTask(createdTask.id, {
        userId: testEmployee.id,
        startedAt: new Date()
      });

      // Затем завершаем
      const result = await taskService.completeTask(createdTask.id, {
        userId: testEmployee.id,
        completedAt: new Date(),
        completionNotes: 'Задача выполнена успешно'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('должен отклонить задачу', async () => {
      const result = await taskService.updateTaskStatus(createdTask.id, {
        status: 'rejected',
        statusReason: 'Задача не актуальна',
        updatedBy: testManager.id
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('rejected');
    });

    it('должен записать историю изменения статуса', async () => {
      await taskService.startTask(createdTask.id, {
        userId: testEmployee.id,
        startedAt: new Date()
      });

      await taskService.completeTask(createdTask.id, {
        userId: testEmployee.id,
        completedAt: new Date()
      });

      const history = await taskService.getTaskStatusHistory(createdTask.id);
      
      expect(history.length).toBeGreaterThanOrEqual(3); // draft -> assigned -> in_progress -> completed
      expect(history.some(h => h.status === 'draft')).toBe(true);
      expect(history.some(h => h.status === 'assigned')).toBe(true);
      expect(history.some(h => h.status === 'in_progress')).toBe(true);
      expect(history.some(h => h.status === 'completed')).toBe(true);
    });
  });

  describe('Task Comments', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await taskService.createTask(testTask);
    });

    it('должен добавить комментарий к задаче', async () => {
      const commentData = {
        content: 'Это тестовый комментарий',
        authorId: testManager.id,
        isInternal: false
      };

      const result = await taskService.addTaskComment(createdTask.id, commentData);

      expect(result).toBeDefined();
      expect(result.content).toBe(commentData.content);
      expect(result.authorId).toBe(testManager.id);
      expect(result.taskId).toBe(createdTask.id);
    });

    it('должен получить комментарии задачи', async () => {
      // Добавляем несколько комментариев
      await taskService.addTaskComment(createdTask.id, {
        content: 'Первый комментарий',
        authorId: testManager.id,
        isInternal: false
      });

      await taskService.addTaskComment(createdTask.id, {
        content: 'Второй комментарий',
        authorId: testEmployee.id,
        isInternal: false
      });

      const comments = await taskService.getTaskComments(createdTask.id);

      expect(comments.length).toBe(2);
      expect(comments[0].content).toBe('Первый комментарий');
      expect(comments[1].content).toBe('Второй комментарий');
    });

    it('должен обновить комментарий', async () => {
      const comment = await taskService.addTaskComment(createdTask.id, {
        content: 'Исходный комментарий',
        authorId: testManager.id,
        isInternal: false
      });

      const updated = await taskService.updateTaskComment(comment.id, {
        content: 'Обновленный комментарий',
        updatedBy: testManager.id
      });

      expect(updated.content).toBe('Обновленный комментарий');
      expect(updated.isEdited).toBe(true);
    });
  });

  describe('Task Checklist', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await taskService.createTask(testTask);
    });

    it('должен добавить элемент чек-листа', async () => {
      const checklistData = {
        title: 'Проверить данные',
        description: 'Проверить все входные данные',
        order: 1,
        createdBy: testManager.id
      };

      const result = await taskService.addChecklistItem(createdTask.id, checklistData);

      expect(result).toBeDefined();
      expect(result.title).toBe(checklistData.title);
      expect(result.isCompleted).toBe(false);
    });

    it('должен отметить элемент чек-листа как выполненный', async () => {
      const item = await taskService.addChecklistItem(createdTask.id, {
        title: 'Тестовый элемент',
        order: 1,
        createdBy: testManager.id
      });

      const completed = await taskService.completeChecklistItem(item.id, {
        completedBy: testEmployee.id,
        completedAt: new Date(),
        completionNotes: 'Выполнено'
      });

      expect(completed.isCompleted).toBe(true);
      expect(completed.completedBy).toBe(testEmployee.id);
    });

    it('должен получить чек-лист задачи', async () => {
      await taskService.addChecklistItem(createdTask.id, {
        title: 'Первый элемент',
        order: 1,
        createdBy: testManager.id
      });

      await taskService.addChecklistItem(createdTask.id, {
        title: 'Второй элемент',
        order: 2,
        createdBy: testManager.id
      });

      const checklist = await taskService.getTaskChecklist(createdTask.id);

      expect(checklist.length).toBe(2);
      expect(checklist[0].order).toBeLessThan(checklist[1].order);
    });
  });

  describe('Task Statistics', () => {
    beforeEach(async () => {
      // Создаем несколько задач для статистики
      const tasks = [
        { ...testTask, title: 'Задача 1', priority: 'high' as const },
        { ...testTask, title: 'Задача 2', priority: 'medium' as const },
        { ...testTask, title: 'Задача 3', priority: 'low' as const }
      ];

      for (const task of tasks) {
        const created = await taskService.createTask(task);
        await taskService.assignTask(created.id, {
          userId: testEmployee.id,
          assignedBy: testManager.id,
          dueDate: new Date(),
          priority: 'medium' as const
        });
      }
    });

    it('должен получить статистику по задачам пользователя', async () => {
      const stats = await taskService.getUserTaskStats(testEmployee.id);

      expect(stats).toBeDefined();
      expect(stats.totalTasks).toBe(3);
      expect(stats.assignedTasks).toBe(3);
      expect(stats.completedTasks).toBe(0);
      expect(stats.overdueTasks).toBe(0);
    });

    it('должен получить статистику по организации', async () => {
      const stats = await taskService.getOrganizationTaskStats(testOrganization.id);

      expect(stats).toBeDefined();
      expect(stats.totalTasks).toBe(3);
      expect(stats.activeTasks).toBe(3);
      expect(stats.completedTasks).toBe(0);
    });
  });

  describe('Task Search and Filtering', () => {
    beforeEach(async () => {
      // Создаем задачи с разными параметрами
      const tasks = [
        { ...testTask, title: 'Срочная задача', priority: 'high' as const },
        { ...testTask, title: 'Обычная задача', priority: 'medium' as const },
        { ...testTask, title: 'Несрочная задача', priority: 'low' as const }
      ];

      for (const task of tasks) {
        const created = await taskService.createTask(task);
        if (task.priority === 'high') {
          await taskService.assignTask(created.id, {
            userId: testEmployee.id,
            assignedBy: testManager.id,
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Просрочена
            priority: 'high' as const
          });
        }
      }
    });

    it('должен найти задачи по заголовку', async () => {
      const results = await taskService.searchTasks({
        query: 'Срочная',
        userId: testManager.id
      });

      expect(results.data.length).toBe(1);
      expect(results.data[0].title).toContain('Срочная');
    });

    it('должен фильтровать задачи по приоритету', async () => {
      const results = await taskService.getTasks({
        priority: 'high',
        createdBy: testManager.id,
        page: 1,
        limit: 10
      });

      expect(results.data.length).toBe(1);
      expect(results.data[0].priority).toBe('high');
    });

    it('должен найти просроченные задачи', async () => {
      const results = await taskService.getTasks({
        isOverdue: true,
        createdBy: testManager.id,
        page: 1,
        limit: 10
      });

      expect(results.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('должен обработать попытку получения несуществующей задачи', async () => {
      await expect(taskService.getTaskById('non-existent-task', testManager.id))
        .rejects.toThrow('Task not found');
    });

    it('должен обработать попытку назначения задачи несуществующему пользователю', async () => {
      const task = await taskService.createTask(testTask);

      await expect(taskService.assignTask(task.id, {
        userId: 'non-existent-user',
        assignedBy: testManager.id,
        dueDate: new Date(),
        priority: 'medium' as const
      })).rejects.toThrow();
    });

    it('должен обработать попытку изменения статуса без прав', async () => {
      mockPermissionsService.getTaskPermissions.mockResolvedValue({
        canView: true,
        canEdit: false,
        canAssign: false,
        canComplete: false,
        canDelete: false
      });

      const task = await taskService.createTask(testTask);

      await expect(taskService.updateTaskStatus(task.id, {
        status: 'completed',
        updatedBy: testEmployee.id
      })).rejects.toThrow('Permission denied');
    });
  });
});

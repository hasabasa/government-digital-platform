import { eq, and, or, like, sql, desc, asc, inArray, isNull, gte, lte } from 'drizzle-orm';
import { db } from '@cube-demper/database';
import {
  tasks,
  taskAssignments,
  taskComments,
  taskStatusHistory,
  taskChecklist,
  taskFiles,
  users,
  companyStructure,
  type Task,
  type TaskAssignment,
  type TaskComment,
  type TaskChecklist as TaskChecklistType,
  type InsertTask,
  type InsertTaskAssignment,
  type InsertTaskComment,
  type InsertTaskChecklist
} from '@cube-demper/database/schema';
import { PermissionsService } from './permissions.service';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  UpdateAssignmentRequest,
  CreateCommentRequest,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  TaskFilters,
  TaskWithDetails,
  TaskStats,
  TaskTimelineEvent,
  TaskStatus,
  TaskPriority
} from '@cube-demper/types';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface TaskStatsOptions {
  organizationId?: string;
  period?: string;
}

export class TaskService {
  private permissionsService: PermissionsService;

  constructor() {
    this.permissionsService = new PermissionsService();
  }

  // Task Management
  async getTasks(
    filters: TaskFilters = {},
    pagination: PaginationOptions,
    userId: string
  ): Promise<{ tasks: TaskWithDetails[]; total: number }> {
    const conditions = [eq(tasks.isActive, true)];

    // Access control: user can see tasks where they are involved
    const userAccessCondition = or(
      eq(tasks.createdBy, userId),
      eq(tasks.assignedTo, userId),
      eq(tasks.supervisorId, userId),
      sql`EXISTS (
        SELECT 1 FROM task_assignments ta
        WHERE ta.task_id = tasks.id AND ta.user_id = ${userId}
      )`
    );
    conditions.push(userAccessCondition);

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(tasks.status, filters.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      conditions.push(inArray(tasks.priority, filters.priority));
    }

    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(tasks.type, filters.type));
    }

    if (filters.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }

    if (filters.createdBy) {
      conditions.push(eq(tasks.createdBy, filters.createdBy));
    }

    if (filters.organizationId) {
      conditions.push(eq(tasks.organizationId, filters.organizationId));
    }

    if (filters.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
    }

    if (filters.dueDateTo) {
      conditions.push(lte(tasks.dueDate, filters.dueDateTo));
    }

    if (filters.isOverdue) {
      conditions.push(
        and(
          sql`tasks.due_date < NOW()`,
          sql`tasks.status NOT IN ('completed', 'cancelled')`
        )
      );
    }

    if (filters.hasMyAssignments) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM task_assignments ta
          WHERE ta.task_id = tasks.id AND ta.user_id = ${userId} AND ta.status != 'declined'
        )`
      );
    }

    if (filters.search) {
      conditions.push(
        or(
          like(tasks.title, `%${filters.search}%`),
          like(tasks.description, `%${filters.search}%`)
        )
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(tasks)
      .where(and(...conditions));

    // Get paginated results — join users directly (no appointments/positions)
    const offset = (pagination.page - 1) * pagination.limit;
    const tasksResult = await db
      .select({
        task: tasks,
        creator: {
          id: sql`creator.id`,
          firstName: sql`creator.first_name`,
          lastName: sql`creator.last_name`,
          position: sql`creator.position`,
        },
        assignee: {
          id: sql`assignee.id`,
          firstName: sql`assignee.first_name`,
          lastName: sql`assignee.last_name`,
          position: sql`assignee.position`,
        },
        supervisor: {
          id: sql`supervisor.id`,
          firstName: sql`supervisor.first_name`,
          lastName: sql`supervisor.last_name`,
          position: sql`supervisor.position`,
        },
        organization: {
          id: sql`org.id`,
          name: sql`org.name`,
          type: sql`org.type`,
        },
      })
      .from(tasks)
      .leftJoin(users.as('creator'), eq(tasks.createdBy, sql`creator.id`))
      .leftJoin(users.as('assignee'), eq(tasks.assignedTo, sql`assignee.id`))
      .leftJoin(users.as('supervisor'), eq(tasks.supervisorId, sql`supervisor.id`))
      .leftJoin(companyStructure.as('org'), eq(tasks.organizationId, sql`org.id`))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    // Enrich tasks with additional data
    const enrichedTasks = await Promise.all(
      tasksResult.map(async (row) => {
        const taskId = row.task.id;

        // Get assignments
        const assignments = await this.getTaskAssignments(taskId);

        // Get counts
        const [commentsCount, filesCount, checklistStats] = await Promise.all([
          this.getCommentsCount(taskId),
          this.getFilesCount(taskId),
          this.getChecklistStats(taskId),
        ]);

        // Check permissions
        const permissions = await this.getUserTaskPermissions(taskId, userId);

        const taskWithDetails: TaskWithDetails = {
          ...row.task,
          creator: row.creator as any,
          assignee: row.assignee || undefined,
          supervisor: row.supervisor || undefined,
          organization: row.organization || undefined,
          assignments,
          commentsCount,
          filesCount,
          checklistItemsCount: checklistStats.total,
          completedChecklistItems: checklistStats.completed,
          ...permissions,
        };

        return taskWithDetails;
      })
    );

    return {
      tasks: enrichedTasks,
      total: parseInt(count.toString()),
    };
  }

  async getTaskById(taskId: string, userId: string): Promise<TaskWithDetails | null> {
    // Check if user has access to this task
    const hasAccess = await this.checkTaskAccess(taskId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const result = await this.getTasks({ search: undefined }, { page: 1, limit: 1 }, userId);
    const task = result.tasks.find(t => t.id === taskId);

    if (!task) return null;

    // Get additional details
    const [subtasks, dependencies] = await Promise.all([
      this.getSubtasks(taskId, userId),
      this.getTaskDependencies(taskId, userId),
    ]);

    return {
      ...task,
      subtasks,
      dependencies,
    };
  }

  async createTask(data: CreateTaskRequest & { createdBy: string }): Promise<Task> {
    // Check if user has permission to create tasks
    await this.checkCreateTaskPermission(data.createdBy);

    const insertData: InsertTask = {
      ...data,
      status: 'draft',
      completionPercentage: 0,
    };

    const [created] = await db.insert(tasks).values(insertData).returning();

    // Create assignments if provided
    if (data.assignments && data.assignments.length > 0) {
      for (const assignment of data.assignments) {
        await this.assignTask(created.id, {
          ...assignment,
          assignedBy: data.createdBy,
        });
      }
    }

    // Log status change
    await this.logStatusChange(created.id, data.createdBy, null, 'draft', 'Task created');

    return created;
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskRequest,
    userId: string
  ): Promise<Task> {
    // Check permissions
    const canEdit = await this.checkEditPermission(taskId, userId);
    if (!canEdit) {
      throw new Error('Permission denied');
    }

    const currentTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!currentTask.length) {
      throw new Error('Task not found');
    }

    const oldStatus = currentTask[0].status;
    const newStatus = data.status || oldStatus;

    const [updated] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();

    // Log status change if status was updated
    if (data.status && oldStatus !== newStatus) {
      await this.logStatusChange(taskId, userId, oldStatus, newStatus, 'Status updated');

      // Auto-complete checklist if task is completed
      if (newStatus === 'completed') {
        await this.markAllChecklistItemsCompleted(taskId, userId);
      }
    }

    return updated;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const canDelete = await this.checkDeletePermission(taskId, userId);
    if (!canDelete) {
      throw new Error('Permission denied');
    }

    // Soft delete
    await db
      .update(tasks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await this.logStatusChange(taskId, userId, null, 'cancelled', 'Task deleted');
  }

  // Task Assignments
  async assignTask(
    taskId: string,
    data: AssignTaskRequest & { assignedBy: string }
  ): Promise<TaskAssignment> {
    // Check role-based permission
    const perms = await this.permissionsService.getUserPermissions(data.assignedBy);
    if (!perms.canAssignTasks) {
      throw new Error('Permission denied: Cannot assign tasks');
    }

    // Check task-level assign permission
    const taskPermissions = await this.permissionsService.getTaskPermissions(taskId, data.assignedBy);
    if (!taskPermissions.canAssign) {
      throw new Error('Permission denied: Cannot assign this task');
    }

    // Check if user is already assigned with this role
    const existingAssignment = await db
      .select()
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, data.userId),
        eq(taskAssignments.role, data.role)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      throw new Error('User is already assigned with this role');
    }

    const insertData: InsertTaskAssignment = {
      taskId,
      userId: data.userId,
      role: data.role,
      status: 'assigned',
      assignmentNote: data.note,
      assignedAt: new Date(),
    };

    const [created] = await db.insert(taskAssignments).values(insertData).returning();

    // Update main task assignee if this is the primary executor
    if (data.role === 'executor') {
      await db
        .update(tasks)
        .set({ assignedTo: data.userId, updatedAt: new Date() })
        .where(eq(tasks.id, taskId));
    }

    return created;
  }

  async updateAssignment(
    assignmentId: string,
    data: UpdateAssignmentRequest,
    userId: string
  ): Promise<TaskAssignment> {
    // Get assignment to check permissions
    const [assignment] = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Only the assigned user can update their assignment status
    if (assignment.userId !== userId) {
      throw new Error('Permission denied');
    }

    const updateData: any = { ...data, updatedAt: new Date() };

    // Set timestamps based on status
    if (data.status === 'accepted') {
      updateData.acceptedAt = new Date();
    } else if (data.status === 'declined') {
      updateData.declinedAt = new Date();
    } else if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(taskAssignments)
      .set(updateData)
      .where(eq(taskAssignments.id, assignmentId))
      .returning();

    return updated;
  }

  async removeAssignment(assignmentId: string, userId: string): Promise<void> {
    const assignment = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.id, assignmentId))
      .limit(1);

    if (!assignment.length) {
      throw new Error('Assignment not found');
    }

    const canRemove = await this.checkAssignPermission(assignment[0].taskId, userId);
    if (!canRemove) {
      throw new Error('Permission denied');
    }

    await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.id, assignmentId));
  }

  // Comments
  async getTaskComments(
    taskId: string,
    pagination: PaginationOptions,
    userId: string
  ): Promise<{ comments: (TaskComment & { author: any })[]; total: number }> {
    const hasAccess = await this.checkTaskAccess(taskId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));

    const commentsResult = await db
      .select({
        comment: taskComments,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.authorId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    return {
      comments: commentsResult.map(row => ({
        ...row.comment,
        author: row.author,
      })),
      total: parseInt(count.toString()),
    };
  }

  async createComment(
    taskId: string,
    data: CreateCommentRequest & { authorId: string }
  ): Promise<TaskComment> {
    const hasAccess = await this.checkTaskAccess(taskId, data.authorId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const insertData: InsertTaskComment = {
      taskId,
      authorId: data.authorId,
      content: data.content,
      type: data.type || 'general',
      isInternal: data.isInternal || false,
    };

    const [created] = await db.insert(taskComments).values(insertData).returning();
    return created;
  }

  // Checklist
  async getTaskChecklist(taskId: string, userId: string): Promise<TaskChecklistType[]> {
    const hasAccess = await this.checkTaskAccess(taskId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return db
      .select()
      .from(taskChecklist)
      .where(eq(taskChecklist.taskId, taskId))
      .orderBy(asc(taskChecklist.orderIndex), asc(taskChecklist.createdAt));
  }

  async createChecklistItem(
    taskId: string,
    data: CreateChecklistItemRequest,
    userId: string
  ): Promise<TaskChecklistType> {
    const canEdit = await this.checkEditPermission(taskId, userId);
    if (!canEdit) {
      throw new Error('Permission denied');
    }

    const insertData: InsertTaskChecklist = {
      taskId,
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      orderIndex: data.orderIndex || 0,
    };

    const [created] = await db.insert(taskChecklist).values(insertData).returning();
    return created;
  }

  async updateChecklistItem(
    itemId: string,
    data: UpdateChecklistItemRequest,
    userId: string
  ): Promise<TaskChecklistType> {
    const item = await db
      .select()
      .from(taskChecklist)
      .where(eq(taskChecklist.id, itemId))
      .limit(1);

    if (!item.length) {
      throw new Error('Checklist item not found');
    }

    const canEdit = await this.checkEditPermission(item[0].taskId, userId);
    if (!canEdit) {
      throw new Error('Permission denied');
    }

    const updateData: any = { ...data, updatedAt: new Date() };

    if (data.isCompleted) {
      updateData.completedBy = userId;
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(taskChecklist)
      .set(updateData)
      .where(eq(taskChecklist.id, itemId))
      .returning();

    return updated;
  }

  async deleteChecklistItem(itemId: string, userId: string): Promise<void> {
    const item = await db
      .select()
      .from(taskChecklist)
      .where(eq(taskChecklist.id, itemId))
      .limit(1);

    if (!item.length) {
      throw new Error('Checklist item not found');
    }

    const canEdit = await this.checkEditPermission(item[0].taskId, userId);
    if (!canEdit) {
      throw new Error('Permission denied');
    }

    await db.delete(taskChecklist).where(eq(taskChecklist.id, itemId));
  }

  // Statistics and Reports
  async getTaskStats(userId: string, options: TaskStatsOptions = {}): Promise<TaskStats> {
    const conditions = [eq(tasks.isActive, true)];

    // Add organization filter if provided
    if (options.organizationId) {
      conditions.push(eq(tasks.organizationId, options.organizationId));
    }

    // Add period filter
    if (options.period) {
      const daysAgo = this.parsePeriod(options.period);
      conditions.push(gte(tasks.createdAt, new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)));
    }

    // User access filter
    const userAccessCondition = or(
      eq(tasks.createdBy, userId),
      eq(tasks.assignedTo, userId),
      eq(tasks.supervisorId, userId),
      sql`EXISTS (
        SELECT 1 FROM task_assignments ta
        WHERE ta.task_id = tasks.id AND ta.user_id = ${userId}
      )`
    );
    conditions.push(userAccessCondition);

    const statsQuery = await db
      .select({
        total: sql`count(*)`,
        status: tasks.status,
        priority: tasks.priority,
        isOverdue: sql`CASE WHEN due_date < NOW() AND status NOT IN ('completed', 'cancelled') THEN true ELSE false END`,
        dueSoon: sql`CASE WHEN due_date BETWEEN NOW() AND NOW() + interval '3 days' AND status NOT IN ('completed', 'cancelled') THEN true ELSE false END`,
        createdByUser: sql`CASE WHEN created_by = ${userId} THEN true ELSE false END`,
        assignedToUser: sql`CASE WHEN assigned_to = ${userId} THEN true ELSE false END`,
        supervisedByUser: sql`CASE WHEN supervisor_id = ${userId} THEN true ELSE false END`,
      })
      .from(tasks)
      .where(and(...conditions))
      .groupBy(tasks.status, tasks.priority);

    // Process results
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let total = 0;
    let overdue = 0;
    let dueSoon = 0;
    let assigned = 0;
    let created = 0;
    let supervised = 0;

    for (const row of statsQuery) {
      const count = parseInt(row.total.toString());
      total += count;

      byStatus[row.status] = (byStatus[row.status] || 0) + count;
      byPriority[row.priority] = (byPriority[row.priority] || 0) + count;

      if (row.isOverdue) overdue += count;
      if (row.dueSoon) dueSoon += count;
      if (row.createdByUser) created += count;
      if (row.assignedToUser) assigned += count;
      if (row.supervisedByUser) supervised += count;
    }

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      dueSoon,
      assigned,
      created,
      supervised,
    };
  }

  async getAssignableUsers(userId: string) {
    // Simple approach: admins/managers can assign to any active user
    const perms = await this.permissionsService.getUserPermissions(userId);
    if (!perms.canAssignTasks) {
      return [];
    }

    const activeUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        position: users.position,
        department: users.department,
      })
      .from(users)
      .where(eq(users.status, 'active'));

    return activeUsers.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      position: u.position || 'No position',
      department: u.department || 'No department',
      canAssign: true,
    }));
  }

  async getTaskTimeline(taskId: string, userId: string): Promise<TaskTimelineEvent[]> {
    const hasAccess = await this.checkTaskAccess(taskId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get status history
    const statusHistory = await db
      .select({
        id: taskStatusHistory.id,
        type: sql`'status_changed'`,
        date: taskStatusHistory.changeDate,
        actorId: taskStatusHistory.changedBy,
        description: sql`CONCAT('Status changed from ', from_status, ' to ', to_status)`,
        metadata: sql`json_build_object('fromStatus', from_status, 'toStatus', to_status, 'reason', reason)`,
      })
      .from(taskStatusHistory)
      .where(eq(taskStatusHistory.taskId, taskId));

    // Get comments
    const comments = await db
      .select({
        id: taskComments.id,
        type: sql`'commented'`,
        date: taskComments.createdAt,
        actorId: taskComments.authorId,
        description: sql`'Added a comment'`,
        metadata: sql`json_build_object('content', content, 'type', type)`,
      })
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));

    // Combine and sort
    const allEvents = [...statusHistory, ...comments];
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Enrich with user data (direct from users table)
    const enrichedEvents = await Promise.all(
      allEvents.map(async (event) => {
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, event.actorId))
          .limit(1);

        return {
          id: event.id,
          type: event.type as any,
          date: event.date,
          actor: user || { id: event.actorId, firstName: 'Unknown', lastName: 'User' },
          description: event.description,
          metadata: event.metadata,
        };
      })
    );

    return enrichedEvents;
  }

  // Helper methods
  private async checkTaskAccess(taskId: string, userId: string): Promise<boolean> {
    // Admins can access all tasks
    const perms = await this.permissionsService.getUserPermissions(userId);
    if (perms.role === 'admin') return true;

    const result = await db
      .select({ count: sql`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        or(
          eq(tasks.createdBy, userId),
          eq(tasks.assignedTo, userId),
          eq(tasks.supervisorId, userId),
          sql`EXISTS (
            SELECT 1 FROM task_assignments ta
            WHERE ta.task_id = ${taskId} AND ta.user_id = ${userId}
          )`
        )
      ));

    return parseInt(result[0].count.toString()) > 0;
  }

  private async checkCreateTaskPermission(userId: string): Promise<void> {
    const permissions = await this.permissionsService.getUserPermissions(userId);

    if (!permissions.canCreateTasks) {
      throw new Error('Permission denied: Cannot create tasks');
    }
  }

  private async checkEditPermission(taskId: string, userId: string): Promise<boolean> {
    const perms = await this.permissionsService.getUserPermissions(userId);
    if (perms.role === 'admin') return true;

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) return false;

    // Creator and supervisor can edit
    if (task.createdBy === userId || task.supervisorId === userId) {
      return true;
    }

    // Check if user has assignment with edit permissions
    const assignment = await db
      .select()
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId),
        inArray(taskAssignments.role, ['executor', 'approver'])
      ))
      .limit(1);

    return assignment.length > 0;
  }

  private async checkDeletePermission(taskId: string, userId: string): Promise<boolean> {
    const perms = await this.permissionsService.getUserPermissions(userId);
    if (perms.role === 'admin') return true;

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    // Only creator and supervisor can delete
    return task && (task.createdBy === userId || task.supervisorId === userId);
  }

  private async checkAssignPermission(taskId: string, userId: string): Promise<boolean> {
    return this.checkEditPermission(taskId, userId);
  }

  private async getUserTaskPermissions(taskId: string, userId: string) {
    const taskPermissions = await this.permissionsService.getTaskPermissions(taskId, userId);

    return {
      canEdit: taskPermissions.canEdit,
      canDelete: taskPermissions.canDelete,
      canAssign: taskPermissions.canAssign,
      canApprove: taskPermissions.canApprove,
    };
  }

  private async getTaskAssignments(taskId: string) {
    return db
      .select({
        assignment: taskAssignments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(taskAssignments)
      .leftJoin(users, eq(taskAssignments.userId, users.id))
      .where(eq(taskAssignments.taskId, taskId));
  }

  private async getCommentsCount(taskId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));

    return parseInt(count.toString());
  }

  private async getFilesCount(taskId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(taskFiles)
      .where(eq(taskFiles.taskId, taskId));

    return parseInt(count.toString());
  }

  private async getChecklistStats(taskId: string): Promise<{ total: number; completed: number }> {
    const [result] = await db
      .select({
        total: sql`count(*)`,
        completed: sql`count(*) FILTER (WHERE is_completed = true)`,
      })
      .from(taskChecklist)
      .where(eq(taskChecklist.taskId, taskId));

    return {
      total: parseInt(result.total.toString()),
      completed: parseInt(result.completed.toString()),
    };
  }

  private async getSubtasks(taskId: string, userId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.parentTaskId, taskId),
        eq(tasks.isActive, true)
      ))
      .orderBy(asc(tasks.createdAt));
  }

  private async getTaskDependencies(taskId: string, userId: string): Promise<Task[]> {
    // This would require parsing the depends_on_task_ids JSON field
    return [];
  }

  private async logStatusChange(
    taskId: string,
    changedBy: string,
    fromStatus: TaskStatus | null,
    toStatus: TaskStatus,
    reason?: string
  ): Promise<void> {
    await db.insert(taskStatusHistory).values({
      taskId,
      changedBy,
      fromStatus,
      toStatus,
      reason,
      changeDate: new Date(),
    });
  }

  private async markAllChecklistItemsCompleted(taskId: string, userId: string): Promise<void> {
    await db
      .update(taskChecklist)
      .set({
        isCompleted: true,
        completedBy: userId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(taskChecklist.taskId, taskId),
        eq(taskChecklist.isCompleted, false)
      ));
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dmy])$/);
    if (!match) return 30;

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'd': return number;
      case 'm': return number * 30;
      case 'y': return number * 365;
      default: return 30;
    }
  }
}

import { eq, and, sql } from 'drizzle-orm';
import { db } from '@cube-demper/database';
import { users, tasks, taskAssignments } from '@cube-demper/database/schema';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserPermissions {
  role: UserRole;
  canCreateTasks: boolean;
  canAssignTasks: boolean;
  canDeleteTasks: boolean;
  canApproveTasks: boolean;
}

export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canApprove: boolean;
  canComment: boolean;
  reason?: string;
}

// --- Simple role-based helper functions ---

export function canCreateTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'employee';
}

export function canAssignTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canDeleteTask(role: UserRole): boolean {
  return role === 'admin';
}

export function canApproveTask(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

// --- Service class ---

export class PermissionsService {

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        role: 'employee',
        canCreateTasks: false,
        canAssignTasks: false,
        canDeleteTasks: false,
        canApproveTasks: false,
      };
    }

    const role = user.role as UserRole;

    return {
      role,
      canCreateTasks: canCreateTask(role),
      canAssignTasks: canAssignTask(role),
      canDeleteTasks: canDeleteTask(role),
      canApproveTasks: canApproveTask(role),
    };
  }

  async getTaskPermissions(taskId: string, userId: string): Promise<TaskPermissions> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return { canView: false, canEdit: false, canDelete: false, canAssign: false, canApprove: false, canComment: false, reason: 'Task not found' };
    }

    const perms = await this.getUserPermissions(userId);

    // Admin has full access to every task
    if (perms.role === 'admin') {
      return { canView: true, canEdit: true, canDelete: true, canAssign: true, canApprove: true, canComment: true, reason: 'Admin' };
    }

    // Task creator
    if (task.createdBy === userId) {
      return { canView: true, canEdit: true, canDelete: perms.canDeleteTasks, canAssign: perms.canAssignTasks, canApprove: true, canComment: true, reason: 'Task creator' };
    }

    // Task supervisor
    if (task.supervisorId === userId) {
      return { canView: true, canEdit: true, canDelete: false, canAssign: perms.canAssignTasks, canApprove: perms.canApproveTasks, canComment: true, reason: 'Task supervisor' };
    }

    // Main assignee
    if (task.assignedTo === userId) {
      return { canView: true, canEdit: true, canDelete: false, canAssign: false, canApprove: false, canComment: true, reason: 'Main assignee' };
    }

    // Check task assignments
    const [assignment] = await db
      .select()
      .from(taskAssignments)
      .where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.userId, userId)))
      .limit(1);

    if (assignment) {
      const isReviewRole = assignment.role === 'reviewer' || assignment.role === 'approver';
      return {
        canView: true,
        canEdit: assignment.role === 'executor',
        canDelete: false,
        canAssign: false,
        canApprove: isReviewRole,
        canComment: true,
        reason: `Task ${assignment.role}`,
      };
    }

    // Manager can view tasks in their scope
    if (perms.role === 'manager') {
      return { canView: true, canEdit: false, canDelete: false, canAssign: false, canApprove: false, canComment: false, reason: 'Manager read-only' };
    }

    return { canView: false, canEdit: false, canDelete: false, canAssign: false, canApprove: false, canComment: false, reason: 'No permissions' };
  }
}

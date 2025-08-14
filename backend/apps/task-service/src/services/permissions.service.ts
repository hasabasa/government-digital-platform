import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '@gov-platform/database';
import { 
  users,
  appointments,
  positions,
  governmentStructure,
  tasks,
  taskAssignments
} from '@gov-platform/database/schema';

export interface UserPermissions {
  canCreateTasks: boolean;
  canAssignTasks: boolean;
  canIssueDisciplinaryActions: boolean;
  canInitiateGroupCalls: boolean;
  canManageSubordinates: boolean;
  organizationLevel: string;
  subordinateUserIds: string[];
  managedOrganizationIds: string[];
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

export class PermissionsService {

  /**
   * Получить полные права пользователя на основе его должности в иерархии
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Получить текущее назначение пользователя
    const currentAppointment = await db
      .select({
        position: positions,
        organization: governmentStructure,
      })
      .from(appointments)
      .leftJoin(positions, eq(appointments.positionId, positions.id))
      .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.isCurrent, true)
      ))
      .limit(1);

    if (!currentAppointment.length) {
      // Пользователь без назначения имеет минимальные права
      return {
        canCreateTasks: false,
        canAssignTasks: false,
        canIssueDisciplinaryActions: false,
        canInitiateGroupCalls: false,
        canManageSubordinates: false,
        organizationLevel: 'none',
        subordinateUserIds: [],
        managedOrganizationIds: [],
      };
    }

    const position = currentAppointment[0].position!;
    const organization = currentAppointment[0].organization!;

    // Получить подчиненных пользователей
    const subordinateUserIds = await this.getSubordinateUserIds(userId);
    
    // Получить организации, которыми управляет пользователь
    const managedOrganizationIds = await this.getManagedOrganizationIds(userId);

    return {
      canCreateTasks: position.isManagerial || position.canAssignTasks,
      canAssignTasks: position.canAssignTasks,
      canIssueDisciplinaryActions: position.canIssueDisciplinaryActions,
      canInitiateGroupCalls: position.isManagerial,
      canManageSubordinates: position.canManageSubordinates,
      organizationLevel: organization.level,
      subordinateUserIds,
      managedOrganizationIds,
    };
  }

  /**
   * Проверить права доступа пользователя к конкретной задаче
   */
  async getTaskPermissions(taskId: string, userId: string): Promise<TaskPermissions> {
    // Получить задачу
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canAssign: false,
        canApprove: false,
        canComment: false,
        reason: 'Task not found',
      };
    }

    // Получить права пользователя
    const userPermissions = await this.getUserPermissions(userId);

    // Проверить базовый доступ к задаче
    const hasBasicAccess = await this.checkBasicTaskAccess(taskId, userId);
    
    if (!hasBasicAccess) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canAssign: false,
        canApprove: false,
        canComment: false,
        reason: 'No access to this task',
      };
    }

    // Создатель задачи имеет полные права
    if (task.createdBy === userId) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canAssign: userPermissions.canAssignTasks,
        canApprove: true,
        canComment: true,
        reason: 'Task creator',
      };
    }

    // Руководитель проекта имеет расширенные права
    if (task.supervisorId === userId) {
      return {
        canView: true,
        canEdit: true,
        canDelete: false, // Только создатель может удалить
        canAssign: userPermissions.canAssignTasks,
        canApprove: true,
        canComment: true,
        reason: 'Task supervisor',
      };
    }

    // Основной исполнитель
    if (task.assignedTo === userId) {
      return {
        canView: true,
        canEdit: true, // Может обновлять статус и прогресс
        canDelete: false,
        canAssign: false,
        canApprove: false,
        canComment: true,
        reason: 'Main assignee',
      };
    }

    // Проверить назначения на задачу
    const assignment = await db
      .select()
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      ))
      .limit(1);

    if (assignment.length > 0) {
      const role = assignment[0].role;
      
      switch (role) {
        case 'executor':
          return {
            canView: true,
            canEdit: true,
            canDelete: false,
            canAssign: false,
            canApprove: false,
            canComment: true,
            reason: 'Task executor',
          };

        case 'reviewer':
          return {
            canView: true,
            canEdit: false,
            canDelete: false,
            canAssign: false,
            canApprove: true,
            canComment: true,
            reason: 'Task reviewer',
          };

        case 'approver':
          return {
            canView: true,
            canEdit: false,
            canDelete: false,
            canAssign: userPermissions.canAssignTasks,
            canApprove: true,
            canComment: true,
            reason: 'Task approver',
          };

        case 'observer':
          return {
            canView: true,
            canEdit: false,
            canDelete: false,
            canAssign: false,
            canApprove: false,
            canComment: true,
            reason: 'Task observer',
          };
      }
    }

    // Проверить иерархические права
    const hierarchicalAccess = await this.checkHierarchicalAccess(taskId, userId, userPermissions);
    
    if (hierarchicalAccess.hasAccess) {
      return {
        canView: true,
        canEdit: hierarchicalAccess.canManage,
        canDelete: false,
        canAssign: hierarchicalAccess.canManage && userPermissions.canAssignTasks,
        canApprove: hierarchicalAccess.canManage,
        canComment: true,
        reason: hierarchicalAccess.reason,
      };
    }

    // Нет доступа
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      canApprove: false,
      canComment: false,
      reason: 'No permissions for this task',
    };
  }

  /**
   * Проверить, может ли пользователь назначать задачи другому пользователю
   */
  async canAssignTaskToUser(assignerId: string, assigneeId: string): Promise<boolean> {
    // Проверить права назначающего
    const assignerPermissions = await this.getUserPermissions(assignerId);
    
    if (!assignerPermissions.canAssignTasks) {
      return false;
    }

    // Руководители могут назначать задачи своим подчиненным
    if (assignerPermissions.subordinateUserIds.includes(assigneeId)) {
      return true;
    }

    // Проверить, находится ли исполнитель в той же организации
    const sameOrganization = await this.checkSameOrganization(assignerId, assigneeId);
    
    if (sameOrganization) {
      // В той же организации можно назначать, если есть права
      return assignerPermissions.canAssignTasks;
    }

    // Проверить, является ли назначающий руководителем вышестоящей организации
    const isHigherLevel = await this.checkHigherLevelAccess(assignerId, assigneeId);
    
    return isHigherLevel;
  }

  /**
   * Получить список пользователей, которым можно назначить задачу
   */
  async getAssignableUsers(userId: string, organizationId?: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    organization: string;
    canAssign: boolean;
    reason: string;
  }>> {
    const userPermissions = await this.getUserPermissions(userId);
    
    if (!userPermissions.canAssignTasks) {
      return [];
    }

    // Построить условия поиска
    const baseQuery = db
      .select({
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        position: {
          title: positions.title,
        },
        organization: {
          id: governmentStructure.id,
          name: governmentStructure.name,
        },
      })
      .from(users)
      .leftJoin(appointments, and(
        eq(appointments.userId, users.id),
        eq(appointments.isCurrent, true)
      ))
      .leftJoin(positions, eq(appointments.positionId, positions.id))
      .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
      .where(eq(users.status, 'active'));

    // Если указана организация, фильтруем по ней и подорганизациям
    let candidates;
    if (organizationId) {
      candidates = await baseQuery.where(
        sql`government_structure.path LIKE (
          SELECT path || '%' 
          FROM government_structure 
          WHERE id = ${organizationId}
        )`
      );
    } else {
      // Иначе берем из доступных организаций
      if (userPermissions.managedOrganizationIds.length > 0) {
        candidates = await baseQuery.where(
          sql`government_structure.id = ANY(${userPermissions.managedOrganizationIds})`
        );
      } else {
        candidates = await baseQuery;
      }
    }

    // Проверить права назначения для каждого кандидата
    const assignableUsers = await Promise.all(
      candidates.map(async (candidate) => {
        const canAssign = await this.canAssignTaskToUser(userId, candidate.user.id);
        
        let reason = '';
        if (userPermissions.subordinateUserIds.includes(candidate.user.id)) {
          reason = 'Direct subordinate';
        } else if (candidate.organization?.id && userPermissions.managedOrganizationIds.includes(candidate.organization.id)) {
          reason = 'Same organization';
        } else if (canAssign) {
          reason = 'Higher level access';
        } else {
          reason = 'No assignment rights';
        }

        return {
          id: candidate.user.id,
          firstName: candidate.user.firstName,
          lastName: candidate.user.lastName,
          position: candidate.position?.title || 'No position',
          organization: candidate.organization?.name || 'No organization',
          canAssign,
          reason,
        };
      })
    );

    return assignableUsers.filter(user => user.canAssign);
  }

  // Приватные методы

  private async checkBasicTaskAccess(taskId: string, userId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.isActive, true),
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

  private async checkHierarchicalAccess(
    taskId: string, 
    userId: string, 
    userPermissions: UserPermissions
  ): Promise<{ hasAccess: boolean; canManage: boolean; reason: string }> {
    // Получить создателя задачи
    const [task] = await db
      .select({
        createdBy: tasks.createdBy,
        organizationId: tasks.organizationId,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return { hasAccess: false, canManage: false, reason: 'Task not found' };
    }

    // Если создатель - подчиненный, то есть доступ
    if (userPermissions.subordinateUserIds.includes(task.createdBy)) {
      return { 
        hasAccess: true, 
        canManage: userPermissions.canManageSubordinates, 
        reason: 'Task creator is subordinate' 
      };
    }

    // Если задача в управляемой организации
    if (task.organizationId && userPermissions.managedOrganizationIds.includes(task.organizationId)) {
      return { 
        hasAccess: true, 
        canManage: userPermissions.canManageSubordinates, 
        reason: 'Task in managed organization' 
      };
    }

    return { hasAccess: false, canManage: false, reason: 'No hierarchical access' };
  }

  private async getSubordinateUserIds(userId: string): Promise<string[]> {
    const query = sql`
      WITH user_subordinates AS (
        SELECT DISTINCT u.id
        FROM users u
        JOIN appointments a ON u.id = a.user_id AND a.is_current = true
        JOIN positions p ON a.position_id = p.id
        JOIN appointments current_a ON current_a.user_id = ${userId} AND current_a.is_current = true
        JOIN positions current_pos ON current_a.position_id = current_pos.id
        WHERE p.reports_to_position_id = current_pos.id
           OR p.id IN (
             WITH RECURSIVE subordinate_positions AS (
               SELECT id, reports_to_position_id
               FROM positions
               WHERE reports_to_position_id = current_pos.id
               
               UNION ALL
               
               SELECT p.id, p.reports_to_position_id
               FROM positions p
               JOIN subordinate_positions sp ON p.reports_to_position_id = sp.id
             )
             SELECT id FROM subordinate_positions
           )
      )
      SELECT id FROM user_subordinates
    `;

    const result = await db.execute(query);
    return result.rows.map((row: any) => row.id);
  }

  private async getManagedOrganizationIds(userId: string): Promise<string[]> {
    // Получить организации, где пользователь является руководителем
    const directManagement = await db
      .select({ id: governmentStructure.id })
      .from(governmentStructure)
      .where(or(
        eq(governmentStructure.headUserId, userId),
        eq(governmentStructure.deputyHeadUserId, userId)
      ));

    const directIds = directManagement.map(org => org.id);

    // Получить подорганизации
    if (directIds.length === 0) {
      return [];
    }

    const subOrganizations = await db
      .select({ id: governmentStructure.id })
      .from(governmentStructure)
      .where(
        sql`path LIKE ANY(
          SELECT path || '%' 
          FROM government_structure 
          WHERE id = ANY(${directIds})
        )`
      );

    return [...directIds, ...subOrganizations.map(org => org.id)];
  }

  private async checkSameOrganization(userId1: string, userId2: string): Promise<boolean> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(appointments.as('a1'))
      .innerJoin(appointments.as('a2'), eq(sql`a1.organization_id`, sql`a2.organization_id`))
      .where(and(
        eq(sql`a1.user_id`, userId1),
        eq(sql`a1.is_current`, true),
        eq(sql`a2.user_id`, userId2),
        eq(sql`a2.is_current`, true)
      ));

    return parseInt(result[0].count.toString()) > 0;
  }

  private async checkHigherLevelAccess(supervisorId: string, subordinateId: string): Promise<boolean> {
    // Проверить, находится ли подчиненный в организации нижнего уровня
    const result = await db
      .select({ count: sql`count(*)` })
      .from(appointments.as('supervisor_app'))
      .innerJoin(governmentStructure.as('supervisor_org'), eq(sql`supervisor_app.organization_id`, sql`supervisor_org.id`))
      .innerJoin(appointments.as('subordinate_app'), and(
        eq(sql`subordinate_app.user_id`, subordinateId),
        eq(sql`subordinate_app.is_current`, true)
      ))
      .innerJoin(governmentStructure.as('subordinate_org'), eq(sql`subordinate_app.organization_id`, sql`subordinate_org.id`))
      .where(and(
        eq(sql`supervisor_app.user_id`, supervisorId),
        eq(sql`supervisor_app.is_current`, true),
        sql`subordinate_org.path LIKE supervisor_org.path || '%'`
      ));

    return parseInt(result[0].count.toString()) > 0;
  }
}

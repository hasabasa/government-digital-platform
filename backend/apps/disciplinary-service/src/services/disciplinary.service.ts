import { eq, and, or, sql, desc, asc, like, gte, lte, inArray } from 'drizzle-orm';
import { db } from '@gov-platform/database';
import { 
  disciplinaryActions,
  commendations,
  disciplinaryAppeals,
  disciplinaryStatusHistory,
  disciplinaryNotifications,
  users,
  appointments,
  positions,
  governmentStructure,
  type DisciplinaryAction,
  type Commendation,
  type DisciplinaryAppeal,
  type InsertDisciplinaryAction,
  type InsertCommendation,
  type InsertDisciplinaryAppeal
} from '@gov-platform/database/schema';
import {
  CreateDisciplinaryActionRequest,
  UpdateDisciplinaryActionRequest,
  CreateCommendationRequest,
  UpdateCommendationRequest,
  CreateAppealRequest,
  UpdateAppealRequest,
  DisciplinaryFilters,
  CommendationFilters,
  DisciplinaryActionWithDetails,
  CommendationWithDetails,
  DisciplinaryStats,
  EmployeeDisciplinaryRecord,
  DisciplinaryActionType,
  CommendationType,
  DisciplinaryStatus,
  SeverityLevel
} from '@gov-platform/types';
import { addDays, subMonths, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface DisciplinaryPermissions {
  canIssueActions: boolean;
  canIssueCommendations: boolean;
  canReviewAppeals: boolean;
  canViewConfidential: boolean;
  canManageAllActions: boolean;
  managedUserIds: string[];
  managedOrganizationIds: string[];
}

export class DisciplinaryService {

  // Disciplinary Actions Management
  async getDisciplinaryActions(
    filters: DisciplinaryFilters = {},
    pagination: PaginationOptions,
    userId: string
  ): Promise<{ actions: DisciplinaryActionWithDetails[]; total: number }> {
    // Check permissions for filtering
    const permissions = await this.getUserPermissions(userId);
    const conditions = [];

    // Access control: user can see actions they issued, received, or have management rights to
    if (!permissions.canManageAllActions) {
      const accessCondition = or(
        eq(disciplinaryActions.issuedBy, userId),
        eq(disciplinaryActions.employeeId, userId),
        inArray(disciplinaryActions.employeeId, permissions.managedUserIds),
        and(
          eq(disciplinaryActions.isConfidential, false),
          inArray(disciplinaryActions.organizationId, permissions.managedOrganizationIds)
        )
      );
      conditions.push(accessCondition);
    }

    // Apply filters
    if (filters.employeeId) {
      conditions.push(eq(disciplinaryActions.employeeId, filters.employeeId));
    }
    
    if (filters.issuedBy) {
      conditions.push(eq(disciplinaryActions.issuedBy, filters.issuedBy));
    }
    
    if (filters.organizationId) {
      conditions.push(eq(disciplinaryActions.organizationId, filters.organizationId));
    }
    
    if (filters.actionType && filters.actionType.length > 0) {
      conditions.push(inArray(disciplinaryActions.actionType, filters.actionType));
    }
    
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(disciplinaryActions.status, filters.status));
    }
    
    if (filters.severityLevel && filters.severityLevel.length > 0) {
      conditions.push(inArray(disciplinaryActions.severityLevel, filters.severityLevel));
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(disciplinaryActions.issuedDate, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(disciplinaryActions.issuedDate, filters.dateTo));
    }
    
    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        conditions.push(eq(disciplinaryActions.status, 'active'));
      } else {
        conditions.push(sql`status != 'active'`);
      }
    }
    
    if (filters.isExecuted !== undefined) {
      conditions.push(eq(disciplinaryActions.isExecuted, filters.isExecuted));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(disciplinaryActions.title, `%${filters.search}%`),
          like(disciplinaryActions.description, `%${filters.search}%`),
          like(disciplinaryActions.reason, `%${filters.search}%`)
        )
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(disciplinaryActions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get paginated results with details
    const offset = (pagination.page - 1) * pagination.limit;
    const actionsResult = await db
      .select({
        action: disciplinaryActions,
        employee: {
          id: sql`employee.id`,
          firstName: sql`employee.first_name`,
          lastName: sql`employee.last_name`,
          middleName: sql`employee.middle_name`,
          position: sql`emp_pos.title`,
          department: sql`emp_org.name`,
        },
        issuer: {
          id: sql`issuer.id`,
          firstName: sql`issuer.first_name`,
          lastName: sql`issuer.last_name`,
          position: sql`issuer_pos.title`,
        },
        organization: {
          id: sql`org.id`,
          name: sql`org.name`,
          type: sql`org.type`,
        },
      })
      .from(disciplinaryActions)
      .leftJoin(users.as('employee'), eq(disciplinaryActions.employeeId, sql`employee.id`))
      .leftJoin(appointments.as('emp_app'), and(
        eq(sql`emp_app.user_id`, sql`employee.id`),
        eq(sql`emp_app.is_current`, true)
      ))
      .leftJoin(positions.as('emp_pos'), eq(sql`emp_app.position_id`, sql`emp_pos.id`))
      .leftJoin(governmentStructure.as('emp_org'), eq(sql`emp_app.organization_id`, sql`emp_org.id`))
      .leftJoin(users.as('issuer'), eq(disciplinaryActions.issuedBy, sql`issuer.id`))
      .leftJoin(appointments.as('issuer_app'), and(
        eq(sql`issuer_app.user_id`, sql`issuer.id`),
        eq(sql`issuer_app.is_current`, true)
      ))
      .leftJoin(positions.as('issuer_pos'), eq(sql`issuer_app.position_id`, sql`issuer_pos.id`))
      .leftJoin(governmentStructure.as('org'), eq(disciplinaryActions.organizationId, sql`org.id`))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(disciplinaryActions.issuedDate))
      .limit(pagination.limit)
      .offset(offset);

    // Enrich with permissions and additional data
    const enrichedActions = await Promise.all(
      actionsResult.map(async (row) => {
        const actionPermissions = await this.getActionPermissions(row.action.id, userId);
        const appealInfo = await this.getAppealInfo(row.action.id);
        
        const actionWithDetails: DisciplinaryActionWithDetails = {
          ...row.action,
          employee: row.employee as any,
          issuer: row.issuer as any,
          organization: row.organization || undefined,
          appealInfo,
          ...actionPermissions,
          daysUntilExpiry: row.action.expiryDate 
            ? Math.ceil((new Date(row.action.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined,
        };

        return actionWithDetails;
      })
    );

    return {
      actions: enrichedActions,
      total: parseInt(count.toString()),
    };
  }

  async createDisciplinaryAction(
    data: CreateDisciplinaryActionRequest & { issuedBy: string }
  ): Promise<DisciplinaryAction> {
    // Check permissions
    const permissions = await this.getUserPermissions(data.issuedBy);
    if (!permissions.canIssueActions) {
      throw new Error('Permission denied: Cannot issue disciplinary actions');
    }

    // Check if user can issue actions to this employee
    const canIssueToEmployee = await this.canIssueActionToEmployee(data.issuedBy, data.employeeId);
    if (!canIssueToEmployee) {
      throw new Error('Permission denied: Cannot issue actions to this employee');
    }

    // Calculate appeal deadline
    const appealDeadline = addDays(new Date(), 15); // Default 15 days

    const insertData: InsertDisciplinaryAction = {
      ...data,
      issuedDate: new Date(),
      appealDeadline,
      status: 'active',
    };

    const [created] = await db.insert(disciplinaryActions).values(insertData).returning();

    // Log status change
    await this.logStatusChange(created.id, data.issuedBy, null, 'active', 'Action issued');

    // Schedule notification
    await this.scheduleNotification(created.id, 'action_issued');

    return created;
  }

  async updateDisciplinaryAction(
    actionId: string,
    data: UpdateDisciplinaryActionRequest,
    userId: string
  ): Promise<DisciplinaryAction> {
    const permissions = await this.getActionPermissions(actionId, userId);
    if (!permissions.canEdit) {
      throw new Error('Permission denied: Cannot edit this action');
    }

    const [currentAction] = await db
      .select()
      .from(disciplinaryActions)
      .where(eq(disciplinaryActions.id, actionId))
      .limit(1);

    if (!currentAction) {
      throw new Error('Disciplinary action not found');
    }

    const oldStatus = currentAction.status;
    const newStatus = data.status || oldStatus;

    const [updated] = await db
      .update(disciplinaryActions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(disciplinaryActions.id, actionId))
      .returning();

    // Log status change if status was updated
    if (data.status && oldStatus !== newStatus) {
      await this.logStatusChange(actionId, userId, oldStatus, newStatus, 'Status updated');
      
      if (newStatus === 'completed' || newStatus === 'executed') {
        await this.scheduleNotification(actionId, 'action_executed');
      }
    }

    return updated;
  }

  // Commendations Management
  async getCommendations(
    filters: CommendationFilters = {},
    pagination: PaginationOptions,
    userId: string
  ): Promise<{ commendations: CommendationWithDetails[]; total: number }> {
    const permissions = await this.getUserPermissions(userId);
    const conditions = [];

    // Access control
    if (!permissions.canManageAllActions) {
      const accessCondition = or(
        eq(commendations.issuedBy, userId),
        eq(commendations.employeeId, userId),
        inArray(commendations.employeeId, permissions.managedUserIds),
        and(
          eq(commendations.isPublic, true),
          inArray(commendations.organizationId, permissions.managedOrganizationIds)
        )
      );
      conditions.push(accessCondition);
    }

    // Apply filters
    if (filters.employeeId) {
      conditions.push(eq(commendations.employeeId, filters.employeeId));
    }
    
    if (filters.issuedBy) {
      conditions.push(eq(commendations.issuedBy, filters.issuedBy));
    }
    
    if (filters.organizationId) {
      conditions.push(eq(commendations.organizationId, filters.organizationId));
    }
    
    if (filters.commendationType && filters.commendationType.length > 0) {
      conditions.push(inArray(commendations.commendationType, filters.commendationType));
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(commendations.issuedDate, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(commendations.issuedDate, filters.dateTo));
    }
    
    if (filters.isPublic !== undefined) {
      conditions.push(eq(commendations.isPublic, filters.isPublic));
    }
    
    if (filters.isExecuted !== undefined) {
      conditions.push(eq(commendations.isExecuted, filters.isExecuted));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(commendations.title, `%${filters.search}%`),
          like(commendations.description, `%${filters.search}%`),
          like(commendations.achievement, `%${filters.search}%`)
        )
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(commendations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const commendationsResult = await db
      .select({
        commendation: commendations,
        employee: {
          id: sql`employee.id`,
          firstName: sql`employee.first_name`,
          lastName: sql`employee.last_name`,
          middleName: sql`employee.middle_name`,
          position: sql`emp_pos.title`,
          department: sql`emp_org.name`,
        },
        issuer: {
          id: sql`issuer.id`,
          firstName: sql`issuer.first_name`,
          lastName: sql`issuer.last_name`,
          position: sql`issuer_pos.title`,
        },
        organization: {
          id: sql`org.id`,
          name: sql`org.name`,
          type: sql`org.type`,
        },
      })
      .from(commendations)
      .leftJoin(users.as('employee'), eq(commendations.employeeId, sql`employee.id`))
      .leftJoin(appointments.as('emp_app'), and(
        eq(sql`emp_app.user_id`, sql`employee.id`),
        eq(sql`emp_app.is_current`, true)
      ))
      .leftJoin(positions.as('emp_pos'), eq(sql`emp_app.position_id`, sql`emp_pos.id`))
      .leftJoin(governmentStructure.as('emp_org'), eq(sql`emp_app.organization_id`, sql`emp_org.id`))
      .leftJoin(users.as('issuer'), eq(commendations.issuedBy, sql`issuer.id`))
      .leftJoin(appointments.as('issuer_app'), and(
        eq(sql`issuer_app.user_id`, sql`issuer.id`),
        eq(sql`issuer_app.is_current`, true)
      ))
      .leftJoin(positions.as('issuer_pos'), eq(sql`issuer_app.position_id`, sql`issuer_pos.id`))
      .leftJoin(governmentStructure.as('org'), eq(commendations.organizationId, sql`org.id`))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(commendations.issuedDate))
      .limit(pagination.limit)
      .offset(offset);

    // Enrich with permissions
    const enrichedCommendations = await Promise.all(
      commendationsResult.map(async (row) => {
        const commendationPermissions = await this.getCommendationPermissions(row.commendation.id, userId);
        
        const commendationWithDetails: CommendationWithDetails = {
          ...row.commendation,
          employee: row.employee as any,
          issuer: row.issuer as any,
          organization: row.organization || undefined,
          ...commendationPermissions,
        };

        return commendationWithDetails;
      })
    );

    return {
      commendations: enrichedCommendations,
      total: parseInt(count.toString()),
    };
  }

  async createCommendation(
    data: CreateCommendationRequest & { issuedBy: string }
  ): Promise<Commendation> {
    const permissions = await this.getUserPermissions(data.issuedBy);
    if (!permissions.canIssueCommendations) {
      throw new Error('Permission denied: Cannot issue commendations');
    }

    const canIssueToEmployee = await this.canIssueActionToEmployee(data.issuedBy, data.employeeId);
    if (!canIssueToEmployee) {
      throw new Error('Permission denied: Cannot issue commendations to this employee');
    }

    const insertData: InsertCommendation = {
      ...data,
      issuedDate: new Date(),
    };

    const [created] = await db.insert(commendations).values(insertData).returning();

    // Schedule notification
    await this.scheduleNotification(created.id, 'commendation_issued', 'commendation');

    return created;
  }

  // Appeals Management
  async createAppeal(
    data: CreateAppealRequest & { appealedBy: string }
  ): Promise<DisciplinaryAppeal> {
    // Check if action exists and user can appeal
    const [action] = await db
      .select()
      .from(disciplinaryActions)
      .where(eq(disciplinaryActions.id, data.disciplinaryActionId))
      .limit(1);

    if (!action) {
      throw new Error('Disciplinary action not found');
    }

    if (action.employeeId !== data.appealedBy) {
      throw new Error('Permission denied: Can only appeal your own disciplinary actions');
    }

    if (action.appealDeadline && new Date() > action.appealDeadline) {
      throw new Error('Appeal deadline has passed');
    }

    // Check if appeal already exists
    const existingAppeal = await db
      .select()
      .from(disciplinaryAppeals)
      .where(eq(disciplinaryAppeals.disciplinaryActionId, data.disciplinaryActionId))
      .limit(1);

    if (existingAppeal.length > 0) {
      throw new Error('Appeal already exists for this action');
    }

    const deadlineDate = addDays(new Date(), 30); // 30 days to decide

    const insertData: InsertDisciplinaryAppeal = {
      ...data,
      submittedDate: new Date(),
      deadlineDate,
      status: 'pending',
    };

    const [created] = await db.insert(disciplinaryAppeals).values(insertData).returning();

    // Update action status
    await db
      .update(disciplinaryActions)
      .set({ status: 'appealed', updatedAt: new Date() })
      .where(eq(disciplinaryActions.id, data.disciplinaryActionId));

    return created;
  }

  // Statistics and Reports
  async getDisciplinaryStats(userId: string, organizationId?: string): Promise<DisciplinaryStats> {
    const permissions = await this.getUserPermissions(userId);
    const conditions = [];

    // Apply access control
    if (!permissions.canManageAllActions) {
      conditions.push(
        or(
          eq(disciplinaryActions.issuedBy, userId),
          inArray(disciplinaryActions.employeeId, permissions.managedUserIds)
        )
      );
    }

    if (organizationId) {
      conditions.push(eq(disciplinaryActions.organizationId, organizationId));
    }

    // Get basic counts
    const [actionStats] = await db
      .select({
        totalActions: sql`count(*)`,
        activeActions: sql`count(*) filter (where status = 'active')`,
      })
      .from(disciplinaryActions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const [commendationStats] = await db
      .select({
        totalCommendations: sql`count(*)`,
      })
      .from(commendations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const [appealStats] = await db
      .select({
        totalAppeals: sql`count(*)`,
        pendingAppeals: sql`count(*) filter (where status = 'pending')`,
      })
      .from(disciplinaryAppeals);

    // Get breakdowns by type and severity
    const actionsByType = await db
      .select({
        actionType: disciplinaryActions.actionType,
        count: sql`count(*)`,
      })
      .from(disciplinaryActions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(disciplinaryActions.actionType);

    const commendationsByType = await db
      .select({
        commendationType: commendations.commendationType,
        count: sql`count(*)`,
      })
      .from(commendations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(commendations.commendationType);

    // Generate monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = subMonths(new Date(), i);
      const monthEnd = subMonths(new Date(), i - 1);
      const monthLabel = format(monthStart, 'yyyy-MM');

      const [monthStats] = await db
        .select({
          actions: sql`count(distinct da.id)`,
          commendations: sql`count(distinct c.id)`,
        })
        .from(disciplinaryActions.as('da'))
        .leftJoin(commendations.as('c'), sql`c.issued_date >= ${monthStart} AND c.issued_date < ${monthEnd}`)
        .where(
          and(
            gte(sql`da.issued_date`, monthStart),
            sql`da.issued_date < ${monthEnd}`,
            ...(conditions.length > 0 ? conditions : [])
          )
        );

      monthlyTrends.push({
        month: monthLabel,
        actions: parseInt(monthStats.actions?.toString() || '0'),
        commendations: parseInt(monthStats.commendations?.toString() || '0'),
      });
    }

    return {
      totalActions: parseInt(actionStats.totalActions.toString()),
      activeActions: parseInt(actionStats.activeActions.toString()),
      totalCommendations: parseInt(commendationStats.totalCommendations.toString()),
      totalAppeals: parseInt(appealStats.totalAppeals.toString()),
      pendingAppeals: parseInt(appealStats.pendingAppeals.toString()),
      byActionType: Object.fromEntries(
        actionsByType.map(item => [item.actionType, parseInt(item.count.toString())])
      ),
      byCommendationType: Object.fromEntries(
        commendationsByType.map(item => [item.commendationType, parseInt(item.count.toString())])
      ),
      bySeverity: {}, // Would need additional query
      byStatus: {}, // Would need additional query
      monthlyTrends,
      topViolations: [], // Would need additional schema for violations
    };
  }

  async getEmployeeDisciplinaryRecord(employeeId: string, userId: string): Promise<EmployeeDisciplinaryRecord> {
    // Check permissions
    const permissions = await this.getUserPermissions(userId);
    const canViewRecord = permissions.canManageAllActions || 
                         permissions.managedUserIds.includes(employeeId) ||
                         userId === employeeId;

    if (!canViewRecord) {
      throw new Error('Permission denied: Cannot view this employee record');
    }

    // Get employee info
    const [employee] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        middleName: users.middleName,
        position: sql`pos.title`,
        department: sql`org.name`,
      })
      .from(users)
      .leftJoin(appointments, and(
        eq(appointments.userId, users.id),
        eq(appointments.isCurrent, true)
      ))
      .leftJoin(positions.as('pos'), eq(appointments.positionId, sql`pos.id`))
      .leftJoin(governmentStructure.as('org'), eq(appointments.organizationId, sql`org.id`))
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get summary stats
    const [actionStats] = await db
      .select({
        totalActions: sql`count(*)`,
        activeActions: sql`count(*) filter (where status = 'active')`,
        lastActionDate: sql`max(issued_date)`,
      })
      .from(disciplinaryActions)
      .where(eq(disciplinaryActions.employeeId, employeeId));

    const [commendationStats] = await db
      .select({
        totalCommendations: sql`count(*)`,
        lastCommendationDate: sql`max(issued_date)`,
      })
      .from(commendations)
      .where(eq(commendations.employeeId, employeeId));

    // Get recent actions and commendations
    const recentActions = await db
      .select()
      .from(disciplinaryActions)
      .where(eq(disciplinaryActions.employeeId, employeeId))
      .orderBy(desc(disciplinaryActions.issuedDate))
      .limit(5);

    const recentCommendations = await db
      .select()
      .from(commendations)
      .where(eq(commendations.employeeId, employeeId))
      .orderBy(desc(commendations.issuedDate))
      .limit(5);

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      parseInt(actionStats.totalActions.toString()),
      parseInt(actionStats.activeActions.toString()),
      actionStats.lastActionDate as Date
    );

    return {
      employeeId,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        middleName: employee.middleName,
        position: employee.position,
        department: employee.department,
      },
      summary: {
        totalActions: parseInt(actionStats.totalActions.toString()),
        activeActions: parseInt(actionStats.activeActions.toString()),
        totalCommendations: parseInt(commendationStats.totalCommendations.toString()),
        lastActionDate: actionStats.lastActionDate as Date,
        lastCommendationDate: commendationStats.lastCommendationDate as Date,
      },
      recentActions,
      recentCommendations,
      riskLevel,
    };
  }

  // Helper methods

  private async getUserPermissions(userId: string): Promise<DisciplinaryPermissions> {
    // Get user's current position and organization
    const [userInfo] = await db
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

    if (!userInfo?.position) {
      return {
        canIssueActions: false,
        canIssueCommendations: false,
        canReviewAppeals: false,
        canViewConfidential: false,
        canManageAllActions: false,
        managedUserIds: [],
        managedOrganizationIds: [],
      };
    }

    const position = userInfo.position;
    const organization = userInfo.organization;

    // Get managed users and organizations
    const managedUserIds = await this.getManagedUserIds(userId);
    const managedOrganizationIds = await this.getManagedOrganizationIds(userId);

    return {
      canIssueActions: position.canIssueDisciplinaryActions || false,
      canIssueCommendations: position.canIssueDisciplinaryActions || false,
      canReviewAppeals: position.canManageSubordinates || false,
      canViewConfidential: position.isManagerial || false,
      canManageAllActions: position.id === 'admin' || position.id === 'super_admin',
      managedUserIds,
      managedOrganizationIds,
    };
  }

  private async getActionPermissions(actionId: string, userId: string) {
    const [action] = await db
      .select()
      .from(disciplinaryActions)
      .where(eq(disciplinaryActions.id, actionId))
      .limit(1);

    if (!action) {
      return {
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canAppeal: false,
      };
    }

    const permissions = await this.getUserPermissions(userId);

    return {
      canEdit: action.issuedBy === userId || permissions.canManageAllActions,
      canDelete: action.issuedBy === userId || permissions.canManageAllActions,
      canApprove: permissions.canManageAllActions,
      canAppeal: action.employeeId === userId && action.status === 'active' && 
                (!action.appealDeadline || new Date() <= action.appealDeadline),
    };
  }

  private async getCommendationPermissions(commendationId: string, userId: string) {
    const [commendation] = await db
      .select()
      .from(commendations)
      .where(eq(commendations.id, commendationId))
      .limit(1);

    if (!commendation) {
      return {
        canEdit: false,
        canDelete: false,
        canApprove: false,
      };
    }

    const permissions = await this.getUserPermissions(userId);

    return {
      canEdit: commendation.issuedBy === userId || permissions.canManageAllActions,
      canDelete: commendation.issuedBy === userId || permissions.canManageAllActions,
      canApprove: permissions.canManageAllActions,
    };
  }

  private async canIssueActionToEmployee(issuerId: string, employeeId: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(issuerId);
    
    if (permissions.canManageAllActions) {
      return true;
    }

    // Check if employee is in managed users
    return permissions.managedUserIds.includes(employeeId);
  }

  private async getManagedUserIds(userId: string): Promise<string[]> {
    // Implementation would be similar to the hierarchy service
    // Get all subordinates based on organizational hierarchy
    return [];
  }

  private async getManagedOrganizationIds(userId: string): Promise<string[]> {
    // Implementation would be similar to the hierarchy service
    // Get all organizations user manages
    return [];
  }

  private async getAppealInfo(actionId: string) {
    const [appeal] = await db
      .select()
      .from(disciplinaryAppeals)
      .where(eq(disciplinaryAppeals.disciplinaryActionId, actionId))
      .limit(1);

    if (!appeal) return undefined;

    return {
      appealId: appeal.id,
      status: appeal.status,
      submittedDate: appeal.submittedDate,
      deadlineDate: appeal.deadlineDate,
    };
  }

  private async logStatusChange(
    actionId: string,
    changedBy: string,
    fromStatus: DisciplinaryStatus | null,
    toStatus: DisciplinaryStatus,
    reason?: string
  ): Promise<void> {
    await db.insert(disciplinaryStatusHistory).values({
      disciplinaryActionId: actionId,
      fromStatus,
      toStatus,
      changedBy,
      reason,
      changeDate: new Date(),
    });
  }

  private async scheduleNotification(
    actionId: string,
    type: 'action_issued' | 'action_executed' | 'commendation_issued',
    entityType: 'action' | 'commendation' = 'action'
  ): Promise<void> {
    // Implementation would schedule notifications via notification service
    // This is a placeholder for the notification scheduling logic
  }

  private calculateRiskLevel(
    totalActions: number,
    activeActions: number,
    lastActionDate?: Date
  ): 'low' | 'medium' | 'high' {
    if (totalActions === 0) return 'low';
    
    if (activeActions >= 3 || totalActions >= 5) return 'high';
    
    if (lastActionDate && new Date().getTime() - lastActionDate.getTime() < 6 * 30 * 24 * 60 * 60 * 1000) {
      return 'medium';
    }
    
    return totalActions >= 2 ? 'medium' : 'low';
  }
}

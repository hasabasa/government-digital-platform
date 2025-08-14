import { eq, and, or, like, sql, isNull, desc, asc } from 'drizzle-orm';
import { db } from '@gov-platform/database';
import { 
  governmentStructure, 
  positions, 
  appointments, 
  delegations,
  users,
  channels,
  channelSubscriptions,
  type GovernmentStructure,
  type Position,
  type Appointment,
  type InsertGovernmentStructure,
  type InsertPosition,
  type InsertAppointment
} from '@gov-platform/database/schema';
import axios from 'axios';
import { ChannelAutomationService } from './channel-automation.service';
import { RoleAssignmentService } from './role-assignment.service';
import {
  CreateGovernmentStructureRequest,
  UpdateGovernmentStructureRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  CreateAppointmentRequest,
  HierarchyTreeNode,
  UserHierarchyInfo,
  OrganizationType,
  HierarchyLevel,
  PositionType,
  CivilServiceCategory
} from '@gov-platform/types';

export interface GovernmentStructureFilters {
  level?: string;
  type?: string;
  parentId?: string;
}

export interface PositionFilters {
  organizationId?: string;
  type?: string;
  category?: string;
  isManagerial?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SubordinatesOptions {
  directOnly?: boolean;
  includeIndirect?: boolean;
}

export interface OrganizationEmployeesOptions extends PaginationOptions {
  includeSuborganizations?: boolean;
}

export class HierarchyService {
  private channelAutomationService: ChannelAutomationService;
  private roleAssignmentService: RoleAssignmentService;

  constructor() {
    this.channelAutomationService = new ChannelAutomationService();
    this.roleAssignmentService = new RoleAssignmentService();
  }
  
  // Government Structure Methods
  async getGovernmentStructure(filters: GovernmentStructureFilters = {}): Promise<GovernmentStructure[]> {
    const query = db.select().from(governmentStructure);
    
    const conditions = [];
    
    if (filters.level) {
      conditions.push(eq(governmentStructure.level, filters.level as HierarchyLevel));
    }
    
    if (filters.type) {
      conditions.push(eq(governmentStructure.type, filters.type as OrganizationType));
    }
    
    if (filters.parentId) {
      conditions.push(eq(governmentStructure.parentId, filters.parentId));
    } else if (filters.parentId === null) {
      conditions.push(isNull(governmentStructure.parentId));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query
      .where(eq(governmentStructure.isActive, true))
      .orderBy(asc(governmentStructure.orderIndex), asc(governmentStructure.name));
  }

  async getGovernmentStructureTree(rootId?: string, maxDepth?: number): Promise<HierarchyTreeNode[]> {
    // Recursive CTE to build the tree
    const treeQuery = sql`
      WITH RECURSIVE org_tree AS (
        -- Base case: root organizations
        SELECT 
          id, name, type, level, parent_id, path, head_user_id,
          0 as depth,
          ARRAY[order_index] as sort_path
        FROM government_structure 
        WHERE ${rootId ? sql`id = ${rootId}` : sql`parent_id IS NULL`}
          AND is_active = true
        
        UNION ALL
        
        -- Recursive case: children
        SELECT 
          gs.id, gs.name, gs.type, gs.level, gs.parent_id, gs.path, gs.head_user_id,
          ot.depth + 1,
          ot.sort_path || gs.order_index
        FROM government_structure gs
        JOIN org_tree ot ON gs.parent_id = ot.id
        WHERE gs.is_active = true 
          ${maxDepth ? sql`AND ot.depth < ${maxDepth}` : sql``}
      )
      SELECT 
        ot.*,
        u.first_name,
        u.last_name,
        p.title as head_position,
        (
          SELECT COUNT(*)
          FROM appointments a 
          JOIN positions pos ON a.position_id = pos.id
          WHERE pos.organization_id = ot.id 
            AND a.is_current = true
        ) as employee_count
      FROM org_tree ot
      LEFT JOIN users u ON ot.head_user_id = u.id
      LEFT JOIN appointments a ON a.user_id = u.id AND a.is_current = true
      LEFT JOIN positions p ON a.position_id = p.id
      ORDER BY sort_path
    `;
    
    const result = await db.execute(treeQuery);
    return this.buildHierarchyTree(result.rows as any[]);
  }

  private buildHierarchyTree(flatData: any[]): HierarchyTreeNode[] {
    const nodeMap = new Map<string, HierarchyTreeNode>();
    const rootNodes: HierarchyTreeNode[] = [];

    // Create all nodes
    flatData.forEach(row => {
      const node: HierarchyTreeNode = {
        id: row.id,
        name: row.name,
        type: row.type,
        level: row.level,
        children: [],
        employeeCount: parseInt(row.employee_count) || 0,
        isActive: true,
        headUser: row.first_name ? {
          id: row.head_user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          position: row.head_position,
        } : undefined,
      };
      nodeMap.set(row.id, node);
    });

    // Build the tree structure
    flatData.forEach(row => {
      const node = nodeMap.get(row.id)!;
      if (row.parent_id && nodeMap.has(row.parent_id)) {
        const parent = nodeMap.get(row.parent_id)!;
        parent.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  async createGovernmentStructure(data: CreateGovernmentStructureRequest): Promise<GovernmentStructure> {
    const insertData: InsertGovernmentStructure = {
      ...data,
      orderIndex: data.orderIndex || 0,
    };

    const [created] = await db.insert(governmentStructure).values(insertData).returning();

    // Автоматически создать канал для новой организации
    try {
      const channelResult = await this.channelAutomationService.createOrganizationChannel(
        created.id,
        data.createdBy || 'system' // fallback если createdBy не передан
      );
      
      if (channelResult.success) {
        console.log(`Auto-created channel for organization ${created.name}:`, {
          channelId: channelResult.channelId,
          subscribersAdded: channelResult.subscribersAdded,
        });
      } else {
        console.warn(`Failed to auto-create channel for organization ${created.name}:`, channelResult.error);
      }
    } catch (error) {
      // Не прерываем создание организации из-за ошибки канала
      console.error('Channel auto-creation failed:', error);
    }

    return created;
  }

  async updateGovernmentStructure(id: string, data: UpdateGovernmentStructureRequest): Promise<GovernmentStructure> {
    const [updated] = await db
      .update(governmentStructure)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(governmentStructure.id, id))
      .returning();
    
    if (!updated) {
      throw new Error('Government structure not found');
    }
    
    return updated;
  }

  async deleteGovernmentStructure(id: string, force: boolean = false): Promise<void> {
    // Check if has children
    const children = await db
      .select()
      .from(governmentStructure)
      .where(eq(governmentStructure.parentId, id));
    
    if (children.length > 0 && !force) {
      throw new Error('Cannot delete organization with children. Use force=true to delete recursively.');
    }
    
    if (force) {
      // Recursively delete children first
      for (const child of children) {
        await this.deleteGovernmentStructure(child.id, true);
      }
    }
    
    // Soft delete by setting isActive to false
    await db
      .update(governmentStructure)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(governmentStructure.id, id));
  }

  // Position Methods
  async getPositions(
    filters: PositionFilters = {}, 
    pagination: PaginationOptions
  ): Promise<{ positions: Position[]; total: number }> {
    const conditions = [eq(positions.isActive, true)];
    
    if (filters.organizationId) {
      conditions.push(eq(positions.organizationId, filters.organizationId));
    }
    
    if (filters.type) {
      conditions.push(eq(positions.type, filters.type as PositionType));
    }
    
    if (filters.category) {
      conditions.push(eq(positions.category, filters.category as CivilServiceCategory));
    }
    
    if (filters.isManagerial !== undefined) {
      conditions.push(eq(positions.isManagerial, filters.isManagerial));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(positions)
      .where(and(...conditions));

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const positionsResult = await db
      .select()
      .from(positions)
      .where(and(...conditions))
      .orderBy(asc(positions.title))
      .limit(pagination.limit)
      .offset(offset);

    return {
      positions: positionsResult,
      total: parseInt(count.toString()),
    };
  }

  async getPositionById(id: string): Promise<Position | null> {
    const [position] = await db
      .select()
      .from(positions)
      .where(and(eq(positions.id, id), eq(positions.isActive, true)));
    
    return position || null;
  }

  async createPosition(data: CreatePositionRequest): Promise<Position> {
    const insertData: InsertPosition = {
      ...data,
      canManageSubordinates: data.canManageSubordinates || false,
      canAssignTasks: data.canAssignTasks || false,
      canIssueDisciplinaryActions: data.canIssueDisciplinaryActions || false,
      isManagerial: data.isManagerial || false,
    };

    const [created] = await db.insert(positions).values(insertData).returning();
    return created;
  }

  async updatePosition(id: string, data: UpdatePositionRequest): Promise<Position> {
    const [updated] = await db
      .update(positions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    
    if (!updated) {
      throw new Error('Position not found');
    }
    
    return updated;
  }

  // Appointment Methods
  async getUserAppointments(userId: string, currentOnly: boolean = true): Promise<Appointment[]> {
    const conditions = [eq(appointments.userId, userId)];
    
    if (currentOnly) {
      conditions.push(eq(appointments.isCurrent, true));
    }

    return db
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(desc(appointments.appointmentDate));
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    // Получить текущее назначение для синхронизации каналов
    const [currentAppointment] = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.userId, data.userId),
        eq(appointments.isCurrent, true)
      ))
      .limit(1);

    // First, set any existing current appointments for this user to false
    await db
      .update(appointments)
      .set({ isCurrent: false, updatedAt: new Date() })
      .where(and(
        eq(appointments.userId, data.userId),
        eq(appointments.isCurrent, true)
      ));

    const insertData: InsertAppointment = {
      ...data,
      isCurrent: true,
    };

    const [created] = await db.insert(appointments).values(insertData).returning();

    // Синхронизировать членство в каналах при смене организации
    try {
      await this.channelAutomationService.syncChannelMembershipOnAppointmentChange(
        data.userId,
        currentAppointment?.organizationId,
        data.organizationId
      );
    } catch (error) {
      console.error('Failed to sync channel membership on appointment:', error);
    }

    // Автоматически назначить роль на основе новой должности
    try {
      const newRole = await this.roleAssignmentService.assignRoleBasedOnPosition(data.userId);
      console.log(`Auto-assigned role ${newRole} to user ${data.userId} based on appointment`);
    } catch (error) {
      console.error('Failed to auto-assign role on appointment:', error);
    }

    return created;
  }

  async dismissFromPosition(
    appointmentId: string, 
    dismissalData: {
      dismissalReason?: string;
      dismissalOrder?: string;
      dismissalDate: Date;
    }
  ): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({ 
        ...dismissalData,
        isCurrent: false,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();
    
    if (!updated) {
      throw new Error('Appointment not found');
    }

    // Обновить роль пользователя после увольнения
    try {
      const newRole = await this.roleAssignmentService.assignRoleBasedOnPosition(updated.userId);
      console.log(`Updated role to ${newRole} for user ${updated.userId} after dismissal`);
    } catch (error) {
      console.error('Failed to update role after dismissal:', error);
    }
    
    return updated;
  }

  // User Hierarchy Info Methods
  async getUserHierarchyInfo(userId: string): Promise<UserHierarchyInfo> {
    // Get current appointment
    const [currentAppointment] = await db
      .select({
        appointment: appointments,
        position: positions,
        organization: governmentStructure,
      })
      .from(appointments)
      .leftJoin(positions, eq(appointments.positionId, positions.id))
      .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.isCurrent, true)
      ));

    if (!currentAppointment) {
      throw new Error('User has no current appointment');
    }

    // Get organization path
    const orgPath = await this.getOrganizationPath(currentAppointment.organization!.id);
    
    // Get direct supervisor
    const supervisor = await this.getDirectSupervisor(userId);
    
    // Get direct subordinates
    const subordinates = await this.getUserSubordinates(userId, { directOnly: true });

    // Calculate permissions
    const permissions = {
      canManageSubordinates: currentAppointment.position!.canManageSubordinates,
      canAssignTasks: currentAppointment.position!.canAssignTasks,
      canIssueDisciplinaryActions: currentAppointment.position!.canIssueDisciplinaryActions,
      canCreateChannels: currentAppointment.position!.isManagerial,
      canInitiateGroupCalls: currentAppointment.position!.isManagerial,
    };

    return {
      currentPosition: currentAppointment.position!,
      currentOrganization: currentAppointment.organization!,
      directSupervisor: supervisor,
      directSubordinates: subordinates,
      organizationPath: orgPath,
      permissions,
    };
  }

  async getUserSubordinates(
    userId: string, 
    options: SubordinatesOptions = { directOnly: true }
  ): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  }>> {
    const query = sql`
      WITH user_subordinates AS (
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          p.title as position_title,
          p.reports_to_position_id,
          current_pos.id as current_user_position_id
        FROM users u
        JOIN appointments a ON u.id = a.user_id AND a.is_current = true
        JOIN positions p ON a.position_id = p.id
        JOIN appointments current_a ON current_a.user_id = ${userId} AND current_a.is_current = true
        JOIN positions current_pos ON current_a.position_id = current_pos.id
        WHERE ${
          options.directOnly 
            ? sql`p.reports_to_position_id = current_pos.id`
            : sql`p.reports_to_position_id = current_pos.id OR 
                  p.id IN (
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
                  )`
        }
      )
      SELECT * FROM user_subordinates
      ORDER BY position_title, first_name, last_name
    `;

    const result = await db.execute(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      position: row.position_title,
    }));
  }

  async getDirectSupervisor(userId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  } | undefined> {
    const query = sql`
      SELECT 
        supervisor_u.id,
        supervisor_u.first_name,
        supervisor_u.last_name,
        supervisor_p.title as position_title
      FROM users u
      JOIN appointments a ON u.id = a.user_id AND a.is_current = true
      JOIN positions p ON a.position_id = p.id
      JOIN positions supervisor_p ON p.reports_to_position_id = supervisor_p.id
      JOIN appointments supervisor_a ON supervisor_p.id = supervisor_a.position_id AND supervisor_a.is_current = true
      JOIN users supervisor_u ON supervisor_a.user_id = supervisor_u.id
      WHERE u.id = ${userId}
    `;

    const result = await db.execute(query);
    const row = result.rows[0] as any;
    
    if (!row) return undefined;

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      position: row.position_title,
    };
  }

  private async getOrganizationPath(organizationId: string): Promise<Array<{
    id: string;
    name: string;
    type: OrganizationType;
  }>> {
    const query = sql`
      WITH RECURSIVE org_path AS (
        SELECT id, name, type, parent_id, 0 as level
        FROM government_structure
        WHERE id = ${organizationId}
        
        UNION ALL
        
        SELECT gs.id, gs.name, gs.type, gs.parent_id, op.level + 1
        FROM government_structure gs
        JOIN org_path op ON gs.id = op.parent_id
      )
      SELECT id, name, type
      FROM org_path
      ORDER BY level DESC
    `;

    const result = await db.execute(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
    }));
  }

  async getOrganizationEmployees(
    organizationId: string,
    options: OrganizationEmployeesOptions
  ): Promise<{
    employees: Array<{
      id: string;
      firstName: string;
      lastName: string;
      position: string;
      organization: string;
      isActive: boolean;
    }>;
    total: number;
  }> {
    const orgCondition = options.includeSuborganizations
      ? sql`gs.path LIKE (SELECT path || '%' FROM government_structure WHERE id = ${organizationId})`
      : sql`gs.id = ${organizationId}`;

    const countQuery = sql`
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN appointments a ON u.id = a.user_id AND a.is_current = true
      JOIN positions p ON a.position_id = p.id
      JOIN government_structure gs ON p.organization_id = gs.id
      WHERE ${orgCondition}
    `;

    const [{ total }] = await db.execute(countQuery) as any;

    const offset = (options.page - 1) * options.limit;
    const employeesQuery = sql`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        p.title as position_title,
        gs.name as organization_name,
        u.status = 'active' as is_active
      FROM users u
      JOIN appointments a ON u.id = a.user_id AND a.is_current = true
      JOIN positions p ON a.position_id = p.id
      JOIN government_structure gs ON p.organization_id = gs.id
      WHERE ${orgCondition}
      ORDER BY gs.path, p.title, u.last_name, u.first_name
      LIMIT ${options.limit} OFFSET ${offset}
    `;

    const result = await db.execute(employeesQuery);
    
    return {
      employees: result.rows.map((row: any) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position_title,
        organization: row.organization_name,
        isActive: row.is_active,
      })),
      total: parseInt(total.toString()),
    };
  }

  // Channel Management Methods
  async createOrganizationChannel(organizationId: string, createdByUserId: string) {
    return this.channelAutomationService.createOrganizationChannel(organizationId, createdByUserId);
  }

  async syncOrganizationChannelMembership(channelId: string, organizationId: string) {
    return this.channelAutomationService.addOrganizationMembersToChannel(channelId, organizationId);
  }
}

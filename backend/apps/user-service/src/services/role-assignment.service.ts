import { db } from '@gov-platform/database';
import { 
  users, 
  appointments, 
  governmentStructure,
  User,
  Appointment,
  GovernmentStructure 
} from '@gov-platform/database/schema';
import { eq, and, isNull } from 'drizzle-orm';

export type SystemRole = 
  | 'super_admin'           // Системный администратор
  | 'government_head'       // Глава государства / Президент
  | 'prime_minister'        // Премьер-министр
  | 'deputy_prime_minister' // Вице-премьер
  | 'minister'              // Министр
  | 'deputy_minister'       // Заместитель министра
  | 'committee_head'        // Председатель комитета
  | 'department_head'       // Руководитель департамента
  | 'division_head'         // Начальник отдела
  | 'senior_specialist'     // Главный специалист
  | 'specialist'            // Специалист
  | 'government_official'   // Государственный служащий
  | 'guest';                // Гость

export interface RolePermissions {
  // Системные права
  canManageUsers: boolean;
  canManageSystem: boolean;
  canViewAllData: boolean;
  
  // Иерархические права
  canManageSubordinates: boolean;
  canAssignTasks: boolean;
  canIssueDisciplinaryActions: boolean;
  canGiveCommendations: boolean;
  canApproveDocuments: boolean;
  
  // Коммуникационные права
  canInitiateCalls: boolean;
  canCreateChannels: boolean;
  canManageGroups: boolean;
  canModerateCommunication: boolean;
  
  // Уровни доступа
  hierarchyLevel: number;        // 1 = высший, 10 = низший
  canAccessLevel: number[];      // К каким уровням есть доступ
  organizationScope: string[];   // К каким организациям есть доступ
}

const ROLE_HIERARCHY: Record<SystemRole, RolePermissions> = {
  super_admin: {
    canManageUsers: true,
    canManageSystem: true,
    canViewAllData: true,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: true,
    canManageGroups: true,
    canModerateCommunication: true,
    hierarchyLevel: 0,
    canAccessLevel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    organizationScope: ['*']
  },
  
  government_head: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: true,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: true,
    canManageGroups: true,
    canModerateCommunication: true,
    hierarchyLevel: 1,
    canAccessLevel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    organizationScope: ['*']
  },
  
  prime_minister: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: true,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: true,
    canManageGroups: true,
    canModerateCommunication: true,
    hierarchyLevel: 2,
    canAccessLevel: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    organizationScope: ['*']
  },
  
  deputy_prime_minister: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: true,
    canManageGroups: true,
    canModerateCommunication: true,
    hierarchyLevel: 3,
    canAccessLevel: [3, 4, 5, 6, 7, 8, 9, 10],
    organizationScope: []
  },
  
  minister: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: true,
    canManageGroups: true,
    canModerateCommunication: true,
    hierarchyLevel: 4,
    canAccessLevel: [4, 5, 6, 7, 8, 9, 10],
    organizationScope: []
  },
  
  deputy_minister: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: false,
    canManageGroups: true,
    canModerateCommunication: false,
    hierarchyLevel: 5,
    canAccessLevel: [5, 6, 7, 8, 9, 10],
    organizationScope: []
  },
  
  committee_head: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: true,
    canInitiateCalls: true,
    canCreateChannels: false,
    canManageGroups: true,
    canModerateCommunication: false,
    hierarchyLevel: 5,
    canAccessLevel: [5, 6, 7, 8, 9, 10],
    organizationScope: []
  },
  
  department_head: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: true,
    canGiveCommendations: true,
    canApproveDocuments: false,
    canInitiateCalls: true,
    canCreateChannels: false,
    canManageGroups: true,
    canModerateCommunication: false,
    hierarchyLevel: 6,
    canAccessLevel: [6, 7, 8, 9, 10],
    organizationScope: []
  },
  
  division_head: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: false,
    canGiveCommendations: true,
    canApproveDocuments: false,
    canInitiateCalls: true,
    canCreateChannels: false,
    canManageGroups: false,
    canModerateCommunication: false,
    hierarchyLevel: 7,
    canAccessLevel: [7, 8, 9, 10],
    organizationScope: []
  },
  
  senior_specialist: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: true,
    canAssignTasks: true,
    canIssueDisciplinaryActions: false,
    canGiveCommendations: false,
    canApproveDocuments: false,
    canInitiateCalls: false,
    canCreateChannels: false,
    canManageGroups: false,
    canModerateCommunication: false,
    hierarchyLevel: 8,
    canAccessLevel: [8, 9, 10],
    organizationScope: []
  },
  
  specialist: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: false,
    canAssignTasks: false,
    canIssueDisciplinaryActions: false,
    canGiveCommendations: false,
    canApproveDocuments: false,
    canInitiateCalls: false,
    canCreateChannels: false,
    canManageGroups: false,
    canModerateCommunication: false,
    hierarchyLevel: 9,
    canAccessLevel: [9, 10],
    organizationScope: []
  },
  
  government_official: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: false,
    canAssignTasks: false,
    canIssueDisciplinaryActions: false,
    canGiveCommendations: false,
    canApproveDocuments: false,
    canInitiateCalls: false,
    canCreateChannels: false,
    canManageGroups: false,
    canModerateCommunication: false,
    hierarchyLevel: 10,
    canAccessLevel: [10],
    organizationScope: []
  },
  
  guest: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAllData: false,
    canManageSubordinates: false,
    canAssignTasks: false,
    canIssueDisciplinaryActions: false,
    canGiveCommendations: false,
    canApproveDocuments: false,
    canInitiateCalls: false,
    canCreateChannels: false,
    canManageGroups: false,
    canModerateCommunication: false,
    hierarchyLevel: 11,
    canAccessLevel: [],
    organizationScope: []
  }
};

export class RoleAssignmentService {
  /**
   * Автоматически назначает роль пользователю на основе его назначения в иерархии
   */
  async assignRoleBasedOnPosition(userId: string): Promise<SystemRole> {
    try {
      // Получаем текущее назначение пользователя
      const currentAppointment = await db
        .select({
          appointment: appointments,
          organization: governmentStructure,
          user: users
        })
        .from(appointments)
        .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
        .leftJoin(users, eq(appointments.userId, users.id))
        .where(
          and(
            eq(appointments.userId, userId),
            isNull(appointments.endDate)
          )
        )
        .limit(1);

      if (!currentAppointment.length) {
        // Нет активного назначения - назначаем роль гостя
        await this.updateUserRole(userId, 'guest');
        return 'guest';
      }

      const appointment = currentAppointment[0];
      const role = this.determineRoleFromPosition(
        appointment.appointment.position,
        appointment.organization?.type || 'department',
        appointment.organization?.level || 6
      );

      // Обновляем роль пользователя
      await this.updateUserRole(userId, role);

      // Логируем изменение роли
      console.log(`Role assigned: User ${userId} assigned role ${role} based on position ${appointment.appointment.position}`);

      return role;
    } catch (error) {
      console.error('Error in assignRoleBasedOnPosition:', error);
      // В случае ошибки назначаем базовую роль
      await this.updateUserRole(userId, 'government_official');
      return 'government_official';
    }
  }

  /**
   * Определяет роль на основе должности и типа организации
   */
  private determineRoleFromPosition(
    position: string, 
    organizationType: string, 
    organizationLevel: number
  ): SystemRole {
    const normalizedPosition = position.toLowerCase();

    // Системные роли
    if (normalizedPosition.includes('системный администратор') || 
        normalizedPosition.includes('system admin')) {
      return 'super_admin';
    }

    // Высшие государственные должности
    if (normalizedPosition.includes('президент') || 
        normalizedPosition.includes('глава государства')) {
      return 'government_head';
    }

    if (normalizedPosition.includes('премьер-министр')) {
      return 'prime_minister';
    }

    if (normalizedPosition.includes('вице-премьер') || 
        normalizedPosition.includes('заместитель премьер-министра')) {
      return 'deputy_prime_minister';
    }

    // Министерские должности
    if (normalizedPosition.includes('министр') && !normalizedPosition.includes('заместитель')) {
      return 'minister';
    }

    if (normalizedPosition.includes('заместитель министра') || 
        normalizedPosition.includes('вице-министр')) {
      return 'deputy_minister';
    }

    // Комитеты и департаменты
    if (normalizedPosition.includes('председатель') && organizationType === 'committee') {
      return 'committee_head';
    }

    if ((normalizedPosition.includes('руководитель') || 
         normalizedPosition.includes('директор') ||
         normalizedPosition.includes('начальник')) && 
         organizationType === 'department') {
      return 'department_head';
    }

    // Отделы и управления
    if ((normalizedPosition.includes('начальник') || 
         normalizedPosition.includes('руководитель')) && 
         (organizationType === 'division' || organizationLevel >= 7)) {
      return 'division_head';
    }

    // Специалисты
    if (normalizedPosition.includes('главный специалист') || 
        normalizedPosition.includes('ведущий специалист') ||
        normalizedPosition.includes('старший специалист')) {
      return 'senior_specialist';
    }

    if (normalizedPosition.includes('специалист')) {
      return 'specialist';
    }

    // По умолчанию - государственный служащий
    return 'government_official';
  }

  /**
   * Обновляет роль пользователя в базе данных
   */
  private async updateUserRole(userId: string, role: SystemRole): Promise<void> {
    await db
      .update(users)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Получает права доступа для роли
   */
  getRolePermissions(role: SystemRole): RolePermissions {
    return ROLE_HIERARCHY[role] || ROLE_HIERARCHY.government_official;
  }

  /**
   * Проверяет, может ли пользователь выполнить действие
   */
  async canUserPerformAction(
    userId: string, 
    action: keyof RolePermissions,
    targetUserId?: string,
    targetOrganizationId?: string
  ): Promise<boolean> {
    try {
      // Получаем информацию о пользователе
      const userInfo = await db
        .select({
          user: users,
          appointment: appointments,
          organization: governmentStructure
        })
        .from(users)
        .leftJoin(appointments, and(
          eq(appointments.userId, users.id),
          isNull(appointments.endDate)
        ))
        .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (!userInfo.length) {
        return false;
      }

      const user = userInfo[0];
      const userRole = (user.user.role as SystemRole) || 'government_official';
      const permissions = this.getRolePermissions(userRole);

      // Базовая проверка права
      const hasBasePermission = permissions[action] as boolean;
      if (!hasBasePermission) {
        return false;
      }

      // Дополнительные проверки для иерархических действий
      if (targetUserId && this.isHierarchicalAction(action)) {
        return await this.canManageUser(userId, targetUserId);
      }

      if (targetOrganizationId && this.isOrganizationalAction(action)) {
        return await this.canAccessOrganization(userId, targetOrganizationId);
      }

      return true;
    } catch (error) {
      console.error('Error in canUserPerformAction:', error);
      return false;
    }
  }

  /**
   * Проверяет, может ли пользователь управлять другим пользователем
   */
  private async canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    // Получаем иерархические позиции обоих пользователей
    const [managerInfo, targetInfo] = await Promise.all([
      this.getUserHierarchyInfo(managerId),
      this.getUserHierarchyInfo(targetUserId)
    ]);

    if (!managerInfo || !targetInfo) {
      return false;
    }

    // Руководитель должен быть выше по иерархии
    return managerInfo.hierarchyLevel < targetInfo.hierarchyLevel;
  }

  /**
   * Проверяет доступ к организации
   */
  private async canAccessOrganization(userId: string, organizationId: string): Promise<boolean> {
    const userInfo = await this.getUserHierarchyInfo(userId);
    if (!userInfo) {
      return false;
    }

    // Суперадмин и высшие роли имеют доступ ко всем организациям
    if (userInfo.permissions.organizationScope.includes('*')) {
      return true;
    }

    // Проверяем, есть ли организация в области доступа пользователя
    return userInfo.permissions.organizationScope.includes(organizationId);
  }

  /**
   * Получает информацию об иерархической позиции пользователя
   */
  private async getUserHierarchyInfo(userId: string) {
    const userInfo = await db
      .select({
        user: users,
        appointment: appointments,
        organization: governmentStructure
      })
      .from(users)
      .leftJoin(appointments, and(
        eq(appointments.userId, users.id),
        isNull(appointments.endDate)
      ))
      .leftJoin(governmentStructure, eq(appointments.organizationId, governmentStructure.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo.length) {
      return null;
    }

    const user = userInfo[0];
    const userRole = (user.user.role as SystemRole) || 'government_official';
    const permissions = this.getRolePermissions(userRole);

    return {
      userId,
      role: userRole,
      permissions,
      hierarchyLevel: permissions.hierarchyLevel,
      organizationId: user.organization?.id,
      organizationLevel: user.organization?.level || 10
    };
  }

  /**
   * Проверяет, является ли действие иерархическим
   */
  private isHierarchicalAction(action: keyof RolePermissions): boolean {
    const hierarchicalActions: (keyof RolePermissions)[] = [
      'canManageSubordinates',
      'canAssignTasks',
      'canIssueDisciplinaryActions',
      'canGiveCommendations'
    ];
    return hierarchicalActions.includes(action);
  }

  /**
   * Проверяет, является ли действие организационным
   */
  private isOrganizationalAction(action: keyof RolePermissions): boolean {
    const organizationalActions: (keyof RolePermissions)[] = [
      'canCreateChannels',
      'canManageGroups',
      'canModerateCommunication'
    ];
    return organizationalActions.includes(action);
  }

  /**
   * Переназначает роли для всех пользователей системы
   */
  async reassignAllUserRoles(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Получаем всех пользователей с активными назначениями
      const allUsers = await db
        .select({ id: users.id })
        .from(users);

      for (const user of allUsers) {
        try {
          await this.assignRoleBasedOnPosition(user.id);
          updated++;
        } catch (error) {
          console.error(`Failed to update role for user ${user.id}:`, error);
          errors++;
        }
      }

      console.log(`Role reassignment completed: ${updated} updated, ${errors} errors`);
      return { updated, errors };
    } catch (error) {
      console.error('Error in reassignAllUserRoles:', error);
      return { updated, errors: allUsers?.length || 0 };
    }
  }
}

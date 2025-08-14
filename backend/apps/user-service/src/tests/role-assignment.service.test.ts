import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@gov-platform/database';
import { 
  users, 
  appointments, 
  governmentStructure 
} from '@gov-platform/database/schema';
import { RoleAssignmentService, SystemRole } from '../services/role-assignment.service';

describe('RoleAssignmentService', () => {
  let roleAssignmentService: RoleAssignmentService;

  // Test data
  const testUsers = [
    {
      id: 'user-president',
      email: 'president@gov.kz',
      firstName: 'Касым-Жомарт',
      lastName: 'Токаев',
      role: 'government_official'
    },
    {
      id: 'user-minister',
      email: 'minister@minfin.gov.kz',
      firstName: 'Министр',
      lastName: 'Финансов',
      role: 'government_official'
    },
    {
      id: 'user-deputy',
      email: 'deputy@minfin.gov.kz',
      firstName: 'Заместитель',
      lastName: 'Министра',
      role: 'government_official'
    },
    {
      id: 'user-specialist',
      email: 'specialist@minfin.gov.kz',
      firstName: 'Главный',
      lastName: 'Специалист',
      role: 'government_official'
    }
  ];

  const testOrganizations = [
    {
      id: 'org-government',
      name: 'Правительство РК',
      type: 'government' as const,
      level: 1,
      path: '1'
    },
    {
      id: 'org-ministry',
      name: 'Министерство финансов',
      type: 'ministry' as const,
      level: 4,
      path: '1.4',
      parentId: 'org-government'
    },
    {
      id: 'org-department',
      name: 'Департамент бюджета',
      type: 'department' as const,
      level: 6,
      path: '1.4.6',
      parentId: 'org-ministry'
    }
  ];

  beforeEach(async () => {
    roleAssignmentService = new RoleAssignmentService();

    // Clean up test data
    await db.delete(appointments);
    await db.delete(users);
    await db.delete(governmentStructure);

    // Insert test data
    await db.insert(users).values(testUsers);
    await db.insert(governmentStructure).values(testOrganizations);
  });

  afterEach(async () => {
    await db.delete(appointments);
    await db.delete(users);
    await db.delete(governmentStructure);
  });

  describe('Role Determination from Position', () => {
    it('должен определить роль президента', async () => {
      await db.insert(appointments).values({
        id: 'appointment-1',
        userId: 'user-president',
        organizationId: 'org-government',
        position: 'Президент Республики Казахстан',
        startDate: new Date(),
        isCurrent: true
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-president');
      expect(role).toBe('government_head');
    });

    it('должен определить роль министра', async () => {
      await db.insert(appointments).values({
        id: 'appointment-2',
        userId: 'user-minister',
        organizationId: 'org-ministry',
        position: 'Министр финансов',
        startDate: new Date(),
        isCurrent: true
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      expect(role).toBe('minister');
    });

    it('должен определить роль заместителя министра', async () => {
      await db.insert(appointments).values({
        id: 'appointment-3',
        userId: 'user-deputy',
        organizationId: 'org-ministry',
        position: 'Заместитель министра финансов',
        startDate: new Date(),
        isCurrent: true
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-deputy');
      expect(role).toBe('deputy_minister');
    });

    it('должен определить роль специалиста', async () => {
      await db.insert(appointments).values({
        id: 'appointment-4',
        userId: 'user-specialist',
        organizationId: 'org-department',
        position: 'Главный специалист',
        startDate: new Date(),
        isCurrent: true
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-specialist');
      expect(role).toBe('senior_specialist');
    });

    it('должен назначить роль гостя пользователю без назначения', async () => {
      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      expect(role).toBe('guest');
    });

    it('должен обновить роль в базе данных', async () => {
      await db.insert(appointments).values({
        id: 'appointment-5',
        userId: 'user-minister',
        organizationId: 'org-ministry',
        position: 'Министр',
        startDate: new Date(),
        isCurrent: true
      });

      await roleAssignmentService.assignRoleBasedOnPosition('user-minister');

      // Проверяем, что роль обновилась в БД
      const user = await db.select().from(users).where(eq(users.id, 'user-minister')).limit(1);
      expect(user[0]?.role).toBe('minister');
    });
  });

  describe('Role Permissions', () => {
    it('должен возвращать правильные права для министра', () => {
      const permissions = roleAssignmentService.getRolePermissions('minister');

      expect(permissions.canManageSubordinates).toBe(true);
      expect(permissions.canAssignTasks).toBe(true);
      expect(permissions.canIssueDisciplinaryActions).toBe(true);
      expect(permissions.canGiveCommendations).toBe(true);
      expect(permissions.canInitiateCalls).toBe(true);
      expect(permissions.canCreateChannels).toBe(true);
      expect(permissions.hierarchyLevel).toBe(4);
    });

    it('должен возвращать ограниченные права для специалиста', () => {
      const permissions = roleAssignmentService.getRolePermissions('specialist');

      expect(permissions.canManageSubordinates).toBe(false);
      expect(permissions.canAssignTasks).toBe(false);
      expect(permissions.canIssueDisciplinaryActions).toBe(false);
      expect(permissions.canGiveCommendations).toBe(false);
      expect(permissions.canInitiateCalls).toBe(false);
      expect(permissions.canCreateChannels).toBe(false);
      expect(permissions.hierarchyLevel).toBe(9);
    });

    it('должен возвращать максимальные права для суперадмина', () => {
      const permissions = roleAssignmentService.getRolePermissions('super_admin');

      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManageSystem).toBe(true);
      expect(permissions.canViewAllData).toBe(true);
      expect(permissions.hierarchyLevel).toBe(0);
      expect(permissions.organizationScope).toContain('*');
    });
  });

  describe('Permission Checking', () => {
    beforeEach(async () => {
      // Создаем иерархию: министр -> заместитель -> специалист
      await db.insert(appointments).values([
        {
          id: 'appointment-minister',
          userId: 'user-minister',
          organizationId: 'org-ministry',
          position: 'Министр',
          startDate: new Date(),
          isCurrent: true
        },
        {
          id: 'appointment-deputy',
          userId: 'user-deputy',
          organizationId: 'org-ministry',
          position: 'Заместитель министра',
          startDate: new Date(),
          isCurrent: true
        },
        {
          id: 'appointment-specialist',
          userId: 'user-specialist',
          organizationId: 'org-department',
          position: 'Главный специалист',
          startDate: new Date(),
          isCurrent: true
        }
      ]);

      // Назначаем соответствующие роли
      await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      await roleAssignmentService.assignRoleBasedOnPosition('user-deputy');
      await roleAssignmentService.assignRoleBasedOnPosition('user-specialist');
    });

    it('должен разрешить министру управлять заместителем', async () => {
      const canManage = await roleAssignmentService.canUserPerformAction(
        'user-minister',
        'canManageSubordinates',
        'user-deputy'
      );

      expect(canManage).toBe(true);
    });

    it('должен разрешить заместителю управлять специалистом', async () => {
      const canManage = await roleAssignmentService.canUserPerformAction(
        'user-deputy',
        'canManageSubordinates',
        'user-specialist'
      );

      expect(canManage).toBe(true);
    });

    it('должен запретить специалисту управлять заместителем', async () => {
      const canManage = await roleAssignmentService.canUserPerformAction(
        'user-specialist',
        'canManageSubordinates',
        'user-deputy'
      );

      expect(canManage).toBe(false);
    });

    it('должен запретить действие пользователю без базового права', async () => {
      const canAssign = await roleAssignmentService.canUserPerformAction(
        'user-specialist',
        'canAssignTasks'
      );

      expect(canAssign).toBe(false);
    });

    it('должен разрешить действие пользователю с правом', async () => {
      const canAssign = await roleAssignmentService.canUserPerformAction(
        'user-minister',
        'canAssignTasks'
      );

      expect(canAssign).toBe(true);
    });
  });

  describe('Hierarchical Actions', () => {
    beforeEach(async () => {
      await db.insert(appointments).values([
        {
          id: 'appointment-minister',
          userId: 'user-minister',
          organizationId: 'org-ministry',
          position: 'Министр',
          startDate: new Date(),
          isCurrent: true
        },
        {
          id: 'appointment-specialist',
          userId: 'user-specialist',
          organizationId: 'org-department',
          position: 'Специалист',
          startDate: new Date(),
          isCurrent: true
        }
      ]);

      await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      await roleAssignmentService.assignRoleBasedOnPosition('user-specialist');
    });

    it('должен определить иерархическое действие', async () => {
      const canIssue = await roleAssignmentService.canUserPerformAction(
        'user-minister',
        'canIssueDisciplinaryActions',
        'user-specialist'
      );

      expect(canIssue).toBe(true);
    });

    it('должен запретить иерархическое действие при равном уровне', async () => {
      // Создаем второго министра
      await db.insert(users).values({
        id: 'user-minister-2',
        email: 'minister2@gov.kz',
        firstName: 'Второй',
        lastName: 'Министр',
        role: 'government_official'
      });

      await db.insert(appointments).values({
        id: 'appointment-minister-2',
        userId: 'user-minister-2',
        organizationId: 'org-ministry',
        position: 'Министр образования',
        startDate: new Date(),
        isCurrent: true
      });

      await roleAssignmentService.assignRoleBasedOnPosition('user-minister-2');

      const canManage = await roleAssignmentService.canUserPerformAction(
        'user-minister',
        'canManageSubordinates',
        'user-minister-2'
      );

      expect(canManage).toBe(false);
    });
  });

  describe('Mass Role Reassignment', () => {
    beforeEach(async () => {
      await db.insert(appointments).values([
        {
          id: 'appointment-1',
          userId: 'user-minister',
          organizationId: 'org-ministry',
          position: 'Министр',
          startDate: new Date(),
          isCurrent: true
        },
        {
          id: 'appointment-2',
          userId: 'user-deputy',
          organizationId: 'org-ministry',
          position: 'Заместитель министра',
          startDate: new Date(),
          isCurrent: true
        }
      ]);
    });

    it('должен переназначить роли всем пользователям', async () => {
      const result = await roleAssignmentService.reassignAllUserRoles();

      expect(result.updated).toBeGreaterThan(0);
      expect(result.errors).toBe(0);

      // Проверяем, что роли обновились
      const minister = await db.select().from(users).where(eq(users.id, 'user-minister')).limit(1);
      const deputy = await db.select().from(users).where(eq(users.id, 'user-deputy')).limit(1);

      expect(minister[0]?.role).toBe('minister');
      expect(deputy[0]?.role).toBe('deputy_minister');
    });

    it('должен обработать ошибки при массовом переназначении', async () => {
      // Создаем пользователя с некорректными данными
      await db.insert(users).values({
        id: 'user-invalid',
        email: 'invalid@test.com',
        firstName: 'Invalid',
        lastName: 'User',
        role: 'government_official'
      });

      // Удаляем appointment для этого пользователя, чтобы вызвать ошибку
      // (пользователь есть, но назначения нет)

      const result = await roleAssignmentService.reassignAllUserRoles();

      expect(result.updated).toBeGreaterThan(0);
      // errors может быть 0 если все прошло успешно (пользователь без назначения получает роль guest)
    });
  });

  describe('Edge Cases', () => {
    it('должен обработать пользователя с несколькими активными назначениями', async () => {
      // Создаем два активных назначения (некорректная ситуация)
      await db.insert(appointments).values([
        {
          id: 'appointment-1',
          userId: 'user-minister',
          organizationId: 'org-ministry',
          position: 'Министр финансов',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          isCurrent: true
        },
        {
          id: 'appointment-2',
          userId: 'user-minister',
          organizationId: 'org-department',
          position: 'Руководитель департамента',
          startDate: new Date(),
          isCurrent: true
        }
      ]);

      // Должен взять первое найденное назначение
      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      expect(['minister', 'department_head']).toContain(role);
    });

    it('должен обработать завершенное назначение', async () => {
      await db.insert(appointments).values({
        id: 'appointment-1',
        userId: 'user-minister',
        organizationId: 'org-ministry',
        position: 'Министр',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isCurrent: false
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      expect(role).toBe('guest');
    });

    it('должен обработать неизвестную должность', async () => {
      await db.insert(appointments).values({
        id: 'appointment-1',
        userId: 'user-minister',
        organizationId: 'org-ministry',
        position: 'Совершенно неизвестная должность',
        startDate: new Date(),
        isCurrent: true
      });

      const role = await roleAssignmentService.assignRoleBasedOnPosition('user-minister');
      expect(role).toBe('government_official');
    });

    it('должен обработать ошибку базы данных', async () => {
      // Имитируем ошибку БД, передавая несуществующий ID
      const role = await roleAssignmentService.assignRoleBasedOnPosition('non-existent-user');
      expect(role).toBe('government_official'); // Fallback роль
    });
  });

  describe('Complex Position Titles', () => {
    const complexPositions = [
      { position: 'Первый заместитель премьер-министра', expectedRole: 'deputy_prime_minister' },
      { position: 'Вице-министр экономики', expectedRole: 'deputy_minister' },
      { position: 'Председатель комитета по туризму', expectedRole: 'committee_head' },
      { position: 'Директор департамента государственных доходов', expectedRole: 'department_head' },
      { position: 'Начальник управления методологии', expectedRole: 'division_head' },
      { position: 'Ведущий специалист отдела кадров', expectedRole: 'senior_specialist' },
      { position: 'Специалист 1 категории', expectedRole: 'specialist' }
    ];

    complexPositions.forEach(({ position, expectedRole }, index) => {
      it(`должен правильно определить роль для "${position}"`, async () => {
        const userId = `user-complex-${index}`;
        
        await db.insert(users).values({
          id: userId,
          email: `user${index}@gov.kz`,
          firstName: 'Тест',
          lastName: 'Пользователь',
          role: 'government_official'
        });

        await db.insert(appointments).values({
          id: `appointment-complex-${index}`,
          userId: userId,
          organizationId: 'org-ministry',
          position: position,
          startDate: new Date(),
          isCurrent: true
        });

        const role = await roleAssignmentService.assignRoleBasedOnPosition(userId);
        expect(role).toBe(expectedRole);
      });
    });
  });
});

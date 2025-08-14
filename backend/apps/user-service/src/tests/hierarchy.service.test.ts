import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@gov-platform/database';
import { 
  governmentStructure, 
  positions, 
  appointments, 
  users 
} from '@gov-platform/database/schema';
import { HierarchyService } from '../services/hierarchy.service';
import { RoleAssignmentService } from '../services/role-assignment.service';
import { ChannelAutomationService } from '../services/channel-automation.service';

// Mock services
vi.mock('../services/role-assignment.service');
vi.mock('../services/channel-automation.service');

describe('HierarchyService', () => {
  let hierarchyService: HierarchyService;
  let mockRoleAssignmentService: vi.Mocked<RoleAssignmentService>;
  let mockChannelAutomationService: vi.Mocked<ChannelAutomationService>;

  // Test data
  const testUser = {
    id: 'test-user-1',
    email: 'test@minfin.gov.kz',
    firstName: 'Тест',
    lastName: 'Пользователь',
    role: 'government_official'
  };

  const testMinistry = {
    id: 'ministry-finance',
    name: 'Министерство финансов',
    type: 'ministry' as const,
    level: 4,
    path: '1.4',
    parentId: null
  };

  const testDepartment = {
    id: 'dept-budget',
    name: 'Департамент бюджета',
    type: 'department' as const,
    level: 6,
    path: '1.4.6',
    parentId: 'ministry-finance'
  };

  beforeEach(async () => {
    hierarchyService = new HierarchyService();
    
    // Setup mocks
    mockRoleAssignmentService = vi.mocked(RoleAssignmentService.prototype);
    mockChannelAutomationService = vi.mocked(ChannelAutomationService.prototype);
    
    mockRoleAssignmentService.assignRoleBasedOnPosition.mockResolvedValue('minister');
    mockChannelAutomationService.createOrganizationChannel.mockResolvedValue({
      id: 'channel-123',
      name: 'test-channel',
      type: 'organization',
      organizationId: 'ministry-finance'
    });
    mockChannelAutomationService.syncChannelMembershipOnAppointmentChange.mockResolvedValue();

    // Clean up test data
    await db.delete(appointments);
    await db.delete(positions);
    await db.delete(governmentStructure);
    await db.delete(users);

    // Insert test user
    await db.insert(users).values(testUser);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(appointments);
    await db.delete(positions);
    await db.delete(governmentStructure);
    await db.delete(users);
    vi.clearAllMocks();
  });

  describe('Government Structure Management', () => {
    it('должен создать новую организационную структуру', async () => {
      const structureData = {
        name: 'Министерство финансов',
        type: 'ministry' as const,
        level: 4,
        parentId: null,
        description: 'Министерство финансов Республики Казахстан',
        address: 'г. Астана',
        phoneNumber: '+7 (7172) 74-44-44',
        email: 'info@minfin.gov.kz',
        website: 'https://minfin.gov.kz'
      };

      const result = await hierarchyService.createGovernmentStructure(structureData);

      expect(result).toBeDefined();
      expect(result.name).toBe(structureData.name);
      expect(result.type).toBe(structureData.type);
      expect(result.level).toBe(structureData.level);
      expect(result.path).toBeDefined();
      
      // Проверяем, что автоматически создался канал
      expect(mockChannelAutomationService.createOrganizationChannel).toHaveBeenCalledWith(
        result.id,
        'system'
      );
    });

    it('должен правильно установить path для вложенной структуры', async () => {
      // Создаем родительскую структуру
      const parent = await hierarchyService.createGovernmentStructure(testMinistry);
      
      // Создаем дочернюю структуру
      const childData = {
        ...testDepartment,
        parentId: parent.id
      };
      
      const child = await hierarchyService.createGovernmentStructure(childData);

      expect(child.path).toBe(`${parent.path}.${child.level}`);
      expect(child.parentId).toBe(parent.id);
    });

    it('должен получить иерархию с фильтрами', async () => {
      await db.insert(governmentStructure).values([testMinistry, testDepartment]);

      const result = await hierarchyService.getGovernmentStructure({
        type: 'ministry',
        level: 4
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(testMinistry.name);
    });
  });

  describe('Appointments Management', () => {
    beforeEach(async () => {
      await db.insert(governmentStructure).values(testMinistry);
      await db.insert(positions).values({
        id: 'position-minister',
        title: 'Министр',
        organizationId: testMinistry.id,
        level: 4,
        isExecutive: true,
        description: 'Министр финансов'
      });
    });

    it('должен создать новое назначение', async () => {
      const appointmentData = {
        userId: testUser.id,
        organizationId: testMinistry.id,
        positionId: 'position-minister',
        position: 'Министр',
        startDate: new Date(),
        appointmentOrder: 'Приказ №123'
      };

      const result = await hierarchyService.createAppointment(appointmentData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.organizationId).toBe(testMinistry.id);
      expect(result.position).toBe('Министр');
      expect(result.isCurrent).toBe(true);

      // Проверяем автоматическое назначение роли
      expect(mockRoleAssignmentService.assignRoleBasedOnPosition).toHaveBeenCalledWith(testUser.id);
      
      // Проверяем синхронизацию каналов
      expect(mockChannelAutomationService.syncChannelMembershipOnAppointmentChange).toHaveBeenCalledWith(
        testUser.id,
        undefined,
        testMinistry.id
      );
    });

    it('должен завершить предыдущее назначение при создании нового', async () => {
      // Создаем первое назначение
      const firstAppointment = await hierarchyService.createAppointment({
        userId: testUser.id,
        organizationId: testMinistry.id,
        positionId: 'position-minister',
        position: 'Министр',
        startDate: new Date(),
        appointmentOrder: 'Приказ №123'
      });

      // Создаем второе назначение (должно завершить первое)
      await db.insert(governmentStructure).values(testDepartment);
      
      const secondAppointment = await hierarchyService.createAppointment({
        userId: testUser.id,
        organizationId: testDepartment.id,
        positionId: 'position-minister',
        position: 'Руководитель департамента',
        startDate: new Date(),
        appointmentOrder: 'Приказ №124'
      });

      // Проверяем, что первое назначение завершено
      const appointments = await hierarchyService.getUserAppointments(testUser.id);
      const current = appointments.find(a => a.isCurrent);
      const previous = appointments.find(a => !a.isCurrent);

      expect(current?.id).toBe(secondAppointment.id);
      expect(previous?.id).toBe(firstAppointment.id);
    });

    it('должен получить информацию о иерархии пользователя', async () => {
      await hierarchyService.createAppointment({
        userId: testUser.id,
        organizationId: testMinistry.id,
        positionId: 'position-minister',
        position: 'Министр',
        startDate: new Date(),
        appointmentOrder: 'Приказ №123'
      });

      const result = await hierarchyService.getUserHierarchyInfo(testUser.id);

      expect(result).toBeDefined();
      expect(result.currentAppointment).toBeDefined();
      expect(result.currentAppointment?.position).toBe('Министр');
      expect(result.organization?.name).toBe(testMinistry.name);
      expect(result.subordinates).toBeDefined();
      expect(result.supervisors).toBeDefined();
    });
  });

  describe('Hierarchy Navigation', () => {
    beforeEach(async () => {
      // Создаем иерархию: Министерство -> Департамент
      await db.insert(governmentStructure).values([testMinistry, testDepartment]);
      
      // Создаем позиции
      await db.insert(positions).values([
        {
          id: 'position-minister',
          title: 'Министр',
          organizationId: testMinistry.id,
          level: 4,
          isExecutive: true
        },
        {
          id: 'position-dept-head',
          title: 'Руководитель департамента',
          organizationId: testDepartment.id,
          level: 6,
          isExecutive: true
        }
      ]);

      // Создаем второго пользователя
      await db.insert(users).values({
        id: 'test-user-2',
        email: 'user2@minfin.gov.kz',
        firstName: 'Второй',
        lastName: 'Пользователь',
        role: 'government_official'
      });

      // Назначаем пользователей
      await hierarchyService.createAppointment({
        userId: testUser.id,
        organizationId: testMinistry.id,
        positionId: 'position-minister',
        position: 'Министр',
        startDate: new Date(),
        appointmentOrder: 'Приказ №123'
      });

      await hierarchyService.createAppointment({
        userId: 'test-user-2',
        organizationId: testDepartment.id,
        positionId: 'position-dept-head',
        position: 'Руководитель департамента',
        startDate: new Date(),
        appointmentOrder: 'Приказ №124'
      });
    });

    it('должен найти подчиненных пользователя', async () => {
      const subordinates = await hierarchyService.getUserSubordinates(testUser.id);

      expect(subordinates).toBeDefined();
      expect(subordinates.length).toBeGreaterThanOrEqual(1);
      
      const departmentHead = subordinates.find(s => s.position === 'Руководитель департамента');
      expect(departmentHead).toBeDefined();
      expect(departmentHead?.firstName).toBe('Второй');
    });

    it('должен найти руководителей пользователя', async () => {
      const supervisors = await hierarchyService.getUserSupervisors('test-user-2');

      expect(supervisors).toBeDefined();
      expect(supervisors.length).toBeGreaterThanOrEqual(1);
      
      const minister = supervisors.find(s => s.position === 'Министр');
      expect(minister).toBeDefined();
      expect(minister?.firstName).toBe('Тест');
    });

    it('должен получить сотрудников организации', async () => {
      const employees = await hierarchyService.getOrganizationEmployees(testMinistry.id);

      expect(employees).toBeDefined();
      expect(employees.data.length).toBeGreaterThanOrEqual(1);
      
      const minister = employees.data.find(e => e.position === 'Министр');
      expect(minister).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('должен обработать ошибку при создании несуществующей структуры', async () => {
      const invalidData = {
        name: 'Тест',
        type: 'ministry' as const,
        level: 4,
        parentId: 'non-existent-parent'
      };

      await expect(hierarchyService.createGovernmentStructure(invalidData))
        .rejects.toThrow();
    });

    it('должен обработать назначение на несуществующую позицию', async () => {
      const invalidAppointment = {
        userId: testUser.id,
        organizationId: 'non-existent-org',
        positionId: 'non-existent-position',
        position: 'Тестовая позиция',
        startDate: new Date(),
        appointmentOrder: 'Приказ №999'
      };

      await expect(hierarchyService.createAppointment(invalidAppointment))
        .rejects.toThrow();
    });
  });

  describe('Integration with Role Assignment', () => {
    it('должен обновить роль при увольнении', async () => {
      await db.insert(governmentStructure).values(testMinistry);
      
      const appointment = await hierarchyService.createAppointment({
        userId: testUser.id,
        organizationId: testMinistry.id,
        positionId: 'position-minister',
        position: 'Министр',
        startDate: new Date(),
        appointmentOrder: 'Приказ №123'
      });

      await hierarchyService.dismissFromPosition(appointment.id, {
        dismissalReason: 'Увольнение по собственному желанию',
        dismissalDate: new Date()
      });

      // Проверяем, что роль была обновлена после увольнения
      expect(mockRoleAssignmentService.assignRoleBasedOnPosition).toHaveBeenCalledTimes(2); // При назначении и увольнении
    });
  });
});

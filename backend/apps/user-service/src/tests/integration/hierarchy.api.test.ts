import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { db } from '@gov-platform/database';
import { 
  users, 
  appointments, 
  governmentStructure, 
  positions 
} from '@gov-platform/database/schema';

describe('Hierarchy API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testOrganizationId: string;

  const testUser = {
    email: 'admin@test.gov.kz',
    firstName: 'Администратор',
    lastName: 'Тестовый',
    role: 'super_admin'
  };

  beforeAll(async () => {
    // Clean up test data
    await db.delete(appointments);
    await db.delete(positions);
    await db.delete(governmentStructure);
    await db.delete(users);

    // Create test user
    const [user] = await db.insert(users).values(testUser).returning();
    testUserId = user.id;

    // Get auth token (мокаем аутентификацию)
    const loginResponse = await request(app)
      .post('/api/auth/mock-login')
      .send({ userId: testUserId });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await db.delete(appointments);
    await db.delete(positions);
    await db.delete(governmentStructure);
    await db.delete(users);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.delete(appointments);
    await db.delete(positions);
    await db.delete(governmentStructure);
  });

  describe('GET /api/hierarchy/structure', () => {
    beforeEach(async () => {
      // Create test organizational structure
      await db.insert(governmentStructure).values([
        {
          id: 'org-1',
          name: 'Правительство РК',
          type: 'government',
          level: 1,
          path: '1'
        },
        {
          id: 'org-2',
          name: 'Министерство финансов',
          type: 'ministry',
          level: 4,
          path: '1.4',
          parentId: 'org-1'
        }
      ]);
    });

    it('должен получить организационную структуру', async () => {
      const response = await request(app)
        .get('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Правительство РК');
    });

    it('должен фильтровать по типу организации', async () => {
      const response = await request(app)
        .get('/api/hierarchy/structure?type=ministry')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('ministry');
    });

    it('должен фильтровать по уровню', async () => {
      const response = await request(app)
        .get('/api/hierarchy/structure?level=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].level).toBe(1);
    });

    it('должен требовать аутентификацию', async () => {
      await request(app)
        .get('/api/hierarchy/structure')
        .expect(401);
    });
  });

  describe('POST /api/hierarchy/structure', () => {
    it('должен создать новую организацию', async () => {
      const organizationData = {
        name: 'Министерство образования',
        type: 'ministry',
        level: 4,
        description: 'Министерство образования и науки',
        address: 'г. Астана',
        phoneNumber: '+7 (7172) 74-56-78',
        email: 'info@edu.gov.kz'
      };

      const response = await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send(organizationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(organizationData.name);
      expect(response.body.data.type).toBe(organizationData.type);
      expect(response.body.data.path).toBeDefined();

      testOrganizationId = response.body.data.id;
    });

    it('должен создать дочернюю организацию с правильным path', async () => {
      // Сначала создаем родительскую организацию
      const parentResponse = await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Министерство финансов',
          type: 'ministry',
          level: 4
        });

      const parentId = parentResponse.body.data.id;

      // Затем создаем дочернюю
      const childResponse = await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Департамент бюджета',
          type: 'department',
          level: 6,
          parentId: parentId
        })
        .expect(201);

      expect(childResponse.body.data.parentId).toBe(parentId);
      expect(childResponse.body.data.path).toContain(parentResponse.body.data.path);
    });

    it('должен валидировать обязательные поля', async () => {
      await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Тест'
          // отсутствуют обязательные поля
        })
        .expect(400);
    });

    it('должен требовать права администратора', async () => {
      // Создаем обычного пользователя
      const [regularUser] = await db.insert(users).values({
        email: 'user@test.gov.kz',
        firstName: 'Обычный',
        lastName: 'Пользователь',
        role: 'specialist'
      }).returning();

      const userLoginResponse = await request(app)
        .post('/api/auth/mock-login')
        .send({ userId: regularUser.id });

      await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${userLoginResponse.body.token}`)
        .send({
          name: 'Тестовая организация',
          type: 'department',
          level: 6
        })
        .expect(403);
    });
  });

  describe('PUT /api/hierarchy/structure/:id', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db.insert(governmentStructure).values({
        name: 'Исходная организация',
        type: 'department',
        level: 6,
        path: '1.4.6'
      }).returning();
      organizationId = org.id;
    });

    it('должен обновить организацию', async () => {
      const updateData = {
        name: 'Обновленная организация',
        description: 'Обновленное описание'
      };

      const response = await request(app)
        .put(`/api/hierarchy/structure/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('должен вернуть 404 для несуществующей организации', async () => {
      await request(app)
        .put('/api/hierarchy/structure/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Новое имя' })
        .expect(404);
    });
  });

  describe('POST /api/hierarchy/appointments', () => {
    let organizationId: string;
    let positionId: string;
    let employeeId: string;

    beforeEach(async () => {
      // Создаем организацию
      const [org] = await db.insert(governmentStructure).values({
        name: 'Тестовая организация',
        type: 'department',
        level: 6,
        path: '1.4.6'
      }).returning();
      organizationId = org.id;

      // Создаем позицию
      const [position] = await db.insert(positions).values({
        title: 'Руководитель департамента',
        organizationId: organizationId,
        level: 6,
        isExecutive: true
      }).returning();
      positionId = position.id;

      // Создаем сотрудника
      const [employee] = await db.insert(users).values({
        email: 'employee@test.gov.kz',
        firstName: 'Сотрудник',
        lastName: 'Тестовый',
        role: 'government_official'
      }).returning();
      employeeId = employee.id;
    });

    it('должен создать новое назначение', async () => {
      const appointmentData = {
        userId: employeeId,
        organizationId: organizationId,
        positionId: positionId,
        position: 'Руководитель департамента',
        startDate: new Date().toISOString(),
        appointmentOrder: 'Приказ №123'
      };

      const response = await request(app)
        .post('/api/hierarchy/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(employeeId);
      expect(response.body.data.organizationId).toBe(organizationId);
      expect(response.body.data.isCurrent).toBe(true);
    });

    it('должен завершить предыдущее назначение', async () => {
      // Создаем первое назначение
      await request(app)
        .post('/api/hierarchy/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: employeeId,
          organizationId: organizationId,
          positionId: positionId,
          position: 'Руководитель департамента',
          startDate: new Date().toISOString(),
          appointmentOrder: 'Приказ №123'
        });

      // Создаем вторую организацию и позицию
      const [org2] = await db.insert(governmentStructure).values({
        name: 'Вторая организация',
        type: 'department',
        level: 6,
        path: '1.4.7'
      }).returning();

      const [position2] = await db.insert(positions).values({
        title: 'Новая позиция',
        organizationId: org2.id,
        level: 6,
        isExecutive: true
      }).returning();

      // Создаем второе назначение
      const response = await request(app)
        .post('/api/hierarchy/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: employeeId,
          organizationId: org2.id,
          positionId: position2.id,
          position: 'Новая позиция',
          startDate: new Date().toISOString(),
          appointmentOrder: 'Приказ №124'
        })
        .expect(201);

      // Проверяем, что новое назначение активно
      expect(response.body.data.isCurrent).toBe(true);

      // Проверяем историю назначений
      const historyResponse = await request(app)
        .get(`/api/hierarchy/users/${employeeId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.data).toHaveLength(2);
      const currentAppointment = historyResponse.body.data.find((a: any) => a.isCurrent);
      const previousAppointment = historyResponse.body.data.find((a: any) => !a.isCurrent);

      expect(currentAppointment.organizationId).toBe(org2.id);
      expect(previousAppointment.organizationId).toBe(organizationId);
    });

    it('должен валидировать данные назначения', async () => {
      await request(app)
        .post('/api/hierarchy/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: employeeId,
          // отсутствуют обязательные поля
          position: 'Тест'
        })
        .expect(400);
    });
  });

  describe('GET /api/hierarchy/users/:userId/info', () => {
    let employeeId: string;
    let managerId: string;
    let subordinateId: string;

    beforeEach(async () => {
      // Создаем иерархию пользователей
      const users = await db.insert(users).values([
        {
          email: 'manager@test.gov.kz',
          firstName: 'Менеджер',
          lastName: 'Тестовый',
          role: 'department_head'
        },
        {
          email: 'employee@test.gov.kz',
          firstName: 'Сотрудник',
          lastName: 'Тестовый',
          role: 'specialist'
        },
        {
          email: 'subordinate@test.gov.kz',
          firstName: 'Подчиненный',
          lastName: 'Тестовый',
          role: 'specialist'
        }
      ]).returning();

      managerId = users[0].id;
      employeeId = users[1].id;
      subordinateId = users[2].id;

      // Создаем организационную структуру
      const [ministry] = await db.insert(governmentStructure).values({
        name: 'Министерство тестирования',
        type: 'ministry',
        level: 4,
        path: '1.4'
      }).returning();

      const [department] = await db.insert(governmentStructure).values({
        name: 'Департамент тестирования',
        type: 'department',
        level: 6,
        path: '1.4.6',
        parentId: ministry.id
      }).returning();

      // Создаем назначения
      await db.insert(appointments).values([
        {
          userId: managerId,
          organizationId: ministry.id,
          position: 'Заместитель министра',
          startDate: new Date(),
          isCurrent: true
        },
        {
          userId: employeeId,
          organizationId: department.id,
          position: 'Руководитель департамента',
          startDate: new Date(),
          isCurrent: true
        },
        {
          userId: subordinateId,
          organizationId: department.id,
          position: 'Специалист',
          startDate: new Date(),
          isCurrent: true
        }
      ]);
    });

    it('должен получить полную информацию о иерархии пользователя', async () => {
      const response = await request(app)
        .get(`/api/hierarchy/users/${employeeId}/info`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentAppointment).toBeDefined();
      expect(response.body.data.organization).toBeDefined();
      expect(response.body.data.supervisors).toBeDefined();
      expect(response.body.data.subordinates).toBeDefined();
    });

    it('должен найти руководителей пользователя', async () => {
      const response = await request(app)
        .get(`/api/hierarchy/users/${subordinateId}/supervisors`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const supervisor = response.body.data.find((s: any) => s.id === employeeId);
      expect(supervisor).toBeDefined();
    });

    it('должен найти подчиненных пользователя', async () => {
      const response = await request(app)
        .get(`/api/hierarchy/users/${employeeId}/subordinates`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const subordinate = response.body.data.find((s: any) => s.id === subordinateId);
      expect(subordinate).toBeDefined();
    });
  });

  describe('Channel Automation Integration', () => {
    it('должен создать канал при создании организации', async () => {
      const organizationData = {
        name: 'Министерство с автоканалом',
        type: 'ministry',
        level: 4
      };

      const response = await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send(organizationData)
        .expect(201);

      const organizationId = response.body.data.id;

      // Проверяем, что канал был создан (мокаем проверку через API каналов)
      // В реальном тесте здесь был бы запрос к Channel Service
      expect(response.body.data.id).toBeDefined();
    });

    it('должен создать канал вручную для организации', async () => {
      const [org] = await db.insert(governmentStructure).values({
        name: 'Организация для канала',
        type: 'department',
        level: 6,
        path: '1.4.6'
      }).returning();

      const response = await request(app)
        .post(`/api/hierarchy/organizations/${org.id}/create-channel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('должен вернуть 404 для несуществующего пользователя', async () => {
      await request(app)
        .get('/api/hierarchy/users/non-existent-user/info')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен обработать ошибку валидации', async () => {
      const response = await request(app)
        .post('/api/hierarchy/structure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // пустое имя
          type: 'invalid-type',
          level: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('должен обработать ошибку сервера', async () => {
      // Имитируем ошибку сервера, передавая некорректные данные
      await request(app)
        .post('/api/hierarchy/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'non-existent-user',
          organizationId: 'non-existent-org',
          positionId: 'non-existent-position',
          position: 'Тест',
          startDate: new Date().toISOString()
        })
        .expect(500);
    });
  });

  describe('Pagination and Filtering', () => {
    beforeEach(async () => {
      // Создаем несколько организаций для тестирования пагинации
      const organizations = Array.from({ length: 15 }, (_, i) => ({
        name: `Организация ${i + 1}`,
        type: 'department' as const,
        level: 6,
        path: `1.4.${i + 1}`
      }));

      await db.insert(governmentStructure).values(organizations);
    });

    it('должен поддерживать пагинацию', async () => {
      const response = await request(app)
        .get('/api/hierarchy/structure?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBeGreaterThan(1);
    });

    it('должен поддерживать поиск', async () => {
      const response = await request(app)
        .get('/api/hierarchy/structure?search=Организация 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((org: any) => org.name.includes('Организация 1'))).toBe(true);
    });
  });
});

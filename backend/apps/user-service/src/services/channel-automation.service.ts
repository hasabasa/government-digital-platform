import { eq, and, sql } from 'drizzle-orm';
import { db } from '@gov-platform/database';
import { 
  governmentStructure,
  channels,
  channelSubscriptions,
  appointments,
  users,
  type GovernmentStructure,
} from '@gov-platform/database/schema';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ChannelCreationResult {
  channelId: string;
  subscribersAdded: number;
  success: boolean;
  error?: string;
}

export interface ChannelMembershipResult {
  usersAdded: number;
  usersSkipped: number;
  success: boolean;
  errors: string[];
}

/**
 * Сервис автоматического управления каналами для организаций
 */
export class ChannelAutomationService {

  /**
   * Автоматически создать канал для организации
   */
  async createOrganizationChannel(
    organizationId: string, 
    createdByUserId: string
  ): Promise<ChannelCreationResult> {
    try {
      // Получить информацию об организации
      const [organization] = await db
        .select()
        .from(governmentStructure)
        .where(eq(governmentStructure.id, organizationId))
        .limit(1);

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Проверить, не существует ли уже канал для этой организации
      const existingChannel = await db
        .select()
        .from(channels)
        .where(
          and(
            sql`channels.settings->>'organizationId' = ${organizationId}`,
            sql`channels.settings->>'autoCreated' = 'true'`
          )
        )
        .limit(1);

      if (existingChannel.length > 0) {
        logger.info('Organization channel already exists', {
          organizationId,
          channelId: existingChannel[0].id,
        });
        
        return {
          channelId: existingChannel[0].id,
          subscribersAdded: 0,
          success: true,
        };
      }

      // Создать название канала
      const channelName = this.generateChannelName(organization);
      const channelDescription = this.generateChannelDescription(organization);

      // Создать канал
      const channelId = uuidv4();
      const newChannel = {
        id: channelId,
        name: channelName,
        description: channelDescription,
        type: 'public' as const,
        ownerId: createdByUserId,
        isVerified: true, // Автоматически созданные каналы верифицированы
        settings: {
          organizationId,
          autoCreated: true,
          level: organization.level,
          organizationType: organization.type,
          isPinned: this.shouldPinChannel(organization),
          allowedRoles: this.getAllowedRoles(organization),
        },
        tags: this.generateChannelTags(organization),
      };

      const [createdChannel] = await db
        .insert(channels)
        .values(newChannel)
        .returning();

      // Автоматически добавить сотрудников организации
      const membershipResult = await this.addOrganizationMembersToChannel(
        channelId,
        organizationId
      );

      logger.info('Organization channel created successfully', {
        organizationId,
        channelId,
        channelName,
        subscribersAdded: membershipResult.usersAdded,
        level: organization.level,
        type: organization.type,
      });

      return {
        channelId,
        subscribersAdded: membershipResult.usersAdded,
        success: true,
      };

    } catch (error) {
      logger.error('Failed to create organization channel', {
        organizationId,
        error: (error as Error).message,
      });

      return {
        channelId: '',
        subscribersAdded: 0,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Автоматически добавить сотрудников организации в канал
   */
  async addOrganizationMembersToChannel(
    channelId: string,
    organizationId: string
  ): Promise<ChannelMembershipResult> {
    try {
      // Получить всех сотрудников организации и подорганизаций
      const employees = await db
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          isManagerial: sql`positions.is_managerial`,
          canManageSubordinates: sql`positions.can_manage_subordinates`,
          organizationLevel: sql`gov_struct.level`,
        })
        .from(appointments)
        .innerJoin(users, eq(appointments.userId, users.id))
        .innerJoin(sql`positions`, eq(sql`appointments.position_id`, sql`positions.id`))
        .innerJoin(
          sql`government_structure as gov_struct`, 
          eq(sql`appointments.organization_id`, sql`gov_struct.id`)
        )
        .where(
          and(
            eq(appointments.isCurrent, true),
            eq(users.status, 'active'),
            // Включить саму организацию и все подорганизации
            sql`gov_struct.path LIKE (
              SELECT path || '%' 
              FROM government_structure 
              WHERE id = ${organizationId}
            )`
          )
        );

      let usersAdded = 0;
      let usersSkipped = 0;
      const errors: string[] = [];

      for (const employee of employees) {
        try {
          // Проверить, не подписан ли уже пользователь
          const existingSubscription = await db
            .select()
            .from(channelSubscriptions)
            .where(
              and(
                eq(channelSubscriptions.channelId, channelId),
                eq(channelSubscriptions.userId, employee.userId)
              )
            )
            .limit(1);

          if (existingSubscription.length > 0) {
            usersSkipped++;
            continue;
          }

          // Определить роль в канале
          const role = this.determineChannelRole(employee);

          // Добавить подписку
          await db
            .insert(channelSubscriptions)
            .values({
              channelId,
              userId: employee.userId,
              role,
              notifications: true, // По умолчанию включены уведомления
            });

          usersAdded++;

        } catch (error) {
          errors.push(`Failed to add user ${employee.userId}: ${(error as Error).message}`);
          usersSkipped++;
        }
      }

      // Обновить счетчик подписчиков канала
      await db
        .update(channels)
        .set({ 
          subscriberCount: usersAdded,
          updatedAt: new Date(),
        })
        .where(eq(channels.id, channelId));

      logger.info('Organization members added to channel', {
        channelId,
        organizationId,
        usersAdded,
        usersSkipped,
        totalEmployees: employees.length,
        errors: errors.length,
      });

      return {
        usersAdded,
        usersSkipped,
        success: true,
        errors,
      };

    } catch (error) {
      logger.error('Failed to add organization members to channel', {
        channelId,
        organizationId,
        error: (error as Error).message,
      });

      return {
        usersAdded: 0,
        usersSkipped: 0,
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Синхронизировать членство в канале при изменении назначений
   */
  async syncChannelMembershipOnAppointmentChange(
    userId: string,
    oldOrganizationId?: string,
    newOrganizationId?: string
  ): Promise<void> {
    try {
      // Удалить из старых каналов организации
      if (oldOrganizationId) {
        await this.removeUserFromOrganizationChannels(userId, oldOrganizationId);
      }

      // Добавить в новые каналы организации
      if (newOrganizationId) {
        await this.addUserToOrganizationChannels(userId, newOrganizationId);
      }

      logger.info('Channel membership synchronized', {
        userId,
        oldOrganizationId,
        newOrganizationId,
      });

    } catch (error) {
      logger.error('Failed to sync channel membership', {
        userId,
        oldOrganizationId,
        newOrganizationId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Удалить пользователя из каналов организации
   */
  private async removeUserFromOrganizationChannels(
    userId: string,
    organizationId: string
  ): Promise<void> {
    // Найти автоматически созданные каналы организации
    const organizationChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .where(
        sql`channels.settings->>'organizationId' = ${organizationId} 
            AND channels.settings->>'autoCreated' = 'true'`
      );

    // Удалить подписки пользователя
    for (const channel of organizationChannels) {
      await db
        .delete(channelSubscriptions)
        .where(
          and(
            eq(channelSubscriptions.channelId, channel.id),
            eq(channelSubscriptions.userId, userId)
          )
        );

      // Обновить счетчик подписчиков
      await this.updateChannelSubscriberCount(channel.id);
    }
  }

  /**
   * Добавить пользователя в каналы организации
   */
  private async addUserToOrganizationChannels(
    userId: string,
    organizationId: string
  ): Promise<void> {
    // Найти автоматически созданные каналы для организации и родительских организаций
    const organizationChannels = await db
      .select({ 
        channelId: channels.id,
        organizationId: sql`channels.settings->>'organizationId'`,
      })
      .from(channels)
      .where(
        sql`channels.settings->>'autoCreated' = 'true' 
            AND channels.settings->>'organizationId' IN (
              SELECT id FROM government_structure 
              WHERE ${organizationId} LIKE path || '%'
            )`
      );

    // Получить информацию о пользователе
    const [userInfo] = await db
      .select({
        userId: users.id,
        isManagerial: sql`positions.is_managerial`,
        canManageSubordinates: sql`positions.can_manage_subordinates`,
      })
      .from(users)
      .innerJoin(appointments, and(
        eq(appointments.userId, users.id),
        eq(appointments.isCurrent, true)
      ))
      .innerJoin(sql`positions`, eq(sql`appointments.position_id`, sql`positions.id`))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo) return;

    // Добавить в каналы
    for (const channel of organizationChannels) {
      try {
        const role = this.determineChannelRole(userInfo);

        await db
          .insert(channelSubscriptions)
          .values({
            channelId: channel.channelId,
            userId,
            role,
            notifications: true,
          })
          .onConflictDoNothing(); // Игнорировать, если уже существует

        // Обновить счетчик подписчиков
        await this.updateChannelSubscriberCount(channel.channelId);

      } catch (error) {
        logger.warn('Failed to add user to organization channel', {
          userId,
          channelId: channel.channelId,
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * Обновить счетчик подписчиков канала
   */
  private async updateChannelSubscriberCount(channelId: string): Promise<void> {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(channelSubscriptions)
      .where(eq(channelSubscriptions.channelId, channelId));

    await db
      .update(channels)
      .set({ 
        subscriberCount: parseInt(count.toString()),
        updatedAt: new Date(),
      })
      .where(eq(channels.id, channelId));
  }

  // Приватные методы для генерации данных канала

  private generateChannelName(organization: GovernmentStructure): string {
    const typeNames: Record<string, string> = {
      'ministry': 'Министерство',
      'committee': 'Комитет',
      'department': 'Департамент',
      'division': 'Отдел',
      'agency': 'Агентство',
      'administration': 'Администрация',
    };

    const typeName = typeNames[organization.type] || 'Организация';
    return `${typeName} ${organization.name}`;
  }

  private generateChannelDescription(organization: GovernmentStructure): string {
    return `Официальный канал ${organization.name}. ` +
           `Здесь публикуются новости, объявления и важная информация для сотрудников.`;
  }

  private generateChannelTags(organization: GovernmentStructure): string[] {
    const tags = ['официальный', organization.type];
    
    if (organization.level === 'level_0') tags.push('президентский');
    if (organization.level === 'level_1') tags.push('министерский');
    if (organization.level === 'level_2') tags.push('комитетский');
    
    return tags;
  }

  private shouldPinChannel(organization: GovernmentStructure): boolean {
    // Закреплять каналы высокого уровня
    return ['level_0', 'level_1', 'level_2'].includes(organization.level);
  }

  private getAllowedRoles(organization: GovernmentStructure): string[] {
    // Определить, кто может постить в канал
    const allowedRoles = ['admin', 'moderator'];
    
    // В каналах низкого уровня разрешить постить всем
    if (['level_4', 'level_5', 'level_6'].includes(organization.level)) {
      allowedRoles.push('member');
    }
    
    return allowedRoles;
  }

  private determineChannelRole(employee: any): string {
    if (employee.canManageSubordinates) {
      return 'moderator';
    } else if (employee.isManagerial) {
      return 'member';
    } else {
      return 'subscriber';
    }
  }
}

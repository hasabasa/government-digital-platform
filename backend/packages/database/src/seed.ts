import { DatabaseConnection, getDefaultConfig } from './connection';
import { users, sessions } from './schema';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

const seedUsers = [
  {
    id: uuidv4(),
    email: 'admin@gov.kz',
    firstName: 'Администратор',
    lastName: 'Системы',
    role: 'admin' as const,
    status: 'active' as const,
    position: 'Системный администратор',
    department: 'IT отдел',
    organization: 'Cube Demper — Разработка',
    digitalCertificate: 'admin-cert-key',
    isOnline: false,
  },
  {
    id: uuidv4(),
    email: 'moderator@gov.kz',
    firstName: 'Модератор',
    lastName: 'Платформы',
    role: 'moderator' as const,
    status: 'active' as const,
    position: 'Модератор контента',
    department: 'Отдел модерации',
    organization: 'Cube Demper — Разработка',
    digitalCertificate: 'moderator-cert-key',
    isOnline: false,
  },
  {
    id: uuidv4(),
    email: 'official@gov.kz',
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: 'Иванович',
    role: 'employee' as const,
    status: 'active' as const,
    position: 'Начальник отдела',
    department: 'Отдел государственных услуг',
    organization: 'Cube Demper — Продажи',
    digitalCertificate: 'official-cert-key',
    phone: '+7 (495) 123-45-67',
    isOnline: false,
  },
  {
    id: uuidv4(),
    email: 'head@gov.kz',
    firstName: 'Петр',
    lastName: 'Петров',
    middleName: 'Петрович',
    role: 'department_head' as const,
    status: 'active' as const,
    position: 'Заместитель министра',
    department: 'Аппарат министра',
    organization: 'Cube Demper — Маркетинг',
    digitalCertificate: 'head-cert-key',
    phone: '+7 (495) 987-65-43',
    isOnline: false,
  }
];

export async function seed(): Promise<void> {
  return seedDatabase();
}

export async function seedDatabase(): Promise<void> {
  try {
    const dbConnection = DatabaseConnection.getInstance(getDefaultConfig());
    await dbConnection.connect();
    
    const db = dbConnection.getDb();
    
    logger.info('Starting database seeding...');
    
    // Seed users
    logger.info('Seeding users...');
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    
    logger.info('Database seeding completed successfully');
    
    await dbConnection.disconnect();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Seeding failed', { error: error.message });
    } else {
      logger.error('Seeding failed', { error: String(error) });
    }
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

import { migrate as drizzleMigrate } from 'drizzle-orm/node-postgres/migrator';
import { DatabaseConnection, getDefaultConfig } from './connection';
import { logger } from './utils/logger';

export async function migrate(): Promise<void> {
  return runMigrations();
}

export async function runMigrations(): Promise<void> {
  try {
    const dbConnection = DatabaseConnection.getInstance(getDefaultConfig());
    await dbConnection.connect();
    
    const db = dbConnection.getDb();
    
    logger.info('Starting database migrations...');
    await drizzleMigrate(db, { migrationsFolder: './migrations' });
    logger.info('Database migrations completed successfully');
    
    await dbConnection.disconnect();
  } catch (error) {
    const err = error as Error;
    logger.error('Migration failed', { error: err.message });
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

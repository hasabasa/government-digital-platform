import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createClient } from 'redis';
import * as schema from './schema';

export interface DatabaseConfig {
  postgres: {
    connectionString: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  redis: {
    url: string;
    password?: string;
    db?: number;
  };
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pgPool: Pool;
  private redisClient: ReturnType<typeof createClient>;
  public db: ReturnType<typeof drizzle>;

  private constructor(config: DatabaseConfig) {
    // PostgreSQL connection
    this.pgPool = new Pool({
      connectionString: config.postgres.connectionString,
      ssl: config.postgres.ssl,
      max: config.postgres.max || 20,
      idleTimeoutMillis: config.postgres.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.postgres.connectionTimeoutMillis || 2000,
    });

    this.db = drizzle(this.pgPool, { schema });

    // Redis connection
    this.redisClient = createClient({
      url: config.redis.url,
      password: config.redis.password,
      database: config.redis.db || 0,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error('Database config is required for first initialization');
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Test PostgreSQL connection
      const client = await this.pgPool.connect();
      client.release();
      console.log('Connected to PostgreSQL');

      // Connect to Redis
      await this.redisClient.connect();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pgPool.end();
      await this.redisClient.quit();
      console.log('Disconnected from databases');
    } catch (error) {
      console.error('Database disconnection error:', error);
      throw error;
    }
  }

  public getRedisClient() {
    return this.redisClient;
  }

  public getPgPool() {
    return this.pgPool;
  }

  public getDb() {
    return this.db;
  }
}

export const getDefaultConfig = (): DatabaseConfig => ({
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cube_demper',
    ssl: process.env.NODE_ENV === 'production',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cube_demper',
  },
} satisfies Config;

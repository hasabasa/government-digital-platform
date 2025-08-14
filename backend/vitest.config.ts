import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    include: [
      'apps/**/*.test.ts',
      'packages/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    sequence: {
      concurrent: false
    }
  },
  resolve: {
    alias: {
      '@gov-platform/database': path.resolve(__dirname, './packages/database/src'),
      '@gov-platform/types': path.resolve(__dirname, './packages/types/src')
    }
  }
});

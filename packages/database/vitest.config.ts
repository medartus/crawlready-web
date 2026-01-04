import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@crawlready/types': path.resolve(__dirname, '../types/src'),
      '@crawlready/logger': path.resolve(__dirname, '../logger/src'),
    },
  },
});
